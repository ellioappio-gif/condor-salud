"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  Send,
  RefreshCw,
  Ban,
  Shield,
  FileEdit,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";

/* ── Types ──────────────────────────────────────────────── */
interface PrescriptionRow {
  id: string;
  patientName: string;
  doctorName: string;
  status: string;
  issuedAt: string;
  verificationToken: string;
  coverageName?: string;
  osde?: { status: string };
  medications: {
    medicationName: string;
    dosage: string;
    frequency: string;
    genericName?: string;
  }[];
}

type StatusFilter = "all" | "draft" | "active" | "sent" | "dispensed" | "expired" | "cancelled";

const STATUS_BADGE: Record<string, { cls: string; label: string; icon: typeof CheckCircle2 }> = {
  draft: { cls: "bg-gray-100 text-gray-600", label: "Borrador", icon: FileEdit },
  active: { cls: "bg-green-50 text-green-700", label: "Activa", icon: CheckCircle2 },
  sent: { cls: "bg-blue-50 text-blue-700", label: "Enviada", icon: Send },
  dispensed: { cls: "bg-indigo-50 text-indigo-700", label: "Dispensada", icon: CheckCircle2 },
  expired: { cls: "bg-amber-50 text-amber-700", label: "Vencida", icon: Clock },
  cancelled: { cls: "bg-red-50 text-red-600", label: "Anulada", icon: XCircle },
};

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "draft", label: "Borradores" },
  { key: "active", label: "Activas" },
  { key: "sent", label: "Enviadas" },
  { key: "dispensed", label: "Dispensadas" },
];

// ─── Demo Data ───────────────────────────────────────────────
const DEMO_PRESCRIPTIONS: PrescriptionRow[] = [
  {
    id: "rx-001",
    patientName: "Maria Garcia",
    doctorName: "Dra. Rodriguez",
    status: "active",
    issuedAt: "2026-03-15T10:30:00",
    verificationToken: "demo-token-001",
    coverageName: "OSDE 310",
    osde: { status: "registered" },
    medications: [
      {
        medicationName: "Losartan Gador 50mg",
        dosage: "50mg",
        frequency: "c/24h",
        genericName: "Losartan",
      },
      {
        medicationName: "Aspirina Protect 100mg",
        dosage: "100mg",
        frequency: "c/24h",
        genericName: "Acido acetilsalicilico",
      },
    ],
  },
  {
    id: "rx-002",
    patientName: "Carlos Lopez",
    doctorName: "Dra. Rodriguez",
    status: "sent",
    issuedAt: "2026-03-14T09:15:00",
    verificationToken: "demo-token-002",
    coverageName: "Swiss Medical",
    medications: [
      {
        medicationName: "Amoxicilina Bago 500mg",
        dosage: "500mg",
        frequency: "c/8h",
        genericName: "Amoxicilina",
      },
    ],
  },
  {
    id: "rx-003",
    patientName: "Ana Martinez",
    doctorName: "Dra. Rodriguez",
    status: "active",
    issuedAt: "2026-03-13T14:00:00",
    verificationToken: "demo-token-003",
    coverageName: "OSDE 410",
    osde: { status: "registered" },
    medications: [
      {
        medicationName: "Omeprazol Roemmers 20mg",
        dosage: "20mg",
        frequency: "c/12h",
        genericName: "Omeprazol",
      },
      {
        medicationName: "Metformina Craveri 850mg",
        dosage: "850mg",
        frequency: "c/12h",
        genericName: "Metformina",
      },
    ],
  },
  {
    id: "rx-004",
    patientName: "Roberto Sanchez",
    doctorName: "Dra. Rodriguez",
    status: "dispensed",
    issuedAt: "2026-03-12T11:45:00",
    verificationToken: "demo-token-004",
    coverageName: "PAMI",
    medications: [
      {
        medicationName: "Atenolol Bago 50mg",
        dosage: "50mg",
        frequency: "c/24h",
        genericName: "Atenolol",
      },
      {
        medicationName: "Furosemida Denver Farma 40mg",
        dosage: "40mg",
        frequency: "c/24h",
        genericName: "Furosemida",
      },
      {
        medicationName: "Enalapril Roemmers 10mg",
        dosage: "10mg",
        frequency: "c/12h",
        genericName: "Enalapril",
      },
    ],
  },
  {
    id: "rx-005",
    patientName: "Lucia Fernandez",
    doctorName: "Dra. Rodriguez",
    status: "expired",
    issuedAt: "2026-02-28T08:30:00",
    verificationToken: "demo-token-005",
    medications: [
      {
        medicationName: "Ibuprofeno Raffo 400mg",
        dosage: "400mg",
        frequency: "c/8h",
        genericName: "Ibuprofeno",
      },
    ],
  },
  {
    id: "rx-006",
    patientName: "Valentina Perez",
    doctorName: "Dra. Rodriguez",
    status: "draft",
    issuedAt: "2026-03-15T16:00:00",
    verificationToken: "demo-token-006",
    coverageName: "OSDE 210",
    medications: [
      {
        medicationName: "Levotiroxina Bago 75mcg",
        dosage: "75mcg",
        frequency: "c/24h",
        genericName: "Levotiroxina",
      },
    ],
  },
  {
    id: "rx-007",
    patientName: "Sofia Torres",
    doctorName: "Dra. Rodriguez",
    status: "cancelled",
    issuedAt: "2026-03-10T13:20:00",
    verificationToken: "demo-token-007",
    medications: [
      {
        medicationName: "Clonazepam Gador 0.5mg",
        dosage: "0.5mg",
        frequency: "c/24h",
        genericName: "Clonazepam",
      },
    ],
  },
  {
    id: "rx-008",
    patientName: "Diego Ramirez",
    doctorName: "Dra. Rodriguez",
    status: "draft",
    issuedAt: "2026-03-15T18:00:00",
    verificationToken: "demo-token-008",
    coverageName: "Galeno",
    medications: [
      {
        medicationName: "Sertralina Gador 50mg",
        dosage: "50mg",
        frequency: "c/24h",
        genericName: "Sertralina",
      },
      {
        medicationName: "Pregabalina Bago 75mg",
        dosage: "75mg",
        frequency: "c/12h",
        genericName: "Pregabalina",
      },
    ],
  },
];

export default function RecetasPage() {
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>(DEMO_PRESCRIPTIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = prescriptions.filter((p) => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.medications.some((m) => m.medicationName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: prescriptions.length,
    draft: prescriptions.filter((p) => p.status === "draft").length,
    active: prescriptions.filter((p) => p.status === "active").length,
    sent: prescriptions.filter((p) => p.status === "sent").length,
    dispensed: prescriptions.filter((p) => p.status === "dispensed").length,
  };

  function copyVerificationUrl(token: string) {
    const url = `${window.location.origin}/rx/${token}`;
    navigator.clipboard.writeText(url);
    showToast(t("toast.recetas.urlCopied"));
  }

  async function handleAction(rxId: string, action: "issue" | "send" | "cancel" | "repeat") {
    try {
      const via = action === "send" ? { via: ["whatsapp"] } : {};
      const res = await fetch(`/api/prescriptions/${rxId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(via),
      });

      if (!res.ok) throw new Error("Action failed");

      const data = await res.json();

      if (action === "repeat" && data.prescription) {
        setPrescriptions((prev) => [
          {
            id: data.prescription.id,
            patientName: prev.find((p) => p.id === rxId)?.patientName || "Paciente",
            doctorName: "Dra. Rodriguez",
            status: "draft",
            issuedAt: new Date().toISOString(),
            verificationToken: data.prescription.verificationToken || `repeat-${Date.now()}`,
            medications: prev.find((p) => p.id === rxId)?.medications || [],
          },
          ...prev,
        ]);
        showToast(t("toast.recetas.repeatDraft"));
        return;
      }

      // Update status in list
      const statusMap: Record<string, string> = {
        issue: "active",
        send: "sent",
        cancel: "cancelled",
      };

      setPrescriptions((prev) =>
        prev.map((p) => (p.id === rxId ? { ...p, status: statusMap[action] || p.status } : p)),
      );

      const msgMap: Record<string, string> = {
        issue: "Receta emitida exitosamente",
        send: "Receta enviada al paciente",
        cancel: "Receta anulada",
      };
      showToast(msgMap[action] || "Accion completada");
    } catch {
      // Demo fallback
      const statusMap: Record<string, string> = {
        issue: "active",
        send: "sent",
        cancel: "cancelled",
      };

      if (action === "repeat") {
        setPrescriptions((prev) => {
          const orig = prev.find((p) => p.id === rxId);
          return [
            {
              id: `rx-repeat-${Date.now()}`,
              patientName: orig?.patientName || "Paciente",
              doctorName: "Dra. Rodriguez",
              status: "draft",
              issuedAt: new Date().toISOString(),
              verificationToken: `repeat-${Date.now()}`,
              medications: orig?.medications || [],
              coverageName: orig?.coverageName,
            },
            ...prev,
          ];
        });
        showToast(t("toast.recetas.repeatDraft"));
        return;
      }

      setPrescriptions((prev) =>
        prev.map((p) =>
          p.id === rxId
            ? {
                ...p,
                status: statusMap[action] || p.status,
                osde:
                  action === "issue" && p.coverageName?.toLowerCase().includes("osde")
                    ? { status: "registered" }
                    : p.osde,
              }
            : p,
        ),
      );

      const msgMap: Record<string, string> = {
        issue: "Receta emitida exitosamente",
        send: "Receta enviada al paciente",
        cancel: "Receta anulada",
      };
      showToast(msgMap[action] || "Accion completada");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Recetas Digitales</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            Gestion completa del ciclo de vida de prescripciones
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

      {/* Status Tabs */}
      <div className="flex items-center gap-1 bg-surface p-1 rounded-lg overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition whitespace-nowrap ${
              statusFilter === tab.key
                ? "bg-white text-ink shadow-sm"
                : "text-ink/50 hover:text-ink/70"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-[10px] opacity-60">
              {counts[tab.key as keyof typeof counts] ?? ""}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
        <input
          type="text"
          placeholder="Buscar por paciente o medicamento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
        />
      </div>

      {/* Prescriptions List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl">
          <QrCode className="w-12 h-12 text-ink/20 mx-auto mb-3" />
          <p className="font-semibold text-ink">No hay recetas</p>
          <p className="text-sm text-ink/50 mt-1">
            {statusFilter !== "all"
              ? `No hay recetas con estado "${STATUS_BADGE[statusFilter]?.label}"`
              : "Crea tu primera receta digital con codigo QR"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rx) => {
            const badge = STATUS_BADGE[rx.status] ?? STATUS_BADGE.active!;
            const BadgeIcon = badge!.icon;
            const isExpanded = expandedRow === rx.id;

            return (
              <div
                key={rx.id}
                className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-sm transition"
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : rx.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-ink truncate">
                        {rx.patientName}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge!.cls}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        {badge!.label}
                      </span>
                      {rx.osde && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            rx.osde.status === "registered"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          OSDE
                        </span>
                      )}
                      {rx.coverageName && !rx.osde && (
                        <span className="text-[10px] text-ink/40">{rx.coverageName}</span>
                      )}
                    </div>
                    <div className="text-xs text-ink/50">
                      {rx.medications.map((m) => m.medicationName).join(" + ")} —{" "}
                      {new Date(rx.issuedAt).toLocaleDateString(
                        locale === "en" ? "en-US" : "es-AR",
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rx.status === "draft" && (
                      <button
                        onClick={() => handleAction(rx.id, "issue")}
                        className="p-1.5 hover:bg-green-50 rounded transition text-green-600"
                        title="Emitir receta"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {(rx.status === "active" || rx.status === "sent") && (
                      <button
                        onClick={() => handleAction(rx.id, "send")}
                        className="p-1.5 hover:bg-blue-50 rounded transition text-blue-600"
                        title="Enviar al paciente"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {rx.status !== "cancelled" && rx.status !== "expired" && (
                      <button
                        onClick={() => copyVerificationUrl(rx.verificationToken)}
                        className="p-1.5 hover:bg-surface rounded transition"
                        title="Copiar URL QR"
                      >
                        <Copy className="w-3.5 h-3.5 text-ink/50" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(rx.id, "repeat")}
                      className="p-1.5 hover:bg-surface rounded transition"
                      title="Repetir receta"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-ink/50" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-ink/30" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ink/30" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border/50 px-4 py-3 bg-surface/30">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Medications detail */}
                      <div>
                        <p className="text-[10px] font-bold text-ink/50 uppercase mb-2">
                          Medicamentos
                        </p>
                        <div className="space-y-1.5">
                          {rx.medications.map((m, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-lg px-3 py-2 border border-border/50"
                            >
                              <p className="text-xs font-semibold text-ink">{m.medicationName}</p>
                              {m.genericName && (
                                <p className="text-[10px] text-ink/40">Generico: {m.genericName}</p>
                              )}
                              <p className="text-[10px] text-ink/50">
                                {m.dosage} — {m.frequency}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions & info */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-ink/50 uppercase mb-2">
                            Acciones
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rx.status === "draft" && (
                              <button
                                onClick={() => handleAction(rx.id, "issue")}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Emitir
                              </button>
                            )}
                            {(rx.status === "active" || rx.status === "sent") && (
                              <>
                                <button
                                  onClick={() => handleAction(rx.id, "send")}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition"
                                >
                                  <Send className="w-3 h-3" />
                                  Enviar WhatsApp
                                </button>
                                <a
                                  href={`/rx/${rx.verificationToken}`}
                                  target="_blank"
                                  rel="noopener"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border text-ink/70 px-3 py-1.5 rounded-md hover:bg-surface transition"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver receta
                                </a>
                              </>
                            )}
                            <button
                              onClick={() => handleAction(rx.id, "repeat")}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border text-ink/70 px-3 py-1.5 rounded-md hover:bg-surface transition"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Repetir
                            </button>
                            {rx.status !== "cancelled" &&
                              rx.status !== "expired" &&
                              rx.status !== "dispensed" && (
                                <button
                                  onClick={() => handleAction(rx.id, "cancel")}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50 transition"
                                >
                                  <Ban className="w-3 h-3" />
                                  Anular
                                </button>
                              )}
                          </div>
                        </div>

                        {/* OSDE Info */}
                        {rx.osde && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Shield className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-[10px] font-bold text-green-800 uppercase">
                                OSDE FHIR 4.0
                              </span>
                            </div>
                            <p className="text-[11px] text-green-700">
                              Prescripcion registrada en el sistema electronico de OSDE. Conforme
                              Res. MSN 1314/2023.
                            </p>
                          </div>
                        )}

                        {/* Coverage */}
                        {rx.coverageName && (
                          <p className="text-[11px] text-ink/50">
                            Cobertura: <span className="font-semibold">{rx.coverageName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
