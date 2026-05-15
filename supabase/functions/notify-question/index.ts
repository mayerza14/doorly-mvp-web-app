import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ⚠️ Reemplazá con tu dominio real
const SITE_URL = "https://doorly.com.ar";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { questionId } = body;

    if (!questionId) throw new Error("questionId es requerido");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Traer la pregunta
    const { data: question, error: qError } = await supabase
      .from("listing_questions")
      .select("id, question, listing_id, user_id")
      .eq("id", questionId)
      .single();

    if (qError || !question) throw new Error("Pregunta no encontrada: " + JSON.stringify(qError));

    // 2. Traer la publicación
    const { data: listing, error: lError } = await supabase
      .from("listings")
      .select("id, title, host_id")
      .eq("id", question.listing_id)
      .single();

    if (lError || !listing) throw new Error("Publicación no encontrada: " + JSON.stringify(lError));

    // 3. Traer nombre de quien preguntó
    const { data: askerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", question.user_id)
      .single();

    // 4. Traer email del anfitrión
    const { data: hostUser, error: hError } = await supabase.auth.admin.getUserById(listing.host_id);
    if (hError || !hostUser?.user?.email) throw new Error("No se encontró email del anfitrión");

    const hostEmail = hostUser.user.email;
    const askerName = askerProfile?.full_name || "Un usuario";
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY no configurado");

    const listingUrl = `${SITE_URL}/espacios/${listing.id}`;
    const year = new Date().getFullYear();

    // 5. Enviar mail con diseño Doorly
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Doorly <soporte@doorly.com.ar>",
        to: [hostEmail],
        subject: `💬 Nueva pregunta en "${listing.title}"`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nueva pregunta en Doorly</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- HEADER con logo -->
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

          <!-- CARD principal -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <!-- Franja superior de color -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Nueva pregunta</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">
                      Alguien preguntó en tu publicación
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Cuerpo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <!-- Info del espacio -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;margin-bottom:20px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Publicación</p>
                          <p style="margin:0;font-size:15px;font-weight:600;color:#0f172a;">${listing.title}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Quien preguntó -->
                    <p style="margin:0 0 12px;font-size:14px;color:#64748b;">
                      <strong style="color:#0f172a;">${askerName}</strong> te hizo la siguiente pregunta:
                    </p>

                    <!-- La pregunta -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#f0f9ff;border-left:3px solid #0ea5e9;border-radius:0 10px 10px 0;padding:16px 20px;">
                          <p style="margin:0;font-size:15px;color:#0f172a;line-height:1.6;font-style:italic;">
                            "${question.question}"
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${listingUrl}"
                             style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 32px;
                                    border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;
                                    letter-spacing:0.3px;">
                            Responder la pregunta →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Tip -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                      <tr>
                        <td style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                            💡 <strong>Tip:</strong> Los anfitriones que responden en menos de 24hs tienen 
                            hasta un 40% más de reservas confirmadas.
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
                Este mail fue enviado automáticamente por Doorly.
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

    console.log("Mail enviado correctamente a:", hostEmail);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("notify-question error:", String(err));
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});