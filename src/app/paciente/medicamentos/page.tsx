"use client";

import { useState, useEffect } from "react";
import {
  Pill,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  Truck,
  Search,
  Filter,
  Plus,
  FileText,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";
import { useMyMedications, useMyMedOrders } from "@/hooks/use-patient-data";
import type { PatientMedication, PatientMedOrder } from "@/lib/services/patient-data";

/* ── types ────────────────────────────────────────────── */
type Tab = "activos" | "historial" | "pedidos";

/* ── demo data removed — using SWR hooks ──────────────── */

function OrderStatusBadge({ status }: { status: PatientMedOrder["status"] }) {
  const { t } = useLocale();
  const map = {
    entregado: {
      label: t("patient.delivered"),
      cls: "bg-success-50 text-success-700",
      icon: CheckCircle2,
    },
    "en-camino": {
      label: t("patient.enRoute"),
      cls: "bg-celeste-50 text-celeste-dark",
      icon: Truck,
    },
    preparando: { label: t("patient.preparing"), cls: "bg-amber-50 text-amber-700", icon: Package },
    cancelado: {
      label: t("patient.cancelledStatus"),
      cls: "bg-red-50 text-red-600",
      icon: AlertTriangle,
    },
  };
  const entry = map[status] ?? map.preparando;
  const { label, cls, icon: Icon } = entry;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function MedicamentosPage() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const { data: medications } = useMyMedications();
  const { data: orders } = useMyMedOrders();
  const [tab, setTab] = useState<Tab>("activos");
  const [search, setSearch] = useState("");

  const allMeds = medications ?? [];
  const allOrders = orders ?? [];
  const active = allMeds.filter((m) => m.status === "activo");
  const history = allMeds.filter((m) => m.status === "finalizado");
  const filtered = (tab === "activos" ? active : history).filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">{t("patient.myMedications")}</h1>
          <p className="text-sm text-ink-muted mt-0.5">{t("patient.prescriptionsAndTracking")}</p>
        </div>
        <button
          onClick={() => showToast(t("patient.orderSent"))}
          className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition shrink-0"
        >
          <ShoppingCart className="w-4 h-4" />
          {t("patient.orderMeds")}
        </button>
      </div>

      {/* Alert for low stock */}
      {active.some((m) => m.remaining <= 7) && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{t("patient.medsRunningLow")}</p>
            <p className="text-xs mt-0.5">
              {active
                .filter((m) => m.remaining <= 7)
                .map((m) => m.name)
                .join(", ")}{" "}
              — {t("patient.fewDaysLeft")}
            </p>
          </div>
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-ink-50 rounded-xl p-1 w-fit">
          {(
            [
              ["activos", t("patient.activeMeds")],
              ["historial", t("patient.pastMeds")],
              ["pedidos", t("patient.orders")],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === key ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab !== "pedidos" && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              placeholder={t("patient.searchMedication")}
              aria-label={t("patient.searchMedication")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-border-light rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-celeste-200 focus:border-celeste-dark w-64"
            />
          </div>
        )}
      </div>

      {/* Medication list */}
      {tab !== "pedidos" && (
        <div className="space-y-3">
          {filtered.map((med) => (
            <div key={med.id} className="bg-white rounded-2xl border border-border-light p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      med.remaining <= 7 && med.status === "activo"
                        ? "bg-amber-50"
                        : "bg-celeste-50"
                    }`}
                  >
                    <Pill
                      className={`w-5 h-5 ${
                        med.remaining <= 7 && med.status === "activo"
                          ? "text-amber-600"
                          : "text-celeste-dark"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{med.name}</h3>
                    <p className="text-xs text-ink-muted">{med.generic}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {med.frequency}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                      <span>
                        {t("patient.prescribedBy")} {med.prescribedBy}
                      </span>
                      <span>
                        {t("patient.since")} {med.startDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {med.status === "activo" && (
                    <>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          med.remaining <= 7
                            ? "bg-amber-50 text-amber-700"
                            : "bg-success-50 text-success-700"
                        }`}
                      >
                        {med.remaining} {t("patient.daysLeft")}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-ink-muted">
                          {t("patient.coverageLabel")} {med.coverage}
                        </span>
                        <span className="text-ink font-medium">
                          {t("patient.copay")} {med.copay}
                        </span>
                      </div>
                      {med.refillable && (
                        <button
                          onClick={() => showToast(`✅ ${t("patient.renewalSent")}`)}
                          className="flex items-center gap-1 text-xs font-medium text-celeste-dark hover:text-celeste-700 transition"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {t("patient.renewPrescription")}
                        </button>
                      )}
                    </>
                  )}
                  {med.status === "finalizado" && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-ink-50 text-ink-400">
                      {t("patient.finished")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-border-light px-5 py-12 text-center text-sm text-ink-muted">
              {t("patient.noMedsFound")}
            </div>
          )}
        </div>
      )}

      {/* Orders list */}
      {tab === "pedidos" && (
        <div className="bg-white rounded-2xl border border-border-light divide-y divide-border-light">
          {allOrders.map((order) => (
            <div key={order.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-ink">
                    {t("patient.orderNumber")} #{order.id}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <span className="text-sm font-medium text-ink">{order.total}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-ink-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {order.date}
                </span>
                <span>{order.items.join(" · ")}</span>
              </div>
            </div>
          ))}
          {allOrders.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-ink-muted">
              {t("patient.noOrders")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
