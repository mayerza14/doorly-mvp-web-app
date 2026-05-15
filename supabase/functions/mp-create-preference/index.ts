import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de comisiones — espejo de lib/commission.ts del frontend
// Para activar comisiones: cambiar DOORLY_COMMISSION_ENABLED a true
// ─────────────────────────────────────────────────────────────────────────────
const DOORLY_COMMISSION_ENABLED = Deno.env.get('DOORLY_COMMISSION_ENABLED') === 'true';
const COMMISSION_RENTER_RATE = 0.12;

function calcRenterCommission(basePrice: number): number {
  if (!DOORLY_COMMISSION_ENABLED) return 0;
  return Math.round(basePrice * COMMISSION_RENTER_RATE);
}

function calcRenterTotal(basePrice: number): number {
  return basePrice + calcRenterCommission(basePrice);
}

const FUNC = "mp-create-preference";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");
    const SITE_URL = Deno.env.get("SITE_URL") ?? "https://doorly.com.ar";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY || !MP_ACCESS_TOKEN) {
      return json(500, { func: FUNC, error: "Faltan variables de entorno." });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json(401, { func: FUNC, error: "No autorizado: Falta el header Authorization" });
    }

    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await supaUser.auth.getUser();

    if (authError || !userData?.user) {
      return json(401, { func: FUNC, error: "No autorizado: Token inválido", details: authError?.message });
    }

    const user = userData.user;
    const body = await req.json().catch(() => ({}));
    const booking_id = body.booking_id ?? body.bookingId;

    if (!booking_id) return json(400, { func: FUNC, error: "Falta el 'booking_id'." });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, status, hold_expires_at, amount, total_amount, mp_status, mp_preference_id, renter_id")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr) return json(500, { func: FUNC, error: "Error de BD al leer la reserva", details: bErr });
    if (!booking) return json(404, { func: FUNC, error: "Reserva no encontrada", booking_id });

    if (booking.renter_id !== user.id) {
      return json(403, { func: FUNC, error: "Prohibido: Esta reserva no es tuya." });
    }
    if (booking.status !== "hold") {
      return json(400, { func: FUNC, error: "La reserva debe estar en 'hold'." });
    }

    const holdExp = new Date(booking.hold_expires_at).getTime();
    if (Number.isNaN(holdExp) || holdExp <= Date.now()) {
      return json(400, { func: FUNC, error: "El tiempo expiró. Volvé a elegir fechas." });
    }
    if (booking.mp_status === "approved") {
      return json(400, { func: FUNC, error: "Esta reserva ya fue pagada." });
    }
    if (!booking.amount || booking.amount <= 0) {
      return json(400, { func: FUNC, error: "Monto inválido." });
    }

    // Monto a cobrar en MP:
    // Usamos total_amount si el frontend lo guardó (base + comision inquilino).
    // Si no, lo calculamos como respaldo.
    const baseAmount = Number(booking.amount);
    const storedTotal = booking.total_amount ? Number(booking.total_amount) : null;
    const chargeAmount =
      storedTotal && storedTotal >= baseAmount
        ? storedTotal
        : calcRenterTotal(baseAmount);

    const webhookUrl = `${SUPABASE_URL}/functions/v1/mp-webhook`;

    const preferencePayload = {
      items: [
        {
          title: "Doorly - Reserva de espacio",
          quantity: 1,
          unit_price: chargeAmount,
          currency_id: "ARS",
        },
      ],
      external_reference: booking_id,
      metadata: { booking_id },
      notification_url: webhookUrl,
      back_urls: {
        success: `${SITE_URL}/dashboard?pago=ok`,
        failure: `${SITE_URL}/dashboard?pago=error`,
        pending: `${SITE_URL}/dashboard?pago=pendiente`,
      },
      auto_return: "approved",
    };

    console.log("[mp-create-preference] Payload enviado a MP:", JSON.stringify(preferencePayload));

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpPref = await mpRes.json();

    console.log("[mp-create-preference] MP status:", mpRes.status);
    console.log("[mp-create-preference] MP body:", JSON.stringify(mpPref));

    if (!mpRes.ok) {
      return json(400, { func: FUNC, error: "Mercado Pago rechazó la preferencia", mpPref });
    }

    const { error: uErr } = await admin
      .from("bookings")
      .update({
        mp_preference_id: mpPref?.id ? String(mpPref.id) : null,
        mp_status: "created",
        mp_init_point: mpPref?.init_point ?? null,
        mp_sandbox_init_point: mpPref?.sandbox_init_point ?? null,
      })
      .eq("id", booking_id);

    if (uErr) {
      return json(500, { func: FUNC, error: "Error al actualizar la base de datos", details: uErr });
    }

    const env = String(MP_ACCESS_TOKEN).startsWith("TEST-") ? "test" : "prod";
    const init_point = env === "prod"
  ? mpPref?.init_point
  : mpPref?.sandbox_init_point ?? mpPref?.init_point;

    console.log("[mp-create-preference] init_point:", init_point);
    console.log("[mp-create-preference] env:", env);
    console.log("[mp-create-preference] charge_amount:", chargeAmount);

    return json(200, {
      ok: true,
      func: FUNC,
      env,
      booking_id,
      preference_id: mpPref?.id,
      init_point,
      charge_amount: chargeAmount,
    });

  } catch (e) {
    return json(500, { func: FUNC, error: "Excepción interna", details: String(e) });
  }
});