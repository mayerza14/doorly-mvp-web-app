"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

interface AddressAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onSelect: (address: string, lat: number, lng: number) => void;
  error?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  label = "Dirección del espacio",
  placeholder = "Ej: Av. Corrientes 1234, Buenos Aires",
  value,
  onSelect,
  error,
  required = false,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(!!value);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al clickear afuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchAddress = async (text: string) => {
    if (text.length < 4) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const encoded = encodeURIComponent(text);
      // Restringir a Argentina con country=ar y proximity a Buenos Aires
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&country=ar&language=es&types=address,poi&proximity=-58.3816,-34.6037&limit=5`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.features) {
        setSuggestions(data.features.map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center,
          text: f.text,
        })));
        setShowDropdown(true);
      }
    } catch (err) {
      console.error("Error buscando dirección:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsSelected(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 350);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    const [lng, lat] = suggestion.center;
    setQuery(suggestion.place_name);
    setIsSelected(true);
    setSuggestions([]);
    setShowDropdown(false);
    onSelect(suggestion.place_name, lat, lng);
  };

  const handleClear = () => {
    setQuery("");
    setIsSelected(false);
    setSuggestions([]);
    onSelect("", 0, 0);
  };

  // Formatear para mostrar la dirección más legible
  const formatSuggestion = (placeName: string) => {
    const parts = placeName.split(", ");
    const main = parts.slice(0, 2).join(", ");
    const secondary = parts.slice(2).join(", ");
    return { main, secondary };
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={`pl-9 pr-9 ${error ? "border-destructive" : ""} ${isSelected ? "border-primary bg-primary/5" : ""}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {!isLoading && query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown de sugerencias */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden mt-1">
          {suggestions.map((s, idx) => {
            const { main, secondary } = formatSuggestion(s.place_name);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-start gap-3
                  ${idx < suggestions.length - 1 ? "border-b border-border/50" : ""}`}
              >
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{main}</p>
                  {secondary && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{secondary}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Estado: dirección confirmada */}
      {isSelected && (
        <div className="flex items-center gap-2 text-xs text-primary font-medium">
          <MapPin className="h-3.5 w-3.5" />
          Ubicación confirmada en el mapa
        </div>
      )}

      {/* Sin resultados */}
      {showDropdown && !isLoading && suggestions.length === 0 && query.length >= 4 && (
        <div className="absolute z-50 w-full bg-white border border-border rounded-xl shadow-lg p-4 mt-1">
          <p className="text-sm text-muted-foreground text-center">
            No se encontraron resultados para "{query}"
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Intentá con más detalle: calle, número y ciudad
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}