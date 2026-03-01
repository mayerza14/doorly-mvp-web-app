"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface PhotoCropModalProps {
  file: File;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const ASPECT_RATIO = 16 / 9;

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function PhotoCropModal({ file, onConfirm, onCancel }: PhotoCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSrc] = useState(() => URL.createObjectURL(file));

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
  }, []);

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Resolución final: máximo 1280px de ancho manteniendo 16/9
      const outputWidth = Math.min(completedCrop.width * scaleX, 1280);
      const outputHeight = outputWidth / ASPECT_RATIO;

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        outputWidth,
        outputHeight
      );

      canvas.toBlob(
        (blob) => {
          if (blob) onConfirm(blob);
          setIsProcessing(false);
        },
        "image/jpeg",
        0.88
      );
    } catch (err) {
      console.error("Error procesando imagen:", err);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Ajustá tu foto</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arrastrá para elegir qué parte de la foto se va a mostrar. El recuadro representa cómo se verá en la publicación (formato 16:9).
          </p>
        </DialogHeader>

        {/* Preview del ratio final */}
        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <div className="w-8 h-[18px] bg-primary/30 rounded-sm border border-primary/40" style={{ aspectRatio: "16/9" }} />
          <p className="text-xs text-primary font-medium">
            Formato 16:9 — igual al carousel de la publicación
          </p>
        </div>

        {/* Cropper */}
        <div className="flex justify-center bg-black/5 rounded-xl overflow-hidden max-h-[400px]">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT_RATIO}
            minWidth={50}
            className="max-h-[400px]"
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Recortar foto"
              onLoad={onImageLoad}
              style={{ maxHeight: "400px", maxWidth: "100%", objectFit: "contain" }}
            />
          </ReactCrop>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Podés arrastrar y redimensionar el recuadro. La zona oscura no se incluirá en la foto.
        </p>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!completedCrop || isProcessing}>
            {isProcessing ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Procesando...</>
            ) : (
              "Usar esta foto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}