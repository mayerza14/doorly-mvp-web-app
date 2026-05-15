import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "reveal-address";

// 1) LA PUERTA DE ENTRADA (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }, // Agregamos CORS aquí
  });
}

Deno.serve(async (req) => {
  try {
    // Respuesta automática para los navegadores (Preflight CORS)
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== "GET") return json(405, { func: FUNC, error: "Use GET" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return json(500, { func: FUNC, error: "Missing env vars" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { func: FUNC, error: "Missing Authorization header" });

    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: uErr } = await supaUser.auth.getUser();
    if (uErr || !userData?.user) {
      return json(401, { func: FUNC, error: "Invalid session", details: uErr?.message ?? "unknown" });
    }
    const uid = userData.user.id;

    const url = new URL(req.url);
    const booking_id = url.searchParams.get("booking_id");
    if (!booking_id) return json(400, { func: FUNC, error: "Missing booking_id query param" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) Validar booking + permisos + pago
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, renter_id, host_id, listing_id, status, mp_status")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr) return json(500, { func: FUNC, error: "DB error reading booking", details: bErr.message });
    if (!booking) return json(404, { func: FUNC, error: "Booking not found" });

    if (booking.renter_id !== uid && booking.host_id !== uid) {
      return json(403, { func: FUNC, error: "Forbidden" });
    }

    if (!(booking.status === "confirmed" && booking.mp_status === "approved")) {
      return json(403, {
        func: FUNC,
        error: "Exact address locked until payment is approved",
        booking_status: booking.status,
        mp_status: booking.mp_status,
      });
    }

    // 2) Traer la dirección y coordenadas exactas desde listing_private
    const { data: priv, error: pErr } = await admin
      .from("listing_private")
      // NUEVO: Agregamos lat_exact y lng_exact
      .select("listing_id, full_address_private, access_notes_private, lat_exact, lng_exact, created_at, updated_at")
      .eq("listing_id", booking.listing_id)
      .maybeSingle();

    if (pErr) return json(500, { func: FUNC, error: "DB error reading listing_private", details: pErr.message });
    if (!priv) return json(404, { func: FUNC, error: "Private address not found for listing" });

    return json(200, { ok: true, func: FUNC, booking_id, listing_id: booking.listing_id, private: priv });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});