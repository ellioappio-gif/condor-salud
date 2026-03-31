"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Activity,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/context";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latencyMs: number;
  message?: string;
}

interface StatusResponse {
  status: "operational" | "partial_outage" | "major_outage";
  timestamp: string;
  services: ServiceStatus[];
}

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    label: "statusPage.allOperational",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  partial_outage: {
    icon: AlertTriangle,
    label: "statusPage.partialOutage",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  major_outage: {
    icon: XCircle,
    label: "statusPage.majorOutage",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

const serviceStatusIcons = {
  operational: { icon: CheckCircle2, color: "text-green-500", label: "statusPage.operational" },
  degraded: { icon: AlertTriangle, color: "text-amber-500", label: "statusPage.degraded" },
  down: { icon: XCircle, color: "text-red-500", label: "statusPage.down" },
};

export default function StatusPage() {
  const { t, locale } = useLocale();
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/status");
      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [refresh]);

  const overallConfig = data ? statusConfig[data.status] : statusConfig.operational;
  const OverallIcon = overallConfig.icon;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#75AADB]" />
            <div>
              <h1 className="text-lg font-bold text-[#1A1A1A]">{t("statusPage.title")}</h1>
              <p className="text-xs text-gray-500">{t("statusPage.subtitle")}</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-[#75AADB] font-medium hover:underline flex items-center gap-1"
          >
            {t("statusPage.goToSite")} <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* Overall status banner */}
        <div className={`border rounded-xl p-6 flex items-center gap-4 ${overallConfig.bg}`}>
          <OverallIcon className={`w-8 h-8 ${overallConfig.color}`} />
          <div>
            <h2 className={`text-lg font-bold ${overallConfig.color}`}>
              {loading ? t("statusPage.checking") : t(overallConfig.label)}
            </h2>
            {lastChecked && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t("statusPage.lastCheck")}{" "}
                {lastChecked.toLocaleTimeString(locale === "en" ? "en-US" : "es-AR")}
              </p>
            )}
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto p-2 rounded-lg hover:bg-white/60 transition disabled:opacity-50"
            aria-label={t("statusPage.refresh")}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Service list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {data?.services.map((svc) => {
            const cfg = serviceStatusIcons[svc.status];
            const Icon = cfg.icon;
            return (
              <div key={svc.name} className="flex items-center px-6 py-4">
                <Icon className={`w-5 h-5 ${cfg.color} shrink-0`} />
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{svc.name}</p>
                  {svc.message && <p className="text-xs text-gray-500 mt-0.5">{svc.message}</p>}
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${cfg.color}`}>{t(cfg.label)}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{svc.latencyMs}ms</p>
                </div>
              </div>
            );
          })}

          {!data && !loading && (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              {t("statusPage.errorFetching")}
            </div>
          )}

          {loading && !data && (
            <div className="px-6 py-8 text-center">
              <RefreshCw className="w-5 h-5 animate-spin text-[#75AADB] mx-auto" />
              <p className="text-sm text-gray-500 mt-2">{t("statusPage.checkingServices")}</p>
            </div>
          )}
        </div>

        {/* Uptime info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-3">
            {t("statusPage.systemInfo")}
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">{t("statusPage.platform")}</p>
              <p className="font-semibold text-[#1A1A1A]">Vercel Edge Network</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t("statusPage.database")}</p>
              <p className="font-semibold text-[#1A1A1A]">Supabase (PostgreSQL)</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t("statusPage.cdn")}</p>
              <p className="font-semibold text-[#1A1A1A]">Vercel CDN Global</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t("statusPage.analytics")}</p>
              <p className="font-semibold text-[#1A1A1A]">PostHog (US-East)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>{t("statusPage.autoRefresh")}</p>
          <p className="mt-1">
            {t("statusPage.issues")}{" "}
            <a href="mailto:soporte@condorsalud.com" className="text-[#75AADB] hover:underline">
              soporte@condorsalud.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
