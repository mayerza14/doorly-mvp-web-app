import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "admin-review-listing";

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

    return json(200, { ok: true, func: FUNC, listing: data });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});