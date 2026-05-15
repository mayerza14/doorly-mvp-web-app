import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "admin-review-listing";
const SITE_URL = "https://doorly.com.ar";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { 
      ...corsHeaders,
      "Content-Type": "application/json" 
    } 
  });
}

async function isAdmin(admin: any, uid: string) {
  const { data, error } = await admin.from("profiles").select("role").eq("id", uid).maybeSingle();
  if (error) return false;
  return data?.role === "admin";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json(405, { func: FUNC, error: "Use POST" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) return json(500, { func: FUNC, error: "Missing env vars" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { func: FUNC, error: "Missing Authorization header" });

    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: uErr } = await supaUser.auth.getUser();
    if (uErr || !userData?.user) return json(401, { func: FUNC, error: "Invalid session" });
    const uid = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    if (!(await isAdmin(admin, uid))) return json(403, { func: FUNC, error: "Admin only" });

    let body: any;
    try { body = await req.json(); } catch { return json(400, { func: FUNC, error: "Invalid JSON body" }); }

    const listing_id = String(body?.listing_id ?? "");
    const action = String(body?.action ?? ""); 
    const rejection_reason = String(body?.rejection_reason ?? "").trim();

    if (!listing_id) return json(400, { func: FUNC, error: "listing_id is required" });
    
    // VALIDACIÓN EXPANDIDA: Agregamos suspend y activate
    const allowedActions = ["approve", "reject", "disable", "suspend", "activate"];
    if (!allowedActions.includes(action)) {
      return json(400, { func: FUNC, error: `action must be one of: ${allowedActions.join("|")}` });
    }

    if (action === "reject" && !rejection_reason) {
      return json(400, { func: FUNC, error: "rejection_reason is required when rejecting" });
    }

    // LÓGICA DE ACTUALIZACIÓN PROFESIONAL
    const patch: any = { approved_by: uid, updated_at: new Date().toISOString() };
    
    if (action === "approve" || action === "activate") {
      patch.status = "approved";
      patch.approved_at = new Date().toISOString();
      patch.rejection_reason = null;
    } else if (action === "reject") {
      patch.status = "rejected";
      patch.approved_at = null;
      patch.rejection_reason = rejection_reason;
    } else if (action === "suspend") {
      patch.status = "suspended";
    } else {
      // Caso 'disable' (eliminado por usuario)
      patch.status = "disabled";
    }

    const { data, error } = await admin
      .from("listings")
      .update(patch)
      .eq("id", listing_id)
      .select("*")
      .maybeSingle();

    if (error) return json(500, { func: FUNC, error: "Update failed", details: error.message });
    if (!data) return json(404, { func: FUNC, error: "Listing not found" });

    // Notificación email al propietario — no bloquea el flujo bajo ningún concepto
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_KEY && (action === "approve" || action === "activate" || action === "reject")) {
      try {
        const { data: hostUser } = await admin.auth.admin.getUserById(data.host_id);
        const { data: hostProfile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", data.host_id)
          .maybeSingle();

        const hostEmail = hostUser?.user?.email;
        const hostName = hostProfile?.full_name || "Propietario";
        const year = new Date().getFullYear();

        if (hostEmail) {
          const isApproved = action === "approve" || action === "activate";

          const subject = isApproved
            ? `¡Tu publicación fue aprobada! 🎉`
            : `Tu publicación fue rechazada`;

          const html = isApproved
            ? `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Publicación aprobada</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${SITE_URL}/logo.png" alt="Doorly" width="120" style="display:block;height:auto;" onerror="this.style.display='none'" />
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#064e3b 0%,#065f46 100%);padding:28px 32px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">¡Buenas noticias!</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Tu publicación fue aprobada</h1>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
                      Hola <strong>${hostName}</strong>, tu espacio <strong>"${data.title}"</strong> ya está publicado y visible para todos en Doorly. ¡Empezá a recibir consultas y reservas!
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;">
                          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e;">⚠️ Completá tus datos de cobro</p>
                          <p style="margin:0 0 12px;font-size:13px;color:#78350f;line-height:1.6;">Para poder recibir reservas y cobrar tus pagos necesitás cargar tu CBU/CVU y datos bancarios. Sin esa información tu publicación <strong>no puede recibir reservas</strong>.</p>
                          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.8;">
                            1. Ingresá a Doorly<br/>
                            2. Andá a <strong>Mi perfil</strong><br/>
                            3. Completá la sección <strong>Datos de cobro</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${SITE_URL}/perfil"
                             style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 32px;
                                    border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;
                                    letter-spacing:0.3px;width:100%;box-sizing:border-box;text-align:center;">
                            Completar datos de cobro →
                          </a>
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
                ¿Dudas? Escribinos a <a href="mailto:soporte@doorly.com.ar" style="color:#0ea5e9;text-decoration:none;">soporte@doorly.com.ar</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${year} Doorly. Todos los derechos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
            : `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Tu publicación fue rechazada</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${SITE_URL}/logo.png" alt="Doorly" width="120" style="display:block;height:auto;" onerror="this.style.display='none'" />
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 32px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:1px;">Revisión de publicación</p>
                    <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Tu publicación necesita cambios</h1>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
                      Hola <strong>${hostName}</strong>, revisamos tu publicación <strong>"${data.title}"</strong> y por el momento no puede ser aprobada. Te dejamos el comentario de nuestro equipo para que puedas hacer las correcciones necesarias.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 10px 10px 0;padding:16px 20px;">
                          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Comentario del equipo Doorly</p>
                          <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">${rejection_reason}</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                      Podés corregir tu publicación y volver a enviarla para revisión directamente desde tu panel de propietario.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${SITE_URL}/dashboard"
                             style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 32px;
                                    border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;
                                    letter-spacing:0.3px;width:100%;box-sizing:border-box;text-align:center;">
                            Ir a mi panel →
                          </a>
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
                ¿Dudas? Escribinos a <a href="mailto:soporte@doorly.com.ar" style="color:#0ea5e9;text-decoration:none;">soporte@doorly.com.ar</a>
              </p>
              <p style="margin:0;font-size:11px;color:#cbd5e1;">© ${year} Doorly. Todos los derechos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Doorly <soporte@doorly.com.ar>",
              to: [hostEmail],
              subject,
              html,
            }),
          });

          if (!emailRes.ok) {
            console.error(`[${FUNC}] Error enviando email al propietario: ${await emailRes.text()}`);
          }
        }
      } catch (emailErr) {
        console.error(`[${FUNC}] Error en notificación al propietario (no bloquea el flujo):`, String(emailErr));
      }
    }

    return json(200, { ok: true, func: FUNC, listing: data });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});