"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, RefreshCw, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/env";

export default function VerificarEmailPage() {
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    setResendStatus("sending");

    try {
      if (!isSupabaseConfigured()) {
        // Demo: simulate resend
        await new Promise((r) => setTimeout(r, 1000));
        setResendStatus("sent");
        setCooldown(60);
        const interval = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) {
              clearInterval(interval);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setResendStatus("error");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) {
        setResendStatus("error");
        return;
      }

      setResendStatus("sent");
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      setResendStatus("error");
    }
  }, [cooldown]);

  const handleLogout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } else {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    }
    window.location.href = "/auth/login";
  }, []);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="w-full max-w-[440px] text-center">
        {/* Brand */}
        <Link href="/" className="inline-flex items-center gap-2 mb-10" aria-label="Ir al inicio">
          <Image
            src="/condor.png"
            alt="Cóndor Salud"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
          />
          <div className="font-display font-bold text-lg">
            <span className="text-celeste-dark">CÓNDOR </span>
            <span className="text-gold">SALUD</span>
          </div>
        </Link>

        {/* Icon */}
        <div className="w-16 h-16 bg-celeste-pale rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-celeste-dark" />
        </div>

        <h1 className="text-2xl font-bold text-ink mb-3">Verificá tu email</h1>

        <p className="text-sm text-ink-muted leading-relaxed mb-2">
          Para acceder al panel de tu clínica, necesitamos verificar tu dirección de email.
        </p>
        <p className="text-sm text-ink-light leading-relaxed mb-8">
          Revisá tu bandeja de entrada (y la carpeta de spam) y hacé clic en el enlace de
          verificación que te enviamos.
        </p>

        {/* Why this matters */}
        <div className="bg-gold-pale border border-border rounded-lg p-4 mb-6 text-left">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-ink mb-1">
                Requisito de seguridad — industria médica
              </p>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                La verificación de email es obligatoria para operar con datos de salud. Garantiza la
                identidad del usuario y cumple con las normativas de protección de datos médicos.
              </p>
            </div>
          </div>
        </div>

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resendStatus === "sending" || cooldown > 0}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-sm font-semibold text-celeste-dark border border-celeste-dark rounded-[4px] hover:bg-celeste-pale transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendStatus === "sending" ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Reenviando...
            </>
          ) : resendStatus === "sent" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Reenviado — revisá tu bandeja
              {cooldown > 0 && ` (${cooldown}s)`}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Reenviar email de verificación
              {cooldown > 0 && ` (${cooldown}s)`}
            </>
          )}
        </button>

        {resendStatus === "error" && (
          <p className="text-xs text-red-600 mt-2">
            No pudimos reenviar el email. Intentá de nuevo en unos minutos.
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-red-500 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
          <span className="text-ink-muted">·</span>
          <Link href="/" className="text-xs text-ink-muted hover:text-celeste-dark transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
