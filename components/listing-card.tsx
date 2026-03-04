"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, ChevronLeft, ChevronRight, Package } from "lucide-react";

interface ListingCardProps {
  listing: any;
}

export function ListingCard({ listing }: ListingCardProps) {
  const photos: string[] = listing.photos || [];
  const hasPhotos = photos.length > 0;
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1));
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg group">
      {/* ── Foto ── */}
      <Link href={`/espacios/${listing.id}`}>
        <div
          className="aspect-video w-full bg-muted relative overflow-hidden"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {hasPhotos ? (
            <>
              <Image
                src={photos[current]}
                alt={listing.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />

              {/* Flechas — solo si hay más de una foto */}
              {photos.length > 1 && hovered && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                               bg-black/50 hover:bg-black/70 text-white rounded-full p-1
                               transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                               bg-black/50 hover:bg-black/70 text-white rounded-full p-1
                               transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Dots — solo si hay más de una foto */}
              {photos.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i); }}
                      className={`h-1.5 rounded-full transition-all ${
                        i === current
                          ? "w-4 bg-white"
                          : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Contador */}
              {photos.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">
                  {current + 1}/{photos.length}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <div className="text-sm">Sin fotos aún</div>
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* ── Info ── */}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {listing.title}
          </h3>
          <Badge variant="secondary" className="shrink-0">
            {listing.spaceType}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{listing.areaLabel}</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {listing.accessType === "24_7" && (
            <Badge variant="outline" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              24/7
            </Badge>
          )}
          {(listing.fits || []).slice(0, 2).map((fit: string) => (
            <Badge key={fit} variant="outline" className="text-xs">
              {fit}
            </Badge>
          ))}
          {(listing.fits || []).length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{listing.fits.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-lg font-bold text-foreground">
              ${listing.priceDaily.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">/día</span>
            </div>
            {listing.priceWeekly && (
              <div className="text-xs text-muted-foreground">
                Desde ${listing.priceWeekly.toLocaleString()}/semana
              </div>
            )}
          </div>
          <Button asChild size="sm">
            <Link href={`/espacios/${listing.id}`}>Ver detalle</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}