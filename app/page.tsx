import Link from "next/link"
import { AppShell } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, CheckCircle, Shield, Star, FileText,
  MapPin, DollarSign, MessageSquare, Eye, Sparkles
} from "lucide-react";
import { HeroCTAs } from "@/components/hero-ctas";
import { ContactForm } from "@/components/contact-form";
 
export default function HomePage() {
  return (
    <AppShell>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 md:py-32">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
              Encontrá tu espacio de almacenamiento perfecto
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed text-pretty">
              Encontrá el lugar perfecto para guardar tus cosas o estacionar tu
              vehículo, por días o por meses. Seguro, confiable y cerca de donde lo necesitás.
            </p>
            <HeroCTAs />
          </div>
        </div>
      </section>
 
      {/* Cómo Funciona Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
              ¿Cómo funciona?
            </h2>
          </div>
 
          {/* Mobile: Tabs — solo ícono + título, sin descripción */}
          <div className="mt-12 md:hidden">
            <Tabs defaultValue="inquilinos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inquilinos">Para inquilinos</TabsTrigger>
                <TabsTrigger value="propietarios">Para propietarios</TabsTrigger>
              </TabsList>
 
              <TabsContent value="inquilinos" className="mt-8">
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Encontrá el espacio perfecto cerca tuyo
                </p>
                <div className="space-y-4">
                  <Card className="border-2">
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Search className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">1. Buscá</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Eye className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">2. Elegí</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      {/* FIXED: era "Reserva por WhatsApp" — igualado a desktop */}
                      <h3 className="text-base font-semibold text-foreground">3. Reservá</h3>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
 
              <TabsContent value="propietarios" className="mt-8">
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Convertí tu espacio libre en ingresos
                </p>
                <div className="space-y-4">
                  <Card className="border-2">
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">1. Publicá</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">2. Verificamos</h3>
                    </CardContent>
                  </Card>
                  <Card className="border-2">
                    <CardContent className="pt-5 pb-5 flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">3. Cobrá</h3>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
 
          {/* Desktop: Side by side — con descripciones completas */}
          <div className="mt-16 hidden md:grid md:grid-cols-2 md:gap-12">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Para guardadores</h3>
              <p className="text-sm text-muted-foreground mb-6">Encontrá el espacio perfecto cerca tuyo</p>
              <div className="space-y-6">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                      <Search className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">1. Buscá</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Buscá por ubicación, tipo de espacio, tamaño y características que necesitás.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                      <Eye className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">2. Elegí</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Revisá las opciones disponibles y encontrá el espacio perfecto para vos.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">3. Reservá</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Pagá y coordiná con el propietario.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">Para propietarios</h3>
              <p className="text-sm text-muted-foreground mb-6">Convertí tu espacio libre en ingresos</p>
              <div className="space-y-6">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">1. Contanos de tu espacio</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Completá el formulario con fotos y detalles de tu espacio.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">2. Verificamos</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Revisamos tu publicación y la aprobamos manualmente.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">3. Cobrá</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Recibí inquilinos y coordiná el pago directamente.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* ¿Por qué elegir Doorly? — carrusel mobile, grid desktop */}
      <section className="py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
              ¿Por qué elegir Doorly?
            </h2>
          </div>
 
          {/* Mobile: carrusel con scroll snap */}
          <div className="mt-10 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:hidden -mx-4 px-4 scrollbar-hide">
            {[
              { icon: <Sparkles className="h-6 w-6 text-primary" />, title: "Publicación simple", desc: "En minutos podés publicar y gestionar tu espacio." },
              { icon: <Search className="h-6 w-6 text-primary" />, title: "Búsqueda inteligente", desc: "Encontrá por zona, tamaño, precio y tipo de espacio." },
              { icon: <Star className="h-6 w-6 text-primary" />, title: "Más ocupación", desc: "Tu espacio visible para quien lo necesita cerca." },
              { icon: <CheckCircle className="h-6 w-6 text-primary" />, title: "Todo en un lugar", desc: "Reservas, mensajes y gestión desde tu panel." },
            ].map((item, i, arr) => (
              <div key={i} className={`snap-start shrink-0 w-[75vw] ${i === arr.length - 1 ? "mr-4" : ""}`}>
                <Card className="border-2 h-full">
                  <CardContent className="pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
 
          {/* Desktop: grid */}
          <div className="hidden md:grid mt-12 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Publicación simple</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">En minutos podés publicar y gestionar tu espacio.</p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Búsqueda inteligente</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Encontrá por zona, tamaño, precio y tipo de espacio.</p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Más ocupación</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Tu espacio visible para quien lo necesita cerca.</p>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Todo en un lugar</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Reservas, mensajes y gestión desde tu panel.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
 
      {/* Tu seguridad — carrusel mobile, grid desktop */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
              Tu seguridad es nuestra prioridad
            </h2>
          </div>
 
          {/* Mobile: carrusel */}
          <div className="mt-10 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 md:hidden -mx-4 px-4 scrollbar-hide">
            {[
              { icon: <MapPin className="h-6 w-6 text-primary" />, title: "Ubicación protegida", desc: "Mostramos ubicación aproximada. Dirección completa post-reserva." },
              { icon: <MessageSquare className="h-6 w-6 text-primary" />, title: "Chat post-reserva", desc: "La coordinación se habilita solo con reserva confirmada." },
              { icon: <Eye className="h-6 w-6 text-primary" />, title: "Moderación", desc: "Publicaciones con revisión y opción de reportar." },
              { icon: <Shield className="h-6 w-6 text-primary" />, title: "Pagos y trazabilidad", desc: "Pagos con Mercado Pago y registro de actividad." },
            ].map((item, i, arr) => (
              <div key={i} className={`snap-start shrink-0 w-[75vw] ${i === arr.length - 1 ? "mr-4" : ""}`}>
                <Card className="border-2 bg-background h-full">
                  <CardContent className="pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
 
          {/* Desktop: grid */}
          <div className="hidden md:grid mt-12 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 bg-background">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Ubicación protegida</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Mostramos ubicación aproximada. Dirección completa post-reserva.</p>
              </CardContent>
            </Card>
            <Card className="border-2 bg-background">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Chat post-reserva</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">La coordinación se habilita solo con reserva confirmada.</p>
              </CardContent>
            </Card>
            <Card className="border-2 bg-background">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Moderación</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Publicaciones con revisión y opción de reportar.</p>
              </CardContent>
            </Card>
            <Card className="border-2 bg-background">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Pagos y trazabilidad</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Pagos con Mercado Pago y registro de actividad.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
 
      {/* Quiénes somos — acordeón en mobile, texto visible en desktop */}
      <section id="quienes-somos" className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl">
 
            {/* Mobile: acordeón colapsable */}
            <div className="md:hidden">
              <Accordion type="single" collapsible>
                <AccordionItem value="quienes" className="border rounded-xl px-4">
                  <AccordionTrigger className="text-xl font-bold text-foreground">
                    Quiénes somos
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-pretty leading-relaxed pb-2">
                      Doorly nació para conectar personas que tienen espacios disponibles con quienes los necesitan.
                      Creemos que cada metro cuadrado cuenta y que la confianza es la base de cualquier intercambio.
                      Nuestra plataforma facilita el proceso de publicar, buscar, reservar y coordinar espacios de forma
                      segura y transparente.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
 
            {/* Desktop: siempre visible */}
            <div className="hidden md:block text-center">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
                Quiénes somos
              </h2>
              <p className="mt-4 text-muted-foreground text-pretty leading-relaxed">
                Doorly nació para conectar personas que tienen espacios disponibles con quienes los necesitan.
                Creemos que cada metro cuadrado cuenta y que la confianza es la base de cualquier intercambio.
                Nuestra plataforma facilita el proceso de publicar, buscar, reservar y coordinar espacios de forma
                segura y transparente.
              </p>
            </div>
          </div>
        </div>
      </section>
 
      {/* Contacto Section */}
      <section id="contacto" className="py-16 md:py-24">
        <div className="container px-4">
          <div className="mx-auto max-w-xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">
                Contacto
              </h2>
              <p className="mt-4 text-muted-foreground text-pretty">
                ¿Tenés alguna consulta? Escribinos y te responderemos a la brevedad.
              </p>
              <a
                href="mailto:soporte.doorly@gmail.com"
                className="inline-block mt-2 text-primary font-medium hover:underline underline-offset-2"
              >
                soporte.doorly@gmail.com
              </a>
            </div>
            <Card>
              <CardContent className="pt-6">
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
 
      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl text-balance">
              ¿Listo para encontrar tu espacio ideal?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/90 text-pretty">
              Comenzá a buscar ahora y encontrá el lugar perfecto para tus necesidades.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/buscar"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-slate-100"
              >
                Buscar espacio
              </Link>
              <Link
                href="/publicar"
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Publicar espacio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}