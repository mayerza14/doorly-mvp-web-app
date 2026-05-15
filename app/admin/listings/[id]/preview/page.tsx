"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhotoCarousel } from "@/components/photo-carousel";
import {
  Loader2, MapPin, Package, Clock, Ruler, CheckCircle, XCircle,
  ShieldCheck, User, Mail, Phone, ArrowLeft,
} from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente de revisión",
  pending: "Pendiente",
  approved: "Aprobada",
  active: "Activa",
  rejected: "Rechazada",
  suspended: "Suspendida",
};

const STATUS_CLASS: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  active: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
};

interface HostData {
  full_name: string;
  email: string;
  phone: string | null;
}

interface PreviewData {
  listing: Record<string, unknown>;
  photos: { url: string; position: number }[];
  host: HostData;
}

export default function AdminListingPreviewPage() {
  const router = useRouter();
  const { id: listingId } = useParams<{ id: string }>();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth?returnUrl=/admin/listings/${listingId}/preview`);
      return;
    }
    if (profile && profile.role !== "admin") {
      router.push("/");
    }
  }, [user, profile, authLoading, router, listingId]);

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;
    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Sin sesión activa");
        const res = await fetch(`/api/admin/listing-preview/${listingId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setData(await res.json());
      } catch (e: unknown) {
        setFetchError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [profile, listingId]);

  if (authLoading || !user || !profile) return null;
  if (profile.role !== "admin") return null;

  const l = data?.listing as Record<string, any> | undefined;
  const photos = data ? data.photos.map((p) => p.url).filter(Boolean) : [];
  const finalPhotos = photos.length > 0 ? photos : ["/placeholder.jpg"];
  const largo = (l?.largo as number) ?? 0;
  const ancho = (l?.ancho as number) ?? 0;
  const alto = (l?.alto as number) ?? 0;
  const sizeM2 =
    (l?.size_m2 as number) ??
    (largo > 0 && ancho > 0 ? Math.round(largo * ancho * 100) / 100 : 0);

  return (
    <AppShell>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al panel
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Vista previa — revisión admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Solo lectura. Para tomar acciones usá el{" "}
            <Link href="/admin" className="underline underline-offset-2 text-primary">
              panel de administración
            </Link>
            .
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {fetchError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-red-700">
              Error al cargar la publicación: {fetchError}
            </CardContent>
          </Card>
        )}

        {l && (
          <div className="space-y-6">

            {/* Status + título */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
                      STATUS_CLASS[l.status as string] ?? "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {STATUS_LABEL[l.status as string] ?? (l.status as string)}
                  </span>
                  {l.doorly_certified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Doorly Certified
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2">{l.title as string}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" />
                    {(l.area_label as string) ?? "—"}
                  </span>
                  <span>{l.space_type as string}</span>
                  {sizeM2 > 0 && <span>{sizeM2} m²</span>}
                </div>
                {l.full_address_private && (
                  <p className="mt-3 text-sm font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    📍 Dirección privada: {l.full_address_private as string}
                  </p>
                )}
                {l.rejection_reason && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="text-sm font-semibold text-red-700">Motivo de rechazo</p>
                    <p className="text-sm text-red-600 mt-0.5">{l.rejection_reason as string}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fotos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fotos ({photos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoCarousel photos={finalPhotos} title={(l.title as string) ?? ""} />
              </CardContent>
            </Card>

            {/* Precio y modalidad */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Precio y modalidad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Por día</p>
                    <p className="font-semibold text-base">
                      ${(l.price_daily as number)?.toLocaleString("es-AR") ?? "—"}
                    </p>
                  </div>
                  {l.price_weekly && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Por semana</p>
                      <p className="font-semibold text-base">
                        ${(l.price_weekly as number).toLocaleString("es-AR")}
                      </p>
                    </div>
                  )}
                  {l.price_monthly && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Por mes</p>
                      <p className="font-semibold text-base">
                        ${(l.price_monthly as number).toLocaleString("es-AR")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Modalidad</p>
                    <p className="font-medium capitalize">{(l.booking_mode as string) ?? "—"}</p>
                  </div>
                  {l.min_months && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase mb-1">Mín. meses</p>
                      <p className="font-medium">{l.min_months as number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Descripción */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {(l.description as string) || "Sin descripción."}
                </p>
              </CardContent>
            </Card>

            {/* Dimensiones y acceso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-primary" />
                    Dimensiones
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  {largo > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Largo</span>
                      <span>{largo} m</span>
                    </div>
                  )}
                  {ancho > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ancho</span>
                      <span>{ancho} m</span>
                    </div>
                  )}
                  {alto > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Alto</span>
                      <span>{alto} m</span>
                    </div>
                  )}
                  {sizeM2 > 0 && (
                    <div className="flex justify-between font-semibold border-t border-border pt-1.5">
                      <span>Superficie</span>
                      <span>{sizeM2} m²</span>
                    </div>
                  )}
                  {largo === 0 && ancho === 0 && sizeM2 === 0 && (
                    <p className="text-muted-foreground italic text-xs">No especificado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Acceso
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">
                    {l.access_type === "24_7" ? "Libre 24/7" : "Horarios coordinados"}
                  </p>
                  {(l.access_hours_text || l.access_notes_private) && (
                    <p className="mt-2 text-muted-foreground italic bg-muted/40 rounded-lg px-3 py-2 text-xs">
                      "{(l.access_hours_text || l.access_notes_private) as string}"
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Qué entra */}
            {Array.isArray(l.fits) && l.fits.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Qué entra en este espacio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(l.fits as string[]).map((f) => (
                      <span
                        key={f}
                        className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Atributos y restricciones */}
            {(Array.isArray(l.rules_allowed) && l.rules_allowed.length > 0) ||
            (Array.isArray(l.rules_not_allowed) && l.rules_not_allowed.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.isArray(l.rules_allowed) && l.rules_allowed.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Atributos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(l.rules_allowed as string[]).map((r) => (
                        <div key={r} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {Array.isArray(l.rules_not_allowed) && l.rules_not_allowed.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        Restricciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(l.rules_not_allowed as string[]).map((r) => (
                        <div key={r} className="flex items-center gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}

            {/* Amenities */}
            {Array.isArray(l.amenities) && l.amenities.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Comodidades adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {(l.amenities as string[]).map((a) => (
                      <div key={a} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{a}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Propietario */}
            <Card className="border-blue-200 bg-blue-50/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Propietario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{data!.host.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{data!.host.email}</span>
                </div>
                {data!.host.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{data!.host.phone}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground pt-1 border-t border-border/50 font-mono">
                  ID host: {l.host_id as string}
                </p>
              </CardContent>
            </Card>

            {/* Metadatos */}
            <Card className="bg-muted/30">
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase mb-1">Creada</p>
                  <p>
                    {new Date(l.created_at as string).toLocaleString("es-AR", {
                      timeZone: "America/Argentina/Buenos_Aires",
                    })}
                  </p>
                </div>
                {l.updated_at && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">
                      Última actualización
                    </p>
                    <p>
                      {new Date(l.updated_at as string).toLocaleString("es-AR", {
                        timeZone: "America/Argentina/Buenos_Aires",
                      })}
                    </p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground uppercase mb-1">ID del listing</p>
                  <p className="font-mono text-xs break-all">{l.id as string}</p>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </AppShell>
  );
}
