"use client";
import { useState } from "react";
import type { Factura, FacturaEstado } from "@/lib/types";

const facturas: Factura[] = [
  { id: "1", numero: "A-0001-00004521", fecha: "2026-03-08", financiador: "PAMI", paciente: "María González", prestacion: "Consulta clínica", codigoNomenclador: "420101", monto: 18500, estado: "cobrada", fechaPresentacion: "2026-02-10", fechaCobro: "2026-03-05", cae: "74281930472819" },
  { id: "2", numero: "A-0001-00004522", fecha: "2026-03-07", financiador: "OSDE", paciente: "Carlos Pérez", prestacion: "Electrocardiograma", codigoNomenclador: "420420", monto: 32000, estado: "presentada", fechaPresentacion: "2026-03-01" },
  { id: "3", numero: "A-0001-00004523", fecha: "2026-03-06", financiador: "Swiss Medical", paciente: "Ana Rodríguez", prestacion: "Laboratorio completo", codigoNomenclador: "430101", monto: 45800, estado: "cobrada", fechaPresentacion: "2026-02-15", fechaCobro: "2026-03-04", cae: "74281930472820" },
  { id: "4", numero: "A-0001-00004524", fecha: "2026-03-05", financiador: "PAMI", paciente: "Jorge Martínez", prestacion: "Radiografía tórax", codigoNomenclador: "440201", monto: 22300, estado: "rechazada", fechaPresentacion: "2026-02-08" },
  { id: "5", numero: "A-0001-00004525", fecha: "2026-03-04", financiador: "IOMA", paciente: "Laura Gómez", prestacion: "Ecografía abdominal", codigoNomenclador: "440301", monto: 38900, estado: "en_observacion", fechaPresentacion: "2026-02-20" },
  { id: "6", numero: "A-0001-00004526", fecha: "2026-03-03", financiador: "Galeno", paciente: "Roberto Díaz", prestacion: "Consulta especialista", codigoNomenclador: "420102", monto: 24500, estado: "pendiente" },
  { id: "7", numero: "A-0001-00004527", fecha: "2026-03-02", financiador: "PAMI", paciente: "Silvia López", prestacion: "Hemograma completo", codigoNomenclador: "430201", monto: 15200, estado: "presentada", fechaPresentacion: "2026-02-25" },
  { id: "8", numero: "A-0001-00004528", fecha: "2026-03-01", financiador: "OSDE", paciente: "Fernando Ruiz", prestacion: "RMN cerebral", codigoNomenclador: "440501", monto: 125000, estado: "cobrada", fechaPresentacion: "2026-01-28", fechaCobro: "2026-02-28", cae: "74281930472821" },
  { id: "9", numero: "A-0001-00004529", fecha: "2026-02-28", financiador: "Swiss Medical", paciente: "Marta Fernández", prestacion: "Consulta clínica", codigoNomenclador: "420101", monto: 18500, estado: "cobrada", fechaPresentacion: "2026-02-05", fechaCobro: "2026-02-27", cae: "74281930472822" },
  { id: "10", numero: "A-0001-00004530", fecha: "2026-02-27", financiador: "IOMA", paciente: "Pablo Sánchez", prestacion: "Tomografía", codigoNomenclador: "440401", monto: 85600, estado: "rechazada", fechaPresentacion: "2026-02-01" },
];

const estadoConfig: Record<FacturaEstado, { label: string; bg: string; text: string }> = {
  presentada: { label: "Presentada", bg: "bg-celeste-pale", text: "text-celeste-dark" },
  cobrada: { label: "Cobrada", bg: "bg-green-100", text: "text-green-700" },
  rechazada: { label: "Rechazada", bg: "bg-red-100", text: "text-red-700" },
  pendiente: { label: "Pendiente", bg: "bg-gold-pale", text: "text-yellow-700" },
  en_observacion: { label: "En observación", bg: "bg-gold-pale", text: "text-yellow-700" },
};

const financiadoresFilter = ["Todos", "PAMI", "OSDE", "Swiss Medical", "IOMA", "Galeno"];
const estadosFilter: ("todos" | FacturaEstado)[] = ["todos", "presentada", "cobrada", "rechazada", "pendiente", "en_observacion"];

function formatMonto(n: number): string {
  return "$" + n.toLocaleString("es-AR");
}

export default function FacturacionPage() {
  const [filtroFinanciador, setFiltroFinanciador] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | FacturaEstado>("todos");

  const filtered = facturas.filter((f) => {
    if (filtroFinanciador !== "Todos" && f.financiador !== filtroFinanciador) return false;
    if (filtroEstado !== "todos" && f.estado !== filtroEstado) return false;
    return true;
  });

  const totalFacturado = facturas.reduce((s, f) => s + f.monto, 0);
  const totalCobrado = facturas.filter((f) => f.estado === "cobrada").reduce((s, f) => s + f.monto, 0);
  const totalRechazado = facturas.filter((f) => f.estado === "rechazada").reduce((s, f) => s + f.monto, 0);
  const totalPendiente = facturas.filter((f) => f.estado === "presentada" || f.estado === "pendiente" || f.estado === "en_observacion").reduce((s, f) => s + f.monto, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Facturación</h1>
          <p className="text-sm text-ink-muted mt-1">Gestión de facturas por financiador</p>
        </div>
        <button className="px-6 py-3 text-sm font-semibold text-white bg-celeste-dark hover:bg-celeste rounded transition">
          Nueva factura
        </button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-ink-muted mb-1">Total facturado</div>
          <div className="text-2xl font-display font-bold text-celeste-dark">{formatMonto(totalFacturado)}</div>
          <div className="text-xs mt-1 text-ink-muted">{facturas.length} facturas</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-ink-muted mb-1">Cobrado</div>
          <div className="text-2xl font-display font-bold text-green-600">{formatMonto(totalCobrado)}</div>
          <div className="text-xs mt-1 text-green-600">{Math.round((totalCobrado / totalFacturado) * 100)}% del total</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-ink-muted mb-1">Pendiente de cobro</div>
          <div className="text-2xl font-display font-bold text-gold">{formatMonto(totalPendiente)}</div>
          <div className="text-xs mt-1 text-ink-muted">{facturas.filter((f) => ["presentada", "pendiente", "en_observacion"].includes(f.estado)).length} facturas</div>
        </div>
        <div className="bg-white border border-border rounded-lg p-5">
          <div className="text-xs text-ink-muted mb-1">Rechazado</div>
          <div className="text-2xl font-display font-bold text-red-600">{formatMonto(totalRechazado)}</div>
          <div className="text-xs mt-1 text-red-600">{Math.round((totalRechazado / totalFacturado) * 100)}% del total</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-lg p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-xs text-ink-muted block mb-1">Financiador</label>
          <select
            value={filtroFinanciador}
            onChange={(e) => setFiltroFinanciador(e.target.value)}
            className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:border-celeste"
          >
            {financiadoresFilter.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-muted block mb-1">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as "todos" | FacturaEstado)}
            className="px-3 py-2 border border-border rounded text-sm focus:outline-none focus:border-celeste"
          >
            {estadosFilter.map((e) => (
              <option key={e} value={e}>
                {e === "todos" ? "Todos" : estadoConfig[e].label}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-xs text-ink-muted">
          Mostrando {filtered.length} de {facturas.length} facturas
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFB] text-xs text-ink-muted">
              <th className="text-left font-medium px-5 py-3">Número</th>
              <th className="text-left font-medium px-5 py-3">Fecha</th>
              <th className="text-left font-medium px-5 py-3">Financiador</th>
              <th className="text-left font-medium px-5 py-3">Paciente</th>
              <th className="text-left font-medium px-5 py-3">Prestación</th>
              <th className="text-right font-medium px-5 py-3">Monto</th>
              <th className="text-center font-medium px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const est = estadoConfig[f.estado];
              return (
                <tr key={f.id} className="border-t border-border-light hover:bg-celeste-pale/30 transition">
                  <td className="px-5 py-3 font-semibold text-ink font-mono text-xs">{f.numero}</td>
                  <td className="px-5 py-3 text-ink-light">{f.fecha}</td>
                  <td className="px-5 py-3 text-ink-light">{f.financiador}</td>
                  <td className="px-5 py-3 text-ink">{f.paciente}</td>
                  <td className="px-5 py-3 text-ink-light">
                    <div>{f.prestacion}</div>
                    <div className="text-[10px] text-ink-muted">Cód. {f.codigoNomenclador}</div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink">{formatMonto(f.monto)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded ${est.bg} ${est.text}`}>
                      {est.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-ink-muted text-sm">
            No se encontraron facturas con los filtros seleccionados.
          </div>
        )}
      </div>
    </div>
  );
}
