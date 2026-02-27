"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";

interface ListingMapProps {
  lat: number;
  lng: number;
  areaLabel: string;
}

export function ListingMap({ lat, lng, areaLabel }: ListingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      // Forzar resize al cargar — resuelve el problema del tab oculto
      map.current!.resize();

      map.current!.addSource("area", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lng, lat] },
          properties: {},
        },
      });

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

    // IntersectionObserver: llama resize() cada vez que el mapa se hace visible
    // Esto resuelve definitivamente el problema del tab oculto
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && map.current) {
            map.current.resize();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(mapContainer.current);

    return () => {
      observer.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, [lat, lng]);

  return (
    <div className="space-y-3">
      <div
        ref={mapContainer}
        style={{ height: "400px", width: "100%" }}
        className="rounded-xl overflow-hidden border border-border"
      />
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2">
        <span className="text-primary mt-0.5">🔒</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Ubicación aproximada</strong> en {areaLabel}. La dirección exacta se comparte una vez confirmada la reserva y aprobado el pago.
        </p>
      </div>
    </div>
  );
}