import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ChevronRight, Mail } from "lucide-react";

interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  lastUpdated: string;
  sections: LegalSection[];
  relatedLinks?: { href: string; label: string }[];
}

export function LegalPageLayout({
  title,
  subtitle,
  icon,
  lastUpdated,
  sections,
  relatedLinks,
}: LegalPageLayoutProps) {
  return (
    <AppShell>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-14 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{title}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
              {icon}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
                {title}
              </h1>
              <p className="text-muted-foreground text-base max-w-xl">{subtitle}</p>
              <p className="text-xs text-muted-foreground mt-3 border border-border bg-muted/40 inline-block px-3 py-1 rounded-full">
                Última actualización: {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Índice lateral — desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-2">
                Contenido
              </p>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-muted-foreground hover:text-primary hover:bg-primary/5
                             px-3 py-2 rounded-lg transition-all duration-150 leading-snug"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 min-w-0 space-y-10">
            {sections.map((section, i) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-full h-6 w-6 flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                </div>
                <div className="pl-9 text-sm text-muted-foreground leading-relaxed space-y-3">
                  {section.content}
                </div>
                {i < sections.length - 1 && (
                  <div className="mt-10 border-b border-border/60" />
                )}
              </section>
            ))}

            {/* Links a otras páginas legales */}
            {relatedLinks && relatedLinks.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                  También puede interesarte
                </p>
                <div className="flex flex-wrap gap-2">
                  {relatedLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10
                                 px-4 py-2 rounded-full transition-colors font-medium"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Contacto */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/20 p-6 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm mb-1">¿Tenés alguna consulta?</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Si tenés dudas sobre este documento, escribinos y te respondemos a la brevedad.
                </p>
                <a
                  href="mailto:soporte.doorly@gmail.com"
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  soporte.doorly@gmail.com
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AppShell>
  );
}