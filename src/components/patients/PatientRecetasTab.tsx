"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import {
  Plus,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Pill,
  ExternalLink,
} from "lucide-react";

interface RxRow {
  id: string;
  status: string;
  issuedAt: string;
  doctorName: string;
  diagnosis?: string;
  medications: { medicationName: string; dosage: string }[];
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  draft: "bg-amber-50 text-amber-700",
  sent: "bg-blue-50 text-blue-700",
  dispensed: "bg-violet-50 text-violet-700",
  expired: "bg-slate-100 text-slate-500",
  cancelled: "bg-red-50 text-red-600",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  draft: "Borrador",
  sent: "Enviada",
  dispensed: "Dispensada",
  expired: "Vencida",
  cancelled: "Cancelada",
};
const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-3 h-3" />,
  draft: <Clock className="w-3 h-3" />,
  sent: <CheckCircle2 className="w-3 h-3" />,
  dispensed: <CheckCircle2 className="w-3 h-3" />,
  expired: <XCircle className="w-3 h-3" />,
  cancelled: <XCircle className="w-3 h-3" />,
};

export default function PatientRecetasTab({
  patientId,
  patientName,
  patientDni,
}: {
  patientId: string;
  patientName: string;
  patientDni?: string;
}) {
  const { showToast } = useToast();
  const [recetas, setRecetas] = useState<RxRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecetas = useCallback(async () => {
    try {
      const res = await fetch(`/api/prescriptions?patient_id=${patientId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setRecetas(data.prescriptions ?? []);
      }
    } catch (_) {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchRecetas();
  }, [fetchRecetas]);

  return (
    <div className="space-y-4">
      {/* Quick-action header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/50">
          Recetas emitidas para <strong className="text-ink">{patientName}</strong>
        </p>
        <Link
          href={`/dashboard/recetas/nueva?patient_id=${patientId}&patient_name=${encodeURIComponent(patientName)}${patientDni ? `&patient_dni=${patientDni}` : ""}`}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-celeste-dark text-white rounded-xl hover:bg-celeste transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva Receta
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-celeste-dark" />
        </div>
      ) : recetas.length === 0 ? (
        <div className="text-center py-14 bg-white border border-border rounded-xl">
          <Pill className="w-10 h-10 text-ink/10 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink/40">Sin recetas para este paciente</p>
          <p className="text-xs text-ink/30 mt-1 mb-4">Las recetas emitidas aparecerán aquí</p>
          <Link
            href={`/dashboard/recetas/nueva?patient_id=${patientId}&patient_name=${encodeURIComponent(patientName)}${patientDni ? `&patient_dni=${patientDni}` : ""}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-celeste-dark text-white rounded-xl hover:bg-celeste transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear primera receta
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recetas.map((rx) => (
            <div
              key={rx.id}
              className="bg-white border border-border rounded-xl p-4 hover:border-celeste/40 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-ink/30 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_STYLES[rx.status] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {STATUS_ICONS[rx.status]}
                        {STATUS_LABELS[rx.status] ?? rx.status}
                      </span>
                      <span className="text-xs text-ink/40">
                        {new Date(rx.issuedAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {rx.doctorName && (
                        <span className="text-xs text-ink/40">· Dr. {rx.doctorName}</span>
                      )}
                    </div>
                    {rx.diagnosis && (
                      <p className="text-xs text-ink/60 mt-0.5 truncate">{rx.diagnosis}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rx.medications.slice(0, 3).map((m, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-surface px-2 py-0.5 rounded-full text-ink/60 font-medium"
                        >
                          {m.medicationName}
                          {m.dosage ? ` ${m.dosage}` : ""}
                        </span>
                      ))}
                      {rx.medications.length > 3 && (
                        <span className="text-[10px] text-ink/30">
                          +{rx.medications.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/dashboard/recetas/${rx.id}`}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-surface transition text-ink/30 hover:text-celeste-dark opacity-0 group-hover:opacity-100"
                  title="Ver receta"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
