"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";

interface Listing {
  id: string;
  title: string;
  areaLabel: string;
  priceDaily: number;
  lat_public?: number;
  lng_public?: number;
  latPublic?: number;
  lngPublic?: number;
}

interface ListingsMapProps {
  listings: Listing[];
}

export function ListingsMap({ listings }: ListingsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const withCoords = listings.filter(l => 
      (l.lat_public || l.latPublic) && (l.lng_public || l.lngPublic)
    );

    const center: [number, number] = withCoords.length > 0
      ? [
          withCoords.reduce((sum, l) => sum + (l.lng_public || l.lngPublic || 0), 0) / withCoords.length,
          withCoords.reduce((sum, l) => sum + (l.lat_public || l.latPublic || 0), 0) / withCoords.length,
        ]
      : [-58.3816, -34.6037];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    withCoords.forEach((listing) => {
      const lng = listing.lng_public || listing.lngPublic || 0;
      const lat = listing.lat_public || listing.latPublic || 0;

      const popupHTML = `
        <div style="padding:8px;min-width:160px;">
          <p style="font-weight:600;font-size:13px;margin:0 0 4px 0;">${listing.title}</p>
          <p style="font-size:11px;color:#666;margin:0 0 6px 0;">${listing.areaLabel}</p>
          <p style="font-size:13px;font-weight:500;margin:0 0 8px 0;">$${listing.priceDaily.toLocaleString('es-AR')}/día</p>
          <a href="/espacios/${listing.id}" 
             style="display:block;text-align:center;background:#000;color:#fff;padding:6px 12px;border-radius:6px;font-size:12px;text-decoration:none;">
            Ver detalle
          </a>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);

      const el = document.createElement('div');
      el.style.cssText = `
        background:#000;color:#fff;padding:4px 8px;border-radius:12px;
        font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
      `;
      el.textContent = `$${listing.priceDaily.toLocaleString('es-AR')}`;

      new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    return () => { map.current?.remove(); map.current = null; };
  }, [listings]);

  const withCoords = listings.filter(l => (l.lat_public || l.latPublic) && (l.lng_public || l.lngPublic));

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border relative">
      <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />
      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 rounded-lg z-10">
          <p className="text-muted-foreground font-medium">No hay cocheras con ubicación en el mapa</p>
          <p className="text-sm text-muted-foreground mt-1">Las cocheras publicadas sin coordenadas no aparecen aquí</p>
        </div>
      )}
    </div>
  );
}