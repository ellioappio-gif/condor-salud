"use client";
/**
 * Meta Embedded Signup — WhatsApp Business Connect
 *
 * Lets receptionists connect their own WhatsApp Business account
 * by launching Meta's official Embedded Signup popup flow.
 *
 * Flow:
 *   1. User clicks "Conectar con Meta"
 *   2. Meta popup opens → user logs in to Facebook, selects or creates
 *      a WhatsApp Business account, and grants permissions
 *   3. Meta redirects back with an authorization code
 *   4. We POST that code to /api/whatsapp/meta-connect → exchanges for
 *      access token + phone number ID → saves to whatsapp_config
 *   5. On success, onComplete() is called by the parent
 *
 * Manual fallback: paste Phone Number ID + Access Token directly.
 */

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, ExternalLink, Eye, EyeOff, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface MetaSignupResult {
  phoneNumberId: string;
  wabaId: string; // WhatsApp Business Account ID
  accessToken: string;
  phoneNumber?: string; // display number, if returned
}

export interface MetaEmbeddedSignupProps {
  /** Called when the user successfully connects WA Business */
  onComplete: (result: MetaSignupResult) => void;
  /** Called when the user clicks "Hacer después" / skip */
  onSkip?: () => void;
  /** Whether to show the skip button */
  allowSkip?: boolean;
}

// ─── FB SDK type shim ─────────────────────────────────────────

declare global {
  interface Window {
    FB?: {
      init: (opts: {
        appId: string;
        autoLogAppEvents: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: { code: string; accessToken?: string };
          status: string;
        }) => void,
        opts: { scope: string; response_type: string; extras?: Record<string, unknown> },
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

// ─── Component ───────────────────────────────────────────────

export function MetaEmbeddedSignup({
  onComplete,
  onSkip,
  allowSkip = true,
}: MetaEmbeddedSignupProps) {
  const [mode, setMode] = useState<"choice" | "loading" | "manual" | "success" | "error">("choice");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MetaSignupResult | null>(null);

  // Manual fallback state
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);

  const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";

  // ── Load Facebook SDK ─────────────────────────────────────
  useEffect(() => {
    if (!META_APP_ID || typeof window === "undefined") return;
    if (window.FB) return; // already loaded

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v21.0",
      });
    };

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [META_APP_ID]);

  // ── Handle message from Meta popup ───────────────────────
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.origin !== "https://www.facebook.com") return;

      type MetaMsg =
        | {
            type: "WA_EMBEDDED_SIGNUP";
            event: "FINISH";
            data: { phone_number_id: string; waba_id: string };
          }
        | { type: "WA_EMBEDDED_SIGNUP"; event: "CANCEL" | "ERROR"; data?: unknown };

      const msg = event.data as MetaMsg;
      if (msg?.type !== "WA_EMBEDDED_SIGNUP") return;

      if (msg.event === "FINISH") {
        const { phone_number_id, waba_id } = msg.data;
        // The FB.login callback has the code; connect here via API
        await handleConnectWithIds(phone_number_id, waba_id);
      } else if (msg.event === "CANCEL") {
        setMode("choice");
        setError("La conexión fue cancelada. Podés intentarlo de nuevo.");
      } else {
        setMode("error");
        setError("Ocurrió un error durante la conexión con Meta. Intentá el método manual.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // ── Launch Meta Embedded Signup ───────────────────────────
  const launchMetaSignup = () => {
    if (!META_APP_ID) {
      setError(
        "La configuración de Meta no está completa (falta NEXT_PUBLIC_META_APP_ID). Usá el método manual.",
      );
      setMode("manual");
      return;
    }

    if (!window.FB) {
      setError("El SDK de Facebook aún está cargando. Intentá de nuevo en unos segundos.");
      return;
    }

    setMode("loading");
    setError(null);

    window.FB.login(
      async (response) => {
        if (response.authResponse?.code) {
          // Exchange code for token via our API
          try {
            await handleCodeExchange(response.authResponse.code);
          } catch {
            setMode("error");
            setError("Error al procesar la autorización de Meta. Intentá el método manual.");
          }
        } else {
          setMode("choice");
          setError("No se completó la autorización con Meta. Podés intentarlo de nuevo.");
        }
      },
      {
        scope: "business_management,whatsapp_business_management,whatsapp_business_messaging",
        response_type: "code",
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      },
    );
  };

  // ── Exchange OAuth code for token ─────────────────────────
  const handleCodeExchange = async (code: string) => {
    setMode("loading");
    const resp = await fetch("/api/whatsapp/meta-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = (await resp.json()) as {
      success: boolean;
      phoneNumberId?: string;
      wabaId?: string;
      accessToken?: string;
      phoneNumber?: string;
      error?: string;
    };

    if (!resp.ok || !data.success) {
      throw new Error(data.error ?? "Token exchange failed");
    }

    const signupResult: MetaSignupResult = {
      phoneNumberId: data.phoneNumberId!,
      wabaId: data.wabaId!,
      accessToken: data.accessToken!,
      phoneNumber: data.phoneNumber,
    };
    setResult(signupResult);
    setMode("success");
    onComplete(signupResult);
  };

  // ── Connect with known IDs (from postMessage) ────────────
  const handleConnectWithIds = async (phoneNumberId: string, wabaId: string) => {
    setMode("loading");
    const resp = await fetch("/api/whatsapp/meta-connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumberId, wabaId }),
    });

    const data = (await resp.json()) as {
      success: boolean;
      phoneNumberId?: string;
      wabaId?: string;
      accessToken?: string;
      phoneNumber?: string;
      error?: string;
    };

    if (!resp.ok || !data.success) {
      setMode("error");
      setError(data.error ?? "Error guardando la conexión. Intentá el método manual.");
      return;
    }

    const signupResult: MetaSignupResult = {
      phoneNumberId: data.phoneNumberId ?? phoneNumberId,
      wabaId: data.wabaId ?? wabaId,
      accessToken: data.accessToken ?? "",
      phoneNumber: data.phoneNumber,
    };
    setResult(signupResult);
    setMode("success");
    onComplete(signupResult);
  };

  // ── Manual save ───────────────────────────────────────────
  const handleManualSave = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      setError("Completá el Phone Number ID y el Access Token para continuar.");
      return;
    }
    setManualSaving(true);
    setError(null);

    try {
      const resp = await fetch("/api/whatsapp/meta-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId: phoneNumberId.trim(),
          accessToken: accessToken.trim(),
          manual: true,
        }),
      });

      const data = (await resp.json()) as {
        success: boolean;
        phoneNumber?: string;
        error?: string;
      };

      if (!resp.ok || !data.success) {
        setError(data.error ?? "No se pudo guardar la configuración.");
        return;
      }

      const signupResult: MetaSignupResult = {
        phoneNumberId: phoneNumberId.trim(),
        wabaId: "",
        accessToken: accessToken.trim(),
        phoneNumber: data.phoneNumber,
      };
      setResult(signupResult);
      setMode("success");
      onComplete(signupResult);
    } finally {
      setManualSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  if (mode === "success") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
        <h3 className="text-base font-bold text-ink">¡WhatsApp Business conectado!</h3>
        {result?.phoneNumber && (
          <p className="text-sm text-ink-muted">
            Número activo: <span className="font-semibold text-ink">{result.phoneNumber}</span>
          </p>
        )}
        <p className="text-xs text-ink-muted">
          Los recordatorios, confirmaciones y mensajes del CRM se enviarán desde esta línea.
        </p>
      </div>
    );
  }

  if (mode === "loading") {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-celeste-dark mx-auto animate-spin" />
        <p className="text-sm font-semibold text-ink">Conectando con Meta…</p>
        <p className="text-xs text-ink-muted">Esto puede tardar unos segundos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      {mode === "choice" && (
        <>
          {/* Primary: Meta Embedded Signup */}
          <button
            onClick={launchMetaSignup}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-lg bg-[#1877F2] text-white text-sm font-bold hover:bg-[#166FE5] transition shadow-sm"
          >
            {/* Facebook logo */}
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Iniciar sesión con Facebook / Meta Business
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              o hacelo manualmente
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={() => setMode("manual")}
            className="w-full px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-ink hover:border-celeste-dark hover:text-celeste-dark transition"
          >
            Ingresar Phone Number ID y Token de Meta
          </button>

          {allowSkip && onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-xs text-ink-muted hover:text-ink transition py-1"
            >
              Hacer después →
            </button>
          )}
        </>
      )}

      {mode === "manual" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-celeste-100 bg-celeste-50/40 p-4">
            <p className="text-xs font-semibold text-ink mb-1">¿Dónde encuentro estos datos?</p>
            <ol className="text-xs text-ink-muted space-y-1 list-decimal pl-4">
              <li>
                Ingresá a{" "}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-celeste-dark hover:underline"
                >
                  developers.facebook.com <ExternalLink className="inline w-3 h-3" />
                </a>
              </li>
              <li>Tu app → WhatsApp → API Setup</li>
              <li>
                Copiá el <strong className="text-ink">Phone Number ID</strong> de la sección
                &quot;From&quot;
              </li>
              <li>
                Generá un <strong className="text-ink">Permanent System User Token</strong> con los
                permisos whatsapp_business_messaging
              </li>
            </ol>
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase block mb-1">
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="Ej: 123456789012345"
              className="w-full rounded-[4px] border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-wider text-ink-muted uppercase block mb-1">
              Access Token (permanente)
            </label>
            <div className="flex items-center rounded-[4px] border border-border focus-within:ring-2 focus-within:ring-celeste-dark">
              <input
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAA..."
                className="flex-1 px-3 py-2 text-sm focus:outline-none rounded-l-[4px]"
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

          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode("choice");
                setError(null);
              }}
              className="flex-1 px-4 py-2 text-sm border border-border rounded-[4px] text-ink-light hover:border-celeste-dark transition"
            >
              Volver
            </button>
            <button
              onClick={handleManualSave}
              disabled={manualSaving || !phoneNumberId || !accessToken}
              className="flex-1 px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition disabled:opacity-50"
            >
              {manualSaving ? "Guardando…" : "Guardar y conectar"}
            </button>
          </div>

          {allowSkip && onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-xs text-ink-muted hover:text-ink transition py-1"
            >
              Hacer después →
            </button>
          )}
        </div>
      )}

      {mode === "error" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode("manual")}
            className="w-full px-4 py-2.5 rounded-lg bg-celeste-dark text-white text-sm font-semibold hover:bg-celeste transition"
          >
            Usar método manual
          </button>
          <button
            onClick={() => {
              setMode("choice");
              setError(null);
            }}
            className="w-full px-4 py-2 text-sm border border-border rounded-[4px] text-ink-light hover:border-celeste-dark transition"
          >
            Reintentar con Meta
          </button>
          {allowSkip && onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-xs text-ink-muted hover:text-ink transition py-1"
            >
              Hacer después →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
