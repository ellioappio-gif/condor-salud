"use client";

import { useState } from "react";
import { ExternalLink, Globe, Copy, CheckCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

const RCTA_URL = "https://app.rcta.me";
const DOCTOR_EMAIL = "flopezmd@gmail.com";

export default function RctaPortalPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  function copy(text: string, setCopied: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 py-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/recetas"
          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-border transition"
        >
          <ArrowLeft className="w-4 h-4 text-ink/50" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Globe className="w-5 h-5 text-celeste-dark" />
            Portal RCTA — Receta Digital
          </h1>
          <p className="text-sm text-ink/50">app.rcta.me — Emitir recetas digitales oficiales</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center gap-4 border-b border-border bg-gradient-to-b from-celeste-pale/40 to-white">
          <div className="w-16 h-16 rounded-2xl bg-celeste-dark/10 flex items-center justify-center">
            <Globe className="w-8 h-8 text-celeste-dark" />
          </div>
          <div className="text-center">
            <p className="text-sm text-ink/60 mb-3">
              Haga clic para abrir el portal oficial de RCTA en una nueva pestaña
            </p>
            <a
              href={RCTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-celeste-dark text-white font-semibold rounded-xl hover:bg-celeste transition text-sm shadow"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir rcta.me
            </a>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs font-bold text-ink/40 uppercase tracking-wider">
            Datos de acceso — Dr. Francisco López
          </p>
          <div className="flex items-center justify-between bg-surface rounded-xl px-4 py-3">
            <div>
              <p className="text-[10px] text-ink/40 uppercase tracking-wide font-semibold">
                Usuario
              </p>
              <p className="text-sm font-mono text-ink font-medium">{DOCTOR_EMAIL}</p>
            </div>
            <button
              onClick={() => copy(DOCTOR_EMAIL, setCopiedEmail)}
              className="p-2 rounded-lg hover:bg-border/40 transition text-ink/40 hover:text-celeste-dark"
              title="Copiar email"
            >
              {copiedEmail ? (
                <CheckCheck className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-ink/40 text-center pt-1">
            La contraseña está guardada en el gestor de contraseñas del navegador
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold text-ink/40 uppercase tracking-wider">
          Pasos para emitir receta
        </p>
        <ol className="space-y-2">
          {[
            "Completar el formulario de receta en Condor Salud",
            "La receta se guarda en el historial del paciente",
            "Abrir rcta.me con el botón de arriba",
            "Iniciar sesión con flopezmd@gmail.com",
            "Completar y firmar la receta digital en RCTA",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-ink/70">
              <span className="shrink-0 w-5 h-5 rounded-full bg-celeste-pale text-celeste-dark text-[11px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
