"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_role: "renter" | "host";
  created_at: string;
}

interface ReviewsSectionProps {
  listingId: string;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          className={star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}
        />
      ))}
    </div>
  );
}

function RatingBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground w-8 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-muted-foreground w-4 text-left">{value}</span>
    </div>
  );
}

export function ReviewsSection({ listingId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          `reviews-by-listing?listing_id=${listingId}`,
          { method: "GET" }
        );
        if (!error && data?.reviews) {
          setReviews(data.reviews);
          setAvgRating(data.summary?.avg_rating ?? 0);
        }
      } catch (e) {
        console.error("Error cargando reseñas:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [listingId]);

  // Distribución de estrellas
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
        <p className="font-medium">Todavía no hay reseñas</p>
        <p className="text-sm mt-1">Sé el primero en dejar una opinión sobre este espacio</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Número grande */}
        <div className="flex flex-col items-center justify-center bg-muted/40 rounded-2xl px-8 py-5 min-w-[120px]">
          <span className="text-5xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
          <StarRating rating={Math.round(avgRating)} size={18} />
          <span className="text-xs text-muted-foreground mt-1.5">
            {reviews.length} reseña{reviews.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Barras de distribución */}
        <div className="flex-1 space-y-1.5 w-full">
          {distribution.map(({ star, count }) => (
            <RatingBar key={star} label={`${star}★`} value={count} max={reviews.length} />
          ))}
        </div>
      </div>

      {/* Lista de reseñas */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                  {review.reviewer_role === "renter" ? "G" : "P"}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground leading-tight">
                    {review.reviewer_role === "renter" ? "Guardador" : "Propietario"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <StarRating rating={review.rating} size={13} />
                <Badge variant="secondary" className="text-xs px-1.5">
                  {review.rating}.0
                </Badge>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed pl-12">
              {review.comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}