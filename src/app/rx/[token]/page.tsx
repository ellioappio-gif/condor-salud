import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Pill,
  User,
  Stethoscope,
  Calendar,
  AlertTriangle,
} from "lucide-react";

// Force dynamic since we need to look up the token
export const dynamic = "force-dynamic";

async function fetchPrescription(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/prescriptions/verify?token=${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  return {
    title: `Receta Digital — Cóndor Salud`,
    description: "Verificación de receta digital emitida por Cóndor Salud.",
    robots: "noindex, nofollow", // Don't index individual prescriptions
  };
}

const STATUS_CONFIG = {
  active: {
    icon: CheckCircle2,
    label: "Receta Válida",
    labelEn: "Valid Prescription",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  dispensed: {
    icon: CheckCircle2,
    label: "Ya Dispensada",
    labelEn: "Already Dispensed",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  expired: {
    icon: Clock,
    label: "Receta Vencida",
    labelEn: "Expired Prescription",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  cancelled: {
    icon: XCircle,
    label: "Receta Cancelada",
    labelEn: "Cancelled Prescription",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

export default async function RxVerificationPage({ params }: { params: { token: string } }) {
  const data = await fetchPrescription(params.token);

  if (!data?.prescription) {
    notFound();
  }

  const rx = data.prescription;
  const status = STATUS_CONFIG[rx.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.expired;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#75AADB]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#4A7FAF]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">Cóndor Salud</p>
            <p className="text-[10px] text-gray-500">Verificación de Receta Digital</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        {/* Status Badge */}
        <div
          className={`flex items-center gap-3 ${status.bg} ${status.border} border rounded-xl p-5`}
        >
          <StatusIcon className={`w-8 h-8 ${status.color}`} />
          <div>
            <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
            <p className="text-xs text-gray-500">{status.labelEn}</p>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Doctor Info */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#75AADB]/10 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-[#4A7FAF]" />
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A]">{rx.doctorName}</p>
                {rx.specialty && <p className="text-sm text-gray-500">{rx.specialty}</p>}
                {rx.doctorMatricula && (
                  <p className="text-xs text-gray-400 mt-0.5">Matrícula: {rx.doctorMatricula}</p>
                )}
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Paciente / Patient</p>
                <p className="font-semibold text-[#1A1A1A]">{rx.patientName}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="p-5 border-b border-gray-100 flex gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Emitida</p>
                <p className="text-sm font-medium">
                  {new Date(rx.issuedAt).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Vence</p>
                <p className="text-sm font-medium">
                  {new Date(rx.expiresAt).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          {rx.diagnosis && (
            <div className="p-5 border-b border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">
                Diagnóstico / Diagnosis
              </p>
              <p className="text-sm text-[#1A1A1A]">{rx.diagnosis}</p>
            </div>
          )}

          {/* Medications */}
          <div className="p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Medicamentos / Medications
            </p>
            <div className="space-y-3">
              {rx.medications?.map(
                (
                  med: {
                    id: string;
                    medicationName: string;
                    dosage: string;
                    frequency: string;
                    duration?: string;
                    quantity?: number;
                    notes?: string;
                  },
                  i: number,
                ) => (
                  <div
                    key={med.id || i}
                    className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
                  >
                    <Pill className="w-4 h-4 text-[#75AADB] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#1A1A1A]">{med.medicationName}</p>
                      <p className="text-xs text-gray-500">
                        {med.dosage} — {med.frequency}
                      </p>
                      {med.duration && (
                        <p className="text-xs text-gray-400">Duración: {med.duration}</p>
                      )}
                      {med.quantity && (
                        <p className="text-xs text-gray-400">Cantidad: {med.quantity}</p>
                      )}
                      {med.notes && (
                        <p className="text-xs text-gray-400 italic mt-1">{med.notes}</p>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Dispensed info */}
          {rx.status === "dispensed" && rx.dispensedAt && (
            <div className="p-5 border-t border-gray-100 bg-blue-50/50">
              <p className="text-xs text-blue-600">
                Dispensada el {new Date(rx.dispensedAt).toLocaleDateString("es-AR")}
                {rx.dispensedBy && ` por ${rx.dispensedBy}`}
              </p>
            </div>
          )}
        </div>

        {/* Warning */}
        {rx.status !== "active" && (
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Esta receta no puede ser dispensada.
              <br />
              <span className="text-xs text-amber-600">This prescription cannot be dispensed.</span>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-4">
          <p>Verificado digitalmente por Cóndor Salud</p>
          <p>Digitally verified by Cóndor Salud</p>
          <p className="mt-1">condorsalud.com</p>
        </div>
      </main>
    </div>
  );
}
