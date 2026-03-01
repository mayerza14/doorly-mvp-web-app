"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Move } from "lucide-react";

interface PhotoCropModalProps {
  file: File;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const ASPECT = 16 / 9;

export function PhotoCropModal({ file, onConfirm, onCancel }: PhotoCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // crop en coordenadas del canvas (px)
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

  const imgSrc = useRef(URL.createObjectURL(file));

  // Dibuja imagen + overlay de recorte
  const draw = useCallback((c: { x: number; y: number; w: number; h: number }) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Overlay oscuro fuera del recorte
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, c.y);
    ctx.fillRect(0, c.y + c.h, canvas.width, canvas.height - c.y - c.h);
    ctx.fillRect(0, c.y, c.x, c.h);
    ctx.fillRect(c.x + c.w, c.y, canvas.width - c.x - c.w, c.h);

    // Borde del recorte
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);

    // Líneas de tercios
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(c.x + (c.w / 3) * i, c.y);
      ctx.lineTo(c.x + (c.w / 3) * i, c.y + c.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + (c.h / 3) * i);
      ctx.lineTo(c.x + c.w, c.y + (c.h / 3) * i);
      ctx.stroke();
    }
  }, []);

  // Inicializar canvas e imagen
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const container = containerRef.current;
      if (!container) return;

      const maxW = Math.min(container.clientWidth - 32, 640);
      const maxH = 360;
      let cw = maxW;
      let ch = Math.round(cw * (img.naturalHeight / img.naturalWidth));
      if (ch > maxH) { ch = maxH; cw = Math.round(ch * (img.naturalWidth / img.naturalHeight)); }

      const canvas = canvasRef.current!;
      canvas.width = cw;
      canvas.height = ch;

      // Crop inicial centrado con ratio 16/9
      const cropH = Math.min(ch, Math.round(cw / ASPECT));
      const cropW = Math.round(cropH * ASPECT);
      const initialCrop = {
        x: Math.round((cw - cropW) / 2),
        y: Math.round((ch - cropH) / 2),
        w: cropW,
        h: cropH,
      };
      setCrop(initialCrop);
      draw(initialCrop);
      setIsLoaded(true);
    };
    img.src = imgSrc.current;
    return () => URL.revokeObjectURL(imgSrc.current);
  }, [draw]);

  useEffect(() => { if (isLoaded) draw(crop); }, [crop, draw, isLoaded]);

  // Clamp para que el recorte no salga del canvas
  const clamp = (c: typeof crop): typeof crop => {
    const canvas = canvasRef.current;
    if (!canvas) return c;
    const x = Math.max(0, Math.min(c.x, canvas.width - c.w));
    const y = Math.max(0, Math.min(c.y, canvas.height - c.h));
    return { ...c, x, y };
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    if (pos.x >= crop.x && pos.x <= crop.x + crop.w && pos.y >= crop.y && pos.y <= crop.y + crop.h) {
      dragging.current = true;
      dragStart.current = { mx: pos.x, my: pos.y, cx: crop.x, cy: crop.y };
    }
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current) return;
    const pos = getPos(e);
    const dx = pos.x - dragStart.current.mx;
    const dy = pos.y - dragStart.current.my;
    setCrop((prev) => clamp({ ...prev, x: dragStart.current.cx + dx, y: dragStart.current.cy + dy }));
  };

  const onMouseUp = () => { dragging.current = false; };

  const handleConfirm = async () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    setIsProcessing(true);

    try {
      const scaleX = img.naturalWidth / canvas.width;
      const scaleY = img.naturalHeight / canvas.height;
      const outputW = Math.min(crop.w * scaleX, 1280);
      const outputH = Math.round(outputW / ASPECT);

      const out = document.createElement("canvas");
      out.width = outputW;
      out.height = outputH;
      const ctx = out.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.w * scaleX, crop.h * scaleY, 0, 0, outputW, outputH);

      out.toBlob((blob) => {
        if (blob) onConfirm(blob);
        setIsProcessing(false);
      }, "image/jpeg", 0.88);
    } catch {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Ajustá tu foto</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Arrastrá el recuadro para elegir qué parte se va a mostrar. El área seleccionada es exactamente como se verá en la publicación.
          </p>
        </DialogHeader>

        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
          <div className="w-8 h-[18px] bg-primary/30 rounded-sm border border-primary/40" />
          <p className="text-xs text-primary font-medium">Formato 16:9 — igual al carousel de la publicación</p>
        </div>

        <div ref={containerRef} className="flex justify-center bg-black rounded-xl overflow-hidden">
          {!isLoaded && (
            <div className="flex items-center justify-center h-40 w-full">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{
              display: isLoaded ? "block" : "none",
              maxWidth: "100%",
              cursor: "move",
              touchAction: "none",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
            onTouchEnd={onMouseUp}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
          <Move className="h-3.5 w-3.5" />
          Arrastrá el recuadro para reposicionarlo
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!isLoaded || isProcessing}>
            {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Procesando...</> : "Usar esta foto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}