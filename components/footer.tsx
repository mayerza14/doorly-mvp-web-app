import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container px-4 py-10 mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

          {/* Marca */}
          <div className="col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-primary mb-2"><Image src="/logo.png" alt="Doorly" width={100} height={40} className="object-contain mb-2" /></div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El marketplace de espacios de guardado en Argentina.
            </p>
            <a
              href="mailto:soporte.doorly@gmail.com"
              className="text-xs text-muted-foreground hover:text-primary transition-colors mt-3 block"
            >
              soporte.doorly@gmail.com
            </a>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Plataforma</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/buscar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Buscar espacios
                </Link>
              </li>
              <li>
                <Link href="/publicar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Publicar espacio
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Mi perfil
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Iniciar sesión
                </Link>
              </li>
            </ul>
          </div>

          {/* Compañía */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Compañía</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#quienes-somos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Preguntas frecuentes
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terminos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/contenido-prohibido" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contenido Prohibido
                </Link>
              </li>
              <li>
                <Link href="/reembolsos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cancelaciones y Reembolsos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Doorly. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terminos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href="/privacidad" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}