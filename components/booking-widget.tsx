"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import type { Listing, AvailabilityBlock } from "@/lib/types";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, Loader2, AlertTriangle, Camera } from "lucide-react";
import { format, addMonths } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import {
  DOORLY_COMMISSION_ENABLED,
  calcRenterCommission,
  calcRenterTotal,
} from "@/lib/commission";

interface BookingWidgetProps {
  listing: Listing;
  blockedDates: AvailabilityBlock[];
  hostHasPayoutMethod: boolean;
}
 
export function BookingWidget({
  listing,
  blockedDates,
  hostHasPayoutMethod,
}: BookingWidgetProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [monthlyStartDate, setMonthlyStartDate] = useState<Date | undefined>();
  const [monthlyMonths, setMonthlyMonths] = useState<number | undefined>();
  const [isReserving, setIsReserving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [activeTab, setActiveTab] = useState<'flexible' | 'monthly'>('flexible');

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

  const calculatePriceFlexible = () => {
    if (!dateRange?.from || !dateRange?.to) return null;

    const days =
      Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    let basePrice = 0;
    let breakdown = "";
    let rateType = "";

    if (days >= 7 && listing.priceWeekly) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      basePrice = weeks * listing.priceWeekly + remainingDays * listing.priceDaily;
      breakdown = `${weeks} semana(s)`;
      rateType = "semanal";
    } else {
      basePrice = days * listing.priceDaily;
      breakdown = `${days} día(s)`;
      rateType = "diario";
    }

    const renterCommission = calcRenterCommission(basePrice);
    const renterTotal = calcRenterTotal(basePrice);

    return { days, basePrice, breakdown, rateType, renterCommission, renterTotal };
  };

  const calculatePriceMonthly = () => {
    if (!monthlyStartDate || !monthlyMonths) return null;

    const basePrice = monthlyMonths * (listing.priceMonthly || 0);
    const renterCommission = calcRenterCommission(basePrice);
    const renterTotal = calcRenterTotal(basePrice);

    return {
      days: monthlyMonths * 30,
      basePrice,
      breakdown: `${monthlyMonths} mes(es)`,
      rateType: "mensual",
      renterCommission,
      renterTotal,
    };
  };

  const priceInfo =
    listing.bookingMode === 'monthly' && !monthlyStartDate
      ? null
      : listing.bookingMode === 'monthly'
      ? calculatePriceMonthly()
      : calculatePriceFlexible();

  const effectiveMode = listing.bookingMode === 'both' ? activeTab : listing.bookingMode;

  const handleReserve = async () => {
    if (!priceInfo) return;
    if (!acceptedTerms) return;

    let startDateStr = "";
    let endDateStr = "";

    if (effectiveMode === 'flexible') {
      if (!dateRange?.from || !dateRange?.to) return;
      startDateStr = format(dateRange.from, "yyyy-MM-dd");
      endDateStr = format(dateRange.to, "yyyy-MM-dd");
    } else {
      if (!monthlyStartDate || !monthlyMonths) return;
      startDateStr = format(monthlyStartDate, "yyyy-MM-dd");
      endDateStr = format(addMonths(monthlyStartDate, monthlyMonths), "yyyy-MM-dd");
    }

    setIsReserving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/auth?returnUrl=/espacios/${listing.id}`);
        return;
      }

      const { data: holdData, error: holdError } = await supabase.functions.invoke(
        "create-hold",
        {
          body: {
            listing_id: listing.id,
            start_date: startDateStr,
            end_date: endDateStr,
            amount: priceInfo.basePrice,
            total_amount: priceInfo.renterTotal,
            booking_mode: effectiveMode,
          },
        }
      );

      if (holdError) {
        let mensajeReal = holdError.message;
        if (holdError.context && typeof holdError.context.json === "function") {
          const errorBody = await holdError.context.json().catch(() => ({}));
          mensajeReal =
            errorBody.error ||
            errorBody.details ||
            JSON.stringify(errorBody) ||
            mensajeReal;
        }
        alert("No se pudo iniciar la reserva: " + mensajeReal);
        setIsReserving(false);
        return;
      }

      const bookingId = holdData?.booking_id || holdData?.id;
      if (!bookingId) throw new Error("No se pudo obtener el ID de la reserva.");

      const { data: mpData, error: mpError } = await supabase.functions.invoke(
        "mp-create-preference",
        { body: { booking_id: bookingId } }
      );

      if (mpError) {
        if (mpError.context && typeof mpError.context.json === "function") {
          const errorBody = await mpError.context.json().catch(() => ({}));
          console.error("ERROR COMPLETO DE MP:", errorBody);
        }
        alert(
          "Mercado Pago no pudo procesar la solicitud en este momento. Intentá de nuevo más tarde."
        );
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
          {listing.bookingMode === 'monthly' ? (
            <>
              <span className="text-2xl font-bold">
                ${listing.priceMonthly?.toLocaleString()}
              </span>
              <span className="text-base font-normal text-muted-foreground">/ mes</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold">
                ${listing.priceDaily.toLocaleString()}
              </span>
              <span className="text-base font-normal text-muted-foreground">/ día</span>
            </>
          )}
        </CardTitle>
        {listing.bookingMode !== 'monthly' && (listing.priceWeekly || listing.priceMonthly) && (
          <div className="flex gap-2 flex-wrap mt-1">
            {listing.priceWeekly && (
              <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                ${listing.priceWeekly.toLocaleString()}/semana
              </Badge>
            )}
          </div>
        )}
        {listing.bookingMode === 'monthly' && listing.minMonths && (
          <p className="text-xs text-muted-foreground mt-2">Permanencia mínima: {listing.minMonths} {listing.minMonths === 1 ? 'mes' : 'meses'}</p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-y-auto max-h-[600px] px-6 pb-6 space-y-4">
          {!hostHasPayoutMethod && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-3">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-xs text-red-800 leading-tight">
                Este espacio no está disponible para reservar por el momento. El
                propietario aún no configuró sus datos de cobro. Intentá más tarde
                o explorá otros espacios.
              </p>
            </div>
          )}

          {listing.bookingMode === 'both' ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'flexible' | 'monthly')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="flexible">Por días</TabsTrigger>
                <TabsTrigger value="monthly">Por meses</TabsTrigger>
              </TabsList>

              <TabsContent value="flexible" className="space-y-4">
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
              </TabsContent>

              <TabsContent value="monthly" className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Fecha de inicio</label>
                    <div className="border border-border rounded-md p-3 bg-card">
                      <Calendar
                        mode="single"
                        selected={monthlyStartDate}
                        onSelect={setMonthlyStartDate}
                        disabled={[{ before: new Date() }, ...disabledRanges]}
                        locale={es}
                        numberOfMonths={1}
                        className="rounded-md"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyMonths">Cantidad de meses *</Label>
                    <Select value={monthlyMonths?.toString() || ""} onValueChange={(v) => setMonthlyMonths(v ? parseInt(v) : undefined)}>
                      <SelectTrigger id="monthlyMonths">
                        <SelectValue placeholder="Seleccionar meses" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 25 - (listing.minMonths || 1) + 1 }, (_, i) => listing.minMonths! + i).map((months) => (
                          <SelectItem key={months} value={months.toString()}>
                            {months} {months === 1 ? 'mes' : 'meses'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {monthlyStartDate && monthlyMonths && (
                    <div className="text-sm text-muted-foreground bg-primary/5 p-2 rounded-md">
                      Hasta: {format(addMonths(monthlyStartDate, monthlyMonths), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : listing.bookingMode === 'monthly' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Fecha de inicio</label>
                <div className="border border-border rounded-md p-3 bg-card">
                  <Calendar
                    mode="single"
                    selected={monthlyStartDate}
                    onSelect={setMonthlyStartDate}
                    disabled={[{ before: new Date() }, ...disabledRanges]}
                    locale={es}
                    numberOfMonths={1}
                    className="rounded-md"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyMonths">Cantidad de meses *</Label>
                <Select value={monthlyMonths?.toString() || ""} onValueChange={(v) => setMonthlyMonths(v ? parseInt(v) : undefined)}>
                  <SelectTrigger id="monthlyMonths">
                    <SelectValue placeholder="Seleccionar meses" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 25 - (listing.minMonths || 1) + 1 }, (_, i) => listing.minMonths! + i).map((months) => (
                      <SelectItem key={months} value={months.toString()}>
                        {months} {months === 1 ? 'mes' : 'meses'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {monthlyStartDate && monthlyMonths && (
                <div className="text-sm text-muted-foreground bg-primary/5 p-2 rounded-md">
                  Hasta: {format(addMonths(monthlyStartDate, monthlyMonths), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
              )}
            </div>
          ) : (
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
          )}

          {priceInfo && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Reserva por {priceInfo.breakdown}
                </span>
                <span className="font-medium">
                  ${priceInfo.basePrice.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    Comisión Doorly
                    {!DOORLY_COMMISSION_ENABLED && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[9px] h-4 px-1.5 uppercase font-bold">
                        Promo Lanzamiento
                      </Badge>
                    )}
                  </span>
                  {!DOORLY_COMMISSION_ENABLED && (
                    <span className="text-[10px] text-muted-foreground">
                      Bonificación del 100% aplicada
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {DOORLY_COMMISSION_ENABLED ? (
                    <span className="font-medium">
                      ${priceInfo.renterCommission.toLocaleString()}
                    </span>
                  ) : (
                    <>
                      <span className="line-through text-muted-foreground text-xs mr-2">
                        ${Math.round(priceInfo.basePrice * 0.12).toLocaleString()}
                      </span>
                      <span className="text-green-600 font-bold">$0</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-dashed pt-4 mt-2">
                <span className="text-base font-bold text-foreground">
                  Total a pagar
                </span>
                <span className="text-2xl font-black text-primary">
                  ${priceInfo.renterTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {priceInfo && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <Camera className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 leading-snug">
                  📸 Recomendamos fotografiar lo que vas a guardar
                </p>
                <p className="text-[11px] text-amber-700 leading-snug mt-0.5">
                  Tomá fotos de tus cosas antes de entregarlas. Es el mejor respaldo
                  para vos y el propietario ante cualquier consulta.
                </p>
              </div>
            </div>
          )}

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
              <Link
                href="/terminos"
                target="_blank"
                className="text-primary underline underline-offset-2"
              >
                Términos y Condiciones
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacidad"
                target="_blank"
                className="text-primary underline underline-offset-2"
              >
                Política de Privacidad
              </Link>{" "}
              de Doorly
            </Label>
          </div>

          <Button
            onClick={handleReserve}
            disabled={
              !priceInfo ||
              isReserving ||
              !acceptedTerms ||
              !hostHasPayoutMethod
            }
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
            Al hacer clic en "Reservar ahora", serás redirigido a Mercado Pago
            para completar la operación de forma segura.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}