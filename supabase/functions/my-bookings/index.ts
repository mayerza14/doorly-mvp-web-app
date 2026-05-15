import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "my-bookings";

// AGREGAMOS "Access-Control-Allow-Methods" PARA EL PREFLIGHT
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 
      ...corsHeaders,
      "Content-Type": "application/json" 
    },
  });
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86400000);
}

Deno.serve(async (req) => {
  // Respuesta con status 204 (Sin contenido) es el estándar más profesional para Preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    if (req.method !== "GET") return json(405, { func: FUNC, error: "Use GET" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return json(500, { func: FUNC, error: "Missing env vars" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { func: FUNC, error: "Missing Authorization header" });

    // 1) Identificar usuario desde el JWT
    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: uErr } = await supaUser.auth.getUser();
    if (uErr || !userData?.user) {
      return json(401, { func: FUNC, error: "Invalid session", details: uErr?.message ?? "unknown" });
    }
    const uid = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 2) Traer bookings donde el usuario participa (renter o host)
    const { data: bookings, error: bErr } = await admin
      .from("bookings")
      .select("id, listing_id, renter_id, host_id, start_date, end_date, status, mp_status, amount, total_amount, created_at, listing:listings(title)")
      .or(`renter_id.eq.${uid},host_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (bErr) return json(500, { func: FUNC, error: "DB error reading bookings", details: bErr.message });

    const list = bookings ?? [];
    const bookingIds = list.map((b) => b.id);

    // 3) Traer reviews que YA escribió este usuario
    let reviewedSet = new Set<string>();
    if (bookingIds.length > 0) {
      const { data: myReviews, error: rErr } = await admin
        .from("reviews")
        .select("booking_id")
        .eq("reviewer_id", uid)
        .in("booking_id", bookingIds);

      if (rErr) return json(500, { func: FUNC, error: "DB error reading reviews", details: rErr.message });

      reviewedSet = new Set((myReviews ?? []).map((x) => x.booking_id));
    }

    const now = new Date();

    // 4) Enriquecer cada booking
    const enriched = list.map((b: any) => {
      const role = uid === b.renter_id ? "renter" : "host";
      const reviewee_id = role === "renter" ? b.host_id : b.renter_id;

      const can_show_exact_address = (b.status === "confirmed" && b.mp_status === "approved");

      const end = new Date(b.end_date);
      const window_open_at = addDays(end, 1);
      const window_close_at = addDays(end, 15);

      const already_reviewed = reviewedSet.has(b.id);

      let review_state: "not_open" | "open" | "closed" | "already_reviewed" | "not_eligible" = "not_eligible";
      let can_review = false;

      const eligible = (b.status === "confirmed" && b.mp_status === "approved");
      if (eligible) {
        if (already_reviewed) {
          review_state = "already_reviewed";
        } else if (now < window_open_at) {
          review_state = "not_open";
        } else if (now >= window_close_at) {
          review_state = "closed";
        } else {
          review_state = "open";
          can_review = true;
        }
      }

      return {
        ...b,
        role,
        reviewee_id,
        can_show_exact_address,
        can_review,
        review_state,
        review_window_open_at: window_open_at.toISOString(),
        review_window_close_at: window_close_at.toISOString(),
        already_reviewed,
        total_price: b.total_amount
      };
    });

    return json(200, { ok: true, func: FUNC, user_id: uid, bookings: enriched });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});