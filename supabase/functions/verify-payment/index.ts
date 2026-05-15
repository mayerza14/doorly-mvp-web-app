import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "verify-payment";

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
    const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY || !MP_ACCESS_TOKEN) {
      return json(500, { func: FUNC, error: "Faltan variables de entorno" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { func: FUNC, error: "No autorizado" });

    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await supaUser.auth.getUser();
    if (authError || !userData?.user) return json(401, { func: FUNC, error: "Token inválido" });

    const body = await req.json().catch(() => ({}));
    const booking_id = body.booking_id;
    if (!booking_id) return json(400, { func: FUNC, error: "Falta booking_id" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Buscamos el booking
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, renter_id, mp_preference_id, mp_status, status, amount")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr || !booking) return json(404, { func: FUNC, error: "Booking no encontrado" });
    if (booking.renter_id !== userData.user.id) return json(403, { func: FUNC, error: "No autorizado" });

    // Si ya está confirmado, devolvemos OK directo
    if (booking.status === "confirmed") {
      return json(200, { ok: true, status: "confirmed", already_confirmed: true });
    }

    if (!booking.mp_preference_id) {
      return json(400, { func: FUNC, error: "No hay preferencia de MP asociada" });
    }

    // Consultamos los pagos de esta preferencia directamente a MP
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/search?preference_id=${booking.mp_preference_id}&sort=date_created&criteria=desc&range=date_created&begin_date=NOW-7DAYS&end_date=NOW`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    const mpData = await mpRes.json();
    console.log(`[${FUNC}] MP search response:`, JSON.stringify(mpData));

    if (!mpRes.ok) {
      return json(500, { func: FUNC, error: "Error consultando MP", mpData });
    }

    const payments = mpData?.results ?? [];
    const approvedPayment = payments.find((p: any) => p.status === "approved");

    if (approvedPayment) {
      // Validar que el monto pagado no sea menor al esperado (tolerancia 1%)
const expectedAmount = Number(booking.amount);
const paidAmount = Number(approvedPayment.transaction_amount ?? 0);
if (paidAmount < expectedAmount * 0.99) {
  console.error(`[${FUNC}] Monto insuficiente: pagó ${paidAmount}, esperaba ${expectedAmount}`);
  return json(400, {
    func: FUNC,
    error: 'Monto pagado insuficiente',
    paid: paidAmount,
    expected: expectedAmount
  });
}
      // Pago aprobado — confirmamos el booking sin importar si estaba expired o hold
      const { error: uErr } = await admin
        .from("bookings")
        .update({
          status: "confirmed",
          mp_status: "approved",
          mp_payment_id: String(approvedPayment.id),
          mp_status_detail: approvedPayment.status_detail ?? null,
          mp_payment_type: approvedPayment.payment_type_id ?? null,
          mp_payment_method_id: approvedPayment.payment_method_id ?? null,
          mp_payer_email: approvedPayment.payer?.email ?? null,
          mp_amount_paid: approvedPayment.transaction_amount ?? null,
          paid_at: approvedPayment.date_approved ?? null,
        })
        .eq("id", booking_id);

      if (uErr) return json(500, { func: FUNC, error: "Error actualizando booking", details: uErr.message });

      return json(200, { ok: true, status: "confirmed", payment_id: approvedPayment.id });
    }

    // Si no hay pago aprobado, devolvemos el estado actual
    const pendingPayment = payments.find((p: any) => p.status === "pending" || p.status === "in_process");
    if (pendingPayment) {
      return json(200, { ok: true, status: "pending", payment_id: pendingPayment.id });
    }

    return json(200, { ok: true, status: booking.status, no_payment_found: true });

  } catch (e) {
    return json(500, { func: FUNC, error: "Excepción interna", details: String(e) });
  }
});