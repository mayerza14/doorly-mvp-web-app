import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "checkout-start";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json(405, { func: FUNC, error: "Use POST" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
    const WEBHOOK_INTERNAL_TOKEN = Deno.env.get("WEBHOOK_INTERNAL_TOKEN")!; // el mismo que usás en mp-webhook

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return json(500, { func: FUNC, error: "Missing Supabase env vars" });
    }
    if (!MP_ACCESS_TOKEN) return json(500, { func: FUNC, error: "Missing MP_ACCESS_TOKEN secret" });
    if (!WEBHOOK_INTERNAL_TOKEN) return json(500, { func: FUNC, error: "Missing WEBHOOK_INTERNAL_TOKEN secret" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { func: FUNC, error: "Missing Authorization header" });

    // Usuario (JWT del cliente)
    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: uErr } = await supaUser.auth.getUser();
    if (uErr || !userData?.user) {
      return json(401, { func: FUNC, error: "Invalid session", details: uErr?.message ?? "unknown" });
    }
    const uid = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const booking_id = body.booking_id;

    if (!booking_id || typeof booking_id !== "string") {
      return json(400, { func: FUNC, error: "Missing booking_id (string) in JSON body." });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Traemos booking y validamos ownership + estado hold
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, renter_id, status, hold_expires_at, amount, mp_status, mp_preference_id")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr) return json(500, { func: FUNC, error: "DB error reading booking", details: bErr.message });
    if (!booking) return json(404, { func: FUNC, error: "Booking not found", booking_id });

    if (booking.renter_id !== uid) return json(403, { func: FUNC, error: "Forbidden: booking no pertenece al usuario" });

    if (booking.status !== "hold") {
      return json(400, { func: FUNC, error: `Booking status must be 'hold'. Current: ${booking.status}` });
    }

    if (!booking.hold_expires_at) return json(400, { func: FUNC, error: "hold_expires_at missing" });

    const holdExp = new Date(booking.hold_expires_at).getTime();
    if (Number.isNaN(holdExp) || holdExp <= Date.now()) {
      return json(400, { func: FUNC, error: "Booking hold expired" });
    }

    if (!booking.amount || booking.amount <= 0) {
      return json(400, { func: FUNC, error: "Booking amount missing or <= 0" });
    }

    // webhook URL (tu edge function)
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mp-webhook?token=${encodeURIComponent(WEBHOOK_INTERNAL_TOKEN)}`;

    // Preferencia MP
    const prefPayload: any = {
      items: [{
        title: "Doorly - Reserva",
        quantity: 1,
        unit_price: Number(booking.amount),
        currency_id: "ARS",
      }],
      external_reference: booking_id,
      metadata: { booking_id },
      notification_url: webhookUrl,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(prefPayload),
    });

    const mpPref = await mpRes.json();
    if (!mpRes.ok) {
      return json(400, { func: FUNC, error: "MP preference creation failed", mpPref });
    }

    const preference_id = mpPref?.id ? String(mpPref.id) : null;
    const init_point = mpPref?.init_point ?? null;
    const sandbox_init_point = mpPref?.sandbox_init_point ?? null;

    // Guardamos referencia
    await admin
      .from("bookings")
      .update({
        mp_preference_id: preference_id,
        mp_status: "created",
      })
      .eq("id", booking_id);

    const env = String(MP_ACCESS_TOKEN).toUpperCase().startsWith("TEST-") ? "test" : "prod";

    return json(200, {
      ok: true,
      func: FUNC,
      env,
      booking_id,
      preference_id,
      init_point,
      sandbox_init_point,
      checkout_url: sandbox_init_point ?? init_point,
    });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});
