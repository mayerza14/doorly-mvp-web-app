"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FiltersPanelProps {
  zona: string;
  setZona: (value: string) => void;
  tipo: string;
  setTipo: (value: string) => void;
  precioMax: number;
  setPrecioMax: (value: number) => void;
  tamanoMin: number;
  setTamanoMin: (value: number) => void;
  acceso24: boolean;
  setAcceso24: (value: boolean) => void;
  fitsSeleccionados: string[];
  setFitsSeleccionados: (value: string[]) => void;
}

const FITS_OPTIONS = [
  "Auto",
  "Moto",
  "Bicicleta",
  "Muebles",
  "Cajas",
  "Herramientas",
];

export function FiltersPanel({
  zona,
  setZona,
  tipo,
  setTipo,
  precioMax,
  setPrecioMax,
  tamanoMin,
  setTamanoMin,
  acceso24,
  setAcceso24,
  fitsSeleccionados,
  setFitsSeleccionados,
}: FiltersPanelProps) {
  const toggleFit = (fit: string) => {
    if (fitsSeleccionados.includes(fit)) {
      setFitsSeleccionados(fitsSeleccionados.filter((f) => f !== fit));
    } else {
      setFitsSeleccionados([...fitsSeleccionados, fit]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zona */}
        <div className="space-y-2">
          <Label htmlFor="zona">Zona</Label>
          <Input
            id="zona"
            placeholder="Ej: Palermo, Recoleta..."
            value={zona}
            onChange={(e) => setZona(e.target.value)}
          />
        </div>

        {/* Tipo de espacio */}
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de espacio</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="cochera">Cochera</SelectItem>
              <SelectItem value="baulera">Baulera</SelectItem>
              <SelectItem value="deposito">Depósito</SelectItem>
              <SelectItem value="garage">Garage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Precio máximo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="precio">Precio máximo por día</Label>
            <span className="text-sm font-medium text-foreground">
              ${precioMax.toLocaleString()}
            </span>
          </div>
          <Slider
            id="precio"
            min={500}
            max={10000}
            step={500}
            value={[precioMax]}
            onValueChange={(value) => setPrecioMax(value[0])}
            className="mt-2"
          />
        </div>

        {/* Tamaño mínimo */}
        <div className="space-y-2">
          <Label htmlFor="tamano">Tamaño mínimo (m²)</Label>
          <Input
            id="tamano"
            type="number"
            placeholder="0"
            value={tamanoMin || ""}
            onChange={(e) => setTamanoMin(Number(e.target.value))}
          />
        </div>

        {/* Acceso 24/7 */}
        <div className="flex items-center justify-between">
          <Label htmlFor="acceso24" className="cursor-pointer">
            Acceso 24/7
          </Label>
          <Switch
            id="acceso24"
            checked={acceso24}
            onCheckedChange={setAcceso24}
          />
        </div>

        {/* Qué entra */}
        <div className="space-y-2">
          <Label>Qué entra</Label>
          <div className="flex flex-wrap gap-2">
            {FITS_OPTIONS.map((fit) => (
              <Badge
                key={fit}
                variant={
                  fitsSeleccionados.includes(fit) ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleFit(fit)}
              >
                {fit}
                {fitsSeleccionados.includes(fit) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
