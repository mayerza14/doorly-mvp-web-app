import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { MessageCircle, Search, Package, Home, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Preguntas Frecuentes — Doorly",
  description: "Todo lo que necesitás saber sobre cómo usar Doorly para guardar o publicar un espacio.",
};

const sections = [
  {
    id: "general",
    title: "Preguntas generales",
    icon: HelpCircle,
    questions: [
      {
        q: "¿Qué es Doorly?",
        a: "Doorly es una plataforma que conecta personas y empresas que tienen espacios privados disponibles (cocheras, galpones, depósitos, terrenos, bauleras, etc.) con quienes necesitan guardar pertenencias, vehículos o mercadería. Doorly actúa como intermediario entre las partes.",
      },
      {
        q: "¿Cómo funciona el pago?",
        a: "El pago se realiza de forma segura a través de Mercado Pago dentro de la plataforma. Doorly no acepta pagos por fuera del sistema para reservas gestionadas en la plataforma. El chat para coordinar entre las partes se habilita una vez que el pago está aprobado.",
      },
      {
        q: "¿Necesito crear una cuenta para usar Doorly?",
        a: "Sí. Para usar Doorly necesitás crear una cuenta e iniciar sesión. Actualmente, el acceso se realiza exclusivamente con Google.",
      },
      {
        q: "¿Cuándo recibo la dirección exacta?",
        a: "Por privacidad y seguridad, la dirección exacta del espacio se comparte cuando la reserva está confirmada y el pago fue aprobado.",
      },
      {
        q: "¿Puedo cancelar una reserva?",
        a: "Sí, podés cancelar una reserva, pero las condiciones dependen de la política aplicable al espacio y del momento en que se haga la cancelación. Si corresponde reembolso, se procesa según las condiciones informadas y los tiempos de Mercado Pago.",
      },
      {
        q: "¿Qué pasa si tengo un problema con el espacio o con la reserva?",
        a: "Podés contactar a soporte desde los canales oficiales de Doorly. Revisaremos el caso y te ayudaremos a resolverlo lo antes posible. Te recomendamos conservar toda la comunicación dentro del chat de Doorly para facilitar la gestión.",
      },
      {
        q: "¿Puedo dejar una reseña?",
        a: "Sí. Una vez finalizado el servicio/reserva, las partes pueden dejar reseñas sobre su experiencia dentro del plazo habilitado por la plataforma.",
      },
    ],
  },
  {
    id: "guardador",
    title: "Para quien necesita guardar",
    icon: Package,
    questions: [
      {
        q: "¿Cómo reservo un espacio?",
        a: "1. Buscás un espacio según ubicación, tipo y necesidades.\n2. Revisás detalles, condiciones y disponibilidad.\n3. Iniciás la reserva.\n4. Se procesa la confirmación según el flujo de la plataforma.\n5. Realizás el pago por Mercado Pago.\n6. Una vez aprobado el pago, se habilita el chat para coordinar con el anfitrión.",
        numbered: true,
      },
      {
        q: "¿Puedo coordinar antes de pagar?",
        a: "La coordinación detallada entre las partes (por chat) se habilita después de la aprobación del pago. Antes de eso, podés revisar la información publicada del espacio (tipo, características, condiciones, etc.).",
      },
      {
        q: "¿Qué tipo de cosas puedo guardar?",
        a: "Depende del espacio publicado y de las condiciones definidas por el anfitrión. Algunos espacios son aptos para muebles/cajas, mercadería de e-commerce, vehículos, trailers/motorhomes y herramientas/equipamiento. Siempre revisá qué está permitido en cada publicación antes de reservar.",
      },
      {
        q: "¿Qué cosas no puedo guardar?",
        a: "No se permite almacenar elementos prohibidos por ley, peligrosos o no autorizados por el anfitrión. Cada publicación puede tener restricciones específicas (por ejemplo, tamaño, peso, tipo de uso, acceso, horarios, etc.).",
      },
      {
        q: "¿Cómo sé si un espacio me sirve?",
        a: "En cada publicación podés ver información como: tipo de espacio, ubicación aproximada/zona, medidas o capacidad, condiciones de acceso, reglas del espacio, precio y reseñas.",
      },
      {
        q: "¿Qué pasa si el espacio no coincide con la publicación?",
        a: "Reportalo a soporte cuanto antes desde los canales de Doorly. Vamos a revisar el caso y la evidencia disponible (incluyendo la comunicación y detalles de la reserva).",
      },
      {
        q: "¿Puedo extender mi reserva?",
        a: "Si necesitás extender el tiempo, deberías gestionarlo según disponibilidad del espacio y condiciones del anfitrión dentro de la plataforma.",
      },
      {
        q: "¿Cómo se calculan los precios?",
        a: "El precio lo define el anfitrión de cada espacio según tipo, ubicación, capacidad y condiciones. Doorly muestra el valor total de la reserva antes de confirmar.",
      },
      {
        q: "¿Tengo comprobante del pago?",
        a: "Sí, el pago se gestiona a través de Mercado Pago, que informa el estado de la transacción y su comprobante según corresponda.",
      },
    ],
  },
  {
    id: "anfitrion",
    title: "Para propietarios y anfitriones",
    icon: Home,
    questions: [
      {
        q: "¿Puedo publicar mi propio espacio?",
        a: "Sí. Si tenés un espacio privado disponible (cochera, galpón, baulera, depósito, terreno, etc.), podés crear una publicación en Doorly.",
      },
      {
        q: "¿Qué tipo de espacios puedo publicar?",
        a: "Podés publicar espacios privados aptos para guardado: cocheras privadas, bauleras, depósitos/galpones y terrenos/playones privados. Doorly no publica espacios en vía pública.",
      },
      {
        q: "¿La publicación se publica automáticamente?",
        a: "No siempre. Las publicaciones pasan por una revisión/aprobación de Doorly antes de quedar activas, para mejorar la calidad y seguridad de la plataforma.",
      },
      {
        q: "¿Cuánto tarda la aprobación de una publicación?",
        a: "Doorly revisa las publicaciones y, en condiciones normales, intenta aprobarlas en un plazo corto, sujeto a validaciones y volumen de solicitudes.",
      },
      {
        q: "¿Puedo pausar o reactivar mi publicación?",
        a: "Sí. Podés pausar tu publicación temporalmente y reactivarla cuando vuelvas a tener disponibilidad.",
      },
      {
        q: "¿Puedo editar mi publicación?",
        a: "Sí, normalmente podés actualizar datos como descripción, disponibilidad, reglas, fotos o precio. Algunos cambios pueden requerir revisión adicional antes de verse reflejados.",
      },
      {
        q: "¿Cuándo cobro por una reserva?",
        a: "El cobro se gestiona a través del flujo de pagos de Mercado Pago y la operatoria definida por Doorly. Los tiempos pueden depender de la acreditación y condiciones de la pasarela de pago.",
      },
      {
        q: "¿Puedo hablar con el guardador antes de que pague?",
        a: "La coordinación por chat se habilita una vez aprobado el pago, para ordenar el proceso y proteger a ambas partes dentro de la plataforma.",
      },
      {
        q: "¿Qué pasa si necesito rechazar o cancelar una reserva?",
        a: "Podrás gestionar la situación según el estado de la reserva y las políticas aplicables. Si ya hay pago involucrado, las condiciones de cancelación y reembolso se procesan según las reglas de la plataforma y Mercado Pago.",
      },
      {
        q: "¿Qué hago si el guardador incumple una regla del espacio?",
        a: "Documentá la situación y contactá a soporte desde los canales oficiales de Doorly. La comunicación dentro del chat de Doorly ayuda a revisar el caso.",
      },
      {
        q: "¿Puedo poner reglas para mi espacio?",
        a: "Sí. Podés establecer condiciones claras (horarios, acceso, usos permitidos, restricciones, etc.) para que el guardador sepa qué esperar antes de reservar.",
      },
      {
        q: "¿Puedo recibir reseñas?",
        a: "Sí. Una vez finalizada la reserva, ambas partes pueden dejar reseñas. Esto ayuda a generar confianza en la comunidad.",
      },
    ],
  },
  {
    id: "extra",
    title: "Otras preguntas",
    icon: Search,
    questions: [
      {
        q: "¿Doorly es dueño de los espacios?",
        a: "No. Doorly es una plataforma intermediaria que conecta a anfitriones y guardadores.",
      },
      {
        q: "¿Doorly verifica a los usuarios?",
        a: "Doorly puede aplicar mecanismos de validación y control dentro del flujo de la plataforma. El acceso actualmente se realiza con cuenta de Google.",
      },
      {
        q: "¿Dónde veo el estado de mi reserva o publicación?",
        a: "Desde tu perfil podés consultar el estado de tus reservas/publicaciones y las acciones disponibles.",
      },
      {
        q: "¿Puedo usar Doorly para guardar mercadería de mi emprendimiento o e-commerce?",
        a: "Sí, siempre que el espacio publicado sea apto para ese uso y se respeten las condiciones del anfitrión y de la plataforma.",
      },
      {
        q: "¿Qué pasa si Mercado Pago rechaza mi pago?",
        a: "Si Mercado Pago rechaza o no aprueba el pago, la reserva no avanza a la etapa de coordinación por chat hasta que el pago esté correctamente aprobado.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <AppShell>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b border-border">
        <div className="absolute inset-0 bg-grid-primary/[0.02] pointer-events-none" />
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-primary/20">
            <HelpCircle className="h-3.5 w-3.5" />
            Centro de ayuda
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            ¿En qué podemos ayudarte?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Todo lo que necesitás saber para guardar o publicar un espacio en Doorly.
          </p>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12">

        {/* Índice de secciones */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-border
                           bg-card hover:border-primary/40 hover:bg-primary/5
                           transition-all duration-200 text-center"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center
                                group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">{s.title}</span>
              </a>
            );
          })}
        </div>

        {/* Secciones */}
        <div className="space-y-14">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} id={section.id}>
                {/* Header de sección */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                </div>

                {/* Preguntas */}
                <div className="space-y-3">
                  {section.questions.map((item, i) => (
                    <Card
                      key={i}
                      className="border-border shadow-none hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                    >
                      <CardContent className="px-6 py-5">
                        <p className="font-semibold text-foreground mb-2 text-[15px]">{item.q}</p>
                        {item.numbered ? (
                          <ol className="list-none space-y-1.5">
                            {item.a.split("\n").map((line, j) => (
                              <li key={j} className="flex items-start gap-3 text-sm text-muted-foreground">
                                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {j + 1}
                                </span>
                                {line.replace(/^\d+\.\s/, "")}
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA final */}
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/20 p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">¿No encontraste lo que buscabas?</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Nuestro equipo está disponible para ayudarte con cualquier consulta.
          </p>
          <a
            href="mailto:soporte.doorly@gmail.com"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground
                       px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
            Contactar soporte
          </a>
          <p className="text-xs text-muted-foreground mt-3">soporte.doorly@gmail.com</p>
        </div>
      </div>
    </AppShell>
  );
}