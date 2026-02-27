"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/auth-context";
import { MessageCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PendingListing {
  listingId: string;
  listingTitle: string;
  pendingCount: number;
}

export function PendingQuestionsBadge() {
  const { user } = useAuth();
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .eq("host_id", user.id)
        .neq("status", "disabled");

      if (!listings || listings.length === 0) return;

      // Para cada publicación, contar preguntas sin responder
      const results: PendingListing[] = [];

      for (const listing of listings) {
        const { count } = await supabase
          .from("listing_questions")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", listing.id)
          .is("answer", null)
          .eq("is_visible", true);

        if (count && count > 0) {
          results.push({
            listingId: listing.id,
            listingTitle: listing.title,
            pendingCount: count,
          });
        }
      }

      setPendingListings(results);
    };

    fetchPending();

    const channel = supabase
      .channel("pending-questions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listing_questions" },
        () => fetchPending()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (pendingListings.length === 0) return null;

  const totalCount = pendingListings.reduce((sum, l) => sum + l.pendingCount, 0);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <MessageCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            {totalCount === 1
              ? "Tenés 1 pregunta sin responder"
              : `Tenés ${totalCount} preguntas sin responder`}
          </p>
          <p className="text-xs text-amber-700">
            Responder rápido genera más confianza y aumenta tus reservas.
          </p>
        </div>
        <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {totalCount > 9 ? "9+" : totalCount}
        </span>
      </div>

      {/* Por publicación */}
      <div className="space-y-2 pl-12">
        {pendingListings.map((item) => (
          <Link
            key={item.listingId}
            href={`/espacios/${item.listingId}`}
            className="flex items-center justify-between gap-3 bg-white border border-amber-200
                       rounded-lg px-3 py-2.5 hover:border-amber-400 hover:bg-amber-50/50
                       transition-colors group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold
                               flex items-center justify-center shrink-0">
                {item.pendingCount > 9 ? "9+" : item.pendingCount}
              </span>
              <span className="text-sm font-medium text-amber-900 truncate">
                {item.listingTitle}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-amber-600 shrink-0 group-hover:text-amber-800">
              Responder
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}