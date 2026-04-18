"use client";

import { useState } from "react";
import { useDemoAction } from "@/components/DemoModal";
import { useCrudAction } from "@/hooks/use-crud-action";
import { useExport } from "@/lib/services/export";
import { useLocale } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { useIsDemo } from "@/lib/auth/context";
import { Download, Filter, Search, Mail, Loader2, X } from "lucide-react";
import type { FinanciadorType } from "@/lib/types";
import { useFinanciadoresExtended } from "@/hooks/use-data";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { ColumnVisibility } from "@/components/ui/ColumnVisibility";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { downloadCSV } from "@/lib/services/export";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const typeLabels: Record<FinanciadorType, { label: string; bg: string; text: string }> = {
  pami: { label: "PAMI", bg: "bg-celeste-pale", text: "text-celeste-dark" },
  os: { label: "Obra Social", bg: "bg-celeste-pale", text: "text-celeste-dark" },
  prepaga: { label: "Prepaga", bg: "bg-success-100", text: "text-success-700" },
};

type TypeFilter = "Todos" | FinanciadorType;

const formatMonto = formatCurrency;

function formatPorcentaje(facturado: number, cobrado: number): number {
  return Math.round((cobrado / facturado) * 100);
}

export default function FinanciadoresPage() {
  const { t } = useLocale();
  const { showDemo } = useDemoAction();
  const isDemo = useIsDemo();
  const { execute } = useCrudAction(isDemo);
  const { exportPDF, exportExcel, isExporting } = useExport();
  const { data: financiadores = [], isLoading } = useFinanciadoresExtended();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("Todos");
  const [detalleFinanciador, setDetalleFinanciador] = useState<
    (typeof financiadores)[number] | null
  >(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allColumns = [
    { key: "type", label: "Tipo" },
    { key: "facturado", label: "Facturado" },
    { key: "cobrado", label: "Cobrado" },
    { key: "pctCobro", label: "% Cobro" },
    { key: "rechazo", label: "Rechazo" },
    { key: "dias", label: "Días Pago" },
    { key: "pendientes", label: "Pendientes" },
    { key: "liquidacion", label: "Últ. Liquidación" },
  ];
  const [visibleCols, setVisibleCols] = useLocalStorage<string[]>(
    "financiadores-columns",
    allColumns.map((c) => c.key),
  );
  const isColVisible = (key: string) => visibleCols.includes(key);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((f) => f.id)));
    }
  };

  const handleVerDetalle = (f: (typeof financiadores)[number]) => {
    if (isDemo) {
      showDemo(`Ver detalle completo de ${f.name}`);
      return;
    }
    setDetalleFinanciador(f);
  };

  const handleContactar = (f: { name: string; contacto: string }) => {
    if (isDemo) {
      showDemo(`Enviar reclamo a ${f.name} (${f.contacto})`);
      return;
    }
    // In real mode, open mailto
    window.open(`mailto:${f.contacto}?subject=Reclamo - ${f.name}`, "_blank");
  };

  const filtered = financiadores.filter((f) => {
    if (typeFilter !== "Todos" && f.type !== typeFilter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalFacturado = filtered.reduce((s, f) => s + f.facturado, 0);
  const totalCobrado = filtered.reduce((s, f) => s + f.cobrado, 0);
  const promedioRechazo =
    filtered.length > 0
      ? Math.round((filtered.reduce((s, f) => s + f.tasaRechazo, 0) / filtered.length) * 10) / 10
      : 0;
  const promedioDias =
    filtered.length > 0
      ? Math.round(filtered.reduce((s, f) => s + f.diasPromedioPago, 0) / filtered.length)
      : 0;

  return (
    <div className="space-y-5">
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-celeste" />
          <span className="ml-2 text-sm text-ink-muted">{t("insurers.loading")}</span>
        </div>
      )}
      {!isLoading && (
        <>
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-ink">{t("insurers.title")}</h1>
              <p className="text-sm text-ink-muted mt-1">{t("insurers.comparativeSubtitle")}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportPDF("financiadores")}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "..." : `${t("action.export")} PDF`}
              </button>
              <button
                onClick={() => exportExcel("financiadores")}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark hover:text-celeste-dark transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Excel
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
              <input
                type="text"
                placeholder={t("insurers.searchPlaceholder")}
                aria-label={t("insurers.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-border rounded-[4px] outline-none focus:border-celeste-dark focus:ring-2 focus:ring-celeste-dark/30 transition bg-white text-ink w-52"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-ink-muted" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                aria-label={t("insurers.filterByType")}
                className="text-xs border border-border rounded-[4px] px-2 py-1.5 outline-none focus:border-celeste-dark focus:ring-2 focus:ring-celeste-dark/30 bg-white text-ink"
              >
                <option value="Todos">{t("label.allTypes")}</option>
                <option value="pami">PAMI</option>
                <option value="os">Obra Social</option>
                <option value="prepaga">Prepaga</option>
              </select>
            </div>
          </div>

          {/* Global KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-celeste">
              <div className="text-xs text-ink-muted mb-1">{t("billing.totalBilled")}</div>
              <div className="text-2xl font-bold text-celeste-dark">
                {formatMonto(totalFacturado)}
              </div>
              <div className="text-xs mt-1 text-ink-muted">
                {filtered.length} {t("insurers.title").toLowerCase()}
              </div>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-success-400">
              <div className="text-xs text-ink-muted mb-1">{t("billing.totalCollected")}</div>
              <div className="text-2xl font-bold text-success-600">{formatMonto(totalCobrado)}</div>
              <div className="text-xs mt-1 text-success-600">
                {totalFacturado > 0 ? formatPorcentaje(totalFacturado, totalCobrado) : 0}%{" "}
                {t("insurers.ofBilled")}
              </div>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-celeste">
              <div className="text-xs text-ink-muted mb-1">{t("insurers.avgRejection")}</div>
              <div
                className={`text-2xl font-bold ${promedioRechazo > 10 ? "text-red-600" : promedioRechazo > 5 ? "text-amber-500" : "text-success-600"}`}
              >
                {promedioRechazo}%
              </div>
              <div className="text-xs mt-1 text-ink-muted">{t("insurers.weightedAverage")}</div>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-red-400">
              <div className="text-xs text-ink-muted mb-1">{t("insurers.avgPayDays")}</div>
              <div
                className={`text-2xl font-bold ${promedioDias > 60 ? "text-red-600" : "text-celeste-dark"}`}
              >
                {promedioDias}
              </div>
              <div className="text-xs mt-1 text-ink-muted">{t("insurers.betweenInsurers")}</div>
            </div>
          </div>

          {/* ─── Recharts: Facturado vs Cobrado ────────────── */}
          {filtered.length > 0 && (
            <div className="bg-white border border-border rounded-lg p-5">
              <h3 className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-4">
                {t("insurers.billedVsCollected")}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filtered.map((f) => ({
                    name: f.name.length > 15 ? f.name.slice(0, 15) + "…" : f.name,
                    facturado: f.facturado,
                    cobrado: f.cobrado,
                    pendiente: f.facturado - f.cobrado,
                  }))}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => formatMonto(Number(value))}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="cobrado"
                    name={t("dashboard.collected")}
                    fill="#75AADB"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pendiente"
                    name={t("status.pending")}
                    fill="#f87171"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Financiador cards */}
          {filtered.length === 0 ? (
            <EmptyState title={t("label.noResults")} description={t("insurers.noResultsDesc")} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((f) => {
                const tipo = typeLabels[f.type];
                const porcentajeCobro = formatPorcentaje(f.facturado, f.cobrado);
                return (
                  <div
                    key={f.id}
                    className="bg-white border border-border rounded-lg overflow-hidden"
                  >
                    <div
                      className={`h-1 ${f.type === "pami" ? "bg-celeste" : f.type === "os" ? "bg-celeste-light" : "bg-celeste"}`}
                    />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-sm text-ink">{f.name}</h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${tipo.bg} ${tipo.text}`}
                          >
                            {tipo.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-celeste-dark">
                            {formatMonto(f.facturado)}
                          </div>
                          <div className="text-[10px] text-ink-muted">{t("insurers.billed")}</div>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-ink-muted">{t("insurers.collected")}</span>
                          <span className="font-semibold text-ink">{porcentajeCobro}%</span>
                        </div>
                        <div className="w-full bg-border-light rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${porcentajeCobro >= 90 ? "bg-success-500" : porcentajeCobro >= 70 ? "bg-celeste" : "bg-celeste-light"}`}
                            style={{ width: `${porcentajeCobro}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-light">
                        <div className="text-center">
                          <div
                            className={`text-sm font-bold ${f.tasaRechazo > 10 ? "text-red-600" : f.tasaRechazo > 5 ? "text-amber-500" : "text-success-600"}`}
                          >
                            {f.tasaRechazo}%
                          </div>
                          <div className="text-[10px] text-ink-muted">
                            {t("insurers.rejectionLabel")}
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-sm font-bold ${f.diasPromedioPago > 60 ? "text-red-600" : "text-ink"}`}
                          >
                            {f.diasPromedioPago}d
                          </div>
                          <div className="text-[10px] text-ink-muted">
                            {t("insurers.paymentDaysLabel")}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-ink">{f.facturasPendientes}</div>
                          <div className="text-[10px] text-ink-muted">{t("status.pending")}</div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border-light flex gap-2">
                        <button
                          onClick={() => handleVerDetalle(f)}
                          className="flex-1 text-xs font-semibold text-celeste-dark hover:underline text-center"
                        >
                          {t("dashboard.viewDetail")}
                        </button>
                        <button
                          onClick={() => handleContactar(f)}
                          className="flex items-center gap-1 text-xs text-ink-muted hover:text-celeste-dark transition"
                        >
                          <Mail className="w-3 h-3" />
                          {t("insurers.contact")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comparison table */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="text-xs text-ink-muted">{t("insurers.detailedComparison")}</div>
              <div className="flex items-center gap-2">
                <ColumnVisibility
                  columns={allColumns}
                  visible={visibleCols}
                  onChange={setVisibleCols}
                />
                <button
                  onClick={() => {
                    const rows = (
                      selected.size > 0 ? filtered.filter((f) => selected.has(f.id)) : filtered
                    ).map((f) => ({
                      Financiador: f.name,
                      Tipo: typeLabels[f.type]?.label,
                      Facturado: f.facturado,
                      Cobrado: f.cobrado,
                      "% Cobro": formatPorcentaje(f.facturado, f.cobrado),
                      "Tasa Rechazo": f.tasaRechazo,
                      "Días Pago": f.diasPromedioPago,
                      Pendientes: f.facturasPendientes,
                    }));
                    downloadCSV(rows, "financiadores");
                  }}
                  className="text-xs text-celeste-dark font-medium hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
                <button
                  onClick={() => exportExcel("facturacion")}
                  disabled={isExporting}
                  className="text-xs text-celeste-dark font-medium hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Excel
                </button>
              </div>
            </div>
            <table className="w-full text-sm" aria-label="Obras sociales y prepagas">
              <thead>
                <tr className="bg-surface text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                  <th scope="col" className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.size === filtered.length}
                      onChange={toggleAll}
                      aria-label="Seleccionar todos"
                      className="rounded border-border"
                    />
                  </th>
                  <th scope="col" className="text-left px-5 py-2.5">
                    {t("billing.insurer")}
                  </th>
                  {isColVisible("type") && (
                    <th scope="col" className="text-left px-5 py-2.5">
                      {t("label.type")}
                    </th>
                  )}
                  {isColVisible("facturado") && (
                    <th scope="col" className="text-right px-5 py-2.5">
                      {t("dashboard.billed")}
                    </th>
                  )}
                  {isColVisible("cobrado") && (
                    <th scope="col" className="text-right px-5 py-2.5">
                      {t("dashboard.collected")}
                    </th>
                  )}
                  {isColVisible("pctCobro") && (
                    <th scope="col" className="text-right px-5 py-2.5">
                      % {t("insurers.collected")}
                    </th>
                  )}
                  {isColVisible("rechazo") && (
                    <th scope="col" className="text-right px-5 py-2.5">
                      {t("insurers.rejectionLabel")}
                    </th>
                  )}
                  {isColVisible("dias") && (
                    <th scope="col" className="text-right px-5 py-2.5">
                      {t("insurers.paymentDaysLabel")}
                    </th>
                  )}
                  {isColVisible("pendientes") && (
                    <th scope="col" className="text-right px-5 py-2.5">
                      {t("status.pending")}
                    </th>
                  )}
                  {isColVisible("liquidacion") && (
                    <th scope="col" className="text-left px-5 py-2.5">
                      {t("insurers.lastSettlement")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const tipo = typeLabels[f.type];
                  return (
                    <tr
                      key={f.id}
                      className={`border-t border-border-light hover:bg-celeste-pale/30 transition ${selected.has(f.id) ? "bg-celeste-pale/20" : ""}`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(f.id)}
                          onChange={() => toggleSelect(f.id)}
                          aria-label={`Seleccionar ${f.name}`}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="px-5 py-3 font-semibold text-ink">{f.name}</td>
                      {isColVisible("type") && (
                        <td className="px-5 py-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${tipo.bg} ${tipo.text}`}
                          >
                            {tipo.label}
                          </span>
                        </td>
                      )}
                      {isColVisible("facturado") && (
                        <td className="px-5 py-3 text-right text-ink-light">
                          {formatMonto(f.facturado)}
                        </td>
                      )}
                      {isColVisible("cobrado") && (
                        <td className="px-5 py-3 text-right text-ink-light">
                          {formatMonto(f.cobrado)}
                        </td>
                      )}
                      {isColVisible("pctCobro") && (
                        <td className="px-5 py-3 text-right font-semibold text-ink">
                          {formatPorcentaje(f.facturado, f.cobrado)}%
                        </td>
                      )}
                      {isColVisible("rechazo") && (
                        <td
                          className={`px-5 py-3 text-right font-semibold ${f.tasaRechazo > 10 ? "text-red-600" : f.tasaRechazo > 5 ? "text-amber-500" : "text-success-600"}`}
                        >
                          {f.tasaRechazo}%
                        </td>
                      )}
                      {isColVisible("dias") && (
                        <td
                          className={`px-5 py-3 text-right ${f.diasPromedioPago > 60 ? "text-red-600 font-semibold" : "text-ink-light"}`}
                        >
                          {f.diasPromedioPago}
                        </td>
                      )}
                      {isColVisible("pendientes") && (
                        <td className="px-5 py-3 text-right text-ink-light">
                          {f.facturasPendientes}
                        </td>
                      )}
                      {isColVisible("liquidacion") && (
                        <td className="px-5 py-3 text-ink-muted text-xs">{f.ultimaLiquidacion}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bulk Action Bar */}
          {selected.size > 0 && (
            <BulkActionBar
              count={selected.size}
              onClear={() => setSelected(new Set())}
              actions={[
                {
                  label: "Exportar CSV",
                  onClick: () => {
                    const rows = filtered
                      .filter((f) => selected.has(f.id))
                      .map((f) => ({
                        Financiador: f.name,
                        Tipo: typeLabels[f.type]?.label,
                        Facturado: f.facturado,
                        Cobrado: f.cobrado,
                        "Tasa Rechazo": f.tasaRechazo,
                        "Días Pago": f.diasPromedioPago,
                      }));
                    downloadCSV(rows, "financiadores-seleccion");
                  },
                },
                {
                  label: "Enviar reclamo",
                  onClick: () => {
                    const names = filtered
                      .filter((f) => selected.has(f.id))
                      .map((f) => f.name)
                      .join(", ");
                    showDemo(`Enviar reclamo a: ${names}`);
                  },
                },
              ]}
            />
          )}
        </>
      )}

      {/* ─── Detalle Financiador Panel ────────────────────── */}
      {detalleFinanciador && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-border shadow-xl z-50 overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-bold text-ink">{detalleFinanciador.name}</h3>
            <button
              onClick={() => setDetalleFinanciador(null)}
              className="text-ink-muted hover:text-ink"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("label.type")}</span>
                <span className="text-ink font-medium">
                  {typeLabels[detalleFinanciador.type]?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("dashboard.billed")}</span>
                <span className="text-ink font-bold">
                  {formatMonto(detalleFinanciador.facturado)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("dashboard.collected")}</span>
                <span className="text-ink">{formatMonto(detalleFinanciador.cobrado)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("insurers.rejectionRateLabel")}</span>
                <span
                  className={`font-semibold ${detalleFinanciador.tasaRechazo > 10 ? "text-red-600" : "text-ink"}`}
                >
                  {detalleFinanciador.tasaRechazo}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("insurers.avgPayDays")}</span>
                <span className="text-ink">
                  {detalleFinanciador.diasPromedioPago} {t("insurers.days")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("insurers.pendingInvoices")}</span>
                <span className="text-ink font-semibold">
                  {detalleFinanciador.facturasPendientes}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("insurers.lastSettlement")}</span>
                <span className="text-ink">{detalleFinanciador.ultimaLiquidacion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">{t("insurers.contactLabel")}</span>
                <span className="text-celeste-dark">{detalleFinanciador.contacto}</span>
              </div>
            </div>
            <button
              onClick={() => handleContactar(detalleFinanciador)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition"
            >
              <Mail className="w-4 h-4" /> {t("insurers.sendClaim")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
