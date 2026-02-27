import { LegalPageLayout } from "@/components/legal-page-layout";
import { RefreshCw } from "lucide-react";

export const metadata = {
  title: "Cancelaciones y Reembolsos — Doorly",
};

const sections = [
  {
    id: "confirmacion",
    title: "Confirmación de reservas",
    content: (
      <p>Una reserva se considera confirmada una vez que el pago fue aprobado por Mercado Pago. Hasta ese momento, no existe compromiso entre las partes y no aplica ninguna política de cancelación.</p>
    ),
  },
  {
    id: "cancelacion-guardador",
    title: "Cancelación por parte del guardador",
    content: (
      <>
        <p>Si el guardador cancela una reserva confirmada, las condiciones de reembolso son:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li><strong className="text-foreground">Más de 48 hs antes del inicio:</strong> reembolso completo</li>
          <li><strong className="text-foreground">Entre 24 y 48 hs antes:</strong> reembolso del 50%</li>
          <li><strong className="text-foreground">Menos de 24 hs antes:</strong> sin reembolso</li>
        </ul>
        <p className="mt-3">Los tiempos de acreditación dependen de Mercado Pago.</p>
      </>
    ),
  },
  {
    id: "cancelacion-anfitrion",
    title: "Cancelación por parte del anfitrión",
    content: (
      <p>Si el anfitrión cancela una reserva confirmada, el guardador recibirá el reembolso completo del monto pagado. Doorly se reserva el derecho de aplicar penalidades al anfitrión y puede suspender su cuenta ante cancelaciones reiteradas.</p>
    ),
  },
  {
    id: "casos-excepcionales",
    title: "Casos excepcionales",
    content: (
      <p>En situaciones de fuerza mayor debidamente documentadas (desastres naturales, emergencias sanitarias, etc.), Doorly puede evaluar excepciones a la política estándar. Cada caso se analiza individualmente contactando a soporte.doorly@gmail.com.</p>
    ),
  },
  {
    id: "arrepentimiento",
    title: "Botón de Arrepentimiento",
    content: (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="font-semibold text-foreground text-sm mb-2">Derecho de arrepentimiento (Ley 24.240)</p>
        <p>Tenés derecho a arrepentirte de una compra dentro de los 10 días hábiles desde la confirmación, siempre que el servicio no haya comenzado. Para ejercer este derecho, escribinos a <strong>soporte.doorly@gmail.com</strong> indicando el número de reserva.</p>
      </div>
    ),
  },
  {
    id: "comision-doorly",
    title: "Comisión de Doorly",
    content: (
      <p>La comisión cobrada por Doorly por el uso de la plataforma no es reembolsable, excepto en los casos de cancelación por parte del anfitrión o ejercicio del derecho de arrepentimiento dentro del plazo legal.</p>
    ),
  },
  {
    id: "disputas",
    title: "Proceso de disputas",
    content: (
      <>
        <p>Si existe un desacuerdo entre las partes respecto a una cancelación o reembolso:</p>
        <ol className="list-decimal list-inside space-y-1.5 mt-2">
          <li>Contactar a soporte.doorly@gmail.com dentro de las 48 hs del incidente</li>
          <li>Doorly revisará la evidencia disponible (reserva, chat, pagos)</li>
          <li>Se emitirá una resolución dentro de los 5 días hábiles</li>
          <li>En caso de disconformidad, las partes pueden recurrir a la justicia ordinaria</li>
        </ol>
      </>
    ),
  },
];

export default function ReembolsosPage() {
  return (
    <LegalPageLayout
      title="Cancelaciones y Reembolsos"
      subtitle="Condiciones aplicables ante cancelaciones de reservas y cómo se procesan los reembolsos."
      icon={<RefreshCw className="h-6 w-6 text-primary" />}
      lastUpdated="Enero 2025"
      sections={sections}
      relatedLinks={[
        { href: "/terminos", label: "Términos y Condiciones" },
        { href: "/privacidad", label: "Política de Privacidad" },
      ]}
    />
  );
}