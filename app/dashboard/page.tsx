"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Eye, Edit, Loader2, MessageSquare, Calendar, Trash2,
  AlertTriangle, User, Landmark, Save, ShieldCheck, AlertCircle, Pencil, Phone,
} from "lucide-react";
import { ChatWidget } from "@/components/chat-widget";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LeaveReview } from "@/components/leave-review";
import { CertificationRequestModal } from "@/components/certification-request-modal";
import { DoorlyCertifiedBadge } from "@/components/doorly-certified-badge";
import { PendingQuestionsBadge } from "@/components/pending-questions-badge";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

  const isHost = profile?.role === "host" || profile?.role === "both" || profile?.role === "admin";
  const isRenter = profile?.role === "renter" || profile?.role === "both" || profile?.role === "admin";
  const [activeTab, setActiveTab] = useState<string>(isHost ? "espacios" : "reservas");

  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [certificationModal, setCertificationModal] = useState<{
    open: boolean; listingId: string; listingTitle: string;
  }>({ open: false, listingId: "", listingTitle: "" });

  // Payout
  const [hasPayoutMethod, setHasPayoutMethod] = useState(true);
  const [isLoadingPayout, setIsLoadingPayout] = useState(true);
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState({ type: "", text: "" });
  const [payoutData, setPayoutData] = useState({
    fullName: "", cuitCuil: "", bankName: "", cbuCvu: "", alias: "",
  });

  // Perfil editable
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth?returnUrl=/dashboard");
  }, [user, authLoading, router]);

  // Cargar datos del perfil
  useEffect(() => {
    if (!user || !profile) return;
    setProfileData({
      fullName: profile.full_name || "",
      phone: profile.phone || "",
    });
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;
    const fetchPayoutData = async () => {
      const { data } = await supabase
        .from("payout_methods")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (data) {
        setPayoutData({
          fullName: data.full_name,
          cuitCuil: data.cuit_cuil,
          bankName: data.bank_name,
          cbuCvu: data.cbu_cvu,
          alias: data.alias || "",
        });
        setHasPayoutMethod(true);
      } else {
        setHasPayoutMethod(false);
      }
      setIsLoadingPayout(false);
    };
    fetchPayoutData();
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("listings")
      .select(`*, bookings(id, status)`)
      .eq("host_id", user.id)
      .neq("status", "disabled")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const processedListings = data.map((listing) => {
        const hasActiveBookings = listing.bookings?.some(
          (b: any) => b.status === "confirmed" || b.status === "pending_payment"
        );
        return { ...listing, hasActiveBookings };
      });
      setListings(processedListings);
    }
    setIsLoadingListings(false);
  };

  useEffect(() => { fetchListings(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const { data, error } = await supabase.functions.invoke("my-bookings", { method: "GET" });
      if (!error && data?.bookings) setBookings(data.bookings);
      else if (error) console.error("Error fetching bookings:", error);
      setIsLoadingBookings(false);
    };
    fetchBookings();
  }, [user]);

  const handleDeleteListing = async (listingId: string) => {
    setIsDeleting(listingId);
    try {
      const { error } = await supabase.from("listings").update({ status: "disabled" }).eq("id", listingId);
      if (error) throw error;
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("No se pudo eliminar la publicación.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTogglePause = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === "paused" ? "approved" : "paused";
    try {
      const { error } = await supabase.from("listings").update({ status: newStatus }).eq("id", listingId);
      if (error) throw error;
      setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l)));
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("No se pudo cambiar el estado de la publicación.");
    }
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutData.cbuCvu.length !== 22) {
      setPayoutMessage({ type: "error", text: "El CBU/CVU debe tener exactamente 22 dígitos." });
      return;
    }
    setIsSavingPayout(true);
    setPayoutMessage({ type: "", text: "" });
    try {
      const { error } = await supabase.from("payout_methods").upsert({
        profile_id: user?.id,
        full_name: payoutData.fullName,
        cuit_cuil: payoutData.cuitCuil,
        bank_name: payoutData.bankName,
        cbu_cvu: payoutData.cbuCvu,
        alias: payoutData.alias,
      });
      if (error) throw error;
      setPayoutMessage({ type: "success", text: "Datos bancarios guardados correctamente." });
      setHasPayoutMethod(true);
    } catch (error) {
      console.error(error);
      setPayoutMessage({ type: "error", text: "Error al guardar los datos." });
    } finally {
      setIsSavingPayout(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.fullName.trim()) {
      setProfileMessage({ type: "error", text: "El nombre no puede estar vacío." });
      return;
    }
    // Validación básica de teléfono
    if (profileData.phone && !/^[\d\s\+\-\(\)]{6,20}$/.test(profileData.phone)) {
      setProfileMessage({ type: "error", text: "El teléfono ingresado no es válido." });
      return;
    }
    setIsSavingProfile(true);
    setProfileMessage({ type: "", text: "" });
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.fullName.trim(),
          phone: profileData.phone.trim() || null,
        })
        .eq("id", user?.id);
      if (error) throw error;
      setProfileMessage({ type: "success", text: "Perfil actualizado correctamente." });
      setIsEditingProfile(false);
    } catch (error) {
      console.error(error);
      setProfileMessage({ type: "error", text: "Error al guardar los datos." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (authLoading || !user || !profile) return null;

  const displayName = profile.full_name || user.user_metadata?.full_name || user.email;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": case "active": case "confirmed":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">Aprobado</Badge>;
      case "pending_review": case "hold":
        return <Badge variant="secondary">En proceso</Badge>;
      case "rejected": case "cancelled":
        return <Badge variant="destructive">Rechazado/Cancelado</Badge>;
      case "disabled": case "suspended":
        return <Badge variant="outline" className="text-muted-foreground">Deshabilitado</Badge>;
      case "paused":
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pausada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AppShell>
      <div className="container max-w-7xl mx-auto px-4 py-8">

        {/* Alerta datos de cobro */}
        {isHost && !isLoadingPayout && !hasPayoutMethod && (
          <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-r-lg mb-8 shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 items-start sm:items-center">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-bold text-destructive">¡Atención! Faltan tus datos de cobro</h3>
                <p className="text-sm opacity-90">Para recibir el dinero de tus reservas, necesitás configurar tu CBU/CVU.</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" className="whitespace-nowrap" onClick={() => setActiveTab("perfil")}>
              Cargar datos ahora
            </Button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mi cuenta</h1>
          <p className="text-muted-foreground">Bienvenido, {displayName}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* ── TabsList responsive: 2 cols mobile, 4 cols desktop ── */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1">
            {isHost && <TabsTrigger value="espacios" className="py-2">Mis espacios</TabsTrigger>}
            {isRenter && <TabsTrigger value="reservas" className="py-2">Mis reservas</TabsTrigger>}
            <TabsTrigger value="mensajes" className="py-2">Mensajes</TabsTrigger>
            <TabsTrigger value="perfil" className="py-2">Mi perfil</TabsTrigger>
          </TabsList>

          {/* ── TAB: MIS ESPACIOS ── */}
          {isHost && (
            <TabsContent value="espacios" className="space-y-6">
              {/* Badge preguntas pendientes */}
              <PendingQuestionsBadge />

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Mis espacios</CardTitle>
                      <CardDescription>Gestioná tus publicaciones</CardDescription>
                    </div>
                    <Button asChild>
                      <Link href="/publicar">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Publicar nuevo espacio</span>
                        <span className="sm:hidden">Publicar</span>
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingListings ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">Todavía no tenés espacios publicados</p>
                      <Button asChild><Link href="/publicar"><Plus className="h-4 w-4 mr-2" />Publicar mi primer espacio</Link></Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Espacio</TableHead>
                          {/* Columnas ocultas en mobile */}
                          <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                          <TableHead className="hidden sm:table-cell">Precio/día</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((listing) => (
                          <React.Fragment key={listing.id}>
                            <TableRow>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-foreground">{listing.title}</div>
                                  {listing.doorly_certified && <DoorlyCertifiedBadge size="sm" />}
                                  {listing.status === "rejected" && listing.rejection_reason && (
                                    <div className="mt-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
                                      <strong className="block mb-0.5">Motivo del rechazo:</strong>
                                      {listing.rejection_reason}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{listing.space_type}</TableCell>
                              <TableCell className="hidden sm:table-cell">${listing.price_daily?.toLocaleString("es-AR")}</TableCell>
                              <TableCell>{getStatusBadge(listing.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" title="Ver publicación" asChild>
                                    <Link href={`/espacios/${listing.id}`}><Eye className="h-4 w-4" /></Link>
                                  </Button>
                                  <Button variant="ghost" size="icon" title="Editar publicación" asChild>
                                    <Link href={`/publicar?edit=${listing.id}`}><Edit className="h-4 w-4 text-muted-foreground" /></Link>
                                  </Button>

                                  {(listing.status === "approved" || listing.status === "paused") && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" title={listing.status === "paused" ? "Reactivar" : "Pausar"}>
                                          {listing.status === "paused"
                                            ? <span className="text-green-600" style={{ fontSize: 16 }}>▶</span>
                                            : <span className="text-amber-500" style={{ fontSize: 16 }}>⏸</span>}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>{listing.status === "paused" ? "¿Reactivar publicación?" : "¿Pausar publicación?"}</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            {listing.status === "paused"
                                              ? "Tu espacio vuelve a aparecer en el buscador."
                                              : "Tu espacio dejará de aparecer en el buscador. Las reservas confirmadas no se ven afectadas."}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleTogglePause(listing.id, listing.status)}
                                            className={listing.status === "paused" ? "!bg-green-600 hover:!bg-green-700 text-white" : "!bg-amber-500 hover:!bg-amber-600 !text-white"}
                                          >
                                            {listing.status === "paused" ? "Sí, reactivar" : "Sí, pausar"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}

                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" title="Eliminar publicación">
                                        {isDeleting === listing.id
                                          ? <Loader2 className="h-4 w-4 animate-spin" />
                                          : <Trash2 className="h-4 w-4 text-destructive" />}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      {listing.hasActiveBookings ? (
                                        <>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle className="flex items-center gap-2">
                                              <AlertTriangle className="h-5 w-5 text-destructive" />No se puede eliminar
                                            </AlertDialogTitle>
                                            <AlertDialogDescription className="text-foreground">
                                              Este espacio tiene reservas activas o pendientes de pago.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter><AlertDialogAction>Entendido</AlertDialogAction></AlertDialogFooter>
                                        </>
                                      ) : (
                                        <>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar publicación?</AlertDialogTitle>
                                            <AlertDialogDescription>Esta acción es permanente. Los usuarios ya no podrán encontrarlo.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteListing(listing.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                              Eliminar permanentemente
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </>
                                      )}
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Banner certificación */}
                            {listing.status === "approved" && !listing.doorly_certified && (
                              <TableRow className="bg-gradient-to-r from-primary/5 to-transparent border-none hover:bg-primary/5">
                                <TableCell colSpan={5} className="py-3 px-4">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-foreground">Certificá este espacio y conseguí más reservas</p>
                                        <p className="text-xs text-muted-foreground">Un Doorlier visita tu espacio y te otorga el badge oficial.</p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                      onClick={() => setCertificationModal({ open: true, listingId: listing.id, listingTitle: listing.title })}
                                    >
                                      <ShieldCheck className="h-4 w-4 mr-1.5" />
                                      Solicitar certificación
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <CertificationRequestModal
                open={certificationModal.open}
                onOpenChange={(open) => setCertificationModal((prev) => ({ ...prev, open }))}
                listingTitle={certificationModal.listingTitle}
                listingId={certificationModal.listingId}
              />
            </TabsContent>
          )}

          {/* ── TAB: MIS RESERVAS ── */}
          {isRenter && (
            <TabsContent value="reservas" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mis reservas</CardTitle>
                  <CardDescription>Espacios que reservaste</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBookings ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">Todavía no hiciste ninguna reserva</p>
                      <Button asChild><Link href="/buscar">Explorar espacios</Link></Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Espacio</TableHead>
                          <TableHead className="hidden sm:table-cell">Desde</TableHead>
                          <TableHead className="hidden sm:table-cell">Hasta</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => {
                          const end = new Date(booking.end_date);
                          const openAt = new Date(end.getTime() + 86400000);
                          const closeAt = new Date(end.getTime() + 15 * 86400000);
                          const now = new Date();
                          const canReview =
                            booking.status === "confirmed" &&
                            booking.mp_status === "approved" &&
                            now >= openAt && now < closeAt &&
                            !reviewedBookings.has(booking.id);

                          return (
                            <React.Fragment key={booking.id}>
                              <TableRow>
                                <TableCell className="font-medium">{booking.listing?.title || "N/A"}</TableCell>
                                <TableCell className="hidden sm:table-cell">{new Date(booking.start_date).toLocaleDateString("es-AR")}</TableCell>
                                <TableCell className="hidden sm:table-cell">{new Date(booking.end_date).toLocaleDateString("es-AR")}</TableCell>
                                <TableCell>${booking.total_price?.toLocaleString("es-AR")}</TableCell>
                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                              </TableRow>
                              {canReview && (
                                <TableRow>
                                  <TableCell colSpan={5} className="pt-0 pb-3 px-4">
                                    <LeaveReview
                                      bookingId={booking.id}
                                      listingTitle={booking.listing?.title || "Espacio"}
                                      onReviewSubmitted={() => setReviewedBookings((prev) => new Set([...prev, booking.id]))}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── TAB: MENSAJES ── */}
          <TabsContent value="mensajes">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Mensajes</CardTitle>
                <CardDescription>Conversaciones sobre tus reservas</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground opacity-30" />
                    <p className="text-muted-foreground text-sm">Aún no tenés reservas para chatear.</p>
                    <Button asChild variant="outline" className="mt-4"><Link href="/buscar">Explorar espacios</Link></Button>
                  </div>
                ) : (
                  <div className="flex" style={{ height: "520px" }}>
                    <div className="w-56 sm:w-64 flex-shrink-0 border-r flex flex-col">
                      <div className="px-4 py-3 border-b">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tus reservas</p>
                      </div>
                      <div className="flex-1 overflow-y-auto py-2">
                        {bookings.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBookingId(b.id)}
                            className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 border-b border-border/50 last:border-0 ${selectedBookingId === b.id ? "bg-muted" : ""}`}
                          >
                            <p className="text-sm font-medium text-foreground truncate">{b.listing?.title || "Espacio"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(b.start_date).toLocaleDateString("es-AR")} → {new Date(b.end_date).toLocaleDateString("es-AR")}
                            </p>
                            <div className="mt-1">{getStatusBadge(b.status)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 p-4">
                      {selectedBookingId ? (
                        <ChatWidget bookingId={selectedBookingId} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-3 rounded-xl border border-dashed bg-muted/20">
                          <MessageSquare className="h-10 w-10 text-muted-foreground opacity-20" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Seleccioná una reserva</p>
                            <p className="text-xs text-muted-foreground mt-1">Elegí una de la lista para ver la conversación</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB: MI PERFIL ── */}
          <TabsContent value="perfil" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">

              {/* ── Información Personal ── */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      <CardTitle>Información Personal</CardTitle>
                    </div>
                    {!isEditingProfile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary"
                        onClick={() => { setIsEditingProfile(true); setProfileMessage({ type: "", text: "" }); }}
                      >
                        <Pencil className="h-4 w-4 mr-1.5" />
                        Editar
                      </Button>
                    )}
                  </div>
                  <CardDescription>Datos básicos de tu cuenta</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="profileName">Nombre completo</Label>
                        <Input
                          id="profileName"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          placeholder="Tu nombre completo"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profilePhone">
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            Teléfono (opcional)
                          </span>
                        </Label>
                        <Input
                          id="profilePhone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="Ej: +54 11 1234-5678"
                          type="tel"
                        />
                        <p className="text-xs text-muted-foreground">Solo visible para vos y el equipo de Doorly.</p>
                      </div>

                      {/* Email — solo lectura */}
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Email (no editable)</Label>
                        <p className="text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded-md border border-border">
                          {user.email}
                        </p>
                      </div>

                      {profileMessage.text && (
                        <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${profileMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {profileMessage.type === "success" ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          {profileMessage.text}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button type="submit" disabled={isSavingProfile} className="flex-1">
                          {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Guardar cambios
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({ fullName: profile.full_name || "", phone: profile.phone || "" });
                            setProfileMessage({ type: "", text: "" });
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Nombre completo</Label>
                        <p className="font-medium text-foreground">{profile?.full_name || "No definido"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Email</Label>
                        <p className="font-medium text-foreground">{user.email}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Teléfono
                        </Label>
                        <p className="font-medium text-foreground">
                          {profile?.phone || <span className="text-muted-foreground text-sm italic">No cargado</span>}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Tipo de cuenta</Label>
                        <div><Badge variant="secondary" className="capitalize mt-1">{profile?.role}</Badge></div>
                      </div>

                      {profileMessage.text && (
                        <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${profileMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {profileMessage.type === "success" ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          {profileMessage.text}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Datos de Cobro ── */}
              <Card className={`border-2 transition-colors ${!hasPayoutMethod && isHost ? "border-destructive/50 shadow-sm shadow-destructive/20" : "border-border"}`}>
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    <CardTitle>Datos de Cobro</CardTitle>
                  </div>
                  <CardDescription>Configurá dónde querés recibir el dinero de tus alquileres.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingPayout ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <form onSubmit={handleSavePayout} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre del Titular</Label>
                        <Input id="fullName" placeholder="Tal cual figura en tu banco" value={payoutData.fullName}
                          onChange={(e) => setPayoutData({ ...payoutData, fullName: e.target.value })} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cuit">CUIT / CUIL</Label>
                          <Input id="cuit" placeholder="Sin guiones" value={payoutData.cuitCuil}
                            onChange={(e) => setPayoutData({ ...payoutData, cuitCuil: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank">Banco / Billetera</Label>
                          <Input id="bank" placeholder="Ej: Mercado Pago" value={payoutData.bankName}
                            onChange={(e) => setPayoutData({ ...payoutData, bankName: e.target.value })} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cbu">CBU / CVU <span className="text-destructive">*</span></Label>
                        <Input id="cbu" placeholder="22 dígitos" maxLength={22} value={payoutData.cbuCvu}
                          onChange={(e) => setPayoutData({ ...payoutData, cbuCvu: e.target.value.replace(/\D/g, "") })}
                          required className="font-mono tracking-widest" />
                        <div className="flex justify-between">
                          <p className="text-[10px] text-muted-foreground">Solo números</p>
                          <p className={`text-[10px] font-medium ${payoutData.cbuCvu.length === 22 ? "text-green-600" : "text-muted-foreground"}`}>
                            {payoutData.cbuCvu.length}/22
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alias">Alias (Opcional)</Label>
                        <Input id="alias" placeholder="puerta.casa.sol" value={payoutData.alias}
                          onChange={(e) => setPayoutData({ ...payoutData, alias: e.target.value })} />
                      </div>
                      {payoutMessage.text && (
                        <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${payoutMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {payoutMessage.type === "success" ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          {payoutMessage.text}
                        </div>
                      )}
                      <Button type="submit" disabled={isSavingPayout} className="w-full mt-2">
                        {isSavingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {hasPayoutMethod ? "Actualizar datos" : "Guardar datos"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}