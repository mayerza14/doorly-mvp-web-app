import { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://www.doorly.com.ar/buscar",
  },
};

export default function BuscarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
