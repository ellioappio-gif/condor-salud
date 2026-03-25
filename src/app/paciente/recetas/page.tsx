"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import {
  FileText,
  Pill,
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Loader2,
  Stethoscope,
  Shield,
  Crown,
} from "lucide-react";
import type { DigitalPrescription } from "@/lib/types";

/* ── Status helpers ───────────────────────────────────────── */
function statusConfig(
  status: string,
  isEn: boolean,
): { label: string; color: string; icon: React.ElementType } {
  switch (status) {
    case "active":
      return {
        label: isEn ? "Active" : "Activa",
        color: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle2,
      };
    case "dispensed":
      return {
        label: isEn ? "Dispensed" : "Dispensada",
        color: "bg-celeste-50 text-celeste-dark border-celeste-200",
        icon: CheckCircle2,
      };
    case "expired":
      return {
        label: isEn ? "Expired" : "Vencida",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: AlertTriangle,
      };
    case "cancelled":
      return {
        label: isEn ? "Cancelled" : "Cancelada",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        color: "bg-surface text-ink-muted border-border",
        icon: Clock,
      };
  }
}

/* ── Prescription card ────────────────────────────────────── */
function RxCard({
  rx,
  isEn,
  clubDiscount,
}: {
  rx: DigitalPrescription;
  isEn: boolean;
  clubDiscount: number;
}) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig(rx.status, isEn);
  const StatusIcon = cfg.icon;
  const issuedDate = new Date(rx.issuedAt).toLocaleDateString(isEn ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const expiresDate = new Date(rx.expiresAt).toLocaleDateString(isEn ? "en-US" : "es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-white border border-border-light rounded-2xl overflow-hidden hover:shadow-sm transition">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface/50 transition"
      >
        <div className="w-10 h-10 rounded-xl bg-celeste-50 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-celeste-dark" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-ink truncate">{rx.doctorName}</p>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            {rx.specialty && `${rx.specialty} · `}
            {issuedDate}
            {rx.medications.length > 0 &&
              ` · ${rx.medications.length} ${isEn ? (rx.medications.length === 1 ? "medication" : "medications") : rx.medications.length === 1 ? "medicamento" : "medicamentos"}`}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-border-light px-5 py-4 space-y-4">
          {/* Diagnosis */}
          {rx.diagnosis && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                {isEn ? "Diagnosis" : "Diagnóstico"}
              </p>
              <p className="text-sm text-ink">{rx.diagnosis}</p>
            </div>
          )}

          {/* Medications list */}
          {rx.medications.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-2">
                {isEn ? "Medications" : "Medicamentos"}
              </p>
              <div className="space-y-2">
                {rx.medications.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-start gap-3 bg-surface rounded-xl px-4 py-3"
                  >
                    <Pill className="w-4 h-4 text-celeste-dark mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{med.medicationName}</p>
                      <p className="text-xs text-ink-muted">
                        {med.dosage} · {med.frequency}
                        {med.duration && ` · ${med.duration}`}
                      </p>
                      {med.quantity && (
                        <p className="text-xs text-ink-muted mt-0.5">
                          {isEn ? "Qty:" : "Cant:"} {med.quantity}
                        </p>
                      )}
                    </div>
                    {clubDiscount > 0 && (
                      <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full shrink-0">
                        -{Math.round(clubDiscount * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-ink-muted">{isEn ? "Issued" : "Emitida"}</p>
              <p className="font-medium text-ink">{issuedDate}</p>
            </div>
            <div>
              <p className="text-ink-muted">{isEn ? "Expires" : "Vence"}</p>
              <p className="font-medium text-ink">{expiresDate}</p>
            </div>
            {rx.doctorMatricula && (
              <div>
                <p className="text-ink-muted">{isEn ? "License" : "Matrícula"}</p>
                <p className="font-medium text-ink">{rx.doctorMatricula}</p>
              </div>
            )}
            {rx.dispensedBy && (
              <div>
                <p className="text-ink-muted">{isEn ? "Dispensed by" : "Dispensada por"}</p>
                <p className="font-medium text-ink">{rx.dispensedBy}</p>
              </div>
            )}
          </div>

          {/* QR verification link */}
          <div className="flex items-center gap-3 pt-2 border-t border-border-light">
            <Link
              href={`/rx/${rx.verificationToken}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-xs font-semibold text-celeste-dark hover:underline"
            >
              <QrCode className="w-4 h-4" />
              {isEn ? "View QR verification" : "Ver verificación QR"}
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export default function PatientPrescriptionsPage() {
  const { locale } = useLocale();
  const isEn = locale === "en";

  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "dispensed" | "expired">("all");
  const [clubDiscount, setClubDiscount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const patientId = localStorage.getItem("patientId") || "demo-patient";

      // Fetch prescriptions and club status in parallel
      const [rxRes, clubRes] = await Promise.all([
        fetch(`/api/prescriptions/mine?patientId=${patientId}`),
        fetch(`/api/club/status?patientId=${patientId}`),
      ]);

      const rxData = await rxRes.json();
      setPrescriptions(rxData.prescriptions || []);

      const clubData = await clubRes.json();
      if (clubData.membership?.plan) {
        setClubDiscount(clubData.membership.plan.prescriptionDiscount || 0);
      }
    } catch {
      // Demo fallback handled by API
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    filter === "all" ? prescriptions : prescriptions.filter((rx) => rx.status === filter);

  const counts = {
    all: prescriptions.length,
    active: prescriptions.filter((rx) => rx.status === "active").length,
    dispensed: prescriptions.filter((rx) => rx.status === "dispensed").length,
    expired: prescriptions.filter((rx) => rx.status === "expired").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-celeste" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold tracking-[2px] text-celeste uppercase mb-1">
          {isEn ? "DIGITAL PRESCRIPTIONS" : "RECETAS DIGITALES"}
        </p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink">
          {isEn ? "My Prescriptions" : "Mis Recetas"}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {isEn
            ? "View your digital prescriptions, verify with QR, and track medication history."
            : "Consultá tus recetas digitales, verificá con QR y seguí tu historial de medicación."}
        </p>
      </div>

      {/* Club discount banner */}
      {clubDiscount > 0 && (
        <div className="bg-gradient-to-r from-gold/10 via-celeste/5 to-gold/10 border border-gold/30 rounded-xl px-5 py-3 flex items-center gap-3">
          <Crown className="w-5 h-5 text-gold shrink-0" />
          <p className="text-sm text-ink">
            <span className="font-semibold">
              {isEn ? "Club member discount:" : "Descuento de club:"}
            </span>{" "}
            {Math.round(clubDiscount * 100)}%{" "}
            {isEn ? "off all prescription medications" : "en todos los medicamentos recetados"}
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface rounded-xl p-1">
        {(["all", "active", "dispensed", "expired"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg transition ${
              filter === f ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {f === "all"
              ? isEn
                ? "All"
                : "Todas"
              : f === "active"
                ? isEn
                  ? "Active"
                  : "Activas"
                : f === "dispensed"
                  ? isEn
                    ? "Dispensed"
                    : "Dispensadas"
                  : isEn
                    ? "Expired"
                    : "Vencidas"}
            <span className="ml-1 text-ink-muted">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Prescription list */}
      <div className="space-y-3">
        {filtered.map((rx) => (
          <RxCard key={rx.id} rx={rx} isEn={isEn} clubDiscount={clubDiscount} />
        ))}
        {filtered.length === 0 && (
          <div className="bg-white border border-border-light rounded-2xl p-12 text-center">
            <Stethoscope className="w-10 h-10 text-ink-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink mb-1">
              {isEn ? "No prescriptions found" : "No se encontraron recetas"}
            </p>
            <p className="text-xs text-ink-muted">
              {filter !== "all"
                ? isEn
                  ? "Try changing the filter above."
                  : "Probá cambiando el filtro."
                : isEn
                  ? "Your digital prescriptions will appear here after a doctor visit."
                  : "Tus recetas digitales aparecerán acá después de una consulta médica."}
            </p>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-surface rounded-2xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-celeste-50 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-celeste-dark" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-ink mb-1">
            {isEn ? "About digital prescriptions" : "Sobre recetas digitales"}
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            {isEn
              ? "Each prescription includes a unique QR code for pharmacy verification. Your pharmacist can scan the code to confirm authenticity and mark it as dispensed. Prescriptions are valid for 30 days from issuance."
              : "Cada receta incluye un código QR único para verificación en farmacia. Tu farmacéutico puede escanear el código para confirmar la autenticidad y marcarla como dispensada. Las recetas son válidas por 30 días desde su emisión."}
          </p>
        </div>
      </div>
    </div>
  );
}
