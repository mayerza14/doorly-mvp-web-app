"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X, Pause, Eye, ShieldAlert, Loader2, Play, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { DoorlyCertifiedBadge } from "@/components/doorly-certified-badge";

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [certLoading, setCertLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; listingId: string | null }>({ open: false, listingId: null });
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth?returnUrl=/admin");
      return;
    }
    if (!authLoading && profile && profile.role !== "admin") {
      router.push("/");
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (!profile || profile.role !== "admin") return;
    const fetchData = async () => {
      const { data: pendingData, error: pendingError } = await supabase.functions.invoke("admin-listings-pending");
      console.log("Pending data:", pendingData);
      console.log("Pending error:", pendingError);

      const { data: allListings, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("All listings:", allListings);
      console.log("Listings error:", listingsError);

      const { data: allBookings } = await supabase
        .from("bookings")
        .select("*, listings(title)")
        .order("created_at", { ascending: false });

      if (allListings) {
        const sortedListings = allListings.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        });
        setListings(sortedListings);
      }

      if (allBookings) setBookings(allBookings);
      setIsLoading(false);
    };
    fetchData();
  }, [profile]);

  const handleAction = async (listingId: string, action: "approve" | "reject" | "suspend" | "activate", reason?: string) => {
    setActionLoading(listingId + action);

    const { error } = await supabase.functions.invoke("admin-review-listing", {
      body: {
        listing_id: listingId,
        action,
        ...(action === "reject" && { rejection_reason: reason }),
      },
    });

    if (error) {
      console.error("Error:", error);
      alert("Hubo un error al procesar la acción administrativa.");
    } else {
      let newStatus = "";
      if (action === "approve" || action === "activate") newStatus = "approved";
      else if (action === "reject") newStatus = "rejected";
      else if (action === "suspend") newStatus = "suspended";
      setListings((prev) => prev.map((l) => l.id === listingId ? { ...l, status: newStatus } : l));
    }
    setActionLoading(null);
  };

  // Toggle certificación Doorly
  const handleToggleCertification = async (listingId: string, currentValue: boolean) => {
    setCertLoading(listingId);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ doorly_certified: !currentValue })
        .eq("id", listingId);

      if (error) throw error;

      setListings((prev) =>
        prev.map((l) => l.id === listingId ? { ...l, doorly_certified: !currentValue } : l)
      );
    } catch (err) {
      console.error("Error al actualizar certificación:", err);
      alert("No se pudo actualizar el certificado. Intentá de nuevo.");
    } finally {
      setCertLoading(null);
    }
  };

  if (authLoading || !user || !profile) return null;
  if (profile.role !== "admin") return null;

  const pendingListings = listings.filter((l) => l.status === "pending_review" || l.status === "pending");
  const activeListings = listings.filter((l) => l.status === "approved" || l.status === "active");
  const suspendedListings = listings.filter((l) => !["approved", "active", "pending_review", "pending"].includes(l.status));

  const getBookingBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending_payment: "Pendiente de pago",
      confirmed: "Confirmada",
      cancelled: "Cancelada",
      completed: "Completada",
      refunded: "Reembolsada",
      disputed: "En disputa",
    };
    return <Badge variant="outline">{labels[status] || status}</Badge>;
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
          </div>
          <p className="text-muted-foreground">Gestión de publicaciones y reservas</p>
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="listings">
              Publicaciones
              {pendingListings.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingListings.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6">

            {/* 1. Pendientes */}
            <Card>
              <CardHeader>
                <CardTitle>Pendientes de revisión</CardTitle>
                <CardDescription>Aprobá o rechazá antes de que salgan publicadas</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : pendingListings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay publicaciones pendientes</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Zona</TableHead>
                        <TableHead>Precio/día</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">{listing.title}</TableCell>
                          <TableCell>{listing.space_type}</TableCell>
                          <TableCell>{listing.area_label}</TableCell>
                          <TableCell>${listing.price_daily?.toLocaleString("es-AR")}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                disabled={!!actionLoading}
                                onClick={() => handleAction(listing.id, "approve")}
                              >
                                {actionLoading === listing.id + "approve" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <><Check className="h-4 w-4 mr-1" />Aprobar</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={!!actionLoading}
                                onClick={() => {
                                  setRejectDialog({ open: true, listingId: listing.id });
                                  setRejectionReason("");
                                }}
                              >
                                <X className="h-4 w-4 mr-1" />Rechazar
                              </Button>
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/espacios/${listing.id}`} target="_blank">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* 2. Activas — con toggle de certificación */}
            <Card>
              <CardHeader>
                <CardTitle>Activas ({activeListings.length})</CardTitle>
                <CardDescription>
                  Podés otorgar o quitar el Certificado Doorly desde acá
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Precio/día</TableHead>
                      <TableHead>Certificado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <span>{listing.title}</span>
                            {listing.doorly_certified && (
                              <DoorlyCertifiedBadge size="sm" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{listing.space_type}</TableCell>
                        <TableCell>${listing.price_daily?.toLocaleString("es-AR")}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={listing.doorly_certified ? "default" : "outline"}
                            disabled={certLoading === listing.id}
                            onClick={() => handleToggleCertification(listing.id, listing.doorly_certified)}
                            className={listing.doorly_certified
                              ? "bg-primary hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              : "border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"}
                          >
                            {certLoading === listing.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : listing.doorly_certified ? (
                              <><ShieldCheck className="h-4 w-4 mr-1" />Certificado</>
                            ) : (
                              <><ShieldCheck className="h-4 w-4 mr-1" />Certificar</>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!actionLoading}
                              onClick={() => handleAction(listing.id, "suspend")}
                            >
                              <Pause className="h-4 w-4 mr-1" />Suspender
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/espacios/${listing.id}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 3. Inactivas */}
            <Card className="opacity-75">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Suspendidas / Rechazadas / Deshabilitadas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    {suspendedListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="text-sm">{listing.title}</TableCell>
                        <TableCell><Badge variant="secondary">{listing.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAction(listing.id, "activate")}
                            disabled={!!actionLoading}
                          >
                            <Play className="h-4 w-4 mr-1" />Reactivar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Reservas */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Reservas</CardTitle>
                <CardDescription>Todas las reservas en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay reservas todavía</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Espacio</TableHead>
                        <TableHead>Desde</TableHead>
                        <TableHead>Hasta</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.listings?.title || "N/A"}</TableCell>
                          <TableCell>{new Date(booking.start_date).toLocaleDateString("es-AR")}</TableCell>
                          <TableCell>{new Date(booking.end_date).toLocaleDateString("es-AR")}</TableCell>
                          <TableCell>${booking.total_price?.toLocaleString("es-AR")}</TableCell>
                          <TableCell>{getBookingBadge(booking.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo de rechazo */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, listingId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar publicación</DialogTitle>
            <DialogDescription>
              El usuario recibirá este mensaje explicando por qué fue rechazada su publicación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ej: Las fotos no muestran claramente el espacio. Por favor subí fotos más nítidas y con buena iluminación."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectDialog({ open: false, listingId: null })}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectionReason.trim() || !!actionLoading}
                onClick={async () => {
                  if (!rejectDialog.listingId || !rejectionReason.trim()) return;
                  await handleAction(rejectDialog.listingId, "reject", rejectionReason.trim());
                  setRejectDialog({ open: false, listingId: null });
                }}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar rechazo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}