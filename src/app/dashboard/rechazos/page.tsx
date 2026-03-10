"use client";
import { useState } from "react";
import type { Rechazo, RechazoMotivo } from "@/lib/types";
import { useToast } from "@/components/Toast";

const motivoLabels: Record<RechazoMotivo, string> = {
  codigo_invalido: "Código inválido",
  afiliado_no_encontrado: "Afiliado no encontrado",
  vencida: "Factura vencida",
  duplicada: "Factura duplicada",
  sin_autorizacion: "Sin autorización previa",
  datos_incompletos: "Datos incompletos",
  nomenclador_desactualizado: "Nomenclador desactualizado",
};

const rechazos: Rechazo[] = [
  { id: "1", facturaId: "4", facturaNumero: "A-0001-00004524", financiador: "PAMI", paciente: "Jorge Martínez", prestacion: "Radiografía tórax", monto: 22300, motivo: "codigo_invalido", motivoDetalle: "Código 440201 no reconocido en nomenclador PAMI vigente. Usar 440200.", fechaRechazo: "2026-03-06", fechaPresentacion: "2026-02-08", reprocesable: true, estado: "pendiente" },
  { id: "2", facturaId: "10", facturaNumero: "A-0001-00004530", financiador: "IOMA", paciente: "Pablo Sánchez", prestacion: "Tomografía", monto: 85600, motivo: "sin_autorizacion", motivoDetalle: "Práctica requiere autorización previa del auditor. No se adjuntó orden.", fechaRechazo: "2026-03-04", fechaPresentacion: "2026-02-01", reprocesable: false, estado: "pendiente" },
  { id: "3", facturaId: "11", facturaNumero: "A-0001-00004511", financiador: "PAMI", paciente: "Rosa Fernández", prestacion: "Ecografía doppler", monto: 35200, motivo: "afiliado_no_encontrado", motivoDetalle: "DNI 18.456.789 no figura en padrón PAMI marzo 2026.", fechaRechazo: "2026-03-03", fechaPresentacion: "2026-02-05", reprocesable: true, estado: "pendiente" },
  { id: "4", facturaId: "12", facturaNumero: "A-0001-00004508", financiador: "IOMA", paciente: "Héctor López", prestacion: "Consulta clínica", monto: 18500, motivo: "duplicada", motivoDetalle: "Factura A-0001-00004508 ya fue presentada el 15/01/2026.", fechaRechazo: "2026-03-01", fechaPresentacion: "2026-01-28", reprocesable: false, estado: "descartado" },
  { id: "5", facturaId: "13", facturaNumero: "A-0001-00004502", financiador: "PAMI", paciente: "Carmen Ruiz", prestacion: "Hemograma completo", monto: 15200, motivo: "nomenclador_desactualizado", motivoDetalle: "Código 430201 tiene arancel actualizado desde 01/02/2026. Diferencia de $2.100.", fechaRechazo: "2026-02-28", fechaPresentacion: "2026-01-20", reprocesable: true, estado: "reprocesado" },
  { id: "6", facturaId: "14", facturaNumero: "A-0001-00004498", financiador: "PAMI", paciente: "Alberto Gómez", prestacion: "Electrocardiograma", monto: 32000, motivo: "datos_incompletos", motivoDetalle: "Falta número de matrícula del profesional actuante.", fechaRechazo: "2026-02-25", fechaPresentacion: "2026-01-15", reprocesable: true, estado: "reprocesado" },
  { id: "7", facturaId: "15", facturaNumero: "A-0001-00004495", financiador: "IOMA", paciente: "Graciela Torres", prestacion: "RMN rodilla", monto: 98000, motivo: "vencida", motivoDetalle: "Presentación fuera de plazo. Límite: 30 días desde prestación.", fechaRechazo: "2026-02-22", fechaPresentacion: "2026-01-10", reprocesable: false, estado: "descartado" },
  { id: "8", facturaId: "16", facturaNumero: "A-0001-00004490", financiador: "PAMI", paciente: "Miguel Acosta", prestacion: "Laboratorio completo", monto: 45800, motivo: "sin_autorizacion", motivoDetalle: "Prestación 430101 requiere validación de auditoría para PAMI.", fechaRechazo: "2026-02-20", fechaPresentacion: "2026-01-08", reprocesable: true, estado: "pendiente" },
];

const estadoConfig: Record<string, { label: string; bg: string; text: string }> = {
  pendiente: { label: "Pendiente", bg: "bg-gold-pale", text: "text-gold-dark" },
  reprocesado: { label: "Reprocesado", bg: "bg-green-100", text: "text-green-700" },
  descartado: { label: "Descartado", bg: "bg-red-100", text: "text-red-700" },
};

function formatMonto(n: number): string {
  return "$" + n.toLocaleString("es-AR");
}

export default function RechazosPage() {
  const { showToast } = useToast();
  const [filtroFinanciador, setFiltroFinanciador] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = rechazos.filter((r) => {
    if (filtroFinanciador !== "Todos" && r.financiador !== filtroFinanciador) return false;
    if (filtroEstado !== "todos" && r.estado !== filtroEstado) return false;
    return true;
  });

  const totalRechazado = rechazos.reduce((s, r) => s + r.monto, 0);
  const pendientes = rechazos.filter((r) => r.estado === "pendiente");
  const reprocesables = pendientes.filter((r) => r.reprocesable);

  // Motivo breakdown
  const motivoCounts = rechazos.reduce<Record<string, number>>((acc, r) => {
    acc[r.motivo] = (acc[r.motivo] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink">Gestión de Rechazos</h1>
        <p className="text-sm text-ink-muted mt-1">Auditoría y reprocesamiento de facturas rechazadas</p>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-red-400">
          <div className="text-xs text-ink-muted mb-1">Total rechazado</div>
          <div className="text-2xl font-bold text-red-600">{formatMonto(totalRechazado)}</div>
          <div className="text-xs mt-1 text-ink-muted">{rechazos.length} rechazos</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-gold">
          <div className="text-xs text-ink-muted mb-1">Pendientes de gestión</div>
          <div className="text-2xl font-bold text-gold">{pendientes.length}</div>
          <div className="text-xs mt-1 text-ink-muted">{formatMonto(pendientes.reduce((s, r) => s + r.monto, 0))}</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-celeste">
          <div className="text-xs text-ink-muted mb-1">Reprocesables</div>
          <div className="text-2xl font-bold text-celeste-dark">{reprocesables.length}</div>
          <div className="text-xs mt-1 text-green-600">Recuperables: {formatMonto(reprocesables.reduce((s, r) => s + r.monto, 0))}</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-green-400">
          <div className="text-xs text-ink-muted mb-1">Tasa de recupero</div>
          <div className="text-2xl font-bold text-celeste-dark">
            {Math.round((rechazos.filter((r) => r.estado === "reprocesado").reduce((s, r) => s + r.monto, 0) / totalRechazado) * 100)}%
          </div>
          <div className="text-xs mt-1 text-green-600">{rechazos.filter((r) => r.estado === "reprocesado").length} reprocesados</div>
        </div>
      </div>

      {/* Two column: Motivos breakdown + Filters */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Motivos breakdown */}
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-ink-muted mb-3">Rechazos por motivo</div>
          <div className="space-y-3">
            {Object.entries(motivoCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([motivo, count]) => (
                <div key={motivo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-celeste-dark" />
                    <span className="text-xs text-ink">{motivoLabels[motivo as RechazoMotivo]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-border-light rounded-full h-1.5">
                      <div
                        className="bg-celeste-dark h-1.5 rounded-full"
                        style={{ width: `${(count / rechazos.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-ink w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Financiador breakdown */}
        <div className="lg:col-span-2 bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-ink-muted mb-3">Rechazos por financiador</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {["PAMI", "IOMA"].map((fin) => {
              const finRechazos = rechazos.filter((r) => r.financiador === fin);
              const finMonto = finRechazos.reduce((s, r) => s + r.monto, 0);
              const finPendientes = finRechazos.filter((r) => r.estado === "pendiente");
              return (
                <div key={fin} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink">{fin}</span>
                    <span className="text-xs font-semibold text-red-600">{finRechazos.length} rechazos</span>
                  </div>
                  <div className="text-xl font-bold text-ink mb-1">{formatMonto(finMonto)}</div>
                  <div className="text-xs text-ink-muted">
                    {finPendientes.length} pendientes · {finRechazos.filter((r) => r.reprocesable).length} reprocesables
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-xs text-ink-muted block mb-1">Financiador</label>
          <select
            value={filtroFinanciador}
            onChange={(e) => setFiltroFinanciador(e.target.value)}
            className="px-3 py-2 border border-border rounded-[4px] text-sm focus:outline-none focus:border-celeste-dark"
          >
            <option value="Todos">Todos</option>
            <option value="PAMI">PAMI</option>
            <option value="IOMA">IOMA</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-muted block mb-1">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-border rounded-[4px] text-sm focus:outline-none focus:border-celeste-dark"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="reprocesado">Reprocesado</option>
            <option value="descartado">Descartado</option>
          </select>
        </div>
        <div className="ml-auto text-xs text-ink-muted">
          {filtered.length} de {rechazos.length} rechazos
        </div>
      </div>

      {/* Rechazos list */}
      <div className="space-y-3">
        {filtered.map((r) => {
          const est = estadoConfig[r.estado];
          const isExpanded = expandedId === r.id;
          return (
            <div key={r.id} className="bg-white border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-celeste-pale/20 transition"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${r.estado === "pendiente" ? "bg-gold" : r.estado === "reprocesado" ? "bg-green-500" : "bg-red-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{r.paciente}</span>
                    <span className="text-xs text-ink-muted">· {r.financiador}</span>
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5">{r.prestacion} — {r.facturaNumero}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-ink">{formatMonto(r.monto)}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${est.bg} ${est.text}`}>
                    {est.label}
                  </span>
                </div>
                <svg className={`w-4 h-4 text-ink-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 border-t border-border-light">
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-ink-muted">Motivo del rechazo</div>
                      <div className="text-sm font-semibold text-red-600 mt-0.5">{motivoLabels[r.motivo]}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted">Fecha de rechazo</div>
                      <div className="text-sm font-semibold text-ink mt-0.5">{r.fechaRechazo}</div>
                    </div>
                  </div>
                  <div className="mt-3 bg-[#F8FAFB] border border-border-light rounded p-3">
                    <div className="text-xs text-ink-muted mb-1">Detalle</div>
                    <div className="text-sm text-ink">{r.motivoDetalle}</div>
                  </div>
                  {r.estado === "pendiente" && (
                    <div className="flex gap-2 mt-4">
                      {r.reprocesable && (
                        <button onClick={() => showToast("Reprocesar factura — Próximamente")} className="px-4 py-2 text-xs font-semibold text-white bg-celeste-dark hover:bg-celeste rounded transition">
                          Reprocesar
                        </button>
                      )}
                      <button onClick={() => showToast("Descartar rechazo — Próximamente")} className="px-4 py-2 text-xs font-semibold text-ink-light border border-border hover:border-celeste-dark hover:text-celeste-dark rounded transition">
                        Descartar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-border rounded-lg p-12 text-center">
          <div className="text-sm text-ink-muted">No se encontraron rechazos con los filtros seleccionados.</div>
        </div>
      )}
    </div>
  );
}
