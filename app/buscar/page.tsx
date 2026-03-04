"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/app-shell";
import { FiltersPanel } from "@/components/filters-panel";
import { ListingCard } from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, List, Map, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/lib/supabaseClient";

const ListingsMap = dynamic(
  () => import("@/components/listings-map").then((mod) => mod.ListingsMap),
  { ssr: false }
);

export default function BuscarPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [zona, setZona] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [precioMax, setPrecioMax] = useState(10000);
  const [tamanoMin, setTamanoMin] = useState(0);
  const [acceso24, setAcceso24] = useState(false);
  const [fitsSeleccionados, setFitsSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);

      // 1. Traer listings desde la edge function
      const { data, error } = await supabase.functions.invoke("search-listings", {
        method: "GET",
      });

      if (error || !data?.listings) {
        setIsLoading(false);
        return;
      }

      const raw = data.listings;

      // 2. Traer fotos de todos los listings en una sola query
      const ids = raw.map((l: any) => l.id);
      const { data: photosData } = await supabase
        .from("listing_photos")
        .select("listing_id, url, position")
        .in("listing_id", ids)
        .order("position", { ascending: true });

      // 3. Agrupar fotos por listing_id
      const photosByListing: Record<string, string[]> = {};
      for (const p of photosData || []) {
        if (!photosByListing[p.listing_id]) photosByListing[p.listing_id] = [];
        photosByListing[p.listing_id].push(p.url);
      }

      // 4. Normalizar y adjuntar fotos
      const normalized = raw.map((l: any) => ({
        ...l,
        priceDaily: l.price_daily,
        priceWeekly: l.price_weekly ?? null,
        areaLabel: l.area_label,
        spaceType: l.space_type,
        sizeM2: l.size_m2,
        accessType: l.access_type,
        hostId: l.host_id,
        latPublic: l.lat_public,
        lngPublic: l.lng_public,
        createdAt: l.created_at,
        fits: l.fits || [],
        // Fotos: primero listing_photos, fallback a columna photos del listing
        photos:
          photosByListing[l.id]?.length > 0
            ? photosByListing[l.id]
            : l.photos || l.photo_urls || [],
      }));

      setListings(normalized);
      setIsLoading(false);
    };

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    let results = listings.filter((listing) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !listing.title?.toLowerCase().includes(query) &&
          !listing.area_label?.toLowerCase().includes(query) &&
          !listing.description?.toLowerCase().includes(query)
        ) return false;
      }
      if (zona && !listing.area_label?.toLowerCase().includes(zona.toLowerCase())) return false;
      if (tipo !== "todos" && listing.space_type?.toLowerCase() !== tipo.toLowerCase()) return false;
      if (listing.price_daily > precioMax) return false;
      if (tamanoMin > 0 && (listing.size_m2 ?? 0) < tamanoMin) return false;
      if (acceso24 && listing.access_type !== "24_7") return false;
      if (fitsSeleccionados.length > 0) {
        const fits = listing.fits ?? [];
        const hasMatch = fitsSeleccionados.some((fit) =>
          fits.some((lf: string) => lf.toLowerCase().includes(fit.toLowerCase()))
        );
        if (!hasMatch) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "price-low": results.sort((a, b) => a.price_daily - b.price_daily); break;
      case "price-high": results.sort((a, b) => b.price_daily - a.price_daily); break;
      default: results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return results;
  }, [listings, searchQuery, zona, tipo, precioMax, tamanoMin, acceso24, fitsSeleccionados, sortBy]);

  return (
    <AppShell>
      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6 text-balance">
            Buscar espacios
          </h1>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por zona, título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más nuevos</SelectItem>
                <SelectItem value="price-low">Precio menor</SelectItem>
                <SelectItem value="price-high">Precio mayor</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-1" />Lista
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <Map className="h-4 w-4 mr-1" />Mapa
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden bg-transparent">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="overflow-y-auto">
                <div className="mt-6">
                  <FiltersPanel
                    zona={zona} setZona={setZona}
                    tipo={tipo} setTipo={setTipo}
                    precioMax={precioMax} setPrecioMax={setPrecioMax}
                    tamanoMin={tamanoMin} setTamanoMin={setTamanoMin}
                    acceso24={acceso24} setAcceso24={setAcceso24}
                    fitsSeleccionados={fitsSeleccionados} setFitsSeleccionados={setFitsSeleccionados}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <FiltersPanel
                zona={zona} setZona={setZona}
                tipo={tipo} setTipo={setTipo}
                precioMax={precioMax} setPrecioMax={setPrecioMax}
                tamanoMin={tamanoMin} setTamanoMin={setTamanoMin}
                acceso24={acceso24} setAcceso24={setAcceso24}
                fitsSeleccionados={fitsSeleccionados} setFitsSeleccionados={setFitsSeleccionados}
              />
            </div>
          </aside>

          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="mb-6 text-sm text-muted-foreground">
                  {filteredListings.length}{" "}
                  {filteredListings.length === 1 ? "espacio encontrado" : "espacios encontrados"}
                </div>

                {filteredListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No encontramos espacios
                    </h3>
                    <p className="text-muted-foreground">
                      Intentá ajustar los filtros o cambiar tu búsqueda
                    </p>
                  </div>
                ) : viewMode === "map" ? (
                  <ListingsMap listings={filteredListings} />
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredListings.map((listing) => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}