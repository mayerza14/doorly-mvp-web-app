"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoCarouselProps {
  photos: string[];
  title: string;
}

export function PhotoCarousel({ photos, title }: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1));

  const isPlaceholder = photos[current] === "/placeholder.jpg" || !photos[current];

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-muted select-none"
         style={{ aspectRatio: "16/9" }}>

      {/* Imagen o placeholder */}
      {isPlaceholder ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
          <div className="text-6xl mb-3">📦</div>
          <p className="text-sm font-medium">Foto {current + 1}</p>
        </div>
      ) : (
        <img
          src={photos[current]}
          alt={`${title} — foto ${current + 1}`}
          className="w-full h-full object-cover"
        />
      )}

      {/* Flechas — solo si hay más de 1 foto */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2
                       h-9 w-9 rounded-full bg-white/90 shadow-md
                       flex items-center justify-center
                       hover:bg-white transition-colors z-10"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>

          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       h-9 w-9 rounded-full bg-white/90 shadow-md
                       flex items-center justify-center
                       hover:bg-white transition-colors z-10"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>

          {/* Contador */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
            {current + 1} / {photos.length}
          </div>

          {/* Puntos indicadores */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? "w-4 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Ir a foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}