import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// ESTÁNDAR MODERNO: Usar Deno.serve directamente sin importar 'serve'
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

    if (!SERVICE_ROLE_KEY) throw new Error("Falta la variable SERVICE_ROLE_KEY en el servidor.");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Falta el token de autorización.");

    // Cliente del usuario para verificar identidad
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("No estás logueado en Doorly.");

    // Cliente Admin para guardar el mensaje sin que las reglas RLS lo bloqueen por error
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { booking_id, text } = await req.json();
    if (!booking_id || !text) throw new Error("Faltan datos del mensaje.");

    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .select("host_id, renter_id, status, mp_status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) throw new Error("La reserva no existe en la base de datos.");

    if (user.id !== booking.host_id && user.id !== booking.renter_id) {
      throw new Error("No tienes permiso para participar en este chat.");
    }

    if (booking.status !== "confirmed" || booking.mp_status !== "approved") {
      throw new Error("El chat solo se habilita después de confirmar el pago.");
    }

    const { error: insertError } = await adminClient
      .from("messages")
      .insert({
        booking_id: booking_id,
        sender_id: user.id,
        text: text,
      });

    if (insertError) throw new Error(`Error de base de datos: ${insertError.message}`);

    return new Response(
      JSON.stringify({ success: true, message: "Mensaje enviado con éxito" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
  const msg = error?.message ?? 'Error interno';
  const isAuth = msg.includes('logueado') || msg.includes('permiso') || msg.includes('autorización');
  const status = isAuth ? 403 : 500;
  return new Response(
    JSON.stringify({ success: false, error: msg }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  );
}
});