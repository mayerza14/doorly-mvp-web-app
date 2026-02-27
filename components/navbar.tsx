"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User as UserIcon, Plus, ShieldAlert } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, profile, logout } = useAuth();
  const pathname = usePathname();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header suppressHydrationWarning className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-primary"><Image src="/logo.png" alt="Doorly" width={90} height={36} className="object-contain" /></div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-6">
          <Link href="/buscar" className="text-sm font-medium text-foreground transition-colors hover:text-primary">
            Buscar
          </Link>
          <Link href="/#quienes-somos" onClick={(e) => handleAnchorClick(e, "#quienes-somos")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Quiénes somos
          </Link>
          <Link href="/faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Preguntas
          </Link>
          <Link href="/#contacto" onClick={(e) => handleAnchorClick(e, "#contacto")} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Contacto
          </Link>
        </div>

        {/* Desktop Right Side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="default" className="hidden md:inline-flex">
                <Link href="/publicar">
                  <Plus className="h-4 w-4 mr-2" />
                  Publicar
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button suppressHydrationWarning variant="ghost" size="icon" className="hidden md:inline-flex">
                    <UserIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">{user.user_metadata?.full_name ?? user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Mi perfil</Link>
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Panel de Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="default" className="hidden md:inline-flex">
                <Link href="/publicar">Publicar espacio</Link>
              </Button>
              <Button asChild variant="outline" className="hidden md:inline-flex bg-transparent">
                <Link href="/auth">Iniciar sesión</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button suppressHydrationWarning variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/buscar" className="text-base font-medium text-foreground transition-colors hover:text-primary">
                  Buscar
                </Link>
                <Link href="/#quienes-somos" onClick={(e) => handleAnchorClick(e, "#quienes-somos")} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Quiénes somos
                </Link>
                <Link href="/faq" className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Preguntas
                </Link>
                <Link href="/#contacto" onClick={(e) => handleAnchorClick(e, "#contacto")} className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Contacto
                </Link>
                {user ? (
                  <>
                    <Button asChild variant="default" className="justify-start">
                      <Link href="/publicar">
                        <Plus className="h-4 w-4 mr-2" />
                        Publicar
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start">
                      <Link href="/dashboard">Mi pefil</Link>
                    </Button>
                    {profile?.role === "admin" && (
                      <Button asChild variant="ghost" className="justify-start">
                        <Link href="/admin">
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Panel de Admin
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" onClick={logout} className="justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="default" className="justify-start">
                      <Link href="/publicar">Publicar espacio</Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-start bg-transparent">
                      <Link href="/auth">Iniciar sesión</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}