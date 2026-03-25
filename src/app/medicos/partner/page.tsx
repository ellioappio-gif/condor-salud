"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { whatsappUrl } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Building2,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  Fingerprint,
  Globe2,
  Heart,
  Landmark,
  LineChart,
  MapPin,
  MessageSquare,
  Phone,
  Pill,
  QrCode,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  TrendingUp,
  Truck,
  Users,
  Video,
  Zap,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────── */
/*  DOCTOR PARTNERSHIP PAGE — condorsalud.com/medicos/partner     */
/*  B2B landing for doctors to join the Cóndor Salud network.     */
/*  $10,000 ARS/mo · 1-year ROI guarantee · All insurances        */
/* ────────────────────────────────────────────────────────────── */

/* ── Shared components ──────────────────────────────────────── */

function Benefit({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white border border-border-light rounded-2xl p-6 hover:shadow-md hover:border-celeste/40 transition-all">
      <div className="w-12 h-12 rounded-xl bg-celeste-pale flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-celeste-dark" />
      </div>
      <h3 className="font-display font-bold text-base text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-light leading-relaxed">{desc}</p>
    </div>
  );
}

function ComparisonRow({
  feature,
  condor,
  others,
  highlight,
}: {
  feature: string;
  condor: string;
  others: string;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-celeste-pale/40" : ""}>
      <td className="px-4 py-3 text-sm text-ink font-medium border-b border-border-light">
        {feature}
      </td>
      <td className="px-4 py-3 text-sm text-celeste-dark font-semibold border-b border-border-light text-center">
        {condor}
      </td>
      <td className="px-4 py-3 text-sm text-ink-muted border-b border-border-light text-center">
        {others}
      </td>
    </tr>
  );
}

/* ── ROI Calculator ─────────────────────────────────────────── */

function ROICalculator({ isEn }: { isEn: boolean }) {
  const [patients, setPatients] = useState(15);
  const avgConsult = 8000; // ARS avg consultation
  const monthlyRevenue = patients * avgConsult;
  const monthlyCost = 10000;
  const netGain = monthlyRevenue - monthlyCost;
  const roi = Math.round(((monthlyRevenue - monthlyCost) / monthlyCost) * 100);

  return (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
      <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-1">
        {isEn ? "ROI CALCULATOR" : "CALCULADORA DE ROI"}
      </p>
      <h3 className="font-bold text-ink text-base mb-4">
        {isEn ? "See your return on investment" : "Calculá tu retorno de inversión"}
      </h3>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-ink-light">
            {isEn ? "New patients per month via Cóndor" : "Nuevos pacientes por mes vía Cóndor"}
          </span>
          <span className="text-2xl font-bold text-celeste-dark font-display">{patients}</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={patients}
          onChange={(e) => setPatients(Number(e.target.value))}
          className="w-full h-2 rounded-full cursor-pointer accent-celeste-dark range-styled"
        />
        <div className="flex justify-between text-[10px] text-ink-muted mt-1">
          <span>1</span>
          <span>50+</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-[10px] text-ink-muted mb-0.5">
            {isEn ? "Monthly revenue" : "Ingreso mensual"}
          </p>
          <p className="text-lg font-bold text-ink font-display">
            ${monthlyRevenue.toLocaleString("es-AR")}
          </p>
        </div>
        <div className="bg-surface rounded-lg p-3 text-center">
          <p className="text-[10px] text-ink-muted mb-0.5">
            {isEn ? "Cóndor fee" : "Cuota Cóndor"}
          </p>
          <p className="text-lg font-bold text-ink-muted font-display">
            -${monthlyCost.toLocaleString("es-AR")}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-celeste-pale to-gold/10 border border-celeste/30 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-muted mb-0.5">
            {isEn ? "Net monthly gain" : "Ganancia neta mensual"}
          </p>
          <p className="text-3xl font-bold text-celeste-dark font-display">
            ${netGain.toLocaleString("es-AR")}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">
            {roi}% ROI ·{" "}
            {isEn ? "Pays for itself with just 2 patients" : "Se paga solo con 2 pacientes"}
          </p>
        </div>
        <div className="w-14 h-14 rounded-xl bg-white border border-celeste/30 flex items-center justify-center shrink-0">
          <TrendingUp className="w-6 h-6 text-celeste-dark" />
        </div>
      </div>

      <p className="text-[10px] text-ink-muted mt-3">
        {isEn
          ? "* Based on avg consultation fee of $8,000 ARS. Actual results vary by specialty and location."
          : "* Basado en consulta promedio de $8.000 ARS. Resultados reales varían por especialidad y ubicación."}
      </p>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */

export default function DoctorPartnerPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <>
      <Navbar />
      <main className="bg-white min-h-screen">
        {/* ── Hero ────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-celeste-pale/30 to-gold/5 px-6 pt-20 pb-16">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-celeste/10 text-celeste-dark text-[11px] font-bold tracking-[2px] uppercase px-4 py-2 rounded-full border border-celeste/20 mb-6">
              <Stethoscope className="w-4 h-4" />
              {isEn ? "DOCTOR PARTNER NETWORK" : "RED MÉDICA PARTNER"}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-ink leading-[1.1] mb-6">
              {isEn ? (
                <>
                  Grow your practice.{" "}
                  <span className="text-celeste-dark">We bring the patients.</span>
                </>
              ) : (
                <>
                  Hacé crecer tu consultorio.{" "}
                  <span className="text-celeste-dark">Nosotros traemos los pacientes.</span>
                </>
              )}
            </h1>

            <p className="text-lg text-ink-light max-w-2xl mx-auto mb-4 leading-relaxed">
              {isEn
                ? "Join the Cóndor Salud medical network and receive patient bookings, AI-powered referrals, ride-share integrations, and insurance billing through our platform — for just $10,000 ARS/month."
                : "Unite a la red médica de Cóndor Salud y recibí turnos, derivaciones por IA, integraciones con apps de transporte y facturación de obras sociales — por solo $10.000 ARS/mes."}
            </p>

            {/* ROI Guarantee badge */}
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold-dark text-sm font-semibold px-4 py-2 rounded-full border border-gold/30 mb-8">
              <ShieldCheck className="w-4 h-4" />
              {isEn
                ? "12-month ROI guarantee — or your money back"
                : "Garantía de ROI a 12 meses — o te devolvemos tu dinero"}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <a
                href={whatsappUrl(
                  isEn
                    ? "Hi, I'm a doctor interested in joining the Cóndor Salud partner network"
                    : "Hola, soy médico y me interesa unirme a la red partner de Cóndor Salud",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-celeste-dark text-white px-8 py-4 rounded-full text-base font-bold hover:bg-celeste-700 transition-colors shadow-lg shadow-celeste/20"
              >
                {isEn ? "Apply Now" : "Sumarme Ahora"} <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#planes"
                className="inline-flex items-center gap-2 border border-celeste-dark text-celeste-dark px-6 py-4 rounded-full text-sm font-semibold hover:bg-celeste-pale transition-colors"
              >
                {isEn ? "See the plan" : "Ver el plan"} <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust logos */}
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {[
                "PAMI",
                "OSDE",
                "Swiss Medical",
                "Galeno",
                "Medifé",
                "IOMA",
                "Sancor Salud",
                "Omint",
              ].map((name) => (
                <div
                  key={name}
                  className="bg-white/80 border border-border/60 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-ink-muted"
                >
                  {name}
                </div>
              ))}
            </div>
            <p className="text-xs text-ink-muted">
              {isEn
                ? "We contract with ALL Argentine insurance providers — we handle the billing, you get paid."
                : "Contratamos con TODAS las obras sociales argentinas — nosotros facturamos, vos cobrás."}
            </p>
          </div>

          {/* Decorative */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-celeste/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
        </section>

        {/* ── The Problem ────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-[11px] font-bold tracking-[2.5px] text-celeste uppercase mb-2">
              {isEn ? "THE PROBLEM" : "EL PROBLEMA"}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">
              {isEn
                ? "Growing a practice in Argentina is broken"
                : "Hacer crecer tu consultorio en Argentina está roto"}
            </h2>
            <p className="text-base text-ink-light max-w-2xl mb-10">
              {isEn
                ? "Platforms like Doctoralia and Teledoctor charge high commissions, lock you in, and give you zero control. You deserve better."
                : "Plataformas como Doctoralia y Teledoctor cobran comisiones altas, te encierran y no te dan control. Merecés algo mejor."}
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  icon: DollarSign,
                  titleEs: "Comisiones abusivas",
                  titleEn: "Abusive commissions",
                  descEs:
                    "Doctoralia cobra hasta $20.000+/mes o comisiones por turno. En 12 meses gastaste más de $240.000 sin garantía.",
                  descEn:
                    "Doctoralia charges up to $20,000+/mo or per-appointment fees. In 12 months you've spent $240K+ with no guarantee.",
                },
                {
                  icon: Clock,
                  titleEs: "Sin pacientes nuevos reales",
                  titleEn: "No real new patients",
                  descEs:
                    "La mayoría de los directorios solo listan tu nombre. No traen pacientes activamente a tu puerta.",
                  descEn:
                    "Most directories only list your name. They don't actively bring patients to your door.",
                },
                {
                  icon: FileText,
                  titleEs: "Pesadilla de obras sociales",
                  titleEn: "Insurance nightmare",
                  descEs:
                    "Rechazos, paperwork, meses de espera por cobrar. Si no aceptás una obra social, perdés el paciente.",
                  descEn:
                    "Rejections, paperwork, months waiting to get paid. If you don't accept an insurance, you lose the patient.",
                },
              ].map((item) => (
                <div key={item.titleEs} className="bg-white border border-red-100 rounded-xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="font-bold text-sm text-ink mb-1">
                    {isEn ? item.titleEn : item.titleEs}
                  </h3>
                  <p className="text-xs text-ink-light leading-relaxed">
                    {isEn ? item.descEn : item.descEs}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Cóndor ─────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-[11px] font-bold tracking-[2.5px] text-celeste uppercase mb-2">
              {isEn ? "WHY CÓNDOR SALUD" : "POR QUÉ CÓNDOR SALUD"}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">
              {isEn
                ? "Everything you need to fill your schedule"
                : "Todo lo que necesitás para llenar tu agenda"}
            </h2>
            <p className="text-base text-ink-light max-w-2xl mb-10">
              {isEn
                ? "Not just a directory — a complete patient acquisition and practice management ecosystem that actively works for you 24/7."
                : "No es solo un directorio — es un ecosistema completo de adquisición de pacientes y gestión de consultorio que trabaja para vos 24/7."}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Benefit
                icon={Bot}
                title={isEn ? "AI Chatbot Referrals (Cora)" : "Derivaciones por Chatbot IA (Cora)"}
                desc={
                  isEn
                    ? "Our AI assistant Cora triages 1000s of patient symptoms 24/7 and routes them directly to your specialty. You get pre-qualified patients ready to book."
                    : "Nuestra asistente IA Cora evalúa miles de síntomas 24/7 y los dirige a tu especialidad. Recibís pacientes pre-calificados listos para agendar."
                }
              />
              <Benefit
                icon={Search}
                title={isEn ? "SEO Doctor Profiles" : "Perfiles Médicos con SEO"}
                desc={
                  isEn
                    ? "Your public profile ranks on Google. Patients searching 'cardiologist Buenos Aires' find YOU — not a generic directory."
                    : "Tu perfil público se posiciona en Google. Pacientes buscando 'cardiólogo Buenos Aires' te encuentran a VOS — no un directorio genérico."
                }
              />
              <Benefit
                icon={CreditCard}
                title={isEn ? "All Insurance Billing" : "Facturación de Todas las Obras Sociales"}
                desc={
                  isEn
                    ? "We contract with every Argentine insurance provider. Have a patient with PAMI but don't accept it? Bill through us — we guarantee payment."
                    : "Contratamos con todas las obras sociales. ¿Tenés un paciente con PAMI pero no la aceptás? Facturá por nosotros — te garantizamos el cobro."
                }
              />
              <Benefit
                icon={Car}
                title={isEn ? "Uber/Cabify/InDrive Integration" : "Integración Uber/Cabify/InDrive"}
                desc={
                  isEn
                    ? "Patients book a ride to your office directly from the booking screen. No more no-shows — they're literally on their way."
                    : "Los pacientes piden un viaje a tu consultorio directo desde la pantalla de turno. No más ausencias — ya están en camino."
                }
              />
              <Benefit
                icon={Video}
                title={isEn ? "Built-in Teleconsulta" : "Teleconsulta Integrada"}
                desc={
                  isEn
                    ? "HD video consultations powered by Daily.co. See patients remotely, expand your reach beyond your city. No extra software needed."
                    : "Consultas de video HD con Daily.co. Atendé pacientes a distancia, expandí tu alcance más allá de tu ciudad. Sin software extra."
                }
              />
              <Benefit
                icon={Globe2}
                title={isEn ? "Medical Tourism Patients" : "Pacientes de Turismo Médico"}
                desc={
                  isEn
                    ? "We partner with travel agencies sending tourists to Argentina. English-speaking patients with international insurance, routed to bilingual doctors."
                    : "Trabajamos con agencias de viaje que traen turistas a Argentina. Pacientes que hablan inglés con seguros internacionales, derivados a médicos bilingües."
                }
              />
              <Benefit
                icon={Calendar}
                title={isEn ? "Smart Scheduling" : "Agenda Inteligente"}
                desc={
                  isEn
                    ? "Patients book online 24/7 — no more phone tag. Automated reminders via WhatsApp reduce no-shows by 40%."
                    : "Los pacientes agendan online 24/7 — no más llamadas perdidas. Recordatorios automáticos por WhatsApp reducen ausencias un 40%."
                }
              />
              <Benefit
                icon={BarChart3}
                title={isEn ? "Practice Analytics" : "Analíticas de Consultorio"}
                desc={
                  isEn
                    ? "See where your patients come from, which referrals convert, and how to optimize your schedule. Data-driven growth."
                    : "Mirá de dónde vienen tus pacientes, qué derivaciones convierten y cómo optimizar tu agenda. Crecimiento basado en datos."
                }
              />
              <Benefit
                icon={MessageSquare}
                title={isEn ? "WhatsApp Integration" : "Integración WhatsApp"}
                desc={
                  isEn
                    ? "Automated appointment confirmations, reminders, and follow-ups via WhatsApp — the channel your patients already use."
                    : "Confirmaciones de turno, recordatorios y seguimiento automáticos por WhatsApp — el canal que tus pacientes ya usan."
                }
              />
              <Benefit
                icon={Landmark}
                title={isEn ? "Mi Argentina Gov Integration" : "Integración Mi Argentina"}
                desc={
                  isEn
                    ? "Connected to Argentina's national digital health ecosystem: SISA registry, REFES facility verification, and Credencial de Salud Digital — all from your dashboard."
                    : "Conectado al ecosistema nacional de salud digital: registro SISA, verificación REFES y Credencial de Salud Digital — todo desde tu dashboard."
                }
              />
              <Benefit
                icon={Fingerprint}
                title={isEn ? "RENAPER Patient Verification" : "Verificación RENAPER de Pacientes"}
                desc={
                  isEn
                    ? "Verify patient identity instantly through RENAPER integration. Reduce fraud, streamline onboarding, and ensure every patient record is accurate."
                    : "Verificá la identidad de pacientes al instante con integración RENAPER. Reducí fraude, agilizá el alta y asegurá que cada ficha sea precisa."
                }
              />
              <Benefit
                icon={Syringe}
                title={isEn ? "Digital Vaccination Records" : "Carnet de Vacunación Digital"}
                desc={
                  isEn
                    ? "Access patient vaccination histories through the national digital vaccination certificate. No more paper records or missing data."
                    : "Accedé al historial de vacunación de pacientes vía el carnet digital nacional. Sin más registros en papel ni datos perdidos."
                }
              />
            </div>
          </div>
        </section>

        {/* ── Insurance Middleman ─────────────────────────── */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-celeste-dark to-celeste-700 text-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[11px] font-bold tracking-[2.5px] text-gold uppercase mb-2">
                  {isEn ? "EXCLUSIVE BENEFIT" : "BENEFICIO EXCLUSIVO"}
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  {isEn
                    ? "Never lose a patient over insurance again"
                    : "Nunca más pierdas un paciente por la obra social"}
                </h2>
                <p className="text-white/80 text-base mb-6 leading-relaxed">
                  {isEn
                    ? "We contract with ALL Argentine insurance providers. When a patient walks into your office with an obra social you don't accept, you have two options:"
                    : "Contratamos con TODAS las obras sociales argentinas. Cuando un paciente llega a tu consultorio con una obra social que no aceptás, tenés dos opciones:"}
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-red-300 text-sm font-bold">—</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white/90">
                        {isEn ? "Before Cóndor:" : "Antes de Cóndor:"}
                      </p>
                      <p className="text-white/60 text-sm">
                        {isEn
                          ? "Turn them away. Lose the revenue. They go to a competitor."
                          : "Los rechazás. Perdés el ingreso. Se van a la competencia."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-green-300 text-sm font-bold"></span>
                    </div>
                    <div>
                      <p className="font-semibold text-white/90">
                        {isEn ? "With Cóndor:" : "Con Cóndor:"}
                      </p>
                      <p className="text-white/60 text-sm">
                        {isEn
                          ? "Bill through us. We accept their insurance, process the claim, and pay you. Zero extra work."
                          : "Facturá por nosotros. Aceptamos su obra social, procesamos el reclamo y te pagamos. Cero trabajo extra."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <p className="text-sm text-white/90 font-medium">
                    {" "}
                    {isEn
                      ? "From your dashboard, simply click 'Bill through Cóndor' on any patient visit. We handle PAMI, OSDE, Swiss Medical, Galeno, Medifé, IOMA, Sancor Salud, Omint, and 270+ more."
                      : "Desde tu dashboard, simplemente hacé click en 'Facturar por Cóndor' en cualquier consulta. Gestionamos PAMI, OSDE, Swiss Medical, Galeno, Medifé, IOMA, Sancor Salud, Omint y 270+ más."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Dashboard mockup */}
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded bg-celeste-dark flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">
                        {isEn ? "Insurance Billing" : "Facturación de Obra Social"}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {isEn ? "Patient: Juan Pérez" : "Paciente: Juan Pérez"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
                      <span className="text-xs text-ink">PAMI</span>
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                        {isEn ? "You don't accept" : "No aceptás"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-celeste-pale border border-celeste/30 rounded-lg px-3 py-2">
                      <span className="text-xs text-ink font-semibold">
                        {isEn ? "Bill through Cóndor" : "Facturar por Cóndor"} →
                      </span>
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        {isEn ? "Covered " : "Cubierto "}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-xs font-bold text-green-700">
                      {" "}
                      {isEn
                        ? "Claim submitted — payment in 15 business days"
                        : "Reclamo enviado — cobro en 15 días hábiles"}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white font-display">280+</p>
                    <p className="text-[10px] text-white/60">
                      {isEn ? "Insurances" : "Obras sociales"}
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gold font-display">15</p>
                    <p className="text-[10px] text-white/60">
                      {isEn ? "Day payment" : "Días de cobro"}
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white font-display">0%</p>
                    <p className="text-[10px] text-white/60">
                      {isEn ? "Extra fee" : "Costo extra"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Comparison Table ────────────────────────────── */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[11px] font-bold tracking-[2.5px] text-celeste uppercase mb-2 text-center">
              {isEn ? "COMPARE" : "COMPARÁ"}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4 text-center">
              {isEn ? "Why doctors switch to Cóndor" : "Por qué los médicos eligen Cóndor"}
            </h2>
            <p className="text-base text-ink-light text-center max-w-2xl mx-auto mb-10">
              {isEn
                ? "See how we compare to Doctoralia, Teledoctor, and other directories."
                : "Mirá cómo nos comparamos con Doctoralia, Teledoctor y otros directorios."}
            </p>

            <div className="overflow-x-auto rounded-2xl border border-border bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-celeste-pale">
                    <th className="px-4 py-3 text-left text-xs font-bold text-ink uppercase tracking-wider">
                      {isEn ? "Feature" : "Característica"}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-celeste-dark uppercase tracking-wider">
                      Cóndor Salud
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-ink-muted uppercase tracking-wider">
                      {isEn ? "Others" : "Otros"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow
                    feature={isEn ? "Monthly price" : "Precio mensual"}
                    condor="$10.000 ARS"
                    others="$20.000+ ARS"
                    highlight
                  />
                  <ComparisonRow
                    feature={isEn ? "ROI guarantee" : "Garantía de ROI"}
                    condor={isEn ? "12 months" : "12 meses"}
                    others="—"
                  />
                  <ComparisonRow
                    feature={isEn ? "AI patient referrals" : "Derivaciones por IA"}
                    condor="Cora 24/7"
                    others="—"
                    highlight
                  />
                  <ComparisonRow
                    feature={
                      isEn ? "Insurance billing (all)" : "Facturación obras sociales (todas)"
                    }
                    condor="280+"
                    others="—"
                  />
                  <ComparisonRow
                    feature={isEn ? "Uber/Cabify integration" : "Integración Uber/Cabify"}
                    condor=""
                    others="—"
                    highlight
                  />
                  <ComparisonRow
                    feature={isEn ? "Built-in teleconsulta" : "Teleconsulta integrada"}
                    condor={isEn ? "HD Video" : "Video HD"}
                    others={isEn ? "Some (extra $)" : "Algunos (extra $)"}
                  />
                  <ComparisonRow
                    feature={isEn ? "SEO public profile" : "Perfil público con SEO"}
                    condor=""
                    others={isEn ? "Limited" : "Limitado"}
                    highlight
                  />
                  <ComparisonRow
                    feature={isEn ? "WhatsApp reminders" : "Recordatorios WhatsApp"}
                    condor={isEn ? "Auto" : "Auto"}
                    others={isEn ? "Manual" : "Manual"}
                  />
                  <ComparisonRow
                    feature={isEn ? "Medical tourism patients" : "Pacientes turismo médico"}
                    condor=""
                    others="—"
                    highlight
                  />
                  <ComparisonRow
                    feature={isEn ? "Practice analytics" : "Analíticas de consultorio"}
                    condor={isEn ? "Full dashboard" : "Dashboard completo"}
                    others={isEn ? "Basic" : "Básico"}
                  />
                  <ComparisonRow
                    feature={isEn ? "Digital prescriptions (QR)" : "Recetas digitales (QR)"}
                    condor=""
                    others="—"
                    highlight
                  />
                  <ComparisonRow
                    feature={
                      isEn ? "Mi Argentina / SISA integration" : "Integración Mi Argentina / SISA"
                    }
                    condor=""
                    others="—"
                  />
                  <ComparisonRow
                    feature={isEn ? "Per-appointment fee" : "Costo por turno"}
                    condor="$0"
                    others="$500–2.000"
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Mi Argentina & Government Integration ──────── */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#37bbed]/5 via-white to-[#f4ce14]/5">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#37bbed]/10 text-[#37bbed] text-[11px] font-bold tracking-[2px] uppercase px-4 py-2 rounded-full border border-[#37bbed]/20 mb-4">
                  <Landmark className="w-4 h-4" />
                  {isEn ? "GOVERNMENT INTEGRATION" : "INTEGRACIÓN GOBIERNO"}
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">
                  {isEn
                    ? "Connected to Argentina's digital health infrastructure"
                    : "Conectado a la infraestructura de salud digital de Argentina"}
                </h2>
                <p className="text-base text-ink-light mb-6 leading-relaxed">
                  {isEn
                    ? "Cóndor Salud integrates with Mi Argentina and the national health systems — giving your practice direct access to government digital health services that streamline patient care and regulatory compliance."
                    : "Cóndor Salud se integra con Mi Argentina y los sistemas nacionales de salud — dándole a tu consultorio acceso directo a servicios de salud digital del gobierno que agilizan la atención y el cumplimiento regulatorio."}
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: QrCode,
                      titleEs: "Credencial de Salud Digital",
                      titleEn: "Digital Health Credential",
                      descEs:
                        "Verificá la cobertura de obra social del paciente al instante con la Credencial de Salud Digital de Mi Argentina. Sin llamar a la obra social, sin esperar.",
                      descEn:
                        "Verify patient insurance coverage instantly via Mi Argentina's Digital Health Credential. No calling the insurer, no waiting.",
                    },
                    {
                      icon: ClipboardList,
                      titleEs: "Registro SISA / REFES",
                      titleEn: "SISA / REFES Registry",
                      descEs:
                        "Tu consultorio queda registrado en el Sistema Integrado de Información Sanitaria (SISA) y el Registro Federal de Establecimientos de Salud (REFES). Visibilidad nacional.",
                      descEn:
                        "Your practice gets registered in the Integrated Health Information System (SISA) and Federal Health Facility Registry (REFES). National visibility.",
                    },
                    {
                      icon: Syringe,
                      titleEs: "Carnet de Vacunación Digital",
                      titleEn: "Digital Vaccination Certificate",
                      descEs:
                        "Accedé al historial de vacunación completo del paciente desde el carnet digital nacional. Cero papel, cero datos perdidos.",
                      descEn:
                        "Access the patient's complete vaccination history from the national digital certificate. Zero paper, zero lost data.",
                    },
                    {
                      icon: Fingerprint,
                      titleEs: "Verificación RENAPER",
                      titleEn: "RENAPER Identity Verification",
                      descEs:
                        "Verificá la identidad de pacientes en tiempo real con integración RENAPER. Prevení fraude y asegurá fichas médicas precisas.",
                      descEn:
                        "Verify patient identity in real time with RENAPER integration. Prevent fraud and ensure accurate medical records.",
                    },
                    {
                      icon: FileText,
                      titleEs: "Receta Electrónica Nacional",
                      titleEn: "National Digital Prescriptions",
                      descEs:
                        "Emití recetas digitales compatibles con el sistema nacional de receta electrónica. Código QR verificable en cualquier farmacia del país.",
                      descEn:
                        "Issue digital prescriptions compatible with the national e-prescription system. QR code verifiable at any pharmacy nationwide.",
                    },
                  ].map((item) => (
                    <div key={item.titleEs} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-celeste/10 flex items-center justify-center shrink-0 mt-0.5">
                        <item.icon className="w-4.5 h-4.5 text-celeste-dark" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {isEn ? item.titleEn : item.titleEs}
                        </p>
                        <p className="text-xs text-ink-light leading-relaxed">
                          {isEn ? item.descEn : item.descEs}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gov integration visual */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[#37bbed] flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">Mi Argentina</p>
                      <p className="text-[10px] text-ink-muted">
                        {isEn
                          ? "National Digital Health Platform"
                          : "Plataforma Nacional de Salud Digital"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { label: "SISA", statusEs: "Registrado", statusEn: "Registered", ok: true },
                      { label: "REFES", statusEs: "Verificado", statusEn: "Verified", ok: true },
                      { label: "RENAPER", statusEs: "Conectado", statusEn: "Connected", ok: true },
                      {
                        label: isEn ? "Digital Credential" : "Credencial Digital",
                        statusEs: "Activa",
                        statusEn: "Active",
                        ok: true,
                      },
                      {
                        label: isEn ? "E-Prescription" : "Receta Electrónica",
                        statusEs: "Habilitada",
                        statusEn: "Enabled",
                        ok: true,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between bg-surface rounded-lg px-3 py-2.5"
                      >
                        <span className="text-xs font-medium text-ink">{row.label}</span>
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isEn ? row.statusEn : row.statusEs}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-celeste-pale border border-celeste/20 rounded-xl p-4">
                  <p className="text-xs text-ink-light leading-relaxed">
                    <span className="font-semibold text-celeste-dark">
                      {isEn ? "Compliance included:" : "Cumplimiento incluido:"}{" "}
                    </span>
                    {isEn
                      ? "All regulatory integrations are handled by Cóndor Salud at no extra cost. Your practice stays compliant with national health registries automatically."
                      : "Todas las integraciones regulatorias son gestionadas por Cóndor Salud sin costo extra. Tu consultorio cumple con los registros nacionales de salud automáticamente."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Partnership Agreement ──────────────────────── */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-[11px] font-bold tracking-[2.5px] text-celeste uppercase mb-2 text-center">
              {isEn ? "PARTNERSHIP AGREEMENT" : "CONTRATO DE PARTNERSHIP"}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4 text-center">
              {isEn
                ? "What's included in your partnership"
                : "Qué incluye tu contrato de partnership"}
            </h2>
            <p className="text-base text-ink-light text-center max-w-2xl mx-auto mb-12">
              {isEn
                ? "Modeled after established medical club agreements in Argentina, your partnership contract covers comprehensive services with clear terms and no surprises."
                : "Basado en contratos de clubes médicos establecidos en Argentina, tu contrato de partnership cubre servicios integrales con términos claros y sin sorpresas."}
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Services Column */}
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-xl bg-celeste/10 flex items-center justify-center mb-3">
                  <Stethoscope className="w-5 h-5 text-celeste-dark" />
                </div>
                <h3 className="font-bold text-sm text-ink mb-3">
                  {isEn ? "Network Services" : "Servicios de la Red"}
                </h3>
                <ul className="space-y-2">
                  {(isEn
                    ? [
                        "Primary care consultations (in-person & virtual)",
                        "Same-day attention for general medicine & cardiology",
                        "Priority scheduling for 23+ specialties",
                        "Diagnostic studies (ECG, echo, Doppler, ultrasound, X-ray, mammography)",
                        "Digital prescriptions with national QR codes",
                        "Patient identity verification via RENAPER",
                        "Insurance billing through Cóndor for 280+ providers",
                      ]
                    : [
                        "Consultas de atención primaria (presencial y virtual)",
                        "Atención el mismo día para clínica médica y cardiología",
                        "Turnos prioritarios para 23+ especialidades",
                        "Estudios diagnósticos (ECG, eco, Doppler, ecografía, Rx, mamografía)",
                        "Recetas digitales con código QR nacional",
                        "Verificación de identidad de pacientes vía RENAPER",
                        "Facturación de obras sociales por Cóndor para 280+ prestadoras",
                      ]
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-celeste-dark mt-0.5 shrink-0" />
                      <span className="text-xs text-ink-light leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Specialties Column */}
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-xl bg-celeste/10 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-celeste-dark" />
                </div>
                <h3 className="font-bold text-sm text-ink mb-3">
                  {isEn ? "23+ Medical Specialties" : "23+ Especialidades Médicas"}
                </h3>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {[
                    { es: "Clínica Médica", en: "Internal Medicine" },
                    { es: "Cardiología", en: "Cardiology" },
                    { es: "Traumatología", en: "Orthopedics" },
                    { es: "Urología", en: "Urology" },
                    { es: "Dermatología", en: "Dermatology" },
                    { es: "Gastroenterología", en: "Gastroenterology" },
                    { es: "Ginecología", en: "Gynecology" },
                    { es: "Oftalmología", en: "Ophthalmology" },
                    { es: "Infectología", en: "Infectious Disease" },
                    { es: "Neumonología", en: "Pulmonology" },
                    { es: "Alergia", en: "Allergy" },
                    { es: "Hematología", en: "Hematology" },
                    { es: "ORL", en: "ENT" },
                    { es: "Psicología", en: "Psychology" },
                    { es: "Neurología", en: "Neurology" },
                    { es: "Endocrinología", en: "Endocrinology" },
                    { es: "Flebología", en: "Phlebology" },
                    { es: "Cirugía Vascular", en: "Vascular Surgery" },
                    { es: "Kinesiología", en: "Physiotherapy" },
                    { es: "Fonoaudiología", en: "Speech Therapy" },
                    { es: "Odontología", en: "Dentistry" },
                  ].map((spec) => (
                    <span key={spec.es} className="text-[11px] text-ink-light">
                      {isEn ? spec.en : spec.es}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contract Terms Column */}
              <div className="bg-white border border-border rounded-xl p-6">
                <div className="w-10 h-10 rounded-xl bg-celeste/10 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5 text-celeste-dark" />
                </div>
                <h3 className="font-bold text-sm text-ink mb-3">
                  {isEn ? "Clear Contract Terms" : "Términos Claros de Contrato"}
                </h3>
                <ul className="space-y-2.5">
                  {(isEn
                    ? [
                        {
                          label: "No pre-existing condition exclusions",
                          desc: "Every patient is welcome, regardless of health history.",
                        },
                        {
                          label: "No waiting periods",
                          desc: "Start receiving patients from day one of your membership.",
                        },
                        {
                          label: "Annual partnership with monthly billing",
                          desc: "$10,000 ARS/month. Cancel anytime with 30 days notice.",
                        },
                        {
                          label: "12-month ROI guarantee",
                          desc: "If referrals don't cover your fees, we refund the difference.",
                        },
                        {
                          label: "Transparent scope of services",
                          desc: "Clear list of included and excluded services. No hidden limits.",
                        },
                        {
                          label: "CABA jurisdiction",
                          desc: "All disputes resolved in Buenos Aires courts.",
                        },
                      ]
                    : [
                        {
                          label: "Sin exclusión de patologías preexistentes",
                          desc: "Todo paciente es bienvenido, sin importar su historial de salud.",
                        },
                        {
                          label: "Sin períodos de carencia",
                          desc: "Empezá a recibir pacientes desde el día uno de tu membresía.",
                        },
                        {
                          label: "Partnership anual con facturación mensual",
                          desc: "$10.000 ARS/mes. Cancelá cuando quieras con 30 días de preaviso.",
                        },
                        {
                          label: "Garantía de ROI a 12 meses",
                          desc: "Si las derivaciones no cubren tu cuota, te devolvemos la diferencia.",
                        },
                        {
                          label: "Alcance transparente de servicios",
                          desc: "Lista clara de servicios incluidos y excluidos. Sin límites ocultos.",
                        },
                        {
                          label: "Jurisdicción CABA",
                          desc: "Cualquier controversia se resuelve en tribunales de Buenos Aires.",
                        },
                      ]
                  ).map((term) => (
                    <li key={term.label}>
                      <p className="text-xs font-semibold text-ink">{term.label}</p>
                      <p className="text-[11px] text-ink-muted leading-relaxed">{term.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Diagnostic Studies Available */}
            <div className="bg-white border border-border rounded-xl p-6">
              <h3 className="font-bold text-sm text-ink mb-4 text-center">
                {isEn
                  ? "26+ Diagnostic Studies Available Through the Network"
                  : "26+ Estudios Diagnósticos Disponibles en la Red"}
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {(isEn
                  ? [
                      "Lab Work",
                      "X-Ray",
                      "Spirometry",
                      "Ultrasound & Doppler",
                      "ECG",
                      "Echocardiogram",
                      "Echo-guided Biopsy",
                      "Vascular Doppler",
                      "Ankle-Brachial Index",
                      "Stress Test",
                      "Pharmacological Stress Echo",
                      "Holter Monitor",
                      "Blood Pressure Map",
                      "Tilt Test",
                      "Fundoscopy",
                      "Pressotherapy",
                      "Physiotherapy",
                      "Pap & Colpo",
                      "Pain Management",
                      "Urodynamics",
                      "Endoscopy",
                      "Laryngoscopy",
                      "Minor Ambulatory Surgery",
                      "Allergy Testing",
                      "Audiometry",
                      "Mammography",
                    ]
                  : [
                      "Laboratorio",
                      "Radiografía",
                      "Espirometría",
                      "Ecografía y Doppler",
                      "ECG",
                      "Ecocardiograma",
                      "Biopsia guiada por eco",
                      "Doppler vascular",
                      "Índice braquio-crural",
                      "Ergometría",
                      "Eco stress farmacológico",
                      "Holter de arritmias",
                      "MAPA",
                      "Tilt test",
                      "Fondo de ojo",
                      "Presoterapia",
                      "Kinesiología",
                      "Pap y colpo",
                      "Manejo del dolor",
                      "Urodinamia",
                      "VEDA/VCC",
                      "Laringoscopía",
                      "Cirugía menor ambulatoria",
                      "Test de alergias",
                      "Audiometría",
                      "Mamografía",
                    ]
                ).map((study) => (
                  <span
                    key={study}
                    className="text-[11px] bg-surface border border-border/60 rounded-lg px-3 py-1.5 text-ink-muted font-medium"
                  >
                    {study}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Plan & ROI (continued) ─────────────────────── */}
        <section id="planes" className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* Plan Card */}
              <div>
                <p className="text-[11px] font-bold tracking-[2.5px] text-celeste uppercase mb-2">
                  {isEn ? "SIMPLE PRICING" : "PRECIO SIMPLE"}
                </p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-4">
                  {isEn ? "One plan. Everything included." : "Un plan. Todo incluido."}
                </h2>
                <p className="text-base text-ink-light mb-8">
                  {isEn
                    ? "No hidden fees. No per-appointment charges. No commissions. One flat monthly fee that pays for itself."
                    : "Sin costos ocultos. Sin cobro por turno. Sin comisiones. Una cuota mensual fija que se paga sola."}
                </p>

                <div className="bg-gradient-to-br from-celeste-pale via-white to-gold/5 border-2 border-celeste-dark rounded-2xl p-8 relative">
                  <div className="absolute -top-3 right-4 bg-gold text-ink text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {isEn ? "ROI GUARANTEED" : "ROI GARANTIZADO"}
                  </div>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-celeste-dark flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-ink">
                        {isEn ? "Doctor Partner" : "Médico Partner"}
                      </h3>
                      <p className="text-xs text-ink-muted">
                        {isEn ? "Full network access" : "Acceso completo a la red"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-4xl font-display font-bold text-celeste-dark">
                      $10.000
                    </span>
                    <span className="text-sm text-ink-muted">ARS/{isEn ? "month" : "mes"}</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {(isEn
                      ? [
                          "Listed in Cóndor Salud patient network",
                          "AI-powered patient referrals from Cora chatbot",
                          "SEO-optimized public doctor profile",
                          "Uber/Cabify/InDrive ride integration",
                          "Built-in HD teleconsulta (Daily.co)",
                          "Bill ANY insurance through Cóndor",
                          "WhatsApp automated reminders",
                          "Practice analytics dashboard",
                          "Digital prescriptions with QR codes",
                          "Medical tourism patient access",
                          "24/7 online appointment booking",
                          "Mi Argentina / SISA / REFES integration",
                          "RENAPER patient identity verification",
                          "Access to 23+ specialties & 26+ diagnostic studies",
                          "$0 per-appointment fees — unlimited bookings",
                          "12-month ROI guarantee",
                        ]
                      : [
                          "Listado en la red de pacientes de Cóndor Salud",
                          "Derivaciones de pacientes por IA con chatbot Cora",
                          "Perfil médico público optimizado para SEO",
                          "Integración Uber/Cabify/InDrive para pacientes",
                          "Teleconsulta HD integrada (Daily.co)",
                          "Facturá CUALQUIER obra social por Cóndor",
                          "Recordatorios automáticos por WhatsApp",
                          "Dashboard de analíticas de consultorio",
                          "Recetas digitales con código QR",
                          "Acceso a pacientes de turismo médico",
                          "Agenda de turnos online 24/7",
                          "Integración Mi Argentina / SISA / REFES",
                          "Verificación de identidad RENAPER",
                          "Acceso a 23+ especialidades y 26+ estudios diagnósticos",
                          "$0 por turno — turnos ilimitados",
                          "Garantía de ROI a 12 meses",
                        ]
                    ).map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-celeste-dark mt-0.5 shrink-0" />
                        <span className="text-sm text-ink">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={whatsappUrl(
                      isEn
                        ? "Hi, I'd like to sign up as a Doctor Partner with Cóndor Salud"
                        : "Hola, quiero registrarme como Médico Partner de Cóndor Salud",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center py-3.5 rounded-full text-base font-bold bg-celeste-dark text-white hover:bg-celeste-700 transition-colors shadow-lg shadow-celeste/20"
                  >
                    {isEn ? "Apply Now — Start Growing" : "Sumarme Ahora — Empezá a Crecer"}{" "}
                    <ArrowRight className="w-4 h-4 inline" />
                  </a>
                </div>

                {/* Money-back guarantee */}
                <div className="mt-4 flex items-start gap-3 bg-gold/5 border border-gold/20 rounded-xl p-4">
                  <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {isEn ? "12-Month ROI Guarantee" : "Garantía de ROI a 12 Meses"}
                    </p>
                    <p className="text-xs text-ink-light leading-relaxed">
                      {isEn
                        ? "If the revenue from patients referred through Cóndor Salud doesn't exceed your annual membership cost ($120,000 ARS) within 12 months, we'll refund the difference. No questions asked."
                        : "Si los ingresos de pacientes derivados por Cóndor Salud no superan tu costo anual de membresía ($120.000 ARS) en 12 meses, te devolvemos la diferencia. Sin preguntas."}
                    </p>
                  </div>
                </div>
              </div>

              {/* ROI Calculator */}
              <div className="sticky top-24">
                <ROICalculator isEn={isEn} />

                {/* Social proof */}
                <div className="mt-6 bg-white border border-border rounded-xl p-5">
                  <p className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
                    {isEn ? "WHAT DOCTORS SAY" : "QUÉ DICEN LOS MÉDICOS"}
                  </p>
                  <div className="space-y-4">
                    {[
                      {
                        quote: isEn
                          ? "I was paying Doctoralia $22,000/mo and barely getting 3 patients. With Cóndor I get 10+ and pay half."
                          : "Le pagaba a Doctoralia $22.000/mes y apenas conseguía 3 pacientes. Con Cóndor consigo 10+ y pago la mitad.",
                        name: "Dra. Valentina Ruiz",
                        spec: isEn ? "Dermatology, CABA" : "Dermatología, CABA",
                      },
                      {
                        quote: isEn
                          ? "The insurance billing feature alone is worth it. I used to reject PAMI patients — now I see them all and get paid."
                          : "Solo la facturación de obras sociales ya vale la pena. Antes rechazaba pacientes de PAMI — ahora los atiendo a todos y cobro.",
                        name: "Dr. Marcos Agüero",
                        spec: isEn ? "Cardiology, Córdoba" : "Cardiología, Córdoba",
                      },
                    ].map((t) => (
                      <div key={t.name} className="border-l-2 border-celeste pl-4">
                        <p className="text-sm text-ink-light italic leading-relaxed">
                          &ldquo;{t.quote}&rdquo;
                        </p>
                        <p className="text-xs font-semibold text-ink mt-1">{t.name}</p>
                        <p className="text-[10px] text-ink-muted">{t.spec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-surface">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[11px] font-bold tracking-[2.5px] text-celeste uppercase mb-2 text-center">
              {isEn ? "HOW IT WORKS" : "CÓMO FUNCIONA"}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mb-12 text-center">
              {isEn ? "Live in 24 hours" : "En vivo en 24 horas"}
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: "1",
                  icon: Phone,
                  titleEs: "Contactanos",
                  titleEn: "Contact us",
                  descEs:
                    "Completá el formulario o escribinos por WhatsApp. Te respondemos en minutos.",
                  descEn: "Fill the form or message us on WhatsApp. We respond in minutes.",
                },
                {
                  step: "2",
                  icon: BadgeCheck,
                  titleEs: "Verificación",
                  titleEn: "Verification",
                  descEs: "Verificamos tu matrícula y especialidad. Proceso rápido y seguro.",
                  descEn: "We verify your license and specialty. Quick and secure process.",
                },
                {
                  step: "3",
                  icon: Stethoscope,
                  titleEs: "Perfil activo",
                  titleEn: "Profile goes live",
                  descEs:
                    "Tu perfil se publica con SEO optimizado. Cora empieza a derivarte pacientes.",
                  descEn: "Your profile goes live with SEO. Cora starts referring patients to you.",
                },
                {
                  step: "4",
                  icon: Users,
                  titleEs: "Recibí pacientes",
                  titleEn: "Receive patients",
                  descEs:
                    "Los pacientes te encuentran, agendan y llegan. Vos atendés, nosotros facturamos.",
                  descEn: "Patients find you, book, and arrive. You treat, we bill.",
                },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-celeste-dark text-white flex items-center justify-center mx-auto mb-4">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-bold tracking-[2px] text-celeste uppercase mb-1">
                    {isEn ? `Step ${s.step}` : `Paso ${s.step}`}
                  </div>
                  <h3 className="font-bold text-base text-ink mb-1">
                    {isEn ? s.titleEn : s.titleEs}
                  </h3>
                  <p className="text-sm text-ink-light">{isEn ? s.descEn : s.descEs}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-[11px] font-bold tracking-[2.5px] text-celeste uppercase mb-2 text-center">
              FAQ
            </p>
            <h2 className="font-display text-3xl font-bold text-ink mb-8 text-center">
              {isEn ? "Frequently asked questions" : "Preguntas frecuentes"}
            </h2>

            <div className="space-y-3">
              {[
                {
                  q: isEn
                    ? "How does the ROI guarantee work?"
                    : "¿Cómo funciona la garantía de ROI?",
                  a: isEn
                    ? "If the total revenue from patients referred through our platform doesn't exceed $120,000 ARS (your annual fee) within 12 months of joining, we refund the difference. We track referrals through our platform analytics, so both sides have full transparency."
                    : "Si los ingresos totales de pacientes derivados por nuestra plataforma no superan $120.000 ARS (tu cuota anual) en 12 meses desde el alta, te devolvemos la diferencia. Rastreamos las derivaciones con analíticas de la plataforma, así ambas partes tienen transparencia total.",
                },
                {
                  q: isEn
                    ? "How does the insurance billing work?"
                    : "¿Cómo funciona la facturación de obras sociales?",
                  a: isEn
                    ? "When a patient has an insurance you don't contract with, you click 'Bill through Cóndor' in your dashboard. We submit the claim under our contract, process payment, and transfer it to you within 15 business days. There's no extra fee — it's included in your membership."
                    : "Cuando un paciente tiene una obra social con la que no contratás, hacés click en 'Facturar por Cóndor' en tu dashboard. Presentamos el reclamo bajo nuestro contrato, procesamos el pago y te lo transferimos en 15 días hábiles. No hay costo extra — está incluido en tu membresía.",
                },
                {
                  q: isEn
                    ? "What's the difference between this and Doctoralia?"
                    : "¿Cuál es la diferencia con Doctoralia?",
                  a: isEn
                    ? "Doctoralia charges $20,000+/mo or per-appointment fees and only gives you a listing. We charge half the price and give you AI referrals, insurance billing, ride integrations, teleconsulta, analytics, digital prescriptions, WhatsApp reminders, medical tourism patients, and an ROI guarantee. They're a directory — we're a growth engine."
                    : "Doctoralia cobra $20.000+/mes o por turno y solo te da un listado. Nosotros cobramos la mitad y te damos derivaciones IA, facturación de obras sociales, integración con apps de transporte, teleconsulta, analíticas, recetas digitales, recordatorios WhatsApp, pacientes de turismo médico y garantía de ROI. Ellos son un directorio — nosotros somos un motor de crecimiento.",
                },
                {
                  q: isEn ? "Can I cancel anytime?" : "¿Puedo cancelar en cualquier momento?",
                  a: isEn
                    ? "Yes. No lock-in contracts. Cancel anytime from your dashboard. If you cancel within the first 12 months and haven't hit ROI, we'll still honor the guarantee."
                    : "Sí. Sin contratos de permanencia. Cancelá cuando quieras desde tu dashboard. Si cancelás antes de los 12 meses y no llegaste al ROI, igualmente honramos la garantía.",
                },
                {
                  q: isEn
                    ? "How do AI referrals work?"
                    : "¿Cómo funcionan las derivaciones por IA?",
                  a: isEn
                    ? "Our chatbot Cora interacts with thousands of patients daily — triaging symptoms, answering questions, and recommending specialists. When a patient needs your specialty in your area, Cora recommends you directly and helps them book an appointment."
                    : "Nuestro chatbot Cora interactúa con miles de pacientes diariamente — evaluando síntomas, respondiendo preguntas y recomendando especialistas. Cuando un paciente necesita tu especialidad en tu zona, Cora te recomienda directamente y lo ayuda a agendar turno.",
                },
                {
                  q: isEn
                    ? "What if I already use another platform?"
                    : "¿Qué pasa si ya uso otra plataforma?",
                  a: isEn
                    ? "You can use both. There's no exclusivity requirement. Many doctors find they can cancel their other subscription within 2–3 months because Cóndor delivers better results at a lower price."
                    : "Podés usar ambas. No hay requisito de exclusividad. Muchos médicos descubren que pueden cancelar su otra suscripción en 2–3 meses porque Cóndor da mejores resultados a menor precio.",
                },
                {
                  q: isEn
                    ? "How does the Mi Argentina integration work?"
                    : "¿Cómo funciona la integración con Mi Argentina?",
                  a: isEn
                    ? "We connect your practice to Argentina's national digital health infrastructure. This includes SISA (health information system), REFES (facility registry), RENAPER (identity verification), the Digital Health Credential for instant insurance verification, and the national e-prescription system. All integrations are set up automatically when you join — no extra cost, no extra work."
                    : "Conectamos tu consultorio a la infraestructura de salud digital nacional de Argentina. Esto incluye SISA (sistema de información sanitaria), REFES (registro de establecimientos), RENAPER (verificación de identidad), la Credencial de Salud Digital para verificar obras sociales al instante y el sistema nacional de receta electrónica. Todas las integraciones se configuran automáticamente al sumarte — sin costo extra, sin trabajo adicional.",
                },
                {
                  q: isEn
                    ? "What does the partnership contract include?"
                    : "¿Qué incluye el contrato de partnership?",
                  a: isEn
                    ? "Your partnership agreement covers: access to 23+ medical specialties and 26+ diagnostic studies through the network, same-day attention guarantees for general medicine and cardiology, insurance billing for 280+ providers, no exclusion of pre-existing conditions, no waiting periods, annual contract with monthly billing at $10,000 ARS/month, 30-day cancellation notice, 12-month ROI guarantee, and clear service scope with no hidden limits. The contract is governed by CABA jurisdiction."
                    : "Tu contrato de partnership incluye: acceso a 23+ especialidades médicas y 26+ estudios diagnósticos a través de la red, garantía de atención el mismo día para clínica médica y cardiología, facturación de obras sociales para 280+ prestadoras, sin exclusión de patologías preexistentes, sin carencia, contrato anual con facturación mensual a $10.000 ARS/mes, cancelación con 30 días de preaviso, garantía de ROI a 12 meses y alcance de servicios claro sin límites ocultos. El contrato se rige por jurisdicción CABA.",
                },
                {
                  q: isEn
                    ? "What diagnostic equipment does the network have?"
                    : "¿Qué equipamiento diagnóstico tiene la red?",
                  a: isEn
                    ? "The Cóndor Salud network includes facilities with multi-slice CT scanners, digital X-ray, dental CT, 3+ ultrasound machines (general and Doppler), echocardiography equipment, stress test systems (ergometric and pharmacological), Holter monitors, ambulatory blood pressure monitoring (ABPM), spirometry, ophthalmology equipment, and in-house laboratory services. All available to your patients through the network."
                    : "La red de Cóndor Salud incluye centros con tomógrafo multicorte, rayos X digital, tomógrafo dental, 3+ ecógrafos (generales y Doppler), equipo de ecocardiografía, sistemas de ergometría y eco stress farmacológico, Holter, MAPA de presión arterial, espirometría, equipamiento de oftalmología y laboratorio propio. Todo disponible para tus pacientes a través de la red.",
                },
              ].map((item, i) => (
                <details key={i} className="group border border-border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-ink hover:bg-surface/50 transition">
                    {item.q}
                    <ChevronRight className="w-4 h-4 text-ink/40 transition-transform group-open:rotate-90 shrink-0 ml-2" />
                  </summary>
                  <div className="px-5 pb-4 text-sm text-ink/70 leading-relaxed">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────── */}
        <section className="bg-gradient-to-r from-celeste-dark to-celeste-700 text-white py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <Heart className="w-10 h-10 text-gold mx-auto mb-4" />
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {isEn
                ? "Your next patient is searching right now"
                : "Tu próximo paciente está buscando ahora mismo"}
            </h2>
            <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
              {isEn
                ? "$10,000 ARS/month. ROI guaranteed. Zero per-appointment fees. Join the medical network that actually brings you patients."
                : "$10.000 ARS/mes. ROI garantizado. Cero costos por turno. Sumate a la red médica que realmente te trae pacientes."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={whatsappUrl(
                  isEn
                    ? "Hi, I want to join the Cóndor Salud doctor partner network"
                    : "Hola, quiero sumarme a la red de médicos partner de Cóndor Salud",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-celeste-dark px-8 py-4 rounded-full font-bold text-base hover:bg-white/90 transition-colors"
              >
                {isEn ? "Apply Now" : "Sumarme Ahora"} <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href={`tel:${isEn ? "+5491100000000" : "+5491100000000"}`}
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-6 py-4 rounded-full font-bold text-sm hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {isEn ? "Call us directly" : "Llamanos directamente"}
              </a>
            </div>
            <p className="text-white/40 text-xs mt-6">
              {isEn
                ? "We respond to all applications within 24 hours."
                : "Respondemos todas las solicitudes en menos de 24 horas."}
            </p>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
