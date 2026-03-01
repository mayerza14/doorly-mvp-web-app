"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Loader2, Upload, X, AlertCircle, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { PhotoCropModal } from "@/components/photo-crop-modal";

const SPACE_TYPES = [
  "Cochera", "Garage", "Depósito", "Baulera", "Galpón", "Espacio al aire libre", "Otro",
];

const FITS_OPTIONS = [
  "Auto", "SUV / Camioneta", "Moto / Scooter", "Bicicleta", "Embarcación pequeña",
  "Cajas y bultos", "Muebles y electrodomésticos", "Mercadería comercial",
  "Equipamiento deportivo", "Herramientas y materiales", "Objetos personales",
];

const SPACE_ATTRIBUTES = [
  "Seguridad 24hs", "Candado", "Rampa", "Accesibilidad", "Techado",
  "Control de humedad", "Cámaras de vigilancia", "Alarma", "Iluminación nocturna",
];

const PHONE_REGEX = /(\+?54\s?)?(\d[\s\-.]?){8,12}\d/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

// ── FIX 1: latExact y lngExact agregados a la interfaz ──
interface FormData {
  spaceType: string;
  title: string;
  description: string;
  areaLabel: string;
  fullAddressPrivate: string;
  largo: number;
  ancho: number;
  alto: number;
  fits: string[];
  accessType: "24_7" | "scheduled";
  accessHoursText: string;
  rulesAllowed: string[];
  priceDaily: number;
  priceWeekly?: number;
  priceMonthly?: number;
  photos: string[];
  latExact: number;   // ← agregado
  lngExact: number;   // ← agregado
}

async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob || file), file.type, quality);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function PublishPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    }>
      <PublishFormContent />
    </Suspense>
  );
}

function PublishFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const { user, isLoading: authLoading } = useAuth();
  const wizardTopRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(isEditMode);
  const [showSuccess, setShowSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [descriptionWarning, setDescriptionWarning] = useState("");

  // ── FIX 2: latExact y lngExact con valores iniciales correctos (no tipos) ──
  const [formData, setFormData] = useState<FormData>({
    spaceType: "",
    title: "",
    description: "",
    areaLabel: "",
    fullAddressPrivate: "",
    largo: 0,
    ancho: 0,
    alto: 0,
    fits: [],
    accessType: "24_7",
    accessHoursText: "",
    rulesAllowed: [],
    priceDaily: 0,
    priceWeekly: undefined,
    priceMonthly: undefined,
    photos: [],
    latExact: 0,   // ← valor inicial correcto
    lngExact: 0,   // ← valor inicial correcto
  });

  const [blockedDates, setBlockedDates] = useState<{ start: Date; end: Date; reason: string }[]>([]);
  const [newBlockStart, setNewBlockStart] = useState<Date>();
  const [newBlockEnd, setNewBlockEnd] = useState<Date>();
  const [blockReason, setBlockReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);  

  const sizeM2 = formData.largo > 0 && formData.ancho > 0
    ? Math.round(formData.largo * formData.ancho * 100) / 100
    : 0;

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth?returnUrl=/publicar");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!isEditMode || !user || authLoading) return;

    const fetchListingToEdit = async () => {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", editId)
          .eq("host_id", user.id)
          .single();

        if (error || !data) {
          alert("No se pudo cargar la publicación o no tenés permisos.");
          router.push("/dashboard");
          return;
        }

        let guessedLargo = 0;
        let guessedAncho = 0;
        if (data.size_m2 > 0) {
          guessedLargo = Math.sqrt(data.size_m2);
          guessedAncho = Math.sqrt(data.size_m2);
        }

        setFormData({
          spaceType: data.space_type || "",
          title: data.title || "",
          description: data.description || "",
          areaLabel: data.area_label || "",
          fullAddressPrivate: data.full_address_private || "",
          largo: data.largo || guessedLargo,
          ancho: data.ancho || guessedAncho,
          alto: data.alto || 0,
          fits: data.fits || [],
          accessType: data.access_type || "24_7",
          accessHoursText: data.access_notes_private || "",
          rulesAllowed: data.rules_allowed || [],
          priceDaily: data.price_daily || 0,
          priceWeekly: data.price_weekly || undefined,
          priceMonthly: data.price_monthly || undefined,
          photos: [],
          latExact: data.lat_exact || 0,
          lngExact: data.lng_exact || 0,
        });

        setAcceptedTerms(true);
      } catch (e) {
        console.error("Error inesperado al cargar:", e);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchListingToEdit();
  }, [isEditMode, editId, user, authLoading, router]);

  if (authLoading || !user || isLoadingData) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            {isEditMode ? "Cargando tu publicación..." : "Cargando..."}
          </span>
        </div>
      </AppShell>
    );
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleDescriptionChange = (value: string) => {
    updateFormData("description", value);
    if (PHONE_REGEX.test(value) || EMAIL_REGEX.test(value)) {
      setDescriptionWarning(
        "Por seguridad, no podés incluir números de teléfono ni emails en la descripción."
      );
    } else {
      setDescriptionWarning("");
    }
    PHONE_REGEX.lastIndex = 0;
    EMAIL_REGEX.lastIndex = 0;
  };

  const toggleFit = (item: string) => {
    const current = formData.fits;
    updateFormData("fits", current.includes(item) ? current.filter((i) => i !== item) : [...current, item]);
  };

  const toggleRule = (item: string) => {
    const current = formData.rulesAllowed;
    updateFormData("rulesAllowed", current.includes(item) ? current.filter((i) => i !== item) : [...current, item]);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.spaceType) newErrors.spaceType = "Seleccioná el tipo de espacio";
      if (!formData.title || formData.title.length < 10) newErrors.title = "El título debe tener al menos 10 caracteres";
      if (!formData.description || formData.description.length < 50) newErrors.description = "La descripción debe tener al menos 50 caracteres";
      if (descriptionWarning) newErrors.description = "Eliminá el teléfono o email de la descripción";
      if (!formData.areaLabel) newErrors.areaLabel = "Indicá la zona";
      if (!formData.fullAddressPrivate) newErrors.fullAddressPrivate = "La dirección completa es requerida";
      if (formData.largo <= 0) newErrors.largo = "Ingresá el largo";
      if (formData.ancho <= 0) newErrors.ancho = "Ingresá el ancho";
      if (formData.fits.length === 0) newErrors.fits = "Seleccioná al menos una opción de qué entra";
    }
    if (step === 2) {
      if (formData.photos.length < 3) newErrors.photos = "Subí al menos 3 fotos";
    }
    if (step === 3) {
      if (!formData.priceDaily || formData.priceDaily <= 0) newErrors.priceDaily = "El precio diario es requerido";
    }
    if (step === 4) {
      if (!acceptedTerms) newErrors.terms = "Debés aceptar los términos y condiciones";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    setTimeout(() => wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setTimeout(() => wizardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);

    try {
      // ── FIX 3: lat_exact y lng_exact tomados de formData (ya los tiene el autocomplete) ──
      let lat_exact = formData.latExact;
      let lng_exact = formData.lngExact;

      // Si por alguna razón no se seleccionó del autocomplete, hacemos geocoding de respaldo
      if ((!lat_exact || !lng_exact) && formData.fullAddressPrivate) {
        const addressQuery = encodeURIComponent(formData.fullAddressPrivate + ", Argentina");
        const geocodeRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${addressQuery}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=AR&limit=1&language=es`
        );
        const geocodeData = await geocodeRes.json();
        if (geocodeData.features?.length > 0) {
          const [lng, lat] = geocodeData.features[0].geometry.coordinates;
          lat_exact = lat;
          lng_exact = lng;
        }
      }

      if (isEditMode) {
        const { error } = await supabase
          .from("listings")
          .update({
            title: formData.title,
            description: formData.description,
            space_type: formData.spaceType,
            area_label: formData.areaLabel,
            price_daily: Math.round(formData.priceDaily ?? 0),
            price_weekly: formData.priceWeekly ? Math.round(formData.priceWeekly) : null,
            price_monthly: formData.priceMonthly ? Math.round(formData.priceMonthly) : null,
            full_address_private: formData.fullAddressPrivate,
            access_notes_private: formData.accessHoursText ?? "",
            size_m2: sizeM2,
            largo: formData.largo,
            ancho: formData.ancho,
            alto: formData.alto,
            fits: formData.fits,
            rules_allowed: formData.rulesAllowed,
            access_type: formData.accessType,
            lat_exact,
            lng_exact,
            status: "pending_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", editId)
          .eq("host_id", user?.id);

        if (error) throw error;

      } else {
        // ── FIX 4: rulesNotAllowed y amenities no existen en formData, se pasan como [] ──
        const { error } = await supabase.functions.invoke("create-listing", {
          body: {
            title: formData.title,
            description: formData.description,
            space_type: formData.spaceType,
            area_label: formData.areaLabel,
            price_daily: Math.round(formData.priceDaily ?? 0),
            price_weekly: formData.priceWeekly ? Math.round(formData.priceWeekly) : null,
            price_monthly: formData.priceMonthly ? Math.round(formData.priceMonthly) : null,
            full_address_private: formData.fullAddressPrivate,
            access_notes_private: formData.accessHoursText ?? "",
            access_type: formData.accessType,
            size_m2: sizeM2,
            largo: formData.largo,
            ancho: formData.ancho,
            alto: formData.alto,
            fits: formData.fits,
            rules_allowed: formData.rulesAllowed,
            rules_not_allowed: [],
            amenities: [],
            photos: formData.photos,
            lat_exact,
            lng_exact,
          },
        });

        if (error) throw error;
      }

      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (e) {
      console.error("Error inesperado:", e);
      alert("Hubo un error al guardar tu publicación. Intentá de nuevo.");
      setIsSubmitting(false);
    }
  };

  const addBlockedDateRange = () => {
    if (newBlockStart && newBlockEnd) {
      setBlockedDates((prev) => [...prev, { start: newBlockStart, end: newBlockEnd, reason: blockReason }]);
      setNewBlockStart(undefined);
      setNewBlockEnd(undefined);
      setBlockReason("");
    }
  };

  const removeBlockedDate = (index: number) => {
    setBlockedDates((prev) => prev.filter((_, i) => i !== index));
  };

  if (showSuccess) {
    return (
      <AppShell>
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center shadow-lg border-primary/20">
            <CardContent className="pt-12 pb-12">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-3">
                {isEditMode ? "¡Cambios guardados!" : "¡Publicación enviada!"}
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                {isEditMode
                  ? "Tu publicación fue actualizada y será revisada por nuestro equipo."
                  : "Tu publicación será revisada por el equipo de Doorly. Te notificaremos cuando esté online."
                }
              </p>
              <Button size="lg" onClick={() => router.push("/dashboard")} className="w-full sm:w-auto px-8">
                Ir a mi cuenta
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const stepLabels = ["Información básica", "Fotos y reglas", "Precio y disponibilidad", "Revisión y envío"];

  return (
    <AppShell>
      <div ref={wizardTopRef} className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Publicar nuevo espacio</h1>
          <p className="text-muted-foreground">Completá los datos para publicar tu espacio en Doorly</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {currentStep > step ? "✓" : step}
                </div>
                <span className="text-xs text-muted-foreground mt-1 hidden sm:block text-center max-w-[80px]">
                  {stepLabels[step - 1]}
                </span>
              </div>
              {step < 4 && <div className={`flex-1 h-1 mx-2 mb-4 ${currentStep > step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paso {currentStep}: {stepLabels[currentStep - 1]}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Describí tu espacio y ubicación"}
              {currentStep === 2 && "Subí fotos y configurá los atributos de tu espacio"}
              {currentStep === 3 && "Establecé precios y períodos de no disponibilidad"}
              {currentStep === 4 && "Revisá toda la información antes de enviar"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* ── PASO 1 ── */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="spaceType">Tipo de espacio *</Label>
                  <Select value={formData.spaceType} onValueChange={(v) => updateFormData("spaceType", v)}>
                    <SelectTrigger id="spaceType"><SelectValue placeholder="Seleccioná el tipo" /></SelectTrigger>
                    <SelectContent>
                      {SPACE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.spaceType && <p className="text-sm text-destructive">{errors.spaceType}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título de la publicación *</Label>
                  <Input id="title" placeholder="Ej: Cochera cubierta en Palermo" value={formData.title} onChange={(e) => updateFormData("title", e.target.value)} />
                  <p className="text-xs text-muted-foreground">{formData.title.length}/10 caracteres mínimo</p>
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea id="description" placeholder="Describí tu espacio: características, acceso, altura libre, si está techado, si tiene luz, etc." rows={5} value={formData.description} onChange={(e) => handleDescriptionChange(e.target.value)} />
                  <div className="flex justify-between items-start">
                    <p className="text-xs text-muted-foreground">Mínimo 50 caracteres. Actual: {formData.description.length}</p>
                    {descriptionWarning && (
                      <div className="flex items-start gap-1.5 text-xs text-destructive max-w-sm text-right">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>{descriptionWarning}</span>
                      </div>
                    )}
                  </div>
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                {/* Zona y dirección */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="areaLabel">Zona / Barrio *</Label>
                    <Input id="areaLabel" placeholder="Ej: Palermo, CABA" value={formData.areaLabel} onChange={(e) => updateFormData("areaLabel", e.target.value)} />
                    {errors.areaLabel && <p className="text-sm text-destructive">{errors.areaLabel}</p>}
                  </div>
                  <div className="space-y-2">
                    <AddressAutocomplete
                      label="Dirección completa (privada) *"
                      placeholder="Ej: Gorriti 4567, CABA"
                      value={formData.fullAddressPrivate}
                      onSelect={(address, lat, lng) => {
                        updateFormData("fullAddressPrivate", address);
                        updateFormData("latExact", lat);
                        updateFormData("lngExact", lng);
                      }}
                      error={errors.fullAddressPrivate}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Solo se revela al guardador tras confirmar el pago</p>
                  </div>
                </div>

                {/* Dimensiones */}
                <div className="space-y-3">
                  <Label>Dimensiones del espacio *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="largo" className="text-xs text-muted-foreground">Largo (m)</Label>
                      <Input id="largo" type="number" min="0" step="0.1" placeholder="5.0" value={formData.largo || ""} onChange={(e) => updateFormData("largo", parseFloat(e.target.value) || 0)} />
                      {errors.largo && <p className="text-xs text-destructive">{errors.largo}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="ancho" className="text-xs text-muted-foreground">Ancho (m)</Label>
                      <Input id="ancho" type="number" min="0" step="0.1" placeholder="2.5" value={formData.ancho || ""} onChange={(e) => updateFormData("ancho", parseFloat(e.target.value) || 0)} />
                      {errors.ancho && <p className="text-xs text-destructive">{errors.ancho}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="alto" className="text-xs text-muted-foreground">Alto (m) — opcional</Label>
                      <Input id="alto" type="number" min="0" step="0.1" placeholder="2.2" value={formData.alto || ""} onChange={(e) => updateFormData("alto", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  {sizeM2 > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md px-4 py-2.5 flex items-center gap-2">
                      <span className="text-sm text-primary font-medium">📐 Superficie calculada: {sizeM2} m²</span>
                      {formData.alto > 0 && <span className="text-xs text-muted-foreground">· Altura libre: {formData.alto} m</span>}
                    </div>
                  )}
                </div>

                {/* Qué entra */}
                <div className="space-y-2">
                  <Label>¿Qué entra en el espacio? *</Label>
                  <p className="text-xs text-muted-foreground">Seleccioná todo lo que aplique</p>
                  <div className="flex flex-wrap gap-2">
                    {FITS_OPTIONS.map((option) => (
                      <Badge key={option} variant={formData.fits.includes(option) ? "default" : "outline"} className="cursor-pointer select-none" onClick={() => toggleFit(option)}>
                        {option}
                      </Badge>
                    ))}
                  </div>
                  {errors.fits && <p className="text-sm text-destructive">{errors.fits}</p>}
                </div>

                {/* Acceso */}
                <div className="space-y-2">
                  <Label htmlFor="accessType">Tipo de acceso *</Label>
                  <Select value={formData.accessType} onValueChange={(v: "24_7" | "scheduled") => updateFormData("accessType", v)}>
                    <SelectTrigger id="accessType" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24_7">Acceso 24/7 — Se puede ingresar en cualquier momento</SelectItem>
                      <SelectItem value="scheduled">Horarios coordinados — Se acuerda el ingreso con el propietario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.accessType === "scheduled" && (
                  <div className="space-y-2">
                    <Label htmlFor="accessHoursText">Describí los horarios disponibles</Label>
                    <Input id="accessHoursText" placeholder="Ej: Lun-Vie 8-20hs, Sáb 9-14hs" value={formData.accessHoursText} onChange={(e) => updateFormData("accessHoursText", e.target.value)} />
                  </div>
                )}
              </>
            )}

            {/* ── PASO 2 ── */}
            {currentStep === 2 && (
              <>
                <div className="space-y-3">
                  <div>
                    <Label>Fotos del espacio * (mínimo 3, máximo 10)</Label>
                    <p className="text-xs text-muted-foreground mt-1">Subí fotos claras y bien iluminadas. Los espacios con buenas fotos reciben hasta 3x más reservas.</p>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/20 transition-all" onClick={() => photoInputRef.current?.click()}>
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground mb-1">Hacé click para seleccionar fotos</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · Máximo 5 MB por foto · Hasta 10 fotos</p>
                    <input
                      ref={photoInputRef}
                      id="photo-input"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;
                        const remaining = 10 - formData.photos.length;
                        if (remaining <= 0) { alert("Ya tenés 10 fotos cargadas."); return; }
                        const toProcess = files.slice(0, remaining);
                        const oversized = toProcess.filter(f => f.size > 5 * 1024 * 1024);
                        if (oversized.length > 0) { alert(`${oversized.length} foto(s) superan los 5 MB.`); return; }
                        // ✅ Solo abre el cropper — la subida ocurre en onConfirm del modal
                        setCropFile(toProcess[0]);
                        (e.target as HTMLInputElement).value = "";
                      }}
                    />
                  </div>

                  {isUploadingPhotos && (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      <p className="text-sm text-primary font-medium">Subiendo foto...</p>
                    </div>
                  )}

                  {formData.photos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">{formData.photos.length}/10 fotos cargadas</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {formData.photos.map((url, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-border bg-muted" style={{ aspectRatio: "16/9" }}>
                            <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">Principal</div>}
                            <button type="button" onClick={() => updateFormData("photos", formData.photos.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 active:bg-red-700 transition-colors" aria-label="Eliminar foto">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        {formData.photos.length < 10 && (
                          <button type="button" onClick={() => photoInputRef.current?.click()} className="rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-accent/20 transition-all" style={{ aspectRatio: "16/9" }}>
                            <Plus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Agregar</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">La primera foto será la portada. Tocá la X para eliminar una foto.</p>
                    </div>
                  )}
                  {errors.photos && <p className="text-sm text-destructive">{errors.photos}</p>}
                </div>

                {/* Atributos */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-bold">Atributos del espacio</Label>
                    <p className="text-xs text-muted-foreground mt-1">Seleccioná las características de seguridad y equipamiento que ofrece tu espacio.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SPACE_ATTRIBUTES.map((attr) => (
                      <div key={attr} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer hover:bg-accent/50 ${formData.rulesAllowed.includes(attr) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`} onClick={() => toggleRule(attr)}>
                        <Checkbox id={`attr-${attr}`} checked={formData.rulesAllowed.includes(attr)} onCheckedChange={() => toggleRule(attr)} onClick={(e) => e.stopPropagation()} />
                        <Label htmlFor={`attr-${attr}`} className="text-sm font-medium cursor-pointer leading-none flex-1">{attr}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Atributos */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-bold">Atributos del espacio</Label>
                    <p className="text-xs text-muted-foreground mt-1">Seleccioná las características de seguridad y equipamiento que ofrece tu espacio.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {SPACE_ATTRIBUTES.map((attr) => (
                      <div key={attr} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer hover:bg-accent/50 ${formData.rulesAllowed.includes(attr) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"}`} onClick={() => toggleRule(attr)}>
                        <Checkbox id={`attr-${attr}`} checked={formData.rulesAllowed.includes(attr)} onCheckedChange={() => toggleRule(attr)} onClick={(e) => e.stopPropagation()} />
                        <Label htmlFor={`attr-${attr}`} className="text-sm font-medium cursor-pointer leading-none flex-1">{attr}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── PASO 3 ── */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Precios</Label>
                  <p className="text-xs text-muted-foreground">El precio diario es obligatorio. Los descuentos por semana y mes son opcionales pero aumentan las reservas.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priceDaily">Precio por día (ARS) *</Label>
                    <Input id="priceDaily" type="number" min="0" placeholder="2500" value={formData.priceDaily || ""} onChange={(e) => updateFormData("priceDaily", parseFloat(e.target.value) || 0)} />
                    {errors.priceDaily && <p className="text-sm text-destructive">{errors.priceDaily}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceWeekly">Precio por semana (ARS)</Label>
                    <Input id="priceWeekly" type="number" min="0" placeholder="15000 (opcional)" value={formData.priceWeekly || ""} onChange={(e) => updateFormData("priceWeekly", e.target.value ? parseFloat(e.target.value) : undefined)} />
                    {formData.priceWeekly && formData.priceDaily > 0 && <p className="text-xs text-muted-foreground">Descuento: {Math.round((1 - formData.priceWeekly / (formData.priceDaily * 7)) * 100)}% vs precio diario</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceMonthly">Precio por mes (ARS)</Label>
                    <Input id="priceMonthly" type="number" min="0" placeholder="50000 (opcional)" value={formData.priceMonthly || ""} onChange={(e) => updateFormData("priceMonthly", e.target.value ? parseFloat(e.target.value) : undefined)} />
                    {formData.priceMonthly && formData.priceDaily > 0 && <p className="text-xs text-muted-foreground">Descuento: {Math.round((1 - formData.priceMonthly / (formData.priceDaily * 30)) * 100)}% vs precio diario</p>}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <Label>Períodos no disponibles (opcional)</Label>
                    <p className="text-xs text-muted-foreground mt-1">Indicá fechas en las que tu espacio no estará disponible.</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label className="text-xs">Desde</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlockStart ? format(newBlockStart, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={newBlockStart} onSelect={setNewBlockStart} locale={es} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Hasta</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start bg-transparent">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlockEnd ? format(newBlockEnd, "dd/MM/yyyy", { locale: es }) : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={newBlockEnd} onSelect={setNewBlockEnd} locale={es} disabled={(date) => newBlockStart ? date < newBlockStart : false} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button type="button" onClick={addBlockedDateRange} disabled={!newBlockStart || !newBlockEnd}>Agregar bloqueo</Button>
                  </div>
                  {blockedDates.length > 0 && (
                    <div className="space-y-2">
                      {blockedDates.map((block, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                          <span className="text-sm">{format(block.start, "dd/MM/yyyy", { locale: es })} → {format(block.end, "dd/MM/yyyy", { locale: es })}{block.reason && <span className="text-muted-foreground"> · {block.reason}</span>}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeBlockedDate(index)}><X className="h-4 w-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── PASO 4 ── */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">Revisá toda la información antes de enviar. Una vez publicado, el equipo de Doorly revisará tu espacio.</p>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b"><h3 className="font-semibold text-sm">Información básica</h3></div>
                  <div className="px-4 py-3 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{formData.spaceType || "—"}</span></div>
                      <div><span className="text-muted-foreground">Zona:</span> <span className="font-medium">{formData.areaLabel || "—"}</span></div>
                      <div><span className="text-muted-foreground">Acceso:</span> <span className="font-medium">{formData.accessType === "24_7" ? "24/7" : "Horarios coordinados"}</span></div>
                      <div><span className="text-muted-foreground">Superficie:</span> <span className="font-medium">{sizeM2 > 0 ? `${sizeM2} m²` : "—"}</span></div>
                      {formData.largo > 0 && <div><span className="text-muted-foreground">Largo × Ancho:</span> <span className="font-medium">{formData.largo}m × {formData.ancho}m</span></div>}
                      {formData.alto > 0 && <div><span className="text-muted-foreground">Altura libre:</span> <span className="font-medium">{formData.alto} m</span></div>}
                    </div>
                    <div className="pt-1"><span className="text-muted-foreground">Título:</span> <span className="font-medium">{formData.title || "—"}</span></div>
                    <div><span className="text-muted-foreground block mb-1">Descripción:</span><p className="text-foreground bg-muted/30 rounded p-2 text-xs leading-relaxed">{formData.description || "—"}</p></div>
                    <div><span className="text-muted-foreground">Dirección privada:</span> <span className="font-medium text-amber-700">🔒 {formData.fullAddressPrivate || "—"}</span></div>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b"><h3 className="font-semibold text-sm">¿Qué entra?</h3></div>
                  <div className="px-4 py-3">
                    {formData.fits.length > 0 ? <div className="flex flex-wrap gap-1.5">{formData.fits.map((f) => <Badge key={f} variant="secondary">{f}</Badge>)}</div> : <p className="text-sm text-muted-foreground">No seleccionaste ninguna opción</p>}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b"><h3 className="font-semibold text-sm">Fotos</h3></div>
                  <div className="px-4 py-3">
                    {formData.photos.length > 0 ? <span className="text-green-600 font-medium text-sm">✓ {formData.photos.length} foto(s) cargadas</span> : <span className="text-destructive text-sm">Sin fotos — volvé al paso 2</span>}
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 border-b"><h3 className="font-semibold text-sm">Precios</h3></div>
                  <div className="px-4 py-3 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center"><p className="text-muted-foreground text-xs mb-1">Por día</p><p className="font-semibold text-lg">${formData.priceDaily?.toLocaleString("es-AR") || "—"}</p></div>
                    <div className="text-center"><p className="text-muted-foreground text-xs mb-1">Por semana</p><p className="font-semibold text-lg">{formData.priceWeekly ? `$${formData.priceWeekly.toLocaleString("es-AR")}` : <span className="text-muted-foreground text-sm">No definido</span>}</p></div>
                    <div className="text-center"><p className="text-muted-foreground text-xs mb-1">Por mes</p><p className="font-semibold text-lg">{formData.priceMonthly ? `$${formData.priceMonthly.toLocaleString("es-AR")}` : <span className="text-muted-foreground text-sm">No definido</span>}</p></div>
                  </div>
                </div>

                {formData.rulesAllowed.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b"><h3 className="font-semibold text-sm">Atributos del espacio</h3></div>
                    <div className="px-4 py-3 flex flex-wrap gap-1.5">{formData.rulesAllowed.map((r) => <Badge key={r} variant="outline">{r}</Badge>)}</div>
                  </div>
                )}

                {blockedDates.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b"><h3 className="font-semibold text-sm">Períodos no disponibles</h3></div>
                    <div className="px-4 py-3 space-y-1">{blockedDates.map((b, i) => <p key={i} className="text-sm">{format(b.start, "dd/MM/yyyy", { locale: es })} → {format(b.end, "dd/MM/yyyy", { locale: es })}{b.reason && <span className="text-muted-foreground"> · {b.reason}</span>}</p>)}</div>
                  </div>
                )}

                <div className={`p-6 rounded-2xl border-2 transition-all mt-8 ${acceptedTerms ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center h-5">
                      <Checkbox id="terms" className="h-5 w-5 rounded-md" checked={acceptedTerms} onCheckedChange={(v) => { setAcceptedTerms(v === true); setErrors((prev) => ({ ...prev, terms: "" })); }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="terms" className="text-sm font-bold cursor-pointer leading-none">Acepto los Términos y Condiciones</Label>
                      <p className="text-xs text-muted-foreground leading-normal">
                        Confirmo que la información es correcta y acepto los{" "}
                        <Link href="/terminos" target="_blank" className="text-primary font-medium hover:underline">Términos</Link>{" "}
                        y la{" "}
                        <Link href="/privacidad" target="_blank" className="text-primary font-medium hover:underline">Política de Privacidad</Link> de Doorly.
                      </p>
                    </div>
                  </div>
                  {errors.terms && <p className="text-xs text-destructive mt-2 font-semibold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.terms}</p>}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-800 leading-relaxed"><strong>¿Qué pasa después?</strong> El equipo de Doorly revisará tu publicación en las próximas horas. Te notificaremos por email cuando esté aprobada y visible.</p>
                </div>
              </div>
            )}

            {/* Navegación */}
            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1 || isSubmitting}>Anterior</Button>
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>Siguiente</Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !acceptedTerms}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : "Enviar publicación"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {cropFile && (
          <PhotoCropModal
            file={cropFile}
            onConfirm={async (blob) => {
              setCropFile(null);
              setIsUploadingPhotos(true);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) throw new Error("No hay sesión activa");
                const ext = cropFile.name.split(".").pop()?.toLowerCase() || "jpg";
                const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                const { error: uploadError } = await supabase.storage
                  .from("listing-photos")
                  .upload(fileName, blob, { contentType: "image/jpeg", upsert: false });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(fileName);
                updateFormData("photos", [...formData.photos, urlData.publicUrl]);
              } catch (err) {
                alert("No se pudo subir la foto. Intentá de nuevo.");
              } finally {
                setIsUploadingPhotos(false);
              }
            }}
            onCancel={() => setCropFile(null)}
          />
        )}
    </AppShell>
  );
}