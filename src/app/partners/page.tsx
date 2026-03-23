"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { whatsappUrl } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import {
  ArrowRight,
  Brain,
  Building2,
  Car,
  Check,
  Clock,
  Code,
  CreditCard,
  Globe2,
  Heart,
  Link2,
  MapPin,
  MessageSquare,
  Pill,
  Plane,
  Shield,
  Stethoscope,
  TrendingDown,
  Users,
  Video,
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
  { key: "step0", icon: Code },
  { key: "step1", icon: Users },
  { key: "step2", icon: Zap },
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

const hlIcons = [TrendingDown, Clock, Shield, Stethoscope, MapPin];

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
      <main className="animate-segmentFade">
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="px-6 pt-16 pb-20 max-w-[1000px] mx-auto">
          {/* Announcement pill */}
          <div className="flex justify-center mb-8">
            <Link
              href="/paciente"
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-celeste-pale border border-celeste/20 rounded-full text-xs hover:bg-celeste-100 hover:border-celeste/40 transition"
            >
              <Plane className="w-3 h-3 text-celeste-dark" />
              <span className="text-ink-light">{pt("hero.badge")}</span>
              <ArrowRight className="w-3 h-3 text-celeste-dark" />
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-[clamp(32px,5vw,56px)] font-bold text-ink leading-[1.1] mb-6">
              {pt("hero.title1")}
              <br />
              <em className="not-italic text-celeste-dark">{pt("hero.title2")}</em>
            </h1>

            <p className="text-lg text-ink-light leading-[1.7] max-w-[660px] mx-auto mb-8">
              {pt("hero.subtitle")}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <a
                href={partnerEmail}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-celeste-dark hover:bg-celeste rounded-[4px] transition"
              >
                {pt("hero.cta")} <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/paciente"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-ink-light border-[1.5px] border-border hover:border-celeste-dark hover:text-celeste-dark rounded-[4px] transition"
              >
                {pt("hero.ctaSecondary")}
              </Link>
            </div>
            <p className="text-[11px] text-ink-muted mb-10">{pt("cta.note")}</p>

            {/* Trust logos */}
            <p className="text-[10px] font-bold tracking-[2px] text-ink-muted uppercase mb-4">
              {pt("logos.kicker")}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {TRUST_NAMES.map((name) => (
                <div
                  key={name}
                  className="text-sm font-bold text-ink-muted/50 hover:text-celeste-dark transition"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────── */}
        <section className="px-6 mb-16">
          <div className="max-w-[960px] mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATS.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="bg-white border border-border rounded-xl p-5 hover:border-celeste/40 hover:shadow-sm transition text-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-celeste-pale flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-celeste-dark" />
                  </div>
                  <div className="text-[32px] font-bold text-celeste-dark leading-none">
                    {pt(`stats.${key}`)}
                  </div>
                  <div className="text-xs font-semibold text-ink mt-1.5 mb-1">
                    {pt(`stats.${key}Label`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Value proposition ──────────────────────────────── */}
        <section className="px-6 py-20 border-t border-border">
          <div className="max-w-[960px] mx-auto">
            <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-2.5">
              {pt("value.kicker")}
            </p>
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-ink mb-4 leading-[1.2]">
              {pt("value.title")}
              <em className="not-italic text-celeste-dark">{pt("value.titleEm")}</em>
            </h2>
            <p className="text-[15px] text-ink-light leading-[1.7] max-w-[640px] mb-10">
              {pt("value.subtitle")}
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {VALUE_CARDS.map(({ key, icon: Icon }, i) => {
                const accent = i % 2 === 0 ? "border-celeste" : "border-celeste-light";
                return (
                  <div
                    key={key}
                    className={`border-l-[3px] ${accent} bg-white border border-l-[3px] border-border rounded-lg p-5 hover:shadow-sm transition`}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-celeste-pale flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-celeste-dark" />
                      </div>
                      <h3 className="font-bold text-sm text-ink">{pt(`value.${key}.title`)}</h3>
                    </div>
                    <p className="text-[13px] text-ink-light leading-relaxed">
                      {pt(`value.${key}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Features — What travelers get ──────────────────── */}
        <section className="px-6 py-20 bg-celeste-pale/50">
          <div className="max-w-[960px] mx-auto">
            <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-2.5">
              {pt("features.kicker")}
            </p>
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-ink mb-4 leading-[1.2]">
              {pt("features.title")}
              <em className="not-italic text-celeste-dark">{pt("features.titleEm")}</em>
            </h2>
            <p className="text-[15px] text-ink-light leading-[1.7] max-w-[640px] mb-10">
              {pt("features.subtitle")}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(({ key, icon: Icon, href }, i) => {
                const accent = i % 2 === 0 ? "border-celeste" : "border-celeste-light";
                return (
                  <Link
                    key={key}
                    href={href}
                    className={`border-l-[3px] ${accent} bg-white border border-l-[3px] border-border rounded-lg p-5 hover:shadow-sm transition group`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-celeste-pale flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-celeste-dark" />
                      </div>
                      <h3 className="font-bold text-sm text-ink group-hover:text-celeste-dark transition">
                        {pt(`features.${key}.title`)}
                      </h3>
                    </div>
                    <p className="text-[13px] text-ink-light leading-relaxed">
                      {pt(`features.${key}.desc`)}
                    </p>
                  </Link>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center mt-8">
              <Link
                href="/paciente"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-celeste-dark border border-celeste-dark rounded-[4px] hover:bg-celeste-pale transition"
              >
                {pt("hero.ctaSecondary")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────── */}
        <section className="px-6 py-20 border-t border-border">
          <div className="max-w-[900px] mx-auto">
            <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-2.5">
              {pt("how.kicker")}
            </p>
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-ink mb-4 leading-[1.2]">
              {pt("how.title")}
              <em className="not-italic text-celeste-dark">{pt("how.titleEm")}</em>
            </h2>
            <p className="text-[15px] text-ink-light leading-[1.7] max-w-[600px] mb-12">
              {pt("how.subtitle")}
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map(({ key, icon: Icon }, i) => (
                <div key={key} className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-celeste-pale flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-celeste-dark" />
                    </div>
                    <span className="text-[11px] font-bold tracking-wider text-celeste-dark/60 uppercase">
                      {isEn ? "Step" : "Paso"} {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-ink mb-2">{pt(`how.${key}.title`)}</h3>
                  <p className="text-[13px] text-ink-light leading-relaxed">
                    {pt(`how.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
            <div className="hidden md:block relative mt-4 mb-4 mx-[60px]" aria-hidden="true">
              <div className="h-px bg-celeste/30 w-full" />
            </div>
          </div>
        </section>

        {/* ── Integration options ────────────────────────────── */}
        <section className="px-6 py-20 bg-celeste-pale/50">
          <div className="max-w-[960px] mx-auto">
            <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-2.5">
              {pt("integration.kicker")}
            </p>
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-ink mb-4 leading-[1.2]">
              {pt("integration.title")}
              <em className="not-italic text-celeste-dark">{pt("integration.titleEm")}</em>
            </h2>
            <p className="text-[15px] text-ink-light leading-[1.7] max-w-[640px] mb-10">
              {pt("integration.subtitle")}
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {INTEGRATIONS.map(({ key, icon: Icon }, i) => {
                const accent = i % 2 === 0 ? "border-celeste" : "border-celeste-light";
                return (
                  <div
                    key={key}
                    className={`border-l-[3px] ${accent} bg-white border border-l-[3px] border-border rounded-lg p-5 hover:shadow-sm transition`}
                  >
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-celeste-pale flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-celeste-dark" />
                      </div>
                      <h3 className="font-bold text-sm text-ink">
                        {pt(`integration.${key}.title`)}
                      </h3>
                    </div>
                    <p className="text-[13px] text-ink-light leading-relaxed">
                      {pt(`integration.${key}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────── */}
        <section className="px-6 py-20 border-t border-border">
          <div className="max-w-[900px] mx-auto">
            <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-2.5">
              {pt("pricing.kicker")}
            </p>
            <h2 className="text-[clamp(24px,3vw,36px)] font-bold text-ink mb-4 leading-[1.2]">
              {pt("pricing.title")}{" "}
              <em className="not-italic text-celeste-dark">{pt("pricing.titleEm")}</em>
            </h2>
            <p className="text-[15px] text-ink-light leading-[1.7] max-w-[640px] mb-10">
              {pt("pricing.subtitle")}
            </p>

            {/* Includes card */}
            <div className="bg-white border border-border rounded-xl p-6">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {INCLUDES.map((i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded bg-celeste-pale flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-celeste-dark" />
                    </div>
                    <span className="text-[13px] text-ink-light leading-relaxed">
                      {pt(`pricing.inc${i}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <a
                href={partnerEmail}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-celeste-dark hover:bg-celeste rounded-[4px] transition"
              >
                {pt("hero.cta")} <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={demoWA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-ink-light border-[1.5px] border-border hover:border-celeste-dark hover:text-celeste-dark rounded-[4px] transition"
              >
                {pt("cta.secondary")}
              </a>
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────── */}
        <section className="px-6 py-20 bg-celeste-pale/40 border-t border-border">
          <div className="max-w-[800px] mx-auto text-center">
            <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-3">
              {pt("cta.note")}
            </p>
            <h2 className="text-[clamp(24px,3.5vw,40px)] font-bold text-ink mb-4 leading-[1.2]">
              {pt("cta.title")}
              <br />
              <em className="not-italic text-celeste-dark">{pt("cta.titleEm")}</em>
            </h2>
            <p className="text-[15px] text-ink-muted leading-[1.7] max-w-[560px] mx-auto mb-8">
              {pt("cta.subtitle")}
            </p>

            {/* Highlight pills */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {hlIcons.map((Icon, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-celeste-dark" />
                  <span className="text-sm text-ink-muted font-medium">
                    {pt(`pricing.inc${i}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={partnerEmail}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white bg-celeste-dark hover:bg-celeste rounded-[4px] transition"
              >
                {pt("cta.primary")} <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={demoWA}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-ink border-[1.5px] border-border hover:border-celeste-dark hover:text-celeste-dark rounded-[4px] transition"
              >
                {pt("cta.secondary")}
              </a>
            </div>
            <p className="text-xs text-ink-muted mt-5">{pt("cta.note")}</p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
