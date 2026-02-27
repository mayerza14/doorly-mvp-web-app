import { AppShell } from "@/components/app-shell";
import { BookingWidget } from "@/components/booking-widget";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Maximize2, Clock, CheckCircle, XCircle, Star,
  ShieldCheck, Package, Zap, Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ListingMap } from "@/components/listing-map";
import { ReviewsSection } from "@/components/reviews-section";
import { PhotoCarousel } from "@/components/photo-carousel";
import { DoorlyCertifiedBadge } from "@/components/doorly-certified-badge";
import { ListingQuestions } from "@/components/listing-questions";

function getApproxCoords(lat: number, lng: number, id: string) {
  const seed = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const latOffset = ((seed % 100) - 50) * 0.00008;
  const lngOffset = (((seed * 7) % 100) - 50) * 0.00008;
  return { lat: lat + latOffset, lng: lng + lngOffset };
}

export default async function EspacioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: rawListing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !rawListing) {
    return (
      <div className="p-10 flex justify-center mt-10">
        <Card className="p-6 text-center max-w-md text-red-500 font-bold text-xl">
          EL RUTEO FUNCIONA, PERO SUPABASE FALLÓ O EL ESPACIO NO EXISTE.
          <br /><br />ID buscado: {id}<br />Error: {JSON.stringify(error)}
        </Card>
      </div>
    );
  }

  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select("start_date, end_date")
    .eq("listing_id", id)
    .in("status", ["hold", "confirmed", "completed"]);

  if (bookingsError) console.error(">>> Error leyendo reservas:", bookingsError);

  const blockedDates = (bookingsData || []).map((b) => ({
    listingId: id,
    startDate: b.start_date,
    endDate: b.end_date,
  }));

  const listing = {
    ...rawListing,
    id: rawListing.id,
    title: rawListing.title || "Espacio sin título",
    description: rawListing.description || "",
    spaceType: rawListing.space_type || "Espacio",
    accessType: rawListing.access_type || "coordinado",
    accessHoursText: rawListing.access_hours_text || rawListing.access_notes_private || "",
    areaLabel: rawListing.area_label || "Ubicación a coordinar",
    sizeM2: rawListing.size_m2 || 0,
    priceDaily: rawListing.price_daily || 0,
    priceWeekly: rawListing.price_weekly || null,
    priceMonthly: rawListing.price_monthly || null,
    amenities: rawListing.amenities || [],
    fits: rawListing.fits || [],
    rulesAllowed: rawListing.rules_allowed || [],
    rulesNotAllowed: rawListing.rules_not_allowed || [],
    latExact: rawListing.lat_exact,
    lngExact: rawListing.lng_exact,
    photos: rawListing.photos || [],
    doorly_certified: rawListing.doorly_certified || false,
  };

  const photos =
    listing.photos.length > 0
      ? listing.photos
      : ["/placeholder.jpg", "/placeholder.jpg", "/placeholder.jpg"];

  const approxCoords =
    listing.latExact && listing.lngExact
      ? getApproxCoords(listing.latExact, listing.lngExact, listing.id)
      : null;

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">

          {/* ══ BLOQUE SUPERIOR: foto izquierda + widget derecha ══ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "2.5rem",
              alignItems: "start",
            }}
          >
            {/* ── IZQUIERDA: badges + título + carrusel ── */}
            <div className="space-y-4 min-w-0">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {listing.spaceType}
                  </Badge>
                  {listing.accessType === "24_7" && (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-50 text-sm px-3 py-1">
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      Acceso 24/7
                    </Badge>
                  )}
                  {listing.doorly_certified && <DoorlyCertifiedBadge size="md" />}
                </div>

                <h1 className="text-2xl font-bold text-foreground leading-tight mb-2">
                  {listing.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm">{listing.areaLabel}</span>
                  </div>
                  {listing.sizeM2 > 0 && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Maximize2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">{listing.sizeM2} m²</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">Ver reseñas ↓</span>
                  </div>
                </div>
              </div>

              {/* Carrusel */}
              <PhotoCarousel photos={photos} title={listing.title} />
            </div>

            {/* ── DERECHA: widget sticky ── */}
            <div style={{ position: "sticky", top: "6rem" }}>
              <BookingWidget listing={listing} blockedDates={blockedDates} />
            </div>
          </div>

          {/* ══ BLOQUE INFERIOR: detalles ══ */}
          <div className="max-w-3xl mt-10 space-y-8">

            {/* Descripción */}
            <div className="pb-8 border-b border-border">
              <h2 className="text-lg font-bold text-foreground mb-3">Acerca de este espacio</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Ideal para guardar */}
            {listing.fits.length > 0 && (
              <div className="pb-8 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground text-lg">Ideal para guardar</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.fits.map((fit: string) => (
                    <span
                      key={fit}
                      className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20
                                 text-sm font-medium text-primary"
                    >
                      {fit}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Atributos y seguridad */}
            {listing.rulesAllowed.length > 0 && (
              <div className="pb-8 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-foreground text-lg">Atributos y seguridad</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {listing.rulesAllowed.map((rule: string) => (
                    <div key={rule} className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50 border border-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm font-medium text-green-900">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TABS: Detalles / Condiciones / Reseñas ── */}
            {/* ⚠️ El mapa está FUERA de los tabs para que Mapbox se inicialice correctamente */}
            <Tabs defaultValue="detalles" className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-auto bg-muted/40 p-1 rounded-xl border border-border mb-6">
                {["detalles", "condiciones", "resenas"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-lg py-2.5 text-sm font-medium
                               data-[state=active]:bg-white data-[state=active]:shadow-sm
                               data-[state=active]:text-foreground data-[state=active]:font-semibold
                               text-muted-foreground transition-all"
                  >
                    {tab === "resenas" ? "Reseñas" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* TAB: DETALLES */}
              <TabsContent value="detalles" className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="shadow-none border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Maximize2 className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">Tamaño total</span>
                      </div>
                      <p className="text-muted-foreground">
                        {listing.sizeM2 > 0 ? `${listing.sizeM2} m²` : "No especificado"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-none border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-bold text-foreground">Acceso</span>
                      </div>
                      <p className="text-muted-foreground">
                        {listing.accessType === "24_7" ? "Acceso libre 24/7" : "Horarios coordinados"}
                      </p>
                      {listing.accessHoursText && (
                        <p className="text-sm mt-1 text-muted-foreground italic">
                          "{listing.accessHoursText}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {listing.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Comodidades adicionales</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {listing.amenities.map((amenity: string) => (
                        <div key={amenity} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB: CONDICIONES */}
              <TabsContent value="condiciones" className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong>Política de Doorly:</strong> Materiales peligrosos, armas, productos
                    químicos, alimentos perecederos y actividades ilegales están prohibidos en todos
                    los espacios de la plataforma.
                  </p>
                </div>
                {listing.rulesNotAllowed.length > 0 ? (
                  <div>
                    <h3 className="font-bold text-foreground mb-4">Restricciones del propietario</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {listing.rulesNotAllowed.map((rule: string) => (
                        <div key={rule} className="flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                          <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          <span className="text-sm text-red-900 font-medium">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No hay restricciones adicionales declaradas por el propietario.
                  </p>
                )}
              </TabsContent>

              {/* TAB: RESEÑAS */}
              <TabsContent value="resenas">
                <ReviewsSection listingId={id} />
              </TabsContent>
            </Tabs>

            {/* ══ MAPA: fuera de tabs, siempre visible en el DOM ══ */}
            <div className="pt-2" id="ubicacion">
              <Card className="overflow-hidden border-border shadow-none">
                <div className="pt-2">
  <ListingQuestions listingId={id} hostId={rawListing.host_id} />
</div>
                <CardHeader className="bg-muted/30 border-b py-3 px-5">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Ubicación — {listing.areaLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {approxCoords ? (
                    <ListingMap
                      lat={approxCoords.lat}
                      lng={approxCoords.lng}
                      areaLabel={listing.areaLabel}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="aspect-video w-full bg-muted rounded-xl flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-40" />
                          <div className="font-medium">Ubicación aproximada</div>
                          <div className="text-sm">{listing.areaLabel}</div>
                        </div>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-2">
                        <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          La dirección exacta se revela tras confirmar la reserva y aprobar el pago.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}