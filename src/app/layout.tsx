import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cóndor Salud — Volá más alto",
  description: "Plataforma unificada de inteligencia para el sistema de salud argentino. PAMI, obras sociales, prepagas en un solo dashboard.",
  icons: {
    icon: [
      { url: "/logos/favicon.svg", type: "image/svg+xml" },
      { url: "/logos/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/logos/apple-touch-icon-180.png",
  },
  openGraph: {
    title: "Cóndor Salud — Volá más alto",
    description: "Conectamos PAMI, obras sociales, prepagas y AFIP en una plataforma unificada.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-ink font-body" style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</body>
    </html>
  );
}
