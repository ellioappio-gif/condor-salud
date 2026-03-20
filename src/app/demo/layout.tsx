import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo — Cóndor Salud",
  description:
    "Explorá el dashboard de Cóndor Salud con datos de demostración. Sin registro, sin tarjeta.",
  openGraph: {
    title: "Demo — Cóndor Salud",
    description:
      "Explorá el dashboard con datos demo. Facturación, rechazos, pacientes, inventario y más.",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
