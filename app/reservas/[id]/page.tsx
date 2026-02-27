"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, MessageSquare, KeyRound, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { mockListings } from "@/lib/mock-data";
import { mockBookings, updateBookingStatus } from "@/lib/mock-bookings";
import type { Booking, Listing } from "@/lib/types";

const STATUS_LABELS = {
  pending_payment: "Pendiente de pago",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  refunded: "Reembolsada",
  disputed: "En disputa",
};

const STATUS_COLORS = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  refunded: "bg-purple-100 text-purple-800",
  disputed: "bg-orange-100 text-orange-800",
};

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth?returnUrl=/reservas/${params.id}`);
    }
  }, [user, authLoading, router, params.id]);

  useEffect(() => {
    const foundBooking = mockBookings.find((b) => b.id === params.id);
    setBooking(foundBooking || null);

    if (foundBooking) {
      const foundListing = mockListings.find((l) => l.id === foundBooking.listingId);
      setListing(foundListing || null);
    }
  }, [params.id]);

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AppShell>
    );
  }

  if (!booking || !listing) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Reserva no encontrada</h1>
          <Button asChild>
            <Link href="/dashboard">Volver a Mi panel</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const handleCancelBooking = () => {
    // TODO: Integrate with Supabase to cancel booking
    updateBookingStatus(booking.id, "cancelled");
    setBooking({ ...booking, status: "cancelled" });
  };

  const isConfirmed = booking.status === "confirmed";
  const canCancel = isConfirmed && new Date(booking.startDate) > new Date();
  const isRenter = user.id === booking.renterId;

  const daysDiff = Math.ceil(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-balance">Detalles de la reserva</h1>
          <p className="text-muted-foreground mt-2">Reserva #{booking.id}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Estado</CardTitle>
                  <Badge className={STATUS_COLORS[booking.status]}>
                    {STATUS_LABELS[booking.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isConfirmed && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      Tu reserva está confirmada. Podés acceder al espacio en las fechas
                      seleccionadas.
                    </p>
                  </div>
                )}
                {booking.status === "pending_payment" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      El pago está pendiente. Completá el pago para confirmar tu reserva.
                    </p>
                    <Button asChild className="mt-3" size="sm">
                      <Link href={`/checkout/${booking.id}`}>Completar pago</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Listing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Espacio reservado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    {listing.areaLabel}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {listing.spaceType}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Fechas de reserva</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.startDate).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      -{" "}
                      {new Date(booking.endDate).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">{daysDiff} días</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Info - Only show if confirmed */}
            {isConfirmed && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Información de acceso
                  </CardTitle>
                  <CardDescription>
                    Esta información solo está disponible para reservas confirmadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium mb-1">Dirección completa</p>
                    <p className="text-sm">{listing.fullAddressPrivate}</p>
                  </div>

                  <Separator />

                  <div>
                    <p className="font-medium mb-1">Tipo de acceso</p>
                    <p className="text-sm">
                      {listing.accessType === "24_7" ? "Acceso 24/7" : "Horarios coordinados"}
                    </p>
                    {listing.accessHoursText && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {listing.accessHoursText}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="bg-accent rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Instrucciones de acceso</p>
                    <p className="text-sm text-muted-foreground">
                      Coordiná los detalles específicos de acceso con el propietario a través del
                      chat.
                    </p>
                  </div>

                  <Button asChild className="w-full" variant="default">
                    <Link href={`/mensajes/${booking.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Abrir chat con el propietario
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Cancellation Policy */}
            {canCancel && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Política de cancelación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Cancelación flexible:</strong> Podés cancelar tu reserva hasta 24
                      horas antes de la fecha de inicio y recibir un reembolso completo.
                    </p>
                    <p className="text-muted-foreground">
                      Las cancelaciones realizadas con menos de 24 horas de anticipación no son
                      reembolsables.
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar reserva
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar esta reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Si cancelas ahora, recibirás un
                          reembolso completo según nuestra política de cancelación.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>No, mantener reserva</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelBooking}>
                          Sí, cancelar reserva
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha de reserva</span>
                    <span>
                      {new Date(booking.createdAt).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración</span>
                    <span>{daysDiff} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método de pago</span>
                    <span>Mercado Pago</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total pagado</span>
                  <span>${booking.totalAmount.toLocaleString("es-AR")}</span>
                </div>

                {isRenter && (
                  <>
                    <Separator />
                    <Button asChild variant="outline" className="w-full bg-transparent">
                      <Link href="/dashboard">Ver todas mis reservas</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
