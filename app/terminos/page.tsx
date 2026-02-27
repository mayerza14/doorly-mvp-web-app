import { LegalPageLayout } from "@/components/legal-page-layout";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones — Doorly",
};

const sections = [
  {
    id: "aceptacion",
    title: "Aceptación de los términos",
    content: (
      <p>Al acceder y utilizar la plataforma Doorly, el usuario acepta quedar vinculado por los presentes Términos y Condiciones. Si no estás de acuerdo con alguna de estas condiciones, no deberías utilizar la plataforma.</p>
    ),
  },
  {
    id: "descripcion",
    title: "Descripción del servicio",
    content: (
      <p>Doorly es una plataforma de intermediación que conecta a personas y empresas que disponen de espacios privados (cocheras, depósitos, galpones, bauleras, terrenos, etc.) con quienes necesitan guardar pertenencias, vehículos o mercadería. Doorly no es parte del contrato de guardado entre anfitrión y guardador, sino un intermediario tecnológico.</p>
    ),
  },
  {
    id: "registro",
    title: "Registro y acceso",
    content: (
      <>
        <p>Para utilizar Doorly es necesario crear una cuenta. El acceso se realiza exclusivamente mediante Google OAuth. Al registrarte, declarás que la información proporcionada es veraz y actualizada.</p>
        <p>Sos responsable de mantener la confidencialidad de tu cuenta y de todas las actividades realizadas desde ella.</p>
      </>
    ),
  },
  {
    id: "publicaciones",
    title: "Publicaciones de espacios",
    content: (
      <>
        <p><strong className="text-foreground">4.1 Requisitos:</strong> Los anfitriones deben publicar información veraz, completa y actualizada sobre sus espacios. Las fotos deben representar fielmente el espacio disponible.</p>
        <p><strong className="text-foreground">4.2 Aprobación:</strong> Todas las publicaciones pasan por revisión de Doorly antes de activarse. Doorly se reserva el derecho de rechazar o dar de baja publicaciones que no cumplan con las políticas de la plataforma.</p>
      </>
    ),
  },
  {
    id: "reservas",
    title: "Reservas y pagos",
    content: (
      <>
        <p>Las reservas se gestionan íntegramente dentro de la plataforma. El pago se procesa exclusivamente a través de Mercado Pago. Doorly no acepta pagos por fuera del sistema.</p>
        <p>La dirección exacta del espacio se comparte únicamente una vez confirmada la reserva y aprobado el pago. El chat entre las partes se habilita tras la aprobación del pago.</p>
      </>
    ),
  },
  {
    id: "chat",
    title: "Comunicación entre partes",
    content: (
      <p>El chat interno de Doorly se habilita una vez aprobado el pago. Se recomienda mantener toda la comunicación dentro de la plataforma para facilitar la resolución de disputas. Doorly puede revisar las conversaciones en caso de conflicto.</p>
    ),
  },
  {
    id: "resenas",
    title: "Reseñas",
    content: (
      <p>Ambas partes pueden dejar reseñas dentro de los 14 días posteriores a la finalización de la reserva. Las reseñas deben ser verídicas y basadas en la experiencia real. Doorly se reserva el derecho de moderar o eliminar reseñas que violen estas políticas.</p>
    ),
  },
  {
    id: "cancelaciones",
    title: "Cancelaciones",
    content: (
      <>
        <p><strong className="text-foreground">7.1 Por parte del guardador:</strong> Las condiciones de reembolso dependen del momento en que se realice la cancelación y la política del espacio. Consultá la sección de Cancelaciones y Reembolsos para más detalle.</p>
        <p><strong className="text-foreground">7.2 Por parte del anfitrión:</strong> En caso de cancelación por parte del anfitrión, se procesará el reembolso completo al guardador. Doorly podrá aplicar penalidades al anfitrión según corresponda.</p>
      </>
    ),
  },
  {
    id: "prohibido",
    title: "Contenido y uso prohibido",
    content: (
      <p>Queda prohibido usar la plataforma para almacenar materiales peligrosos, sustancias ilegales, armas, o cualquier elemento contemplado en nuestra política de Contenido Prohibido. Doorly puede suspender cuentas y reportar actividades ilegales a las autoridades competentes.</p>
    ),
  },
  {
    id: "derechos-consumidor",
    title: "Derechos del consumidor",
    content: (
      <p>En cumplimiento con la Ley 24.240 de Defensa del Consumidor, los usuarios tienen derecho a arrepentirse de una compra dentro de los 10 días hábiles desde la confirmación, siempre que el servicio no haya comenzado. Para ejercer este derecho, contactar a soporte.doorly@gmail.com.</p>
    ),
  },
  {
    id: "modificaciones",
    title: "Modificaciones a los términos",
    content: (
      <p>Doorly se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios serán notificados con al menos 30 días de anticipación. El uso continuado de la plataforma implica la aceptación de los nuevos términos.</p>
    ),
  },
  {
    id: "jurisdiccion",
    title: "Jurisdicción y ley aplicable",
    content: (
      <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será sometida a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando expresamente a cualquier otro fuero.</p>
    ),
  },
];

export default function TerminosPage() {
  return (
    <LegalPageLayout
      title="Términos y Condiciones"
      subtitle="Las reglas que rigen el uso de la plataforma Doorly para anfitriones y guardadores."
      icon={<FileText className="h-6 w-6 text-primary" />}
      lastUpdated="Enero 2025"
      sections={sections}
      relatedLinks={[
        { href: "/privacidad", label: "Política de Privacidad" },
        { href: "/reembolsos", label: "Cancelaciones y Reembolsos" },
        { href: "/contenido-prohibido", label: "Contenido Prohibido" },
      ]}
    />
  );
}