"use client";

import { useState, useMemo, useEffect } from "react";
import type { FacturaEstado } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/Toast";
import { useDemoAction } from "@/components/DemoModal";
import { useCrudAction } from "@/hooks/use-crud-action";
import { useExport } from "@/lib/services/export";
import { useLocale } from "@/lib/i18n/context";
import { Card, CardContent, StatusBadge, PageHeader, Select, Button, Input } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useFacturas } from "@/hooks/use-data";
import { useIsDemo } from "@/lib/auth/context";
import { Download, Loader2, X } from "lucide-react";
import { HelpTooltip } from "@/components/HelpTooltip";
import useSWR from "swr";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { ColumnVisibility } from "@/components/ui/ColumnVisibility";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const estadoConfig: Record<FacturaEstado, string> = {
  presentada: "Presentada",
  cobrada: "Cobrada",
  rechazada: "Rechazada",
  pendiente: "Pendiente",
  en_observacion: "En observación",
};

const financiadoresFilter = [
  { value: "Todos", label: "Todos" },
  { value: "PAMI", label: "PAMI" },
  { value: "OSDE", label: "OSDE" },
  { value: "Swiss Medical", label: "Swiss Medical" },
  { value: "IOMA", label: "IOMA" },
  { value: "Galeno", label: "Galeno" },
];

const estadosFilter = [
  { value: "todos", label: "Todos" },
  { value: "presentada", label: "Presentada" },
  { value: "cobrada", label: "Cobrada" },
  { value: "rechazada", label: "Rechazada" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_observacion", label: "En observación" },
];

export default function FacturacionPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const { showDemo } = useDemoAction();
  const isDemo = useIsDemo();
  const { execute, isExecuting } = useCrudAction(isDemo);
  const { isExporting, exportPDF, exportExcel } = useExport();
  const { data: facturas = [], isLoading } = useFacturas();
  const [filtroFinanciador, setFiltroFinanciador] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [showNuevaFactura, setShowNuevaFactura] = useState(false);
  const [detalleFactura, setDetalleFactura] = useState<(typeof facturas)[number] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"facturas" | "aging">("facturas");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Column visibility
  const allColumns = [
    { key: "numero", label: "Número" },
    { key: "fecha", label: "Fecha" },
    { key: "financiador", label: "Financiador" },
    { key: "paciente", label: "Paciente" },
    { key: "prestacion", label: "Prestación" },
    { key: "monto", label: "Monto" },
    { key: "estado", label: "Estado" },
    { key: "accion", label: "Acción" },
  ];
  const [visibleCols, setVisibleCols] = useLocalStorage<string[]>(
    "facturacion-cols",
    allColumns.map((c) => c.key),
  );
  const isColVisible = (key: string) => visibleCols.includes(key);

  // Aging data
  const { data: agingData } = useSWR<{
    aging: Array<{
      financiador: string;
      corriente: number;
      dias30: number;
      dias60: number;
      dias90: number;
    }>;
  }>(activeTab === "aging" ? "/api/billing/aging" : null, (url: string) =>
    fetch(url).then((r) => r.json()),
  );

  // ─── Nueva factura form state ────────────────────────────
  const [nfNumero, setNfNumero] = useState("");
  const [nfPaciente, setNfPaciente] = useState("");
  const [nfFinanciador, setNfFinanciador] = useState("PAMI");
  const [nfPrestacion, setNfPrestacion] = useState("");
  const [nfMonto, setNfMonto] = useState("");
  const [nfCodigo, setNfCodigo] = useState("");

  const handleNuevaFactura = () => {
    if (isDemo) {
      showDemo("Nueva factura");
      return;
    }
    setShowNuevaFactura(true);
  };

  const handleCrearFactura = async () => {
    if (!nfNumero || !nfPaciente || !nfMonto) {
      showToast(`${t("billing.fillRequired")}`);
      return;
    }
    const result = await execute({
      action: async () => {
        const { createFactura } = await import("@/lib/services/facturacion");
        return createFactura({
          numero: nfNumero,
          fecha: new Date().toISOString().split("T")[0]!,
          financiador: nfFinanciador,
          paciente: nfPaciente,
          prestacion: nfPrestacion,
          codigoNomenclador: nfCodigo || undefined,
          monto: Number(nfMonto),
          estado: "presentada",
        });
      },
      successMessage: `Factura ${nfNumero} creada`,
      errorMessage: "Error al crear factura",
      demoLabel: "Nueva factura",
      mutateKeys: ["facturas", "kpi-facturacion"],
    });
    if (result) {
      setShowNuevaFactura(false);
      setNfNumero("");
      setNfPaciente("");
      setNfPrestacion("");
      setNfMonto("");
      setNfCodigo("");
    }
  };

  const handleVerDetalle = (f: (typeof facturas)[number]) => {
    if (isDemo) {
      showDemo(`Detalle de factura ${f.numero}`);
      return;
    }
    setDetalleFactura(f);
  };

  const filtered = useMemo(() => {
    return facturas.filter((f) => {
      if (filtroFinanciador !== "Todos" && f.financiador !== filtroFinanciador) return false;
      if (filtroEstado !== "todos" && f.estado !== filtroEstado) return false;
      return true;
    });
  }, [facturas, filtroFinanciador, filtroEstado]);

  const PAGE_SIZE = 25;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroFinanciador, filtroEstado]);

  const totals = useMemo(() => {
    const totalFacturado = facturas.reduce((s, f) => s + f.monto, 0);
    const totalCobrado = facturas
      .filter((f) => f.estado === "cobrada")
      .reduce((s, f) => s + f.monto, 0);
    const totalRechazado = facturas
      .filter((f) => f.estado === "rechazada")
      .reduce((s, f) => s + f.monto, 0);
    const totalPendiente = facturas
      .filter((f) => ["presentada", "pendiente", "en_observacion"].includes(f.estado))
      .reduce((s, f) => s + f.monto, 0);
    return { totalFacturado, totalCobrado, totalRechazado, totalPendiente };
  }, [facturas]);

  const kpis = [
    {
      label: t("billing.totalBilled"),
      value: formatCurrency(totals.totalFacturado),
      sub: `${facturas.length} ${t("billing.invoices")}`,
      accent: "border-l-celeste",
    },
    {
      label: t("billing.totalCollected"),
      value: formatCurrency(totals.totalCobrado),
      sub: `${totals.totalFacturado ? Math.round((totals.totalCobrado / totals.totalFacturado) * 100) : 0}% ${t("billing.ofTotal")}`,
      accent: "border-l-green-400",
      subColor: "text-green-600",
    },
    {
      label: t("billing.pendingCollection"),
      value: formatCurrency(totals.totalPendiente),
      sub: `${facturas.filter((f) => ["presentada", "pendiente", "en_observacion"].includes(f.estado)).length} ${t("billing.invoices")}`,
      accent: "border-l-amber-400",
    },
    {
      label: t("label.rejected"),
      value: formatCurrency(totals.totalRechazado),
      sub: `${totals.totalFacturado ? Math.round((totals.totalRechazado / totals.totalFacturado) * 100) : 0}% ${t("billing.ofTotal")}`,
      accent: "border-l-red-400",
      subColor: "text-red-600",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("billing.title")}
        description={t("billing.description")}
        breadcrumbs={[
          { label: t("dashboard.mainPanel"), href: "/dashboard" },
          { label: t("billing.title") },
        ]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => exportPDF("facturacion")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border text-ink-light rounded-[4px] hover:border-celeste-dark hover:text-celeste-dark transition disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              PDF
            </button>
            <button
              onClick={() => exportExcel("facturacion")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border text-ink-light rounded-[4px] hover:border-green-600 hover:text-green-600 transition disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Excel
            </button>
            <Button onClick={handleNuevaFactura}>{t("billing.newInvoice")}</Button>
          </div>
        }
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-celeste-dark" />
          <span className="ml-2 text-sm text-ink-muted">
            {t("common.loading") !== "common.loading" ? t("common.loading") : "Cargando..."}
          </span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1 border-b border-border" role="tablist">
            {(["facturas", "aging"] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedIds(new Set());
                }}
                className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-celeste-dark text-celeste-dark"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                {tab === "facturas" ? t("billing.invoices") : "Antigüedad de Saldos"}
              </button>
            ))}
          </div>

          {activeTab === "aging" && (
            <>
              {/* Aging KPIs */}
              {(() => {
                const rows = agingData?.aging ?? [];
                const totalPendiente = rows.reduce(
                  (s, r) => s + r.corriente + r.dias30 + r.dias60 + r.dias90,
                  0,
                );
                const vencido60 = rows.reduce((s, r) => s + r.dias60 + r.dias90, 0);
                const mayorDeudor = rows.sort(
                  (a, b) =>
                    b.corriente +
                    b.dias30 +
                    b.dias60 +
                    b.dias90 -
                    (a.corriente + a.dias30 + a.dias60 + a.dias90),
                )[0];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-amber-400">
                      <div className="text-xs text-ink-muted mb-1">Total pendiente</div>
                      <div className="text-2xl font-bold text-celeste-dark">
                        {formatCurrency(totalPendiente)}
                      </div>
                    </div>
                    <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-red-400">
                      <div className="text-xs text-ink-muted mb-1">Vencido 60+ días</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(vencido60)}
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        {totalPendiente > 0 ? Math.round((vencido60 / totalPendiente) * 100) : 0}%
                        del total
                      </div>
                    </div>
                    <div className="bg-white border border-border rounded-lg p-5 border-l-[3px] border-l-celeste">
                      <div className="text-xs text-ink-muted mb-1">Mayor deudor</div>
                      <div className="text-2xl font-bold text-celeste-dark">
                        {mayorDeudor?.financiador ?? "—"}
                      </div>
                      <div className="text-xs text-ink-muted mt-1">
                        {mayorDeudor
                          ? formatCurrency(
                              mayorDeudor.corriente +
                                mayorDeudor.dias30 +
                                mayorDeudor.dias60 +
                                mayorDeudor.dias90,
                            )
                          : ""}
                      </div>
                    </div>
                  </div>
                );
              })()}
              {/* Aging table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Antigüedad de saldos">
                    <thead>
                      <tr className="bg-surface text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                        <th scope="col" className="text-left px-5 py-3">
                          Financiador
                        </th>
                        <th scope="col" className="text-right px-5 py-3">
                          Corriente
                        </th>
                        <th scope="col" className="text-right px-5 py-3">
                          31–60 días
                        </th>
                        <th scope="col" className="text-right px-5 py-3">
                          61–90 días
                        </th>
                        <th scope="col" className="text-right px-5 py-3">
                          90+ días
                        </th>
                        <th scope="col" className="text-right px-5 py-3">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(agingData?.aging ?? []).map((row) => {
                        const total = row.corriente + row.dias30 + row.dias60 + row.dias90;
                        return (
                          <tr
                            key={row.financiador}
                            className="border-t border-border-light hover:bg-celeste-pale/30 transition"
                          >
                            <td className="px-5 py-3 font-semibold text-ink">{row.financiador}</td>
                            <td className="px-5 py-3 text-right text-ink-light">
                              {formatCurrency(row.corriente)}
                            </td>
                            <td className="px-5 py-3 text-right text-ink-light">
                              {formatCurrency(row.dias30)}
                            </td>
                            <td
                              className={`px-5 py-3 text-right ${row.dias60 > 0 ? "text-amber-600 font-semibold" : "text-ink-light"}`}
                            >
                              {formatCurrency(row.dias60)}
                            </td>
                            <td
                              className={`px-5 py-3 text-right ${row.dias90 > 0 ? "text-red-600 font-semibold" : "text-ink-light"}`}
                            >
                              {formatCurrency(row.dias90)}
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-ink">
                              {formatCurrency(total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {activeTab === "facturas" && (
            <>
              {/* KPI summary */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                role="region"
                aria-label={t("billing.billingSummary")}
              >
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`bg-white border border-border rounded-lg p-5 border-l-[3px] ${kpi.accent}`}
                  >
                    <div className="text-xs text-ink-muted mb-1">{kpi.label}</div>
                    <div className="text-2xl font-bold text-celeste-dark">{kpi.value}</div>
                    <div className={`text-xs mt-1 ${kpi.subColor || "text-ink-muted"}`}>
                      {kpi.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div
                    className="flex flex-wrap gap-4 items-end"
                    role="search"
                    aria-label={t("billing.billingFilters")}
                  >
                    <Select
                      label={t("billing.insurer")}
                      options={financiadoresFilter}
                      value={filtroFinanciador}
                      onChange={(e) => setFiltroFinanciador(e.target.value)}
                    />
                    <Select
                      label={t("label.status")}
                      options={estadosFilter}
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                    />
                    <div className="ml-auto flex items-center gap-3 self-center">
                      <ColumnVisibility
                        columns={allColumns}
                        visible={visibleCols}
                        onChange={setVisibleCols}
                      />
                      <span className="text-xs text-ink-muted">
                        Mostrando {filtered.length} de {facturas.length} {t("billing.invoices")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Facturas">
                    <thead>
                      <tr className="bg-surface text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                        <th scope="col" className="px-3 py-3 w-8">
                          <input
                            type="checkbox"
                            checked={
                              selectedIds.size > 0 && selectedIds.size === paginatedData.length
                            }
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedIds(new Set(paginatedData.map((f) => f.id)));
                              else setSelectedIds(new Set());
                            }}
                            className="rounded border-gray-300"
                            aria-label="Seleccionar todas"
                          />
                        </th>
                        {isColVisible("numero") && (
                          <th scope="col" className="text-left px-5 py-3">
                            {t("label.number")}
                          </th>
                        )}
                        {isColVisible("fecha") && (
                          <th scope="col" className="text-left px-5 py-3">
                            {t("label.date")}
                          </th>
                        )}
                        {isColVisible("financiador") && (
                          <th scope="col" className="text-left px-5 py-3">
                            {t("billing.insurer")}
                          </th>
                        )}
                        {isColVisible("paciente") && (
                          <th scope="col" className="text-left px-5 py-3">
                            {t("label.patient")}
                          </th>
                        )}
                        {isColVisible("prestacion") && (
                          <th scope="col" className="text-left px-5 py-3">
                            {t("billing.service")}
                          </th>
                        )}
                        {isColVisible("monto") && (
                          <th scope="col" className="text-right px-5 py-3">
                            {t("label.amount")}
                          </th>
                        )}
                        {isColVisible("estado") && (
                          <th scope="col" className="text-center px-5 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {t("label.status")}
                              <HelpTooltip content={t("help.cae")} position="top" />
                            </div>
                          </th>
                        )}
                        {isColVisible("accion") && (
                          <th scope="col" className="text-center px-5 py-3">
                            {t("label.action")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((f) => (
                        <tr
                          key={f.id}
                          className="border-t border-border-light hover:bg-celeste-pale/30 transition"
                        >
                          <td className="px-3 py-3 w-8">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(f.id)}
                              onChange={(e) => {
                                const next = new Set(selectedIds);
                                if (e.target.checked) next.add(f.id);
                                else next.delete(f.id);
                                setSelectedIds(next);
                              }}
                              className="rounded border-gray-300"
                              aria-label={`Seleccionar factura ${f.numero}`}
                            />
                          </td>
                          {isColVisible("numero") && (
                            <td className="px-5 py-3 font-mono text-xs text-celeste-dark font-semibold">
                              {f.numero}
                            </td>
                          )}
                          {isColVisible("fecha") && (
                            <td className="px-5 py-3 text-ink-light">{f.fecha}</td>
                          )}
                          {isColVisible("financiador") && (
                            <td className="px-5 py-3 text-ink font-medium">{f.financiador}</td>
                          )}
                          {isColVisible("paciente") && (
                            <td className="px-5 py-3 text-ink-light">{f.paciente}</td>
                          )}
                          {isColVisible("prestacion") && (
                            <td className="px-5 py-3 text-ink-light">{f.prestacion}</td>
                          )}
                          {isColVisible("monto") && (
                            <td className="px-5 py-3 text-right font-semibold text-ink">
                              {formatCurrency(f.monto)}
                            </td>
                          )}
                          {isColVisible("estado") && (
                            <td className="px-5 py-3 text-center">
                              <StatusBadge variant={f.estado} label={estadoConfig[f.estado]} />
                            </td>
                          )}
                          {isColVisible("accion") && (
                            <td className="px-5 py-3 text-center">
                              <button
                                onClick={() => handleVerDetalle(f)}
                                className="text-[10px] text-celeste-dark font-medium hover:underline"
                                aria-label={`Ver detalle de factura ${f.numero}`}
                              >
                                {t("action.view")}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan={visibleCols.length + 1}
                            className="px-5 py-12 text-center text-sm text-ink-muted"
                          >
                            No se encontraron {t("billing.invoices")} con los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />

              {/* ─── Nueva Factura Modal ──────────────────────────── */}
              {showNuevaFactura && (
                <div
                  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Nueva factura"
                >
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                      <h2 className="text-lg font-bold text-ink">{t("billing.newInvoice")}</h2>
                      <button
                        onClick={() => setShowNuevaFactura(false)}
                        className="text-ink-muted hover:text-ink"
                        aria-label="Cerrar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="px-6 py-4 space-y-3">
                      <Input
                        label={`${t("label.number")} *`}
                        placeholder="FAC-0001"
                        value={nfNumero}
                        onChange={(e) => setNfNumero(e.target.value)}
                      />
                      <Input
                        label={`${t("label.patient")} *`}
                        placeholder={t("schedule.patientNamePlaceholder")}
                        value={nfPaciente}
                        onChange={(e) => setNfPaciente(e.target.value)}
                      />
                      <Select
                        label={t("billing.insurer")}
                        options={financiadoresFilter}
                        value={nfFinanciador}
                        onChange={(e) => setNfFinanciador(e.target.value)}
                      />
                      <Input
                        label={t("billing.service")}
                        placeholder={t("billing.servicePlaceholder")}
                        value={nfPrestacion}
                        onChange={(e) => setNfPrestacion(e.target.value)}
                      />
                      <Input
                        label={t("billing.nomenclatorCode")}
                        placeholder="420101"
                        value={nfCodigo}
                        onChange={(e) => setNfCodigo(e.target.value)}
                      />
                      <Input
                        label={`${t("label.amount")} *`}
                        placeholder="18500"
                        type="number"
                        value={nfMonto}
                        onChange={(e) => setNfMonto(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
                      <Button variant="outline" onClick={() => setShowNuevaFactura(false)}>
                        {t("action.cancel")}
                      </Button>
                      <Button onClick={handleCrearFactura} disabled={isExecuting}>
                        {isExecuting ? t("billing.creating") : t("billing.createInvoice")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Detalle Factura Panel ────────────────────────── */}
              {detalleFactura && (
                <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-border shadow-xl z-50 overflow-y-auto">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h3 className="font-bold text-ink">
                      {t("billing.invoiceDetail")} {detalleFactura.numero}
                    </h3>
                    <button
                      onClick={() => setDetalleFactura(null)}
                      className="text-ink-muted hover:text-ink"
                      aria-label="Cerrar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-ink-muted">{t("label.date")}</span>
                        <span className="text-ink">{detalleFactura.fecha}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">{t("billing.insurer")}</span>
                        <span className="text-ink font-medium">{detalleFactura.financiador}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">{t("label.patient")}</span>
                        <span className="text-ink">{detalleFactura.paciente}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">{t("billing.service")}</span>
                        <span className="text-ink">{detalleFactura.prestacion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">{t("label.amount")}</span>
                        <span className="text-ink font-bold text-lg">
                          {formatCurrency(detalleFactura.monto)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ink-muted">{t("label.status")}</span>
                        <StatusBadge
                          variant={detalleFactura.estado}
                          label={estadoConfig[detalleFactura.estado]}
                        />
                      </div>
                    </div>
                    {detalleFactura.estado === "rechazada" && (
                      <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700">
                        {t("billing.rejectedNote")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {/* end facturas tab */}
        </>
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.size}
        actions={[
          {
            label: "Exportar selección",
            onClick: () => {
              showToast("Exportando selección…");
              setSelectedIds(new Set());
            },
          },
          {
            label: "Marcar cobrada",
            onClick: () => {
              if (isDemo) {
                showDemo("Marcar cobrada");
              } else {
                showToast("Facturas actualizadas");
              }
              setSelectedIds(new Set());
            },
          },
        ]}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
