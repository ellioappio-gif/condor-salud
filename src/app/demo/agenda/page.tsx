"use client";

import { useState, useMemo } from "react";
import DemoShell from "../DemoShell";
import { DEMO_TURNOS } from "@/lib/demo-data";
import { Card, StatusBadge, PageHeader, Select } from "@/components/ui";

export default function DemoAgendaPage() {
  const [filtro, setFiltro] = useState("todos");
  const [prof, setProf] = useState("todos");

  const profesionales = Array.from(new Set(DEMO_TURNOS.map((t) => t.profesional)));

  const filtered = useMemo(() => {
    let list = DEMO_TURNOS;
    if (filtro !== "todos") list = list.filter((t) => t.estado === filtro);
    if (prof !== "todos") list = list.filter((t) => t.profesional === prof);
    return list;
  }, [filtro, prof]);

  const confirmados = DEMO_TURNOS.filter((t) => t.estado === "confirmado").length;
  const pendientes = DEMO_TURNOS.filter((t) => t.estado === "pendiente").length;
  const cancelados = DEMO_TURNOS.filter((t) => t.estado === "cancelado").length;

  return (
    <DemoShell>
      <div className="space-y-5">
        <PageHeader
          title="Agenda del día"
          description={`${DEMO_TURNOS.length} turnos · ${confirmados} confirmados · ${pendientes} pendientes`}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total turnos", value: DEMO_TURNOS.length },
            { label: "Confirmados", value: confirmados, color: "text-green-600" },
            { label: "Pendientes", value: pendientes, color: "text-amber-600" },
            { label: "Cancelados", value: cancelados, color: "text-red-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white border border-border rounded-lg p-4">
              <div className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                {kpi.label}
              </div>
              <div className={`text-xl font-bold mt-1 ${kpi.color ?? "text-ink"}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            options={[
              { value: "todos", label: "Todos los estados" },
              { value: "confirmado", label: "Confirmado" },
              { value: "pendiente", label: "Pendiente" },
              { value: "cancelado", label: "Cancelado" },
            ]}
          />
          <Select
            value={prof}
            onChange={(e) => setProf(e.target.value)}
            options={[
              { value: "todos", label: "Todos los profesionales" },
              ...profesionales.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>

        <Card>
          <div className="divide-y divide-border-light">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-celeste-pale/30 transition"
              >
                <div className="w-14 text-center">
                  <span className="text-lg font-bold text-celeste-dark">{t.hora}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink truncate">{t.paciente}</div>
                  <div className="text-xs text-ink-light">
                    {t.tipo} · {t.profesional}
                  </div>
                </div>
                <StatusBadge
                  variant={t.estado}
                  label={t.estado.charAt(0).toUpperCase() + t.estado.slice(1)}
                />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-ink-muted text-sm">
                No hay turnos para los filtros seleccionados.
              </div>
            )}
          </div>
        </Card>
      </div>
    </DemoShell>
  );
}
