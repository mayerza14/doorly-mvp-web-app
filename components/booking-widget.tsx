"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import type { Listing, AvailabilityBlock } from "@/lib/types";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, Loader2, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";

interface BookingWidgetProps {
  listing: Listing;
  blockedDates: AvailabilityBlock[];
}

export function BookingWidget({ listing, blockedDates }: BookingWidgetProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isReserving, setIsReserving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const disabledRanges = blockedDates
    .filter((block) => block.listingId === listing.id)
    .map((block) => {
      const [sYear, sMonth, sDay] = block.startDate.split("-");
      const [eYear, eMonth, eDay] = block.endDate.split("-");
      return {
        from: new Date(Number(sYear), Number(sMonth) - 1, Number(sDay), 0, 0, 0),
        to: new Date(Number(eYear), Number(eMonth) - 1, Number(eDay), 23, 59, 59),
      };
    });

  const calculatePrice = () => {
    if (!dateRange?.from || !dateRange?.to) return null;

    const days = Math.ceil(
      (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    let total = 0;
    let breakdown = "";
    let rateType = "";

    if (days >= 30 && listing.priceMonthly) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      const weeklyRate = listing.priceWeekly || listing.priceDaily * 7;
      total =
        months * listing.priceMonthly +
        (remainingDays >= 7 && listing.priceWeekly
          ? Math.floor(remainingDays / 7) * weeklyRate + (remainingDays % 7) * listing.priceDaily
          : remainingDays * listing.priceDaily);
      breakdown = `${months} mes(es)`;
      rateType = "mensual";
    } else if (days >= 7 && listing.priceWeekly) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      total = weeks * listing.priceWeekly + remainingDays * listing.priceDaily;
      breakdown = `${weeks} semana(s)`;
      rateType = "semanal";
    } else {
      total = days * listing.priceDaily;
      breakdown = `${days} día(s)`;
      rateType = "diario";
    }

    const serviceFeeRate = 0.10;
    const serviceFeeAmount = Math.round(total * serviceFeeRate);

    return { days, total, breakdown, rateType, serviceFeeAmount };
  };

  const priceInfo = calculatePrice();

  const handleReserve = async () => {
    if (!dateRange?.from || !dateRange?.to || !priceInfo) return;
    if (!acceptedTerms) return;

    setIsReserving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/auth?returnUrl=/espacios/${listing.id}`);
        return;
      }

      const { data: holdData, error: holdError } = await supabase.functions.invoke("create-hold", {
        body: {
          listing_id: listing.id,
          start_date: format(dateRange.from, "yyyy-MM-dd"),
          end_date: format(dateRange.to, "yyyy-MM-dd"),
          amount: priceInfo.total,
        },
      });

      if (holdError) {
        let mensajeReal = holdError.message;
        if (holdError.context && typeof holdError.context.json === "function") {
          const errorBody = await holdError.context.json().catch(() => ({}));
          mensajeReal = errorBody.error || errorBody.details || JSON.stringify(errorBody) || mensajeReal;
        }
        alert("No se pudo iniciar la reserva: " + mensajeReal);
        setIsReserving(false);
        return;
      }

      const bookingId = holdData?.booking_id || holdData?.id;
      if (!bookingId) throw new Error("No se pudo obtener el ID de la reserva.");

      const { data: mpData, error: mpError } = await supabase.functions.invoke("mp-create-preference", {
        body: { booking_id: bookingId },
      });

      if (mpError) {
        if (mpError.context && typeof mpError.context.json === "function") {
          const errorBody = await mpError.context.json().catch(() => ({}));
          console.error("ERROR COMPLETO DE MP:", errorBody);
        }
        alert("Mercado Pago no pudo procesar la solicitud en este momento. Intentá de nuevo más tarde.");
        setIsReserving(false);
        return;
      }

      if (mpData?.init_point) {
        window.location.href = mpData.init_point;
      } else {
        throw new Error("No se recibió la URL de pago de Mercado Pago.");
      }
    } catch (error: any) {
      console.error("Error en el proceso de reserva:", error);
      alert(error?.message || "Hubo un problema. Por favor intentá de nuevo.");
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">${listing.priceDaily.toLocaleString()}</span>
          <span className="text-base font-normal text-muted-foreground">/ día</span>
        </CardTitle>
        {(listing.priceWeekly || listing.priceMonthly) && (
          <div className="flex gap-2 flex-wrap mt-1">
            {listing.priceWeekly && (
              <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                ${listing.priceWeekly.toLocaleString()}/semana
              </Badge>
            )}
            {listing.priceMonthly && (
              <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                ${listing.priceMonthly.toLocaleString()}/mes
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {/* ── Scroll interno: el card no crece, solo scrollea por dentro ── */}
      <CardContent className="p-0">
        <div className="overflow-y-auto max-h-[600px] px-6 pb-6 space-y-4">

          {/* Calendario */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Seleccioná las fechas</label>
            <div className="border border-border rounded-md p-3 bg-card">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={[{ before: new Date() }, ...disabledRanges]}
                locale={es}
                numberOfMonths={1}
                className="rounded-md"
              />
            </div>
            {dateRange?.from && dateRange?.to && (
              <div className="flex items-center gap-2 text-sm text-primary font-medium mt-2 bg-primary/5 p-2 rounded-md">
                <CalendarIcon className="h-4 w-4" />
                {format(dateRange.from, "d 'de' MMM", { locale: es })} -{" "}
                {format(dateRange.to, "d 'de' MMM yyyy", { locale: es })}
              </div>
            )}
          </div>

          {/* Desglose de costos */}
          {priceInfo && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reserva por {priceInfo.breakdown}</span>
                <span className="font-medium">${priceInfo.total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    Comisión Doorly
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[9px] h-4 px-1.5 uppercase font-bold">
                      Promo Lanzamiento
                    </Badge>
                  </span>
                  <span className="text-[10px] text-muted-foreground">Bonificación del 100% aplicada</span>
                </div>
                <div className="text-right">
                  <span className="line-through text-muted-foreground text-xs mr-2">
                    ${priceInfo.serviceFeeAmount.toLocaleString()}
                  </span>
                  <span className="text-green-600 font-bold">$0</span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-dashed pt-4 mt-2">
                <span className="text-base font-bold text-foreground">Total a pagar</span>
                <span className="text-2xl font-black text-primary">
                  ${priceInfo.total.toLocaleString()}
                </span>
              </div>

              <div className="flex items-start gap-2 bg-blue-50/50 p-2 rounded-md border border-blue-100">
                <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-700 leading-tight">
                  No hay cargos adicionales. El precio final es el reflejado arriba.
                </p>
              </div>
            </div>
          )}

          {/* Checkbox términos */}
          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id="terms-booking"
              checked={acceptedTerms}
              onCheckedChange={(v) => setAcceptedTerms(v === true)}
            />
            <Label
              htmlFor="terms-booking"
              className="text-xs font-normal text-muted-foreground leading-relaxed cursor-pointer"
            >
              Acepto los{" "}
              <Link href="/terminos" target="_blank" className="text-primary underline underline-offset-2">
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" target="_blank" className="text-primary underline underline-offset-2">
                Política de Privacidad
              </Link>{" "}
              de Doorly
            </Label>
          </div>

          <Button
            onClick={handleReserve}
            disabled={!dateRange?.from || !dateRange?.to || isReserving || !acceptedTerms}
            className="w-full shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            {isReserving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando pago...
              </>
            ) : (
              "Reservar ahora"
            )}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
            Al hacer clic en "Reservar ahora", serás redirigido a Mercado Pago para completar la
            operación de forma segura.
          </p>

        </div>
      </CardContent>
    </Card>
  );
}