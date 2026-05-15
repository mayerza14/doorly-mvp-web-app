import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "admin-listings-pending";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function isAdmin(admin: any, uid: string) {
  const { data, error } = await admin.from("profiles").select("role").eq("id", uid).maybeSingle();
  if (error) return false;
  return data?.role === "admin";
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") return json(405, { func: FUNC, error: "Use GET" });

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

    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");

    const { data: listings, error: lErr } = await admin
      .from("listings")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (lErr) return json(500, { func: FUNC, error: "DB error reading listings", details: lErr.message });

    const ids = (listings ?? []).map((x: any) => x.id);
    let priv: any[] = [];
    if (ids.length) {
      const { data, error } = await admin
        .from("listing_private")
        .select("listing_id, full_address_private, access_notes_private, created_at, updated_at")
        .in("listing_id", ids);

      if (error) return json(500, { func: FUNC, error: "DB error reading listing_private", details: error.message });
      priv = data ?? [];
    }

    const privMap = new Map(priv.map((p: any) => [p.listing_id, p]));
    const merged = (listings ?? []).map((l: any) => ({ ...l, private: privMap.get(l.id) ?? null }));

    return json(200, { ok: true, func: FUNC, count: merged.length, listings: merged });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});
