"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

interface CertificationRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  listingId: string;
}

export function CertificationRequestModal({
  open,
  onOpenChange,
  listingTitle,
  listingId,
}: CertificationRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    address: "",
    phone: "",
    availabilityFrom: "",
    availabilityTo: "",
    availableDays: [] as string[],
    notes: "",
  });

  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.address ||
      !form.phone ||
      !form.availabilityFrom ||
      !form.availabilityTo ||
      form.availableDays.length === 0
    ) {
      alert("Por favor completá todos los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const subject = encodeURIComponent(`Solicitud de Certificado Doorly — ${listingTitle}`);
      const body = encodeURIComponent(
        `SOLICITUD DE CERTIFICACIÓN DOORLY\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Publicación: ${listingTitle}\n` +
        `ID: ${listingId}\n\n` +
        `DATOS DE CONTACTO\n` +
        `Dirección del espacio: ${form.address}\n` +
        `Teléfono de contacto: ${form.phone}\n\n` +
        `DISPONIBILIDAD PARA LA VISITA\n` +
        `Días disponibles: ${form.availableDays.join(", ")}\n` +
        `Horario: de ${form.availabilityFrom} a ${form.availabilityTo} hs\n\n` +
        `NOTAS ADICIONALES\n` +
        `${form.notes || "Sin notas adicionales."}`
      );
      window.location.href = `mailto:soporte.doorly@gmail.com?subject=${subject}&body=${body}`;
      setSubmitted(true);
    } catch {
      alert("Hubo un error. Intentá de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setForm({
      address: "", phone: "", availabilityFrom: "",
      availabilityTo: "", availableDays: [], notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground">¡Solicitud enviada!</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Recibimos tu solicitud para certificar <strong>{listingTitle}</strong>.
              Te vamos a responder dentro de las próximas 48 horas para confirmar fecha y hora de visita.
            </p>
            <Button onClick={handleClose} className="w-full">Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle>Solicitar Certificado Doorly</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Un Doorlier visitará tu espacio para verificarlo
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm">
                <span className="text-muted-foreground">Espacio a certificar: </span>
                <span className="font-semibold text-foreground">{listingTitle}</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">
                  Dirección exacta del espacio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Ej: Billinghurst 2386, CABA"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Teléfono de contacto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ej: 11 5555-5555"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Días disponibles para la visita <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.availableDays.includes(day)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>
                  Rango horario disponible <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Desde</p>
                    <Input
                      type="time"
                      value={form.availabilityFrom}
                      onChange={(e) => setForm((p) => ({ ...p, availabilityFrom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Hasta</p>
                    <Input
                      type="time"
                      value={form.availabilityTo}
                      onChange={(e) => setForm((p) => ({ ...p, availabilityTo: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ej: Tocar el timbre del 3B, hay que coordinar acceso con el encargado, etc."
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                <strong>¿Qué pasa después?</strong> Te contactamos dentro de las 48 horas para confirmar
                fecha y hora de visita dentro de tu disponibilidad. La visita es gratuita.
              </div>

              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                    : "Solicitar visita"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}