import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/lib/types";
import { MapPin, Clock } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-video w-full bg-muted relative">
        {/* Placeholder for photo */}
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-sm">Foto próximamente</div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground line-clamp-1 text-balance">
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
          {listing.fits.slice(0, 2).map((fit) => (
            <Badge key={fit} variant="outline" className="text-xs">
              {fit}
            </Badge>
          ))}
          {listing.fits.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{listing.fits.length - 2}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <div className="text-lg font-bold text-foreground">
              ${listing.priceDaily.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">
                /día
              </span>
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
