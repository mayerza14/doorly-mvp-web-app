import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://doorly.com.ar";
const ADMIN_EMAIL = "soporte.doorly@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
   const listing_id = body.listing_id ?? body.record?.id;
if (!listing_id) throw new Error("listing_id es requerido");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Traer el listing
    const { data: listing, error: lError } = await supabase
      .from("listings")
      .select("id, title, space_type, price_daily, area_label, description, host_id, created_at")
      .eq("id", listing_id)
      .single();

    if (lError || !listing) throw new Error("Listing no encontrado: " + JSON.stringify(lError));

    // 2. Traer datos del host
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", listing.host_id)
      .single();

    const { data: hostUser } = await supabase.auth.admin.getUserById(listing.host_id);

    const hostName = hostProfile?.full_name || "Sin nombre";
    const hostEmail = hostUser?.user?.email || "Sin email";
    const hostPhone = hostProfile?.phone || "Sin teléfono";

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY no configurado");

    const listingUrl = `${SITE_URL}/admin/listings/${listing.id}/preview`;
    const reviewUrl = `${SITE_URL}/admin`;
    const year = new Date().getFullYear();
    const createdAt = new Date(listing.created_at).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    // 3. Enviar mail al admin
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Doorly <soporte@doorly.com.ar>",
        to: [ADMIN_EMAIL],
        subject: `🏠 Nueva publicación para revisar: "${listing.title}"`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nueva publicación en Doorly</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- HEADER logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img
                src="${SITE_URL}/logo.png"
                alt="Doorly"
                width="120"
                style="display:block;height:auto;"
                onerror="this.style.display='none'"
              />
            </td>
          </tr>

          <!-- CARD -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <!-- Franja superior -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Acción requerida</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                      Nueva publicación para revisar
                    </h1>
                    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">${createdAt}</p>
                  </td>
                </tr>
              </table>

              <!-- Cuerpo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <!-- Datos del espacio -->
                    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Datos del espacio</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin-bottom:24px;">
                      <tr>
                        <td style="padding:18px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom:10px;">
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Título</p>
                                <p style="margin:2px 0 0;font-size:16px;font-weight:700;color:#0f172a;">${listing.title}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Tipo / Zona</p>
                                <p style="margin:2px 0 0;font-size:14px;color:#334155;">${listing.space_type} · ${listing.area_label || "Sin zona"}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;">
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Precio por día</p>
                                <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#0f172a;">$${listing.price_daily?.toLocaleString("es-AR")} ARS</p>
                              </td>
                            </tr>
                            ${listing.description ? `
                            <tr>
                              <td>
                                <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;">Descripción</p>
                                <p style="margin:2px 0 0;font-size:13px;color:#64748b;line-height:1.5;">${listing.description.substring(0, 200)}${listing.description.length > 200 ? "..." : ""}</p>
                              </td>
                            </tr>` : ""}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Datos del host -->
                    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Propietario</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-left:3px solid #0ea5e9;border-radius:0 10px 10px 0;margin-bottom:28px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#0f172a;">${hostName}</p>
                          <p style="margin:0 0 2px;font-size:13px;color:#64748b;">${hostEmail}</p>
                          <p style="margin:0;font-size:13px;color:#64748b;">${hostPhone}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTAs -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding-bottom:12px;">
                          <a href="${listingUrl}"
                             style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 32px;
                                    border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;
                                    letter-spacing:0.3px;width:100%;box-sizing:border-box;text-align:center;">
                            Ver publicación →
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td align="center">
                          <a href="${reviewUrl}"
                             style="display:inline-block;background:#f1f5f9;color:#0f172a;padding:14px 32px;
                                    border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;
                                    letter-spacing:0.3px;width:100%;box-sizing:border-box;text-align:center;">
                            Ir al panel de revisión →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Recordatorio -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                      <tr>
                        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                            ⏱ <strong>Recordá revisar y aprobar o rechazar la publicación lo antes posible</strong> 
                            para que el propietario pueda empezar a recibir reservas.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
                Este mail fue enviado automáticamente por Doorly cuando se creó una nueva publicación.
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
</html>
        `,
      }),
    });

    const resendBody = await resendRes.text();
    if (!resendRes.ok) throw new Error(`Resend error ${resendRes.status}: ${resendBody}`);

    console.log("Mail de nueva publicación enviado a:", ADMIN_EMAIL);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("notify-new-listing error:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});