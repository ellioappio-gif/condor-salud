import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sumate a la Red Médica — Doctor Partner Network | Cóndor Salud",
  description:
    "Unite a la red médica de Cóndor Salud por $10.000 ARS/mes. Recibí pacientes, referidos por IA, integraciones con Uber, facturación de todas las obras sociales y garantía de ROI a 12 meses.",
  openGraph: {
    title: "Red Médica Cóndor Salud — Sumate como Partner",
    description:
      "Recibí pacientes, referidos IA, billing de todas las obras sociales. $10.000 ARS/mes con garantía de ROI.",
    url: "https://condorsalud.com/medicos/partner",
    siteName: "Cóndor Salud",
    type: "website",
  },
  alternates: { canonical: "https://condorsalud.com/medicos/partner" },
};

export default function DoctorPartnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
