import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encontrá Espacios para Guardar y Estacionar en Argentina | Doorly",
  description: "Buscá y reservá espacios privados para guardar cosas o estacionar en Buenos Aires y toda Argentina. Filtrá por zona, precio y tipo de espacio.",
  alternates: {
    canonical: "https://www.doorly.com.ar/buscar",
  },
  openGraph: {
    title: "Encontrá Espacios para Guardar y Estacionar | Doorly",
    description: "Buscá y reservá espacios privados para guardar cosas o estacionar en toda Argentina.",
  },
};

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
