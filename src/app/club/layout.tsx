import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cóndor Club Salud — Membership Plans",
  description:
    "Join Cóndor Club Salud for teleconsultas, medical visits, health tracking, Cora AI assistance, and medication delivery. Plans from $9,000 ARS/month.",
  openGraph: {
    title: "Cóndor Club Salud — Teleconsultas & Medical Benefits",
    description:
      "Membership plans starting at $9,000 ARS/month. Teleconsultas, medical visits, medication delivery, and 24/7 AI triage.",
    url: "https://condorsalud.com/club",
    type: "website",
  },
  alternates: { canonical: "https://condorsalud.com/club" },
};

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
