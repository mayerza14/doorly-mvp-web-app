"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/app-shell";
import { Chrome, Loader2, Lock } from "lucide-react";

export default function AuthClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  useEffect(() => {
    if (user) router.push(returnUrl);
  }, [user, router, returnUrl]);

  const handleGoogleLogin = async () => {
    setError("");
    if (!acceptedTerms) {
      setError("Debés aceptar los Términos y Condiciones para continuar");
      return;
    }
    setIsLoading(true);
    try {
      await loginWithGoogle();
      router.push(returnUrl);
    } catch (err) {
      setError("Error al iniciar sesión con Google. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (user) return null;

  return (
    <AppShell>
      <div className="container max-w-md mx-auto px-4 py-16">
        <Card className="shadow-lg">
          <CardHeader className="space-y-2 text-center pb-4">
            <div className="text-4xl font-black text-primary mx-auto mb-1">Doorly</div>
            <CardTitle className="text-xl font-bold">Bienvenido</CardTitle>
            <CardDescription>
              Ingresá a tu cuenta para continuar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(v) => {
                  setAcceptedTerms(v === true);
                  setError("");
                }}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-xs font-normal text-muted-foreground leading-relaxed cursor-pointer"
              >
                Acepto los{" "}
                <Link
                  href="/terminos"
                  target="_blank"
                  className="text-primary underline underline-offset-2 font-medium"
                >
                  Términos y Condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="text-primary underline underline-offset-2 font-medium"
                >
                  Política de Privacidad
                </Link>{" "}
                de Doorly
              </Label>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading || !acceptedTerms}
              variant="outline"
              className="w-full bg-transparent h-11 text-sm font-medium"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continuar con Google
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
              <Lock className="h-3 w-3" />
              <span>Acceso seguro mediante Google. No almacenamos contraseñas.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}