"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Landmark, ShieldCheck, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Estados para datos bancarios
  const [payoutData, setPayoutData] = useState({
    fullName: "",
    cuitCuil: "",
    bankName: "",
    cbuCvu: "",
    alias: "",
  });

  // Cargar datos existentes si los hay
  useEffect(() => {
    if (!user) return;
    const fetchPayoutData = async () => {
      const { data, error } = await supabase
        .from('payout_methods')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle();
      
      if (data) {
        setPayoutData({
          fullName: data.full_name,
          cuitCuil: data.cuit_cuil,
          bankName: data.bank_name,
          cbuCvu: data.cbu_cvu,
          alias: data.alias || "",
        });
      }
    };
    fetchPayoutData();
  }, [user]);

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutData.cbuCvu.length !== 22) {
      setMessage({ type: "error", text: "El CBU/CVU debe tener exactamente 22 dígitos." });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase
        .from('payout_methods')
        .upsert({
          profile_id: user?.id,
          full_name: payoutData.fullName,
          cuit_cuil: payoutData.cuitCuil,
          bank_name: payoutData.bankName,
          cbu_cvu: payoutData.cbuCvu,
          alias: payoutData.alias,
        });

      if (error) throw error;
      setMessage({ type: "success", text: "Datos bancarios guardados correctamente." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Error al guardar los datos." });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestioná tu información y métodos de cobro</p>
        </div>

        <div className="grid gap-8">
          {/* Información de Usuario */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos básicos de tu cuenta en Doorly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Nombre completo</Label>
                  <p className="font-medium">{profile?.full_name || "No definido"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Rol actual</Label>
                  <div>
                    <Badge variant="outline" className="capitalize">{profile?.role}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Datos Bancarios (Payout Method) */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <CardTitle>Datos de Cobro</CardTitle>
              </div>
              <CardDescription>
                Configurá dónde querés recibir el dinero de tus alquileres.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSavePayout} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre del Titular de la Cuenta</Label>
                    <Input 
                      id="fullName" 
                      placeholder="Tal cual aparece en el banco"
                      value={payoutData.fullName}
                      onChange={e => setPayoutData({...payoutData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuit">CUIT / CUIL</Label>
                    <Input 
                      id="cuit" 
                      placeholder="20-XXXXXXXX-9"
                      value={payoutData.cuitCuil}
                      onChange={e => setPayoutData({...payoutData, cuitCuil: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">Banco</Label>
                    <Input 
                      id="bank" 
                      placeholder="Ej: Banco Galicia, Brubank..."
                      value={payoutData.bankName}
                      onChange={e => setPayoutData({...payoutData, bankName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alias">Alias (Opcional)</Label>
                    <Input 
                      id="alias" 
                      placeholder="Ej: puerta.casa.sol"
                      value={payoutData.alias}
                      onChange={e => setPayoutData({...payoutData, alias: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="cbu">CBU / CVU (22 dígitos)</Label>
                    <Input 
                      id="cbu" 
                      placeholder="0000000000000000000000"
                      maxLength={22}
                      value={payoutData.cbuCvu}
                      onChange={e => setPayoutData({...payoutData, cbuCvu: e.target.value.replace(/\D/g, '')})}
                      required
                      className="font-mono text-lg tracking-widest"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Dígitos ingresados: {payoutData.cbuCvu.length}/22</p>
                  </div>
                </div>

                {message.text && (
                  <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {message.text}
                  </div>
                )}

                <Button type="submit" disabled={isSaving} className="w-full md:w-auto">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar datos de cobro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}