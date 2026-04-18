import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LandingContent from "@/components/LandingContent";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  title: "Cóndor Salud — Plataforma de Salud Digital para Clínicas",
  description:
    "Gestión integral de clínicas y consultorios médicos. Turnos online, historia clínica digital, telemedicina, facturación y más. Probá gratis.",
  openGraph: {
    title: "Cóndor Salud — Plataforma de Salud Digital para Clínicas",
    description:
      "Gestión integral de clínicas y consultorios médicos. Turnos online, historia clínica digital, telemedicina, facturación y más.",
    url: "https://condorsalud.com",
    siteName: "Cóndor Salud",
    type: "website",
    locale: "es_AR",
  },
  alternates: {
    canonical: "https://condorsalud.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cóndor Salud — Plataforma de Salud Digital",
    description: "Gestión integral de clínicas y consultorios médicos.",
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LandingContent />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
