"use client";

import { useState, useMemo, useCallback } from "react";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import {
  PAMI_NOMENCLADOR,
  PAMI_CAPITULOS,
  getPAMIStats,
  type PAMINomencladorEntry,
} from "@/lib/data/pami-nomenclador";
import {
  Search,
  Copy,
  Download,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Star,
  FileText,
  ClipboardList,
  Filter,
} from "lucide-react";
import Link from "next/link";

export default function PAMINomencladorPage() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const stats = useMemo(() => getPAMIStats(), []);

  const [search, setSearch] = useState("");
  const [capFilter, setCapFilter] = useState("Todos");
  const [showOnlyAuth, setShowOnlyAuth] = useState(false);
  const [showOnlyCommon, setShowOnlyCommon] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PAMINomencladorEntry | null>(null);

  const filtered = useMemo(() => {
    let items = PAMI_NOMENCLADOR;
    if (capFilter !== "Todos") {
      items = items.filter((e) => e.capitulo === capFilter);
    }
    if (showOnlyAuth) {
      items = items.filter((e) => e.requiereAutorizacion);
    }
    if (showOnlyCommon) {
      items = items.filter((e) => e.destacado);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (e) =>
          e.codigo.includes(q) ||
          e.descripcion.toLowerCase().includes(q) ||
          e.capitulo.toLowerCase().includes(q) ||
          (e.notas && e.notas.toLowerCase().includes(q)),
      );
    }
    return items;
  }, [search, capFilter, showOnlyAuth, showOnlyCommon]);

  const copyCode = useCallback(
    (code: string) => {
      navigator.clipboard.writeText(code);
      showToast(t("pami.codeCopied"), "success");
    },
    [showToast, t],
  );

  const copyRow = useCallback(
    (entry: PAMINomencladorEntry) => {
      const text = `${entry.codigo} — ${entry.descripcion} — ${formatCurrency(entry.valorPAMI)}`;
      navigator.clipboard.writeText(text);
      showToast(t("pami.rowCopied"), "success");
    },
    [showToast, t],
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/nomenclador"
            className="inline-flex items-center gap-1.5 text-xs text-celeste-dark hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("pami.backToNomenclador")}
          </Link>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <FileText className="w-6 h-6 text-celeste-dark" />
            {t("pami.title")}
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">{t("pami.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/nomenclador-pami-febrero-2026.pdf"
            download
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark hover:text-celeste-dark transition"
          >
            <Download className="w-4 h-4" />
            {t("pami.downloadPDF")}
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            label: t("pami.totalCodes"),
            value: stats.total,
            color: "border-celeste",
          },
          {
            label: t("pami.chapters"),
            value: stats.capitulos,
            color: "border-gold",
          },
          {
            label: t("pami.noAuthRequired"),
            value: stats.noAuth,
            color: "border-green-400",
          },
          {
            label: t("pami.authRequired"),
            value: stats.requireAuth,
            color: "border-orange-400",
          },
          {
            label: t("nomenclator.lastUpdate"),
            value: stats.lastUpdate,
            color: "border-celeste",
          },
        ].map((k) => (
          <div
            key={k.label}
            className={`bg-white border border-border rounded-lg p-4 border-l-[3px] ${k.color}`}
          >
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              {k.label}
            </p>
            <p className="text-xl font-bold text-ink mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder={t("pami.searchPlaceholder")}
            aria-label={t("pami.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 pl-9 pr-4 py-2 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <select
            value={capFilter}
            onChange={(e) => setCapFilter(e.target.value)}
            aria-label={t("pami.filterByChapter")}
            className="pl-8 pr-3 py-2 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark transition bg-white text-ink"
          >
            <option value="Todos">{t("nomenclator.allChapters")}</option>
            {PAMI_CAPITULOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowOnlyCommon(!showOnlyCommon)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[4px] transition ${
            showOnlyCommon
              ? "bg-gold/20 border border-gold text-[#B8860B]"
              : "border border-border text-ink-light hover:border-gold"
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          {t("pami.commonCodes")}
        </button>
        <button
          onClick={() => setShowOnlyAuth(!showOnlyAuth)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[4px] transition ${
            showOnlyAuth
              ? "bg-orange-50 border border-orange-400 text-orange-700"
              : "border border-border text-ink-light hover:border-orange-400"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          {t("pami.needsAuth")}
        </button>
        <span className="text-xs text-ink-muted ml-auto">
          {filtered.length}{" "}
          {filtered.length !== 1 ? t("nomenclator.results") : t("nomenclator.result")}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-[#F8FAFB] text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              <th scope="col" className="text-left px-4 py-2.5 w-10"></th>
              <th scope="col" className="text-left px-4 py-2.5">
                {t("label.code")}
              </th>
              <th scope="col" className="text-left px-4 py-2.5">
                {t("pami.description")}
              </th>
              <th scope="col" className="text-left px-4 py-2.5">
                {t("nomenclator.chapter")}
              </th>
              <th scope="col" className="text-left px-4 py-2.5">
                {t("nomenclator.module")}
              </th>
              <th scope="col" className="text-right px-4 py-2.5">
                {t("pami.valuePAMI")}
              </th>
              <th scope="col" className="text-center px-4 py-2.5">
                {t("pami.authorization")}
              </th>
              <th scope="col" className="text-center px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-0">
                  <EmptyState title={t("label.noResults")} description={t("pami.noResultsDesc")} />
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr
                  key={entry.codigo}
                  className="border-t border-border-light hover:bg-celeste-pale/30 transition cursor-pointer"
                  onClick={() =>
                    setSelectedEntry(selectedEntry?.codigo === entry.codigo ? null : entry)
                  }
                >
                  <td className="px-4 py-3 text-center">
                    {entry.destacado && <Star className="w-3.5 h-3.5 text-gold fill-gold" />}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCode(entry.codigo);
                      }}
                      className="font-mono text-xs font-bold text-celeste-dark hover:bg-celeste-pale px-2 py-1 rounded transition inline-flex items-center gap-1.5"
                      title={t("pami.clickToCopy")}
                    >
                      {entry.codigo}
                      <Copy className="w-3 h-3 opacity-40" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-ink">{entry.descripcion}</td>
                  <td className="px-4 py-3 text-xs text-ink-light">{entry.capitulo}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{entry.modulo}</td>
                  <td className="px-4 py-3 text-right text-xs font-bold text-ink">
                    {entry.valorPAMI > 0 ? formatCurrency(entry.valorPAMI) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.requiereAutorizacion ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        <ShieldAlert className="w-3 h-3" />
                        {t("pami.yes")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        <ShieldCheck className="w-3 h-3" />
                        {t("pami.no")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyRow(entry);
                      }}
                      className="p-1.5 rounded hover:bg-celeste-pale text-ink-muted hover:text-celeste-dark transition"
                      title={t("pami.copyRow")}
                    >
                      <ClipboardList className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selectedEntry && (
        <div className="bg-celeste-pale/40 border border-celeste/30 rounded-lg p-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm font-bold text-celeste-dark">
                  {selectedEntry.codigo}
                </span>
                {selectedEntry.destacado && <Star className="w-4 h-4 text-gold fill-gold" />}
                {selectedEntry.requiereAutorizacion && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    <ShieldAlert className="w-3 h-3" />
                    {t("pami.authRequired")}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-ink">{selectedEntry.descripcion}</h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-ink-light">
                <span>
                  {t("nomenclator.chapter")}: <strong>{selectedEntry.capitulo}</strong>
                </span>
                <span>
                  {t("nomenclator.module")}: <strong>{selectedEntry.modulo}</strong>
                </span>
                <span>
                  {t("pami.valuePAMI")}:{" "}
                  <strong className="text-celeste-dark">
                    {selectedEntry.valorPAMI > 0
                      ? formatCurrency(selectedEntry.valorPAMI)
                      : t("pami.fullCoverage")}
                  </strong>
                </span>
              </div>
              {selectedEntry.notas && (
                <p className="mt-3 text-xs text-ink-muted bg-white/60 rounded p-3 border border-border-light">
                  {selectedEntry.notas}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => copyCode(selectedEntry.codigo)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-celeste-dark text-white rounded-[4px] hover:bg-celeste-dark/90 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                {t("pami.copyCode")}
              </button>
              <button
                onClick={() => copyRow(selectedEntry)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark transition"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                {t("pami.copyAll")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-celeste-pale/40 border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-celeste-dark uppercase mb-3">
            {t("pami.quickGuide")}
          </h3>
          <ul className="space-y-2 text-xs text-ink-light">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600 mt-0.5 shrink-0" />
              {t("pami.guide1")}
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-600 mt-0.5 shrink-0" />
              {t("pami.guide2")}
            </li>
            <li className="flex items-start gap-2">
              <Star className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
              {t("pami.guide3")}
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-celeste-dark mt-0.5 shrink-0" />
              {t("pami.guide4")}
            </li>
          </ul>
        </div>
        <div className="bg-gold-pale/40 border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-[#B8860B] uppercase mb-3">
            {t("pami.prescriptionNotes")}
          </h3>
          <ul className="space-y-2 text-xs text-ink-light">
            <li>• {t("pami.rxNote1")}</li>
            <li>• {t("pami.rxNote2")}</li>
            <li>• {t("pami.rxNote3")}</li>
            <li>• {t("pami.rxNote4")}</li>
            <li>• {t("pami.rxNote5")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
