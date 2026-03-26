"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Pill,
  Copy,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { useToast } from "@/components/Toast";

/* ── Types ──────────────────────────────────────────────── */
interface Medication {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number | "";
  notes: string;
}

interface PrescriptionRow {
  id: string;
  patientName: string;
  doctorName: string;
  status: string;
  issuedAt: string;
  verificationToken: string;
  medications: { medicationName: string; dosage: string; frequency: string }[];
}

const STATUS_BADGE: Record<string, { cls: string; label: string; icon: typeof CheckCircle2 }> = {
  active: { cls: "bg-green-50 text-green-700", label: "Activa", icon: CheckCircle2 },
  dispensed: { cls: "bg-blue-50 text-blue-700", label: "Dispensada", icon: CheckCircle2 },
  expired: { cls: "bg-amber-50 text-amber-700", label: "Vencida", icon: Clock },
  cancelled: { cls: "bg-red-50 text-red-600", label: "Cancelada", icon: XCircle },
};

const EMPTY_MED: Medication = {
  medicationName: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "",
  notes: "",
};

// ─── Demo Data ───────────────────────────────────────────────
const DEMO_PRESCRIPTIONS: PrescriptionRow[] = [
  {
    id: "rx-001",
    patientName: "María García",
    doctorName: "Dr. Rodríguez",
    status: "active",
    issuedAt: "2026-03-15T10:30:00",
    verificationToken: "demo-token-001",
    medications: [
      { medicationName: "Losartán 50mg", dosage: "50mg", frequency: "c/24h" },
      { medicationName: "Aspirina 100mg", dosage: "100mg", frequency: "c/24h" },
    ],
  },
  {
    id: "rx-002",
    patientName: "Carlos López",
    doctorName: "Dr. Rodríguez",
    status: "dispensed",
    issuedAt: "2026-03-14T09:15:00",
    verificationToken: "demo-token-002",
    medications: [{ medicationName: "Amoxicilina 500mg", dosage: "500mg", frequency: "c/8h" }],
  },
  {
    id: "rx-003",
    patientName: "Ana Martínez",
    doctorName: "Dr. Rodríguez",
    status: "active",
    issuedAt: "2026-03-13T14:00:00",
    verificationToken: "demo-token-003",
    medications: [
      { medicationName: "Omeprazol 20mg", dosage: "20mg", frequency: "c/12h" },
      { medicationName: "Metformina 850mg", dosage: "850mg", frequency: "c/12h" },
    ],
  },
  {
    id: "rx-004",
    patientName: "Roberto Sánchez",
    doctorName: "Dr. Rodríguez",
    status: "dispensed",
    issuedAt: "2026-03-12T11:45:00",
    verificationToken: "demo-token-004",
    medications: [
      { medicationName: "Atenolol 50mg", dosage: "50mg", frequency: "c/24h" },
      { medicationName: "Furosemida 40mg", dosage: "40mg", frequency: "c/24h" },
      { medicationName: "Enalapril 10mg", dosage: "10mg", frequency: "c/12h" },
    ],
  },
  {
    id: "rx-005",
    patientName: "Lucía Fernández",
    doctorName: "Dr. Rodríguez",
    status: "expired",
    issuedAt: "2026-02-28T08:30:00",
    verificationToken: "demo-token-005",
    medications: [{ medicationName: "Ibuprofeno 400mg", dosage: "400mg", frequency: "c/8h" }],
  },
  {
    id: "rx-006",
    patientName: "Valentina Pérez",
    doctorName: "Dr. Rodríguez",
    status: "active",
    issuedAt: "2026-03-15T16:00:00",
    verificationToken: "demo-token-006",
    medications: [{ medicationName: "Levotiroxina 75mcg", dosage: "75mcg", frequency: "c/24h" }],
  },
  {
    id: "rx-007",
    patientName: "Sofía Torres",
    doctorName: "Dr. Rodríguez",
    status: "cancelled",
    issuedAt: "2026-03-10T13:20:00",
    verificationToken: "demo-token-007",
    medications: [{ medicationName: "Clonazepam 0.5mg", dosage: "0.5mg", frequency: "c/24h" }],
  },
];

export default function RecetasPage() {
  const { showToast } = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>(DEMO_PRESCRIPTIONS);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [patientName, setPatientName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState<Medication[]>([{ ...EMPTY_MED }]);

  const filtered = prescriptions.filter(
    (p) =>
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.status.includes(search.toLowerCase()),
  );

  function addMed() {
    setMeds([...meds, { ...EMPTY_MED }]);
  }

  function removeMed(idx: number) {
    if (meds.length === 1) return;
    setMeds(meds.filter((_, i) => i !== idx));
  }

  function updateMed(idx: number, field: keyof Medication, value: string | number) {
    setMeds(meds.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  async function handleCreate() {
    if (!patientName.trim() || !meds[0]?.medicationName) {
      showToast("Completá el nombre del paciente y al menos un medicamento.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/prescriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: "clinic-patient-" + Date.now(),
          patientName: patientName.trim(),
          doctorName: "Dr. Demo", // In production: from auth context
          diagnosis: diagnosis.trim() || undefined,
          notes: notes.trim() || undefined,
          medications: meds
            .filter((m) => m.medicationName)
            .map((m) => ({
              ...m,
              quantity: m.quantity ? Number(m.quantity) : undefined,
            })),
        }),
      });

      if (!res.ok) throw new Error("Create failed");

      const data = await res.json();
      const rx = data.prescription;

      setPrescriptions([
        {
          id: rx.id,
          patientName: rx.patientName,
          doctorName: rx.doctorName,
          status: rx.status,
          issuedAt: rx.issuedAt || rx.createdAt,
          verificationToken: rx.verificationToken,
          medications: rx.medications || [],
        },
        ...prescriptions,
      ]);

      // Reset form
      setPatientName("");
      setDiagnosis("");
      setNotes("");
      setMeds([{ ...EMPTY_MED }]);
      setShowCreate(false);
      showToast("Receta digital creada con éxito");
    } catch {
      showToast("Error al crear la receta. Intentá de nuevo.");
    } finally {
      setCreating(false);
    }
  }

  function copyVerificationUrl(token: string) {
    const url = `${window.location.origin}/rx/${token}`;
    navigator.clipboard.writeText(url);
    showToast("URL de verificación copiada");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Recetas Digitales</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            Creá y gestioná recetas con código QR verificable
          </p>
        </div>
        <Link
          href="/dashboard/recetas/nueva"
          className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Receta
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
        <input
          type="text"
          placeholder="Buscar por paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
        />
      </div>

      {/* Prescriptions Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl">
          <QrCode className="w-12 h-12 text-ink/20 mx-auto mb-3" />
          <p className="font-semibold text-ink">No hay recetas aún</p>
          <p className="text-sm text-ink/50 mt-1">Creá tu primera receta digital con código QR</p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left">
                <th className="px-4 py-3 font-semibold text-ink/70">Paciente</th>
                <th className="px-4 py-3 font-semibold text-ink/70">Medicamentos</th>
                <th className="px-4 py-3 font-semibold text-ink/70">Fecha</th>
                <th className="px-4 py-3 font-semibold text-ink/70">Estado</th>
                <th className="px-4 py-3 font-semibold text-ink/70">QR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rx) => {
                const badge = STATUS_BADGE[rx.status] ?? STATUS_BADGE.active!;
                const BadgeIcon = badge!.icon;
                return (
                  <tr key={rx.id} className="border-t border-border/50 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium text-ink">{rx.patientName}</td>
                    <td className="px-4 py-3 text-ink/70">
                      {rx.medications?.map((m) => m.medicationName).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {new Date(rx.issuedAt).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badge!.cls}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        {badge!.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyVerificationUrl(rx.verificationToken)}
                          className="p-1.5 hover:bg-surface rounded transition"
                          title="Copiar URL de verificación"
                        >
                          <Copy className="w-3.5 h-3.5 text-ink/50" />
                        </button>
                        <a
                          href={`/rx/${rx.verificationToken}`}
                          target="_blank"
                          rel="noopener"
                          className="p-1.5 hover:bg-surface rounded transition"
                          title="Ver receta"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-ink/50" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Create Modal ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-display font-bold text-ink flex items-center gap-2">
                <FileText className="w-5 h-5 text-celeste" />
                Nueva Receta Digital
              </h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-surface rounded">
                <X className="w-5 h-5 text-ink/50" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Patient */}
              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                  Paciente
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nombre completo del paciente"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                  Diagnóstico (opcional)
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Ej: Hipertensión arterial"
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
                />
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                    Medicamentos
                  </label>
                  <button
                    onClick={addMed}
                    className="text-xs text-celeste-dark hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar
                  </button>
                </div>

                <div className="space-y-3">
                  {meds.map((med, idx) => (
                    <div key={idx} className="bg-surface rounded-lg p-3 space-y-2 relative">
                      {meds.length > 1 && (
                        <button
                          onClick={() => removeMed(idx)}
                          className="absolute top-2 right-2 p-1 hover:bg-white rounded"
                        >
                          <X className="w-3 h-3 text-ink/40" />
                        </button>
                      )}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Pill className="w-3.5 h-3.5 text-celeste" />
                        <span className="text-[10px] font-bold text-ink/50 uppercase">
                          Medicamento {idx + 1}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre del medicamento"
                        value={med.medicationName}
                        onChange={(e) => updateMed(idx, "medicationName", e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-celeste/40"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Dosis (500mg)"
                          value={med.dosage}
                          onChange={(e) => updateMed(idx, "dosage", e.target.value)}
                          className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-celeste/40"
                        />
                        <input
                          type="text"
                          placeholder="Frecuencia (c/8h)"
                          value={med.frequency}
                          onChange={(e) => updateMed(idx, "frequency", e.target.value)}
                          className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-celeste/40"
                        />
                        <input
                          type="text"
                          placeholder="Duración (7 días)"
                          value={med.duration}
                          onChange={(e) => updateMed(idx, "duration", e.target.value)}
                          className="px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-celeste/40"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Indicaciones adicionales..."
                  className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                Generar Receta con QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
