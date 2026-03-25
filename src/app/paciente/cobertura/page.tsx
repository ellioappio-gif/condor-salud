"use client";

import {
  Shield,
  CreditCard,
  FileText,
  Phone,
  Globe,
  CheckCircle2,
  AlertCircle,
  Download,
  ChevronRight,
  Heart,
  Stethoscope,
  Pill,
  Eye,
  Baby,
  Brain,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";
import { useMyCoverage } from "@/hooks/use-patient-data";

/* ── icon map for coverage categories ─────────────────── */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Stethoscope,
  FileText,
  Pill,
  Heart,
  Eye,
  Baby,
  Brain,
  CheckCircle2,
};

export default function CoberturaPage() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const { data: coverage } = useMyCoverage();
  const planInfo = coverage?.plan ?? {
    name: "",
    memberId: "",
    group: "",
    status: "",
    validUntil: "",
    monthlyFee: "",
    lastPayment: "",
    phone: "",
    web: "",
  };
  const coverageItems = (coverage?.items ?? []).map((item) => ({
    ...item,
    icon: iconMap[item.icon] ?? CheckCircle2,
  }));
  const recentClaims = coverage?.claims ?? [];
  const documents = coverage?.documents ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">{t("patient.myCoverage")}</h1>
        <p className="text-sm text-ink-muted mt-0.5">{t("patient.coverageInfo")}</p>
      </div>

      {/* Plan card */}
      <div className="bg-celeste-dark rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-7 h-7" />
              <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                {planInfo.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{planInfo.name}</h2>
            <p className="text-sm opacity-80 mt-1">
              {t("patient.memberIdLabel")} {planInfo.memberId}
            </p>
            <p className="text-sm opacity-80">
              {t("patient.groupLabel")} {planInfo.group}
            </p>
            <p className="text-sm opacity-80">
              {t("patient.validUntil")} {planInfo.validUntil}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 min-w-[180px]">
            <p className="text-xs opacity-70">{t("patient.monthlyFee")}</p>
            <p className="text-2xl font-bold mt-0.5">{planInfo.monthlyFee}</p>
            <p className="text-xs opacity-70 mt-1">
              {t("patient.lastPayment")} {planInfo.lastPayment}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/20 text-sm">
          <span className="flex items-center gap-1.5 opacity-80">
            <Phone className="w-3.5 h-3.5" /> {planInfo.phone}
          </span>
          <span className="flex items-center gap-1.5 opacity-80">
            <Globe className="w-3.5 h-3.5" /> {planInfo.web}
          </span>
        </div>
      </div>

      {/* Coverage grid */}
      <div className="bg-white rounded-2xl border border-border-light">
        <div className="px-5 py-4 border-b border-border-light">
          <h2 className="text-sm font-bold text-ink">{t("patient.coverageDetail")}</h2>
        </div>
        <div className="divide-y divide-border-light">
          {coverageItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.category} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-lg bg-celeste-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-celeste-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{item.category}</p>
                  <p className="text-xs text-ink-muted">{item.copay}</p>
                </div>
                <div className="shrink-0">
                  <span className="text-sm font-bold text-success-600">{item.coverage}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent claims */}
        <div className="bg-white rounded-2xl border border-border-light">
          <div className="px-5 py-4 border-b border-border-light">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-celeste-dark" />
              {t("patient.recentClaims")}
            </h2>
          </div>
          <div className="divide-y divide-border-light">
            {recentClaims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{claim.description}</p>
                  <p className="text-xs text-ink-muted">{claim.date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-sm font-medium text-ink">{claim.amount}</span>
                  {claim.status === "aprobado" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success-500" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-border-light">
          <div className="px-5 py-4 border-b border-border-light">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-celeste-dark" />
              {t("patient.documents")}
            </h2>
          </div>
          <div className="divide-y divide-border-light">
            {documents.map((doc) => (
              <button
                key={doc.name}
                onClick={() => showToast(`${doc.name} ${t("patient.downloaded")}`)}
                className="flex items-center justify-between px-5 py-3 w-full hover:bg-surface/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-celeste-50 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-celeste-dark" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-ink">{doc.name}</p>
                    <p className="text-[11px] text-ink-muted">{doc.type}</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-ink-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
