import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "booking-status";

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
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return json(500, { func: FUNC, error: "Missing env vars" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { func: FUNC, error: "Missing Authorization header" });

    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: uErr } = await supaUser.auth.getUser();
    if (uErr || !userData?.user) {
      return json(401, { func: FUNC, error: "Invalid session", details: uErr?.message ?? "unknown" });
    }
    const uid = userData.user.id;

    const url = new URL(req.url);
    const booking_id = url.searchParams.get("booking_id");
    if (!booking_id) return json(400, { func: FUNC, error: "Missing booking_id query param" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, renter_id, host_id, listing_id, status, hold_expires_at, amount, total_amount, mp_status, mp_preference_id, created_at")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr) return json(500, { func: FUNC, error: "DB error reading booking", details: bErr.message });
    if (!booking) return json(404, { func: FUNC, error: "Booking not found" });

    if (booking.renter_id !== uid && booking.host_id !== uid) {
      return json(403, { func: FUNC, error: "Forbidden" });
    }

    const can_show_exact_address = booking.status === "confirmed" && booking.mp_status === "approved";

    return json(200, { ok: true, func: FUNC, booking, can_show_exact_address });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});
