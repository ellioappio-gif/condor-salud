"use client";
/**
 * Receptionist First-Run Setup
 * /dashboard/bienvenida-recepcion
 *
 * A lightweight 3-step wizard shown once to new receptionists on first login:
 *   1. Welcome — overview of what they'll manage
 *   2. Connect WhatsApp via Twilio (Account SID + Auth Token + number)
 *   3. All set — go to dashboard
 *
 * On completion sets user_metadata.wa_setup_complete = true so
 * middleware stops redirecting here.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  Bell,
  ClipboardList,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/Toast";

type Step = 0 | 1 | 2;

const STEPS = ["Bienvenida", "WhatsApp", "¡Listo!"] as const;

export default function BienvenidaRecepcionPage() {
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  // Twilio form fields
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const router = useRouter();
  const { showToast } = useToast();

  // If this clinic already has WhatsApp configured, skip step 2
  useEffect(() => {
    fetch("/api/whatsapp/config-status")
      .then((r) => r.json())
      .then((d: { configured: boolean }) => {
        if (d.configured) setConnected(true);
      })
      .catch(() => {});
  }, []);

  const markComplete = async () => {
    setSaving(true);
    try {
      await fetch("/api/auth/complete-setup", { method: "POST" });
    } catch {
      // Non-fatal
    }
    router.replace("/dashboard");
  };

  const handleTwilioConnect = async () => {
    if (!accountSid.trim() || !authToken.trim() || !whatsappNumber.trim()) {
      setConnectError("Completá los tres campos para continuar.");
      return;
    }
    setConnecting(true);
    setConnectError(null);
    try {
      const resp = await fetch("/api/whatsapp/twilio-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountSid: accountSid.trim(),
          authToken: authToken.trim(),
          whatsappNumber: whatsappNumber.trim(),
        }),
      });
      const data = (await resp.json()) as { success: boolean; error?: string };
      if (!resp.ok || !data.success) {
        setConnectError(data.error ?? "No se pudo verificar las credenciales de Twilio.");
        return;
      }
      setConnected(true);
      showToast("¡WhatsApp conectado correctamente!", "success");
      setStep(2);
    } catch {
      setConnectError("Error de conexión. Revisá los datos e intentá de nuevo.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                      ? "bg-celeste-dark text-white"
                      : "bg-border text-ink-muted"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  i === step ? "text-ink" : "text-ink-muted"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-border hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          {/* ── Step 0: Welcome ─────────────────────────────── */}
          {step === 0 && (
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-celeste-pale flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7 text-celeste-dark" />
                </div>
                <h1 className="text-2xl font-bold text-ink">¡Bienvenida a Cóndor Salud!</h1>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Este es tu panel de recepción. En pocos minutos vas a tener todo listo para
                  gestionar turnos y comunicarte con los pacientes.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    icon: Calendar,
                    title: "Agenda y turnos",
                    desc: "Agendá, confirmá y reprogramá turnos desde la vista diaria o semanal.",
                  },
                  {
                    icon: Users,
                    title: "Gestión de pacientes",
                    desc: "Creá y buscá fichas de pacientes, y gestioná sus coberturas.",
                  },
                  {
                    icon: MessageCircle,
                    title: "Inbox de WhatsApp",
                    desc: "Respondé consultas y enviá recordatorios sin salir del sistema.",
                  },
                  {
                    icon: Bell,
                    title: "Recordatorios automáticos",
                    desc: "El sistema envía recordatorios de turno por WhatsApp 24h y 2h antes.",
                  },
                  {
                    icon: ClipboardList,
                    title: "Reportes de asistencia",
                    desc: "Confirmados, ausentes y cancelados en tiempo real.",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border-light bg-surface"
                  >
                    <div className="w-8 h-8 rounded-lg bg-celeste-pale flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-celeste-dark" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink">{title}</p>
                      <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 text-sm font-semibold bg-celeste-dark text-white rounded-lg hover:bg-celeste transition"
              >
                {connected ? "Revisar configuración →" : "Continuar →"}
              </button>
            </div>
          )}

          {/* ── Step 1: Twilio WhatsApp connect ──────────────── */}
          {step === 1 && (
            <div className="p-8 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#25D366]" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-ink">Conectá WhatsApp via Twilio</h2>
                <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
                  Pegá tus credenciales de Twilio y el número de WhatsApp. Los recordatorios y
                  mensajes de la clínica se enviarán desde esa línea.
                </p>
              </div>

              {connected && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <p className="text-xs text-green-700 font-medium">
                    WhatsApp ya está configurado para esta clínica.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-celeste-100 bg-celeste-50/40 p-4">
                <p className="text-xs font-semibold text-ink mb-2">¿Dónde encuentro estos datos?</p>
                <ol className="text-xs text-ink-muted space-y-1.5 list-decimal pl-4">
                  <li>
                    Ingresá a{" "}
                    <a
                      href="https://console.twilio.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-celeste-dark hover:underline inline-flex items-center gap-0.5"
                    >
                      console.twilio.com <ExternalLink className="w-3 h-3" />
                    </a>{" "}
                    y creá una cuenta gratuita si no tenés.
                  </li>
                  <li>
                    En el panel principal encontrás el{" "}
                    <strong className="text-ink">Account SID</strong> y el{" "}
                    <strong className="text-ink">Auth Token</strong>.
                  </li>
                  <li>
                    En <em>Messaging → Senders → WhatsApp</em>, activá el sandbox o comprá un
                    número. Ese es el <strong className="text-ink">número de WhatsApp</strong> (ej:{" "}
                    <code className="bg-white border border-border rounded px-1">+14155238886</code>
                    ).
                  </li>
                </ol>
              </div>

              {connectError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">{connectError}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase block mb-1">
                    Account SID
                  </label>
                  <input
                    type="text"
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full rounded-[4px] border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-celeste-dark"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase block mb-1">
                    Auth Token
                  </label>
                  <div className="flex items-center rounded-[4px] border border-border focus-within:ring-2 focus-within:ring-celeste-dark">
                    <input
                      type={showToken ? "text" : "password"}
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="????????????????????????????????"
                      className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none rounded-l-[4px]"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken((v) => !v)}
                      className="px-3 text-ink-muted hover:text-ink transition"
                      aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase block mb-1">
                    Número de WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+14155238886"
                    className="w-full rounded-[4px] border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-celeste-dark"
                  />
                  <p className="mt-1 text-[10px] text-ink-muted">
                    Incluí el prefijo internacional, sin espacios.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2 text-sm border border-border rounded-[4px] text-ink-light hover:border-celeste-dark transition"
                >
                  Atrás
                </button>
                <button
                  onClick={handleTwilioConnect}
                  disabled={connecting || !accountSid || !authToken || !whatsappNumber}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verificando…
                    </>
                  ) : (
                    "Conectar WhatsApp →"
                  )}
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full text-xs text-ink-muted hover:text-ink transition py-1 text-center"
              >
                Hacer después →
              </button>
            </div>
          )}

          {/* ── Step 2: Done ─────────────────────────────────── */}
          {step === 2 && (
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-ink">
                  {connected ? "¡WhatsApp conectado!" : "¡Todo listo!"}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
                  {connected
                    ? "Los recordatorios y mensajes de la clínica se enviarán desde tu número de Twilio."
                    : "Podés conectar WhatsApp en cualquier momento desde Configuración → WhatsApp."}
                </p>
              </div>
              <button
                onClick={markComplete}
                disabled={saving}
                className="w-full py-3 text-sm font-semibold bg-celeste-dark text-white rounded-lg hover:bg-celeste transition disabled:opacity-50"
              >
                {saving ? "Iniciando…" : "Ir al dashboard →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
