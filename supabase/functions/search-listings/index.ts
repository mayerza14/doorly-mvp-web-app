import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNC = "search-listings";

// 1) LA PUERTA DE ENTRADA (CORS) - Evita bloqueos del navegador en v0
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}

Deno.serve(async (req) => {
  try {
    // Respuesta automática para los navegadores (Preflight CORS)
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== "GET") return json(405, { func: FUNC, error: "Use GET" });

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { func: FUNC, error: "Missing env vars" });

    // ------------------------------------------------------------------
    // NUEVO: 2) Leer los parámetros de la "Caja" del Mapa desde la URL
    // ------------------------------------------------------------------
    const url = new URL(req.url);
    const minLat = url.searchParams.get('minLat');
    const maxLat = url.searchParams.get('maxLat');
    const minLng = url.searchParams.get('minLng');
    const maxLng = url.searchParams.get('maxLng');

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 3) Empezamos a armar la consulta básica: Traer solo los aprobados
    let query = admin
      .from("listings")
      .select("*")
      .eq("status", "approved");

    // ------------------------------------------------------------------
    // NUEVO: 4) Filtro Matemático del Mapa
    // Si el frontend nos mandó las 4 coordenadas de la pantalla, recortamos la búsqueda.
    // ------------------------------------------------------------------
    if (minLat && maxLat && minLng && maxLng) {
      query = query
        .gte("lat_public", Number(minLat)) // latitud pública MAYOR o igual a la de abajo
        .lte("lat_public", Number(maxLat)) // latitud pública MENOR o igual a la de arriba
        .gte("lng_public", Number(minLng)) // longitud pública MAYOR o igual a la izquierda
        .lte("lng_public", Number(maxLng)); // longitud pública MENOR o igual a la derecha
    }

    // 5) Ejecutamos la búsqueda final con un límite de 50 resultados para no colapsar la app
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return json(500, { func: FUNC, error: "DB error", details: error.message });

    return json(200, { ok: true, func: FUNC, count: (data ?? []).length, listings: data ?? [] });
  } catch (e) {
    return json(500, { func: FUNC, error: "Unhandled", details: String(e) });
  }
});