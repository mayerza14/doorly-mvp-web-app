import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
    error: authError,
  } = await serviceClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { data: listing, error: listingError } = await serviceClient
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing no encontrado" }, { status: 404 });
  }

  const { data: photos } = await serviceClient
    .from("listing_photos")
    .select("url, position")
    .eq("listing_id", id)
    .order("position", { ascending: true });

  const { data: hostProfile } = await serviceClient
    .from("profiles")
    .select("full_name, phone")
    .eq("id", listing.host_id)
    .single();

  const { data: hostUser } = await serviceClient.auth.admin.getUserById(listing.host_id);

  return NextResponse.json({
    listing,
    photos: photos ?? [],
    host: {
      full_name: hostProfile?.full_name ?? "Sin nombre",
      phone: hostProfile?.phone ?? null,
      email: hostUser?.user?.email ?? "Sin email",
    },
  });
}
