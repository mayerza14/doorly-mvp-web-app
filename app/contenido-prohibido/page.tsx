import { LegalPageLayout } from "@/components/legal-page-layout";
import { Ban } from "lucide-react";

export const metadata = {
  title: "Contenido Prohibido — Doorly",
  alternates: {
    canonical: "https://www.doorly.com.ar/contenido-prohibido",
  },
};

const sections = [
  {
    id: "introduccion",
    title: "Introducción",
    content: (
      <p>Para garantizar la seguridad de todos los usuarios y el cumplimiento de la ley, Doorly establece una lista de elementos y actividades que no están permitidos en ningún espacio publicado en la plataforma.</p>
    ),
  },
  {
    id: "elementos-prohibidos",
    title: "Elementos prohibidos para almacenar",
    content: (
      <div className="space-y-2 mt-1">
        {[
          { icon: "🚫", label: "Materiales ilegales", desc: "Cualquier elemento cuya tenencia o comercialización sea ilegal bajo la legislación argentina." },
          { icon: "💊", label: "Drogas y estupefacientes", desc: "Sustancias prohibidas por la Ley 23.737 de estupefacientes." },
          { icon: "🔫", label: "Armas", desc: "Armas de fuego, armas blancas, municiones o accesorios sin la debida habilitación legal." },
          { icon: "📦", label: "Mercadería de contrabando", desc: "Bienes ingresados al país en violación de la Ley 22.415 (Código Aduanero)." },
          { icon: "🐾", label: "Animales vivos", desc: "Está prohibido el almacenamiento de animales de cualquier tipo." },
          { icon: "☣️", label: "Sustancias tóxicas o peligrosas", desc: "Químicos, explosivos, materiales radiactivos o cualquier sustancia de riesgo." },
          { icon: "🥩", label: "Alimentos perecederos", desc: "Productos alimenticios que requieran cadena de frío u otras condiciones especiales no garantizadas." },
          { icon: "🏴‍☠️", label: "Bienes de origen ilícito", desc: "Mercadería robada, falsificada o de procedencia dudosa." },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
            <span className="text-lg shrink-0">{item.icon}</span>
            <div>
              <p className="font-semibold text-foreground text-sm">{item.label}</p>
              <p className="text-sm mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "restricciones-publicaciones",
    title: "Restricciones en publicaciones",
    content: (
      <>
        <p>Además del contenido físico, también está prohibido en las publicaciones:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>Contenido discriminatorio, ofensivo o que incite al odio</li>
          <li>Información falsa o engañosa sobre el espacio</li>
          <li>Datos de contacto para evadir el sistema de pagos de Doorly</li>
          <li>Precios o condiciones distintos a los publicados en la plataforma</li>
        </ul>
      </>
    ),
  },
  {
    id: "sanciones",
    title: "Sanciones aplicables",
    content: (
      <>
        <p>El incumplimiento de estas políticas puede resultar en:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>Suspensión temporal o cierre permanente de la cuenta</li>
          <li>Retención de fondos pendientes</li>
          <li>Cancelación de reservas activas sin reembolso</li>
          <li>Reporte a las autoridades competentes en caso de actividades ilegales</li>
        </ul>
      </>
    ),
  },
  {
    id: "reportar",
    title: "Cómo reportar",
    content: (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p>Si detectás una publicación o actividad que viole estas políticas, reportala a <strong className="text-foreground">soporte.doorly@gmail.com</strong> con el mayor detalle posible. Analizaremos el caso y tomaremos las medidas correspondientes.</p>
      </div>
    ),
  },
];

export default function ContenidoProhibidoPage() {
  return (
    <LegalPageLayout
      title="Contenido Prohibido"
      subtitle="Elementos y actividades que no están permitidos en ningún espacio publicado en Doorly."
      icon={<Ban className="h-6 w-6 text-primary" />}
      lastUpdated="Enero 2025"
      sections={sections}
      relatedLinks={[
        { href: "/terminos", label: "Términos y Condiciones" },
        { href: "/protocolo-bienes", label: "Protocolo de Bienes" },
      ]}
    />
  );
}