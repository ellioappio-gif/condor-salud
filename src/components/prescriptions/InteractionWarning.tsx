"use client";

import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import type { DrugInteraction } from "@/lib/types";

interface InteractionWarningProps {
  interactions: DrugInteraction[];
  hasContraindicated: boolean;
  hasHigh: boolean;
}

const SEVERITY_CONFIG = {
  contraindicated: {
    label: "CONTRAINDICADO",
    bgCard: "bg-red-50 border-red-300",
    bgPill: "bg-red-600 text-white",
    bgItem: "bg-red-100 border border-red-200",
    icon: "text-red-600",
    header: "text-red-800",
  },
  high: {
    label: "ALTO RIESGO",
    bgCard: "bg-amber-50 border-amber-300",
    bgPill: "bg-amber-600 text-white",
    bgItem: "bg-amber-100 border border-amber-200",
    icon: "text-amber-600",
    header: "text-amber-800",
  },
  moderate: {
    label: "MODERADO",
    bgCard: "bg-yellow-50 border-yellow-200",
    bgPill: "bg-yellow-500 text-white",
    bgItem: "bg-white border border-yellow-200",
    icon: "text-yellow-600",
    header: "text-yellow-800",
  },
  low: {
    label: "LEVE",
    bgCard: "bg-blue-50 border-blue-200",
    bgPill: "bg-blue-500 text-white",
    bgItem: "bg-white border border-blue-200",
    icon: "text-blue-600",
    header: "text-blue-800",
  },
} as const;

export default function InteractionWarning({
  interactions,
  hasContraindicated,
  hasHigh,
}: InteractionWarningProps) {
  if (interactions.length === 0) return null;

  const topSeverity = hasContraindicated ? "contraindicated" : hasHigh ? "high" : "moderate";
  const config = SEVERITY_CONFIG[topSeverity];

  return (
    <div className={`border rounded-2xl p-4 ${config.bgCard}`} role="alert">
      <div className="flex items-center gap-2 mb-3">
        {hasContraindicated ? (
          <ShieldAlert className={`w-5 h-5 ${config.icon}`} />
        ) : (
          <AlertTriangle className={`w-5 h-5 ${config.icon}`} />
        )}
        <span className={`text-sm font-bold ${config.header}`}>
          {hasContraindicated
            ? "Interacción CONTRAINDICADA detectada"
            : `${interactions.length} interacción(es) detectada(s)`}
        </span>
      </div>

      {hasContraindicated && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-xs text-red-800 font-semibold">
            No se puede emitir la receta con interacciones contraindicadas. Elimine uno de los
            medicamentos involucrados para continuar.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {interactions.map((ix) => {
          const sev = SEVERITY_CONFIG[ix.severity] || SEVERITY_CONFIG.moderate;
          return (
            <div key={ix.id} className={`rounded-lg p-3 text-xs ${sev.bgItem}`}>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${sev.bgPill}`}
                >
                  {sev.label}
                </span>
                <span className="text-ink/70 font-medium">
                  {ix.drugA} + {ix.drugB}
                </span>
              </div>
              <p className="text-ink/70">{ix.description}</p>
              {ix.recommendation && (
                <div className="flex items-start gap-1.5 mt-1.5">
                  <Info className="w-3 h-3 text-ink/40 mt-0.5 shrink-0" />
                  <p className="text-ink/90 font-semibold">{ix.recommendation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
