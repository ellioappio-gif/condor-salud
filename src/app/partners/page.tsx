"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { whatsappUrl } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Plane,
  Stethoscope,
  Video,
  Pill,
  MapPin,
  Brain,
  MessageSquare,
  Car,
  Shield,
  CreditCard,
  Users,
  Check,
  ArrowRight,
  Code,
  Globe2,
  Link2,
  Clock,
  Heart,
  Building2,
  Zap,
} from "lucide-react";

/* ─── Static data ─────────────────────────────────────────── */

const STATS = [
  { key: "doctors", icon: Stethoscope },
  { key: "specialties", icon: Heart },
  { key: "cities", icon: MapPin },
  { key: "response", icon: Clock },
] as const;

const VALUE_CARDS = [
  { key: "c0", icon: Building2 },
  { key: "c1", icon: Globe2 },
  { key: "c2", icon: Zap },
  { key: "c3", icon: CreditCard },
] as const;

const FEATURES = [
  { key: "f0", icon: Stethoscope, href: "/paciente/medicos" },
  { key: "f1", icon: Video, href: "/paciente/teleconsulta" },
  { key: "f2", icon: Pill, href: "/paciente/medicamentos" },
  { key: "f3", icon: MapPin, href: "/paciente/mapa" },
  { key: "f4", icon: Brain, href: "/paciente/sintomas" },
  { key: "f5", icon: MessageSquare, href: "/paciente" },
  { key: "f6", icon: Car, href: "/paciente/turnos" },
  { key: "f7", icon: Shield, href: "/paciente/cobertura" },
  { key: "f8", icon: CreditCard, href: "/paciente/pagos" },
] as const;

const STEPS = [
  { key: "step0", icon: Code, num: "01" },
  { key: "step1", icon: Users, num: "02" },
  { key: "step2", icon: Zap, num: "03" },
] as const;

const INTEGRATIONS = [
  { key: "opt0", icon: Code },
  { key: "opt1", icon: Globe2 },
  { key: "opt2", icon: Link2 },
] as const;

const INCLUDES = Array.from({ length: 8 }, (_, i) => i);

const TRUST_NAMES = [
  "PAMI",
  "OSDE",
  "Swiss Medical",
  "Galeno",
  "Medifé",
  "MercadoPago",
  "WhatsApp",
  "Uber",
  "Google Places",
];

/* ─── Page ────────────────────────────────────────────────── */

export default function PartnersPage() {
  const { t, isEn, setSegment } = useLocale();
  const pt = (key: string) => t(`partners.${key}`);

  /* Force tourist segment so partner sees tourist content when navigating */
  useEffect(() => {
    setSegment("tourist");
  }, [setSegment]);

  const partnerEmail = "mailto:partners@condorsalud.com";
  const demoWA = whatsappUrl(
    isEn
      ? "Hi, I'm interested in the Cóndor Salud travel partnership."
      : "Hola, me interesa la alianza de viajes de Cóndor Salud.",
  );

  return (
    <>
      <Navbar />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-ink text-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold tracking-widest uppercase bg-celeste-dark/20 text-celeste-light rounded mb-6">
            <Plane className="w-3.5 h-3.5" />
            {pt("hero.badge")}
          </p>

          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
            {pt("hero.title1")} <span className="text-celeste">{pt("hero.title2")}</span>
          </h1>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            {pt("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={partnerEmail}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-ink bg-gold hover:bg-[#E5A50D] rounded transition"
            >
              {pt("hero.cta")} <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/paciente"
              className="px-8 py-3.5 text-sm font-semibold text-white border border-white/20 hover:border-celeste hover:text-celeste rounded transition"
            >
              {pt("hero.ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────── */}
      <section className="px-6 py-12 bg-celeste-pale border-t border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ key, icon: Icon }) => (
            <div key={key}>
              <Icon className="w-6 h-6 text-celeste-dark mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-ink">{pt(`stats.${key}`)}</p>
              <p className="text-xs text-ink-muted mt-1">{pt(`stats.${key}Label`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Value proposition ────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-celeste uppercase mb-2">
            {pt("value.kicker")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4 leading-tight">
            {pt("value.title")} <span className="text-celeste-dark">{pt("value.titleEm")}</span>
          </h2>
          <p className="text-sm text-ink-light max-w-2xl mb-10 leading-relaxed">
            {pt("value.subtitle")}
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            {VALUE_CARDS.map(({ key, icon: Icon }, i) => (
              <div key={key} className="border border-border hover:shadow-md transition">
                <div className={`h-1 ${i % 2 === 0 ? "bg-celeste" : "bg-gold"}`} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center ${
                        i % 2 === 0 ? "bg-celeste-pale" : "bg-gold-pale"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${i % 2 === 0 ? "text-celeste-dark" : "text-gold"}`}
                      />
                    </div>
                    <h3 className="font-bold text-sm text-ink">{pt(`value.${key}.title`)}</h3>
                  </div>
                  <p className="text-[13px] text-ink-light leading-relaxed">
                    {pt(`value.${key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features — What travelers get ────────────────────── */}
      <section className="px-6 py-20 border-t border-border bg-celeste-pale/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-celeste uppercase mb-2">
            {pt("features.kicker")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4 leading-tight">
            {pt("features.title")}{" "}
            <span className="text-celeste-dark">{pt("features.titleEm")}</span>
          </h2>
          <p className="text-sm text-ink-light max-w-2xl mb-10 leading-relaxed">
            {pt("features.subtitle")}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ key, icon: Icon, href }, i) => (
              <Link
                key={key}
                href={href}
                className={`border-l-[3px] ${
                  i % 2 === 0 ? "border-celeste bg-white" : "border-gold bg-white"
                } p-5 hover:shadow-md transition group`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${i % 2 === 0 ? "text-celeste-dark" : "text-gold"}`} />
                  <h3 className="font-bold text-sm text-ink group-hover:text-celeste-dark transition">
                    {pt(`features.${key}.title`)}
                  </h3>
                </div>
                <p className="text-[13px] text-ink-light leading-relaxed">
                  {pt(`features.${key}.desc`)}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-celeste-dark font-semibold mt-2">
                  {isEn ? "Try live" : "Probá en vivo"} <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-celeste uppercase mb-2">
            {pt("how.kicker")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4 leading-tight">
            {pt("how.title")} <span className="text-celeste-dark">{pt("how.titleEm")}</span>
          </h2>
          <p className="text-sm text-ink-light max-w-2xl mb-10 leading-relaxed">
            {pt("how.subtitle")}
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ key, icon: Icon, num }) => (
              <div key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded flex items-center justify-center bg-celeste-dark text-white font-display font-bold text-sm">
                    {num}
                  </span>
                  <Icon className="w-5 h-5 text-celeste-dark" />
                </div>
                <h3 className="font-bold text-sm text-ink mb-1.5">{pt(`how.${key}.title`)}</h3>
                <p className="text-[13px] text-ink-light leading-relaxed">
                  {pt(`how.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integration options ──────────────────────────────── */}
      <section className="px-6 py-20 border-t border-border bg-celeste-pale/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-celeste uppercase mb-2">
            {pt("integration.kicker")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4 leading-tight">
            {pt("integration.title")}{" "}
            <span className="text-celeste-dark">{pt("integration.titleEm")}</span>
          </h2>
          <p className="text-sm text-ink-light max-w-2xl mb-10 leading-relaxed">
            {pt("integration.subtitle")}
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {INTEGRATIONS.map(({ key, icon: Icon }, i) => (
              <div key={key} className="border border-border bg-white hover:shadow-md transition">
                <div className={`h-1 ${i === 1 ? "bg-gold" : "bg-celeste"}`} />
                <div className="p-5">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center mb-3 ${
                      i === 1 ? "bg-gold-pale" : "bg-celeste-pale"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${i === 1 ? "text-gold" : "text-celeste-dark"}`} />
                  </div>
                  <h3 className="font-bold text-sm text-ink mb-1.5">
                    {pt(`integration.${key}.title`)}
                  </h3>
                  <p className="text-[13px] text-ink-light leading-relaxed">
                    {pt(`integration.${key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest text-celeste uppercase mb-2">
            {pt("pricing.kicker")}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mb-2 leading-tight">
            <span className="text-celeste-dark">{pt("pricing.title")}</span>
          </h2>
          <p className="font-display text-xl text-ink-light mb-2">{pt("pricing.titleEm")}</p>
          <p className="text-sm text-ink-muted max-w-lg mx-auto mb-10">{pt("pricing.subtitle")}</p>

          {/* Includes card */}
          <div className="max-w-md mx-auto border border-border rounded">
            <div className="h-1 bg-gold" />
            <div className="p-6 text-left space-y-3">
              {INCLUDES.map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-celeste-dark mt-0.5 shrink-0" />
                  <span className="text-sm text-ink-light">{pt(`pricing.inc${i}`)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <a
              href={partnerEmail}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-ink bg-gold hover:bg-[#E5A50D] rounded transition"
            >
              {pt("hero.cta")} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Trusted network ──────────────────────────────────── */}
      <section className="px-6 py-16 border-t border-border bg-celeste-pale/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold tracking-widest text-celeste uppercase mb-2">
            {pt("logos.kicker")}
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-8 leading-tight">
            {pt("logos.title")} <span className="text-celeste-dark">{pt("logos.titleEm")}</span>
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TRUST_NAMES.map((name) => (
              <span
                key={name}
                className="px-4 py-2 text-xs font-semibold text-ink-muted border border-border rounded bg-white"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-celeste-dark text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-4">
            {pt("cta.title")} <span className="text-gold">{pt("cta.titleEm")}</span>
          </h2>
          <p className="text-sm text-celeste-light max-w-xl mx-auto mb-8 leading-relaxed">
            {pt("cta.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={partnerEmail}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-bold text-ink bg-gold hover:bg-[#E5A50D] rounded transition"
            >
              {pt("cta.primary")} <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={demoWA}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 text-sm font-semibold text-white border border-white/30 hover:border-white rounded transition"
            >
              {pt("cta.secondary")}
            </a>
          </div>

          <p className="text-xs text-celeste-light/60 mt-6">{pt("cta.note")}</p>
        </div>
      </section>

      <Footer />
    </>
  );
}
