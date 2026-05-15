import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "create-review";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isInt(n: unknown) {
  return typeof n === "number" && Number.isInteger(n);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return json(405, { func: FUNC, error: "Use POST" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return json(500, { func: FUNC, error: "Missing env vars" });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { func: FUNC, error: "Missing Authorization header" });

    // Cliente con JWT del usuario (para saber quién es)
    const supaUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: uErr } = await supaUser.auth.getUser();
    if (uErr || !userData?.user) {
      return json(401, { func: FUNC, error: "Invalid session", details: uErr?.message ?? "unknown" });
    }
    const uid = userData.user.id;

    // Body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json(400, { func: FUNC, error: "Invalid JSON body" });
    }

    const booking_id = String(body?.booking_id ?? "");
    const rating = body?.rating;
    const commentRaw = String(body?.comment ?? "");
    const comment = commentRaw.trim();

    if (!booking_id) return json(400, { func: FUNC, error: "Missing booking_id" });
    if (!isInt(rating) || rating < 1 || rating > 5) return json(400, { func: FUNC, error: "rating must be an integer 1..5" });
    if (!comment) return json(400, { func: FUNC, error: "comment is required" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Leer booking
    const { data: b, error: bErr } = await admin
      .from("bookings")
      .select("id, listing_id, renter_id, host_id, status, mp_status, end_date")
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr) return json(500, { func: FUNC, error: "DB error reading booking", details: bErr.message });
    if (!b) return json(404, { func: FUNC, error: "Booking not found" });

    // Debe estar confirmado y aprobado
    if (!(b.status === "confirmed" && b.mp_status === "approved")) {
      return json(403, {
        func: FUNC,
        error: "Booking not eligible for review (not confirmed/approved)",
        status: b.status,
        mp_status: b.mp_status,
      });
    }

    // Evitar caso raro
    if (b.renter_id === b.host_id) {
      return json(400, { func: FUNC, error: "Invalid booking: renter_id == host_id (cannot review yourself)" });
    }

    // Ventana de 14 días: abre end_date + 1 día y cierra end_date + 15 días
    const end = new Date(b.end_date);
    const openAt = new Date(end.getTime() + 1 * 86400000);
    const closeAt = new Date(end.getTime() + 15 * 86400000);
    const now = new Date();

    if (now < openAt || now >= closeAt) {
      return json(403, {
        func: FUNC,
        error: "Review window closed or not opened yet",
        window_open_at: openAt.toISOString(),
        window_close_at: closeAt.toISOString(),
      });
    }

    // Determinar rol + a quién reseña
    let reviewer_role: "renter" | "host";
    let reviewee_id: string;

    if (uid === b.renter_id) {
      reviewer_role = "renter";
      reviewee_id = b.host_id;
    } else if (uid === b.host_id) {
      reviewer_role = "host";
      reviewee_id = b.renter_id;
    } else {
      return json(403, { func: FUNC, error: "Forbidden (not renter/host of this booking)" });
    }

    // Insert (si ya existe, devuelve 409 por unique index booking_id+reviewer_id)
    const { data: ins, error: insErr } = await admin
      .from("reviews")
      .insert({
        booking_id,
        listing_id: b.listing_id,
        reviewer_id: uid,
        reviewee_id,
        reviewer_role,
        rating,
        comment,
      })
      .select("id, created_at")
      .single();

    if (insErr) {
      if ((insErr as any).code === "23505") {
        return json(409, { func: FUNC, error: "You already reviewed this booking" });
      }
      return json(500, { func: FUNC, error: "Insert failed", details: insErr.message });
    }

    return json(200, { ok: true, func: FUNC, review: ins });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});
