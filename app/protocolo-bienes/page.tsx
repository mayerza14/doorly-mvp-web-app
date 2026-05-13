import { LegalPageLayout } from "@/components/legal-page-layout";
import { ClipboardList } from "lucide-react";

export const metadata = {
  title: "Protocolo de Bienes — Doorly",
  alternates: {
    canonical: "https://www.doorly.com.ar/protocolo-bienes",
  },
};

const sections = [
  {
    id: "objetivo",
    title: "Objetivo del protocolo",
    content: (
      <p>Este protocolo establece el procedimiento a seguir cuando el guardador no retira sus pertenencias al finalizar la reserva, protegiendo los derechos tanto del anfitrión como del guardador.</p>
    ),
  },
  {
    id: "pasos",
    title: "Procedimiento paso a paso",
    content: (
      <div className="space-y-3 mt-1">
        {[
          {
            step: 1,
            title: "Fin de la reserva",
            desc: "Al vencer el período de reserva, el guardador debe retirar sus pertenencias en el horario acordado.",
          },
          {
            step: 2,
            title: "Cargos por permanencia",
            desc: "Si los bienes permanecen sin autorización, el anfitrión puede aplicar cargos diarios adicionales según las condiciones publicadas.",
          },
          {
            step: 3,
            title: "Notificación formal",
            desc: "El anfitrión debe notificar al guardador por el chat de Doorly. Se otorga un período de gracia de 72 horas para el retiro.",
          },
          {
            step: 4,
            title: "Transferencia a depósito de terceros",
            desc: "Si transcurrido el plazo los bienes no fueron retirados, el anfitrión puede transferirlos a un depósito externo, documentando el proceso con inventario y fotografías.",
          },
          {
            step: 5,
            title: "Disposición final",
            desc: "La disposición definitiva de los bienes solo puede realizarse mediante proceso legal. Doorly no autoriza la eliminación unilateral de pertenencias ajenas.",
          },
        ].map((item) => (
          <div key={item.step} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
              {item.step}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{item.title}</p>
              <p className="text-sm mt-1">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "responsabilidades",
    title: "Responsabilidades de cada parte",
    content: (
      <div className="grid sm:grid-cols-2 gap-3 mt-1">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-bold text-foreground text-sm mb-3">👤 Guardador</p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Retirar sus bienes al finalizar la reserva</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Responder las notificaciones del anfitrión</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Abonar los cargos por permanencia adicional</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Cubrir los costos de traslado a depósito externo</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-bold text-foreground text-sm mb-3">🏠 Anfitrión</p>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Notificar formalmente al guardador</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Respetar el período de gracia de 72 horas</li>
            <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Documentar el estado de los bienes con fotos</li>
            <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✗</span> No puede eliminar bienes sin proceso legal</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "contacto-soporte",
    title: "Contacto con soporte",
    content: (
      <p>Ante cualquier situación contemplada en este protocolo, ambas partes pueden contactar a Doorly en soporte.doorly@gmail.com para recibir orientación y asistencia en la resolución del conflicto.</p>
    ),
  },
];

export default function ProtocoloBienesPage() {
  return (
    <LegalPageLayout
      title="Protocolo de Bienes"
      subtitle="Procedimiento a seguir cuando los bienes almacenados no son retirados al finalizar la reserva."
      icon={<ClipboardList className="h-6 w-6 text-primary" />}
      lastUpdated="Enero 2025"
      sections={sections}
      relatedLinks={[
        { href: "/terminos", label: "Términos y Condiciones" },
        { href: "/reembolsos", label: "Cancelaciones y Reembolsos" },
        { href: "/contenido-prohibido", label: "Contenido Prohibido" },
      ]}
    />
  );
}