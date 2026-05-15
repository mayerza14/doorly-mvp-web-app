import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "reviews-by-listing";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") return json(405, { func: FUNC, error: "Use GET" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { func: FUNC, error: "Missing env vars" });

    const url = new URL(req.url);
    const listing_id = url.searchParams.get("listing_id");
    if (!listing_id) return json(400, { func: FUNC, error: "Missing listing_id query param" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await admin
      .from("reviews")
      .select("id, rating, comment, reviewer_role, created_at")
      .eq("listing_id", listing_id)
      .order("created_at", { ascending: false });

    if (error) return json(500, { func: FUNC, error: "DB error reading reviews", details: error.message });

    const reviews = data ?? [];
    const count = reviews.length;
    const avg = count ? reviews.reduce((a: number, r: any) => a + r.rating, 0) / count : 0;

    return json(200, { ok: true, func: FUNC, listing_id, summary: { count, avg_rating: avg }, reviews });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});
