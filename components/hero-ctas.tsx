"use client";
 
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Home, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
 
export function HeroCTAs() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
 
  const handlePublicarClick = () => {
    if (user) {
      router.push("/publicar");
    } else {
      setShowModal(true);
    }
  };
 
  return (
    <>
      {/* Two action cards */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-sm mx-auto sm:max-w-md">
        {/* Buscar */}
        <Link
          href="/buscar"
          className="flex flex-col items-center gap-3 rounded-2xl bg-slate-950 px-6 py-7 text-white transition-all hover:bg-slate-800 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Search className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold">Buscar un espacio</p>
            <p className="mt-1 text-xs text-white/60">Garajes, depósitos y más</p>
          </div>
        </Link>
 
        {/* Publicar */}
        <button
          onClick={handlePublicarClick}
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-6 py-7 text-slate-950 transition-all hover:bg-slate-50 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Home className="h-6 w-6 text-slate-700" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold">Publicar mi espacio</p>
            <p className="mt-1 text-xs text-slate-400">Empezá a ganar</p>
          </div>
        </button>
      </div>
 
      {/* Bottom sheet modal — solo para usuarios no logueados */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
 
          {/* Sheet */}
          <div className="relative z-10 w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl px-6 pt-8 pb-10 shadow-xl">
            {/* Handle visible en mobile */}
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
 
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
 
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 mx-auto mb-4">
                <Home className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">
                Publicar tu espacio
              </h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Para publicar necesitás una cuenta gratuita de Doorly.
              </p>
 
              <ul className="mt-5 flex flex-col gap-2 text-sm text-slate-700 text-left mx-auto w-fit">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  Gratis, sin costo inicial
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  Listo en menos de 2 minutos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  Ingresá con tu cuenta de Google
                </li>
              </ul>
 
              <div className="mt-7 flex flex-col gap-3">
                <Button asChild size="lg" className="w-full rounded-xl">
                  <Link href="/auth">Crear cuenta / Iniciar sesión</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full rounded-xl text-slate-500"
                  onClick={() => setShowModal(false)}
                >
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}