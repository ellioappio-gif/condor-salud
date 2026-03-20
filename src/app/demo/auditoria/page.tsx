"use client";

import DemoShell from "../DemoShell";
import { DEMO_AUDIT } from "@/lib/demo-data";
import { Card, PageHeader } from "@/components/ui";

const sevConfig: Record<string, { bg: string; text: string; label: string }> = {
  alta: { bg: "bg-red-100", text: "text-red-700", label: "Alta" },
  media: { bg: "bg-amber-100", text: "text-amber-700", label: "Media" },
  baja: { bg: "bg-green-100", text: "text-green-700", label: "Baja" },
};

export default function DemoAuditoriaPage() {
  const altas = DEMO_AUDIT.filter((a) => a.sev === "alta").length;

  return (
    <DemoShell>
      <div className="space-y-5">
        <PageHeader
          title="Auditoría"
          description={`${DEMO_AUDIT.length} alertas activas · ${altas} de severidad alta`}
        />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "Total alertas", value: DEMO_AUDIT.length },
            { label: "Alta severidad", value: altas, color: "text-red-500" },
            {
              label: "Media severidad",
              value: DEMO_AUDIT.filter((a) => a.sev === "media").length,
              color: "text-amber-600",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-border rounded-lg p-4">
              <div className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                {kpi.label}
              </div>
              <div className={`text-xl font-bold mt-1 ${kpi.color ?? "text-ink"}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <Card>
          <div className="divide-y divide-border-light">
            {DEMO_AUDIT.map((a, idx) => {
              const cfg = sevConfig[a.sev] as { bg: string; text: string; label: string };
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-celeste-pale/30 transition"
                >
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                  >
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-ink">{a.tipo}</div>
                    <div className="text-xs text-ink-light">{a.pac}</div>
                  </div>
                  <div className="text-right font-semibold text-ink whitespace-nowrap">
                    {a.monto}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-sm font-bold text-blue-800">🔍 Auditoría automática</h3>
          <p className="text-sm text-blue-700 mt-1">
            Cóndor Salud detecta automáticamente inconsistencias en códigos de nomenclador,
            autorizaciones vencidas, duplicados potenciales y topes superados — antes de presentar a
            los financiadores.
          </p>
        </div>
      </div>
    </DemoShell>
  );
}
