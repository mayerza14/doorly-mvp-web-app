"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle2, Loader2 } from "lucide-react";

interface LeaveReviewProps {
  bookingId: string;
  listingTitle: string;
  onReviewSubmitted: () => void; // callback para refrescar la lista
}

function InteractiveStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][value]}
        </span>
      )}
    </div>
  );
}

export function LeaveReview({ bookingId, listingTitle, onReviewSubmitted }: LeaveReviewProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) { setError("Seleccioná una puntuación"); return; }
    if (comment.trim().length < 10) { setError("El comentario debe tener al menos 10 caracteres"); return; }

    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-review", {
        body: { booking_id: bookingId, rating, comment: comment.trim() },
      });

      if (fnError) {
        setError("No se pudo enviar la reseña. Intentá de nuevo.");
        return;
      }

      if (data?.ok === false || data?.error) {
        if (data?.error?.includes("already reviewed")) {
          setError("Ya dejaste una reseña para esta reserva.");
        } else if (data?.error?.includes("window")) {
          setError("El período para dejar reseña ya venció (15 días desde la finalización).");
        } else {
          setError(data?.error || "Error al enviar la reseña.");
        }
        return;
      }

      setSubmitted(true);
      setTimeout(() => onReviewSubmitted(), 1500);
    } catch (e) {
      setError("Error inesperado. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="font-semibold text-foreground">¡Reseña enviada!</p>
        <p className="text-sm text-muted-foreground">Gracias por tu opinión</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
      <div>
        <p className="font-medium text-sm text-foreground">Dejá tu reseña</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">Reserva: {listingTitle}</p>
      </div>

      {/* Estrellas interactivas */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">¿Cómo fue tu experiencia?</p>
        <InteractiveStars value={rating} onChange={(v) => { setRating(v); setError(""); }} />
      </div>

      {/* Comentario */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Contanos más (mínimo 10 caracteres)</p>
        <Textarea
          placeholder="El espacio era exactamente como se describía, muy fácil el acceso..."
          rows={3}
          value={comment}
          onChange={(e) => { setComment(e.target.value); setError(""); }}
          className="resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground text-right">{comment.length} caracteres</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
        ) : (
          "Publicar reseña"
        )}
      </Button>
    </div>
  );
}