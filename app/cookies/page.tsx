import { LegalPageLayout } from "@/components/legal-page-layout";
import { Cookie } from "lucide-react";

export const metadata = {
  title: "Política de Cookies — Doorly",
};

const sections = [
  {
    id: "que-son",
    title: "¿Qué son las cookies?",
    content: (
      <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitás un sitio web. Permiten que el sitio recuerde tus preferencias y mejore tu experiencia de navegación.</p>
    ),
  },
  {
    id: "tipos",
    title: "Tipos de cookies que usamos",
    content: (
      <div className="grid gap-3 mt-1">
        {[
          {
            name: "Necesarias",
            color: "bg-green-50 border-green-200",
            badge: "bg-green-100 text-green-700",
            desc: "Esenciales para el funcionamiento de la plataforma. Gestionan la autenticación y sesión de usuario. No pueden desactivarse.",
          },
          {
            name: "Rendimiento",
            color: "bg-blue-50 border-blue-200",
            badge: "bg-blue-100 text-blue-700",
            desc: "Nos ayudan a entender cómo los usuarios interactúan con la plataforma para mejorar la experiencia.",
          },
          {
            name: "Preferencias",
            color: "bg-amber-50 border-amber-200",
            badge: "bg-amber-100 text-amber-700",
            desc: "Recuerdan tus configuraciones y preferencias para personalizar tu experiencia.",
          },
          {
            name: "Marketing",
            color: "bg-muted border-border",
            badge: "bg-muted text-muted-foreground",
            desc: "Actualmente no utilizamos cookies de marketing o publicidad en la plataforma.",
          },
        ].map((c) => (
          <div key={c.name} className={`rounded-xl border p-4 ${c.color}`}>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{c.name}</span>
            <p className="mt-2 text-sm">{c.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "terceros",
    title: "Cookies de terceros",
    content: (
      <>
        <p>Algunos servicios integrados en Doorly pueden instalar sus propias cookies:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li><strong className="text-foreground">Google:</strong> autenticación OAuth</li>
          <li><strong className="text-foreground">Mercado Pago:</strong> procesamiento de pagos</li>
        </ul>
        <p className="mt-3">Estas cookies están sujetas a las políticas de privacidad de cada proveedor.</p>
      </>
    ),
  },
  {
    id: "control",
    title: "Cómo controlar las cookies",
    content: (
      <>
        <p>Podés gestionar o deshabilitar las cookies desde la configuración de tu navegador:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li><strong className="text-foreground">Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
          <li><strong className="text-foreground">Safari:</strong> Preferencias → Privacidad</li>
          <li><strong className="text-foreground">Firefox:</strong> Opciones → Privacidad y seguridad</li>
          <li><strong className="text-foreground">Edge:</strong> Configuración → Cookies y permisos del sitio</li>
        </ul>
        <p className="mt-3">Tené en cuenta que deshabilitar cookies necesarias puede afectar el funcionamiento de la plataforma.</p>
      </>
    ),
  },
  {
    id: "actualizaciones",
    title: "Actualizaciones de esta política",
    content: (
      <p>Podemos actualizar esta política de cookies en cualquier momento. Te notificaremos de cambios significativos a través de la plataforma o por email.</p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      subtitle="Información sobre el uso de cookies y tecnologías similares en la plataforma Doorly."
      icon={<Cookie className="h-6 w-6 text-primary" />}
      lastUpdated="Enero 2025"
      sections={sections}
      relatedLinks={[
        { href: "/privacidad", label: "Política de Privacidad" },
        { href: "/terminos", label: "Términos y Condiciones" },
      ]}
    />
  );
}