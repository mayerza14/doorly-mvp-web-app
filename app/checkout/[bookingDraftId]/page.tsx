"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, CreditCard, Shield, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { mockListings } from "@/lib/mock-data";
import { mockBookings, updateBookingStatus } from "@/lib/mock-bookings";
import type { Listing } from "@/lib/types";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock booking draft data (in real app, would fetch from API)
  const bookingDraft = {
    id: params.bookingDraftId as string,
    listingId: "1", // Mock listing ID
    startDate: "2026-02-01",
    endDate: "2026-02-28",
    totalAmount: 50000,
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth?returnUrl=/checkout/${params.bookingDraftId}`);
    }
  }, [user, authLoading, router, params.bookingDraftId]);

  useEffect(() => {
    const foundListing = mockListings.find((l) => l.id === bookingDraft.listingId);
    setListing(foundListing || null);
  }, [bookingDraft.listingId]);

  if (authLoading || !user || !listing) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-12 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AppShell>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);

    // TODO: Real Mercado Pago integration
    // 1. Create MP preference with booking details
    // 2. Redirect to MP Checkout Pro
    // 3. Handle webhook to confirm booking
    console.log("[v0] Simulating Mercado Pago payment flow");

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create confirmed booking
    const newBooking = {
      id: `booking_${Date.now()}`,
      listingId: bookingDraft.listingId,
      renterId: user.id,
      hostId: listing.hostId,
      startDate: bookingDraft.startDate,
      endDate: bookingDraft.endDate,
      totalAmount: bookingDraft.totalAmount,
      status: "confirmed" as const,
      paymentProvider: "mercadopago" as const,
      createdAt: new Date().toISOString(),
    };

    // Add to mock bookings
    mockBookings.push(newBooking);

    setIsProcessing(false);

    // Redirect to reservation details
    router.push(`/reservas/${newBooking.id}`);
  };

  const daysDiff = Math.ceil(
    (new Date(bookingDraft.endDate).getTime() - new Date(bookingDraft.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-balance">Confirmar y pagar</h1>
          <p className="text-muted-foreground mt-2">Revisá los detalles de tu reserva</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Listing Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Detalles del espacio</CardTitle>
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
                      {new Date(bookingDraft.startDate).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      -{" "}
                      {new Date(bookingDraft.endDate).toLocaleDateString("es-AR", {
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

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Método de pago</CardTitle>
                <CardDescription>Procesado de forma segura por Mercado Pago</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Mercado Pago</p>
                    <p className="text-sm text-muted-foreground">
                      Tarjetas de crédito, débito, y más
                    </p>
                  </div>
                </div>

                <div className="bg-accent rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Pago seguro</p>
                      <p className="text-xs text-muted-foreground">
                        Los fondos se retienen hasta que se confirme el inicio de la reserva.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Liberación de fondos</p>
                      <p className="text-xs text-muted-foreground">
                        Se libera al propietario 48h después del inicio de la reserva.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Breakdown */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-xl">Resumen de precio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>
                      ${listing.priceDaily.toLocaleString("es-AR")} x {daysDiff} días
                    </span>
                    <span>${bookingDraft.totalAmount.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${bookingDraft.totalAmount.toLocaleString("es-AR")}</span>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? "Procesando..." : "Pagar con Mercado Pago"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Al hacer clic en "Pagar", aceptás nuestros{" "}
                  <a href="#" className="underline">
                    términos de servicio
                  </a>{" "}
                  y{" "}
                  <a href="#" className="underline">
                    política de cancelación
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
