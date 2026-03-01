"use client";

import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

interface ListingMapProps {
  lat: number;
  lng: number;
  areaLabel: string;
}

export function ListingMap({ lat, lng, areaLabel }: ListingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  // Cargar CSS de Mapbox
  useEffect(() => {
    if (document.querySelector('link[href*="mapbox-gl"]')) {
      setReady(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css";
    link.onload = () => setReady(true);
    document.head.appendChild(link);
  }, []);

  // Inicializar mapa solo cuando el CSS cargó Y el contenedor es visible
  useEffect(() => {
    if (!ready || !mapContainer.current || map.current) return;

    // Pequeño delay para asegurar que el DOM está pintado y visible
    const timer = setTimeout(() => {
      if (!mapContainer.current) return;

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 14,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("load", () => {
        map.current!.resize();

        map.current!.addSource("area", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: {},
          },
        });

        // Círculo difuso
        map.current!.addLayer({
          id: "area-fill",
          type: "circle",
          source: "area",
          paint: {
            "circle-radius": 80,
            "circle-color": "#3b82f6",
            "circle-opacity": 0.15,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#3b82f6",
            "circle-stroke-opacity": 0.4,
          },
        });

        // Punto central
        map.current!.addLayer({
          id: "area-center",
          type: "circle",
          source: "area",
          paint: {
            "circle-radius": 8,
            "circle-color": "#3b82f6",
            "circle-opacity": 0.9,
          },
        });
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      map.current?.remove();
      map.current = null;
    };
  }, [ready, lat, lng]);

  return (
    <div className="space-y-3">
      <div
        ref={mapContainer}
        style={{ height: "400px", width: "100%" }}
        className="rounded-xl overflow-hidden border border-border bg-muted"
      />
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2">
        <span className="text-primary shrink-0 mt-0.5">🔒</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Ubicación aproximada</strong> en {areaLabel}. La dirección exacta se comparte una vez confirmada la reserva y aprobado el pago.
        </p>
      </div>
    </div>
  );
}