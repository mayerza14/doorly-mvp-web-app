import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "create-listing";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json(405, { func: FUNC, error: "Use POST" });

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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json(400, { func: FUNC, error: "Invalid JSON body" });
    }

    // ── Campos básicos ──
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim();
    const space_type = String(body?.space_type ?? "").trim();
    const area_label = String(body?.area_label ?? "").trim();
    const price_daily = Number(body?.price_daily ?? 0);
    const price_weekly = body?.price_weekly ? Number(body.price_weekly) : null;
    const price_monthly = body?.price_monthly ? Number(body.price_monthly) : null;
    const full_address_private = String(body?.full_address_private ?? "").trim();
    const access_notes_private = String(body?.access_notes_private ?? "").trim();
    const access_type = String(body?.access_type ?? "24_7").trim();

    // ── Dimensiones ──
    const largo = body?.largo ? Number(body.largo) : null;
    const ancho = body?.ancho ? Number(body.ancho) : null;
    const alto = body?.alto ? Number(body.alto) : null;
    const size_m2 = body?.size_m2
      ? Number(body.size_m2)
      : (largo && ancho ? Math.round(largo * ancho * 100) / 100 : null);

    // ── Arrays ──
    const fits = Array.isArray(body?.fits) ? body.fits : [];
    const rules_allowed = Array.isArray(body?.rules_allowed) ? body.rules_allowed : [];
    const rules_not_allowed = Array.isArray(body?.rules_not_allowed) ? body.rules_not_allowed : [];
    const amenities = Array.isArray(body?.amenities) ? body.amenities : [];

    // ── Fotos ──
    const photos: string[] = Array.isArray(body?.photos) ? body.photos : [];

    // ── Coordenadas ──
    const lat_exact = body?.lat_exact !== undefined ? Number(body.lat_exact) : null;
    const lng_exact = body?.lng_exact !== undefined ? Number(body.lng_exact) : null;

    let lat_public = null;
    let lng_public = null;
    if (lat_exact !== null && lng_exact !== null && !isNaN(lat_exact) && !isNaN(lng_exact)) {
      const lat_offset = (Math.random() - 0.5) * 0.006;
      const lng_offset = (Math.random() - 0.5) * 0.006;
      lat_public = Number((lat_exact + lat_offset).toFixed(5));
      lng_public = Number((lng_exact + lng_offset).toFixed(5));
    }

// ── Modo de reserva ──
const booking_mode = ['flexible', 'monthly', 'both'].includes(body?.booking_mode)
  ? String(body.booking_mode)
  : 'flexible';
const min_months = body?.min_months ? Number(body.min_months) : null;

    // ── Validaciones ──
    if (!title) return json(400, { func: FUNC, error: "title is required" });
    if (!description) return json(400, { func: FUNC, error: "description is required" });
    if (!space_type) return json(400, { func: FUNC, error: "space_type is required" });
    if (!area_label) return json(400, { func: FUNC, error: "area_label is required" });
    if (!Number.isFinite(price_daily) || price_daily <= 0) {
      return json(400, { func: FUNC, error: "price_daily must be a number > 0" });
    }
    if (!Number.isInteger(price_daily)) {
      return json(400, { func: FUNC, error: "price_daily must be an integer" });
    }
    if (!full_address_private) {
      return json(400, { func: FUNC, error: "full_address_private is required" });
    }

// Validación modo mensual
if ((booking_mode === 'monthly' || booking_mode === 'both') && !price_monthly) {
  return json(400, { func: FUNC, error: "price_monthly is required for monthly mode" });
}
if ((booking_mode === 'monthly' || booking_mode === 'both') && (!min_months || min_months < 1)) {
  return json(400, { func: FUNC, error: "min_months must be >= 1 for monthly mode" });
}

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ── Insertar listing con todos los campos ──
    const { data: listing, error: lErr } = await admin
      .from("listings")
      .insert({
        host_id: uid,
        title,
        description,
        space_type,
        area_label,
        price_daily,
        price_weekly,
        price_monthly,
        booking_mode,
min_months,
        access_type,
        largo,
        ancho,
        alto,
        size_m2,
        fits,
        rules_allowed,
        rules_not_allowed,
        amenities,
        lat_public,
        lng_public,
      })
      .select("id, status")
      .single();

    if (lErr) return json(500, { func: FUNC, error: "Insert listing failed", details: lErr.message });

    // ── Insertar datos privados ──
    const { error: pErr } = await admin
      .from("listing_private")
      .upsert(
        {
          listing_id: listing.id,
          full_address_private,
          access_notes_private,
          lat_exact,
          lng_exact,
        },
        { onConflict: "listing_id" }
      );

    if (pErr) return json(500, { func: FUNC, error: "Upsert listing_private failed", details: pErr.message });

    // ── Insertar fotos en listing_photos ──
    if (photos.length > 0) {
      const photoRows = photos.map((url: string, index: number) => ({
        listing_id: listing.id,
        url,
        position: index,
      }));

      const { error: photoErr } = await admin
        .from("listing_photos")
        .insert(photoRows);

      if (photoErr) {
        console.error("Error insertando fotos:", photoErr.message);
        // No fallamos el request completo por las fotos
      }
    }

    return json(200, {
      ok: true,
      func: FUNC,
      listing_id: listing.id,
      status: listing.status,
      photos_saved: photos.length,
    });

  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});