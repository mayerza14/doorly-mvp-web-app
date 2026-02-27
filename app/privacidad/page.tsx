import { LegalPageLayout } from "@/components/legal-page-layout";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad — Doorly",
};

const sections = [
  {
    id: "responsable",
    title: "Responsable del tratamiento",
    content: (
      <p>El responsable del tratamiento de datos personales es Marcos José Ayerza (CUIT 20-42.305.936-3), operador de la plataforma Doorly. Contacto: soporte.doorly@gmail.com.</p>
    ),
  },
  {
    id: "datos-recopilados",
    title: "Datos que recopilamos",
    content: (
      <>
        <p>Recopilamos la siguiente información al usar Doorly:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>Perfil de Google OAuth (nombre, email, foto de perfil)</li>
          <li>Información de publicaciones (descripción, fotos, precio, ubicación)</li>
          <li>Datos de reservas y transacciones</li>
          <li>IDs de pago de Mercado Pago</li>
          <li>Mensajes del chat interno</li>
          <li>Datos técnicos (IP, dispositivo, navegador)</li>
        </ul>
      </>
    ),
  },
  {
    id: "uso-datos",
    title: "Uso de los datos",
    content: (
      <>
        <p>Utilizamos tus datos para:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li>Gestionar tu cuenta y autenticación</li>
          <li>Procesar reservas y pagos</li>
          <li>Facilitar la comunicación entre partes</li>
          <li>Mejorar la plataforma y prevenir fraudes</li>
          <li>Cumplir con obligaciones legales</li>
        </ul>
      </>
    ),
  },
  {
    id: "terceros",
    title: "Compartir datos con terceros",
    content: (
      <>
        <p>Compartimos datos con los siguientes proveedores de servicios:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li><strong className="text-foreground">Mercado Pago:</strong> procesamiento de pagos</li>
          <li><strong className="text-foreground">Google:</strong> autenticación OAuth</li>
          <li><strong className="text-foreground">Supabase:</strong> almacenamiento de datos</li>
          <li><strong className="text-foreground">Vercel:</strong> infraestructura de la plataforma</li>
        </ul>
        <p className="mt-3">No vendemos ni cedemos datos personales a terceros con fines comerciales.</p>
      </>
    ),
  },
  {
    id: "transferencias",
    title: "Transferencias internacionales",
    content: (
      <p>Algunos de nuestros proveedores pueden procesar datos fuera de Argentina. En estos casos, garantizamos que existen mecanismos adecuados de protección conforme a la Ley 25.326 y sus normas complementarias.</p>
    ),
  },
  {
    id: "derechos-arco",
    title: "Derechos ARCO",
    content: (
      <>
        <p>En virtud de la Ley 25.326 de Protección de Datos Personales, tenés derecho a:</p>
        <ul className="list-disc list-inside space-y-1.5 mt-2">
          <li><strong className="text-foreground">Acceso:</strong> conocer qué datos tenemos sobre vos</li>
          <li><strong className="text-foreground">Rectificación:</strong> corregir datos incorrectos</li>
          <li><strong className="text-foreground">Cancelación:</strong> solicitar la eliminación de tus datos</li>
          <li><strong className="text-foreground">Oposición:</strong> oponerte al tratamiento de tus datos</li>
        </ul>
        <p className="mt-3">Para ejercer estos derechos, escribinos a soporte.doorly@gmail.com.</p>
      </>
    ),
  },
  {
    id: "retencion",
    title: "Retención de datos",
    content: (
      <p>Conservamos tus datos mientras tu cuenta esté activa o sea necesario para cumplir con obligaciones legales. Podés solicitar la eliminación de tu cuenta y datos en cualquier momento contactando a soporte.</p>
    ),
  },
  {
    id: "seguridad",
    title: "Seguridad",
    content: (
      <p>Implementamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o alteración. Sin embargo, ningún sistema es completamente infalible.</p>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    content: (
      <p>Utilizamos cookies para mejorar tu experiencia. Para más información sobre el uso de cookies, consultá nuestra Política de Cookies.</p>
    ),
  },
  {
    id: "aaip",
    title: "Autoridad de control",
    content: (
      <div className="bg-muted/40 border border-border rounded-xl p-4">
        <p className="font-semibold text-foreground text-sm mb-2">Agencia de Acceso a la Información Pública (AAIP)</p>
        <p>La AAIP es el órgano de control en materia de protección de datos en Argentina. Si considerás que tus derechos han sido vulnerados, podés presentar una denuncia ante la AAIP en <strong>www.argentina.gob.ar/aaip</strong>.</p>
      </div>
    ),
  },
];

export default function PrivacidadPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidad"
      subtitle="Cómo recopilamos, usamos y protegemos tu información personal en la plataforma Doorly."
      icon={<Shield className="h-6 w-6 text-primary" />}
      lastUpdated="Enero 2025"
      sections={sections}
      relatedLinks={[
        { href: "/terminos", label: "Términos y Condiciones" },
        { href: "/cookies", label: "Política de Cookies" },
      ]}
    />
  );
}