import type { Metadata } from "next";

// D-05: SEO metadata for /planes
export const metadata: Metadata = {
  title: "Planes y Precios",
  description:
    "Elegí el plan de Cóndor Salud ideal para tu clínica. Desde consultorios individuales hasta redes multi-sucursal. 14 días de prueba gratis.",
  openGraph: {
    title: "Planes y Precios — Cóndor Salud",
    description:
      "Elegí el plan ideal para tu clínica. Módulos flexibles, precios ajustados por IPC. 14 días de prueba gratis.",
  },
};

export default function PlanesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
