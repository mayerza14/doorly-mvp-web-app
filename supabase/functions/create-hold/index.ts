import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "create-hold";

// 1) Cabeceras CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseDate(s: string) {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 0, 0, 0));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

Deno.serve(async (req) => {
  // Respuesta automática para los navegadores (Preflight CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json(405, { func: FUNC, error: "Use POST" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

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
      return json(401, { func: FUNC, error: "Invalid session", details: uErr?.message });
    }

    const renter_id = userData.user.id;
    const body = await req.json().catch(() => ({}));

    const listing_id = body.listing_id;
    const start_date = body.start_date;
    const end_date = body.end_date;
    const booking_mode = ['flexible', 'monthly'].includes(body?.booking_mode)
  ? String(body.booking_mode)
  : 'flexible';

    if (!listing_id || typeof listing_id !== "string") return json(400, { func: FUNC, error: "listing_id requerido" });
    if (!start_date || typeof start_date !== "string") return json(400, { func: FUNC, error: "start_date requerido" });
    if (!end_date || typeof end_date !== "string") return json(400, { func: FUNC, error: "end_date requerido" });

    const sd = parseDate(start_date);
    const ed = parseDate(end_date);

    if (!sd || !ed) return json(400, { func: FUNC, error: "Fechas inválidas. Formato: YYYY-MM-DD" });
    if (ed.getTime() < sd.getTime()) return json(400, { func: FUNC, error: "end_date no puede ser menor a start_date" });

    const days = Math.floor((ed.getTime() - sd.getTime()) / 86400000) + 1;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: listing, error: lErr } = await admin
      .from("listings")
      .select("id, host_id, price_daily, price_weekly, price_monthly, booking_mode, min_months")
      .eq("id", listing_id)
      .maybeSingle();

    if (lErr) return json(500, { func: FUNC, error: "DB error reading listing", details: lErr.message });
    if (!listing) return json(404, { func: FUNC, error: "Listing not found" });
    if (!listing.host_id) return json(500, { func: FUNC, error: "Listing host_id missing" });

    const pd = typeof listing.price_daily === "number" ? listing.price_daily : null;
    const pw = typeof listing.price_weekly === "number" ? listing.price_weekly : null;
    const pm = typeof listing.price_monthly === "number" ? listing.price_monthly : null;

    let amount: number | null = null;

if (booking_mode === 'monthly' && pm) {
  // Modo mensual: meses enteros, no días
  const months = Math.round(days / 30);
  amount = months * pm;
} else {
  // Modo flexible: lógica actual sin descuento mensual automático
  if (days >= 7 && pw) amount = Math.ceil(days / 7) * pw;
  else if (pd) amount = days * pd;
}

    if (!amount) {
      const bodyAmount = typeof body.amount === "number" ? body.amount : null;
      if (bodyAmount && bodyAmount > 0) amount = bodyAmount;
    }

    if (!amount || amount <= 0) {
      return json(400, { func: FUNC, error: "No pude calcular amount." });
    }

    const total_amount = typeof body.total_amount === "number" && body.total_amount > 0 ? body.total_amount : amount;

    // Llamada a la base de datos para crear la retención
   const { data: booking_id, error: rpcErr } = await admin.rpc("create_hold_booking", {
  p_listing_id: listing_id,
  p_renter_id: renter_id,
  p_host_id: listing.host_id,
  p_start_date: start_date,
  p_end_date: end_date,
  p_amount: amount,
  p_total_amount: total_amount,
  p_booking_mode: booking_mode,   // ← nuevo
});

    if (rpcErr) return json(409, { func: FUNC, error: "No disponible / solapamiento", details: rpcErr.message });

    return json(200, { ok: true, func: FUNC, booking_id, days, amount, total_amount });
    
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled exception", details: String(e) });
  }
});