import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "mp-webhook";
async function verifyMPSignature(req: Request, secret: string): Promise<boolean> {
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  if (!signature || !requestId) return false;
  const url = new URL(req.url);
  const dataId = url.searchParams.get('data.id') ?? '';
  const manifest = `id:${dataId};request-id:${requestId};ts:${Date.now()};`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const hashBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
  const parts = signature.split(',');
  const v1 = parts.find(p => p.startsWith('v1='))?.slice(3) ?? '';
  return v1 === hashHex;
}


function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function processNotification(
  body: any,
  url: URL,
  SUPABASE_URL: string,
  SERVICE_ROLE_KEY: string,
  MP_ACCESS_TOKEN: string
) {
  const topic =
    url.searchParams.get("topic") ??
    url.searchParams.get("type") ??
    body?.type ??
    body?.topic ??
    "";

  const id =
    url.searchParams.get("id") ??
    body?.data?.id ??
    "";

  console.log(`[${FUNC}] topic=${topic} id=${id}`);

  if (!id) {
    console.log(`[${FUNC}] Sin ID, ignorando`);
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let booking_id: string | null = null;
  let mp_status: string | null = null;
  let preference_id: string | null = null;

  if (topic === "merchant_order") {
    const moRes = await fetch(`https://api.mercadopago.com/merchant_orders/${id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const mo = await moRes.json();
    console.log(`[${FUNC}] merchant_order:`, JSON.stringify(mo));

    if (!moRes.ok) return;

    booking_id = mo?.external_reference ? String(mo.external_reference) : null;
    preference_id = mo?.preference_id ? String(mo.preference_id) : null;

    const payments = Array.isArray(mo?.payments) ? mo.payments : [];
    const approved = payments.find((p: any) => p?.status === "approved");
    mp_status = approved
      ? "approved"
      : payments[0]?.status
      ? String(payments[0].status)
      : "pending";

  } else if (topic === "payment") {
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const pay = await payRes.json();
    console.log(`[${FUNC}] payment:`, JSON.stringify(pay));

    if (!payRes.ok) return;

    booking_id = pay?.external_reference ? String(pay.external_reference) : null;
    mp_status = pay?.status ? String(pay.status) : "unknown";

  } else {
    console.log(`[${FUNC}] Tópico ignorado: ${topic}`);
    return;
  }

  let resolved_booking_id: string | null = null;

  if (booking_id && isUuid(booking_id)) {
    resolved_booking_id = booking_id;
  } else if (preference_id) {
    const { data: b } = await admin
      .from("bookings")
      .select("id")
      .eq("mp_preference_id", preference_id)
      .maybeSingle();
    resolved_booking_id = b?.id ?? null;
  }

  if (!resolved_booking_id) {
    console.log(`[${FUNC}] No se pudo resolver booking_id`);
    return;
  }

  const patch: any = { mp_status: mp_status ?? "unknown" };
  if (mp_status === "approved") patch.status = "confirmed";

  console.log(`[${FUNC}] Actualizando booking ${resolved_booking_id}:`, JSON.stringify(patch));

  const { error: upErr } = await admin
    .from("bookings")
    .update(patch)
    .eq("id", resolved_booking_id);

  if (upErr) {
    console.error(`[${FUNC}] Error actualizando BD:`, upErr.message);
  } else {
    console.log(`[${FUNC}] Booking actualizado OK`);

    if (mp_status === "approved") {
      try {
        const { data: booking } = await admin
          .from("bookings")
          .select("listing_id, renter_id, host_id, start_date, end_date")
          .eq("id", resolved_booking_id)
          .single();

        if (booking) {
          const [listingRes, hostUserRes, hostProfileRes, renterProfileRes] = await Promise.all([
            admin.from("listings").select("title").eq("id", booking.listing_id).single(),
            admin.auth.admin.getUserById(booking.host_id),
            admin.from("profiles").select("full_name").eq("id", booking.host_id).single(),
            admin.from("profiles").select("full_name").eq("id", booking.renter_id).single(),
          ]);

          const hostEmail = hostUserRes.data?.user?.email;
          const listingTitle = listingRes.data?.title || "tu espacio";
          const hostName = hostProfileRes.data?.full_name || "Propietario";
          const renterName = renterProfileRes.data?.full_name || "Un inquilino";

          const formatDate = (d: string) =>
            new Date(d).toLocaleDateString("es-AR", {
              timeZone: "America/Argentina/Buenos_Aires",
              day: "2-digit", month: "2-digit", year: "numeric",
            });

          const startDate = formatDate(booking.start_date);
          const endDate = formatDate(booking.end_date);
          const year = new Date().getFullYear();
          const resendKey = Deno.env.get("RESEND_API_KEY");

          if (hostEmail && resendKey) {
            const emailRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Doorly <soporte@doorly.com.ar>",
                to: [hostEmail],
                subject: `¡Tenés una nueva reserva confirmada! "${listingTitle}"`,
                html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nueva reserva confirmada</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="https://doorly.com.ar/logo.png" alt="Doorly" width="120"
                style="display:block;height:auto;" onerror="this.style.display='none'" />
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Buenas noticias</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                      ¡Tenés una nueva reserva confirmada!
                    </h1>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">Hola, ${hostName}</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Detalles de la reserva</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:10px;">
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Espacio</p>
                                <p style="margin:2px 0 0;font-size:16px;font-weight:700;color:#0f172a;">${listingTitle}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Inquilino</p>
                                <p style="margin:2px 0 0;font-size:14px;color:#334155;">${renterName}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Desde</p>
                                <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#0f172a;">${startDate}</p>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Hasta</p>
                                <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#0f172a;">${endDate}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#166534;line-height:1.5;">
                            ✅ <strong>El pago fue acreditado.</strong> Podés ver todos los detalles en tu panel de Doorly.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                Este mail fue enviado automáticamente por Doorly al confirmarse una reserva.
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                ¿Dudas? Escribinos a
                <a href="mailto:soporte@doorly.com.ar" style="color:#0ea5e9;text-decoration:none;">soporte@doorly.com.ar</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© ${year} Doorly. Todos los derechos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
              }),
            });

            if (!emailRes.ok) {
              console.error(`[${FUNC}] Error enviando email al host: ${await emailRes.text()}`);
            } else {
              console.log(`[${FUNC}] Email de reserva confirmada enviado a ${hostEmail}`);
            }
          } else {
            console.warn(`[${FUNC}] Email del host o RESEND_API_KEY no disponibles, no se envió notificación`);
          }
        }
      } catch (emailErr) {
        console.error(`[${FUNC}] Error en notificación al host (no bloquea el flujo):`, String(emailErr));
      }
    }
  }
}
const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET') ?? '';
if (MP_WEBHOOK_SECRET) {
  const clonedReq = req.clone();
  const valid = await verifyMPSignature(clonedReq, MP_WEBHOOK_SECRET);
  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
  }
}

Deno.serve(async (req) => {
  // ← RESPUESTA INMEDIATA: MP recibe 200 antes de que procesemos nada
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
  const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !MP_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Faltan env vars" }), { status: 500 });
  }

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));

  // Procesamos en segundo plano sin bloquear la respuesta
  processNotification(body, url, SUPABASE_URL, SERVICE_ROLE_KEY, MP_ACCESS_TOKEN)
    .catch((e) => console.error(`[${FUNC}] Error en background:`, String(e)));

  // MP recibe este 200 inmediatamente → no cancela el pago
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});