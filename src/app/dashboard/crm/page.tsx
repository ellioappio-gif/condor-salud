"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "@/lib/i18n/context";
import { useIsDemo } from "@/lib/auth/context";
import { useDemoAction } from "@/components/DemoModal";
import { useToast } from "@/components/Toast";
import useSWR, { mutate as globalMutate } from "swr";
import {
  Card,
  CardContent,
  Button,
  PageHeader,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Skeleton,
} from "@/components/ui";
import {
  Users,
  Phone,
  Mail,
  Plus,
  Search,
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  ChevronRight,
  X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  motivo?: string;
  fuente: string;
  estado: string;
  prioridad?: string;
  assigned_to?: string;
  tags?: string[];
  notas?: string;
  created_at: string;
  updated_at?: string;
}

interface LeadStats {
  total: number;
  nuevo: number;
  contactado: number;
  interesado: number;
  turno_agendado: number;
  convertido: number;
  perdido: number;
  conversionRate: number;
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  nuevo: { label: "Nuevo", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  contactado: { label: "Contactado", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  interesado: {
    label: "Interesado",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200",
  },
  turno_agendado: {
    label: "Turno agendado",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  convertido: {
    label: "Convertido",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  perdido: { label: "Perdido", color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
};

const FUENTE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  web: "Web",
  referido: "Referido",
  landing: "Landing",
  chatbot: "Chatbot",
  manual: "Manual",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── Component ────────────────────────────────────────────────

export default function CRMPage() {
  const { t } = useLocale();
  const isDemo = useIsDemo();
  const { showDemo } = useDemoAction();
  const { showToast } = useToast();

  const [estadoFilter, setEstadoFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newTelefono, setNewTelefono] = useState("");
  const [newMotivo, setNewMotivo] = useState("");
  const [noteText, setNoteText] = useState("");

  const LIMIT = 25;

  const leadsUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(LIMIT));
    params.set("offset", String((page - 1) * LIMIT));
    if (estadoFilter) params.set("estado", estadoFilter);
    if (search) params.set("search", search);
    return `/api/crm/leads?${params.toString()}`;
  }, [estadoFilter, search, page]);

  const { data: leadsData, isLoading } = useSWR<{ leads: Lead[]; total: number }>(
    leadsUrl,
    fetcher,
    { keepPreviousData: true },
  );
  const { data: stats } = useSWR<LeadStats>("/api/crm/stats", fetcher);
  const { data: selectedLead, isLoading: loadingDetail } = useSWR<Lead>(
    selectedLeadId ? `/api/crm/leads/${selectedLeadId}` : null,
    fetcher,
  );

  const leads = leadsData?.leads ?? [];
  const total = leadsData?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleCreateLead = useCallback(async () => {
    if (isDemo) {
      showDemo("Crear leads disponible en producción.");
      return;
    }
    if (!newNombre.trim() || !newTelefono.trim()) {
      showToast("Nombre y teléfono son requeridos", "error");
      return;
    }
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: newNombre,
          telefono: newTelefono,
          motivo: newMotivo,
          fuente: "manual",
        }),
      });
      if (res.ok) {
        showToast("Lead creado exitosamente", "success");
        setShowNewModal(false);
        setNewNombre("");
        setNewTelefono("");
        setNewMotivo("");
        globalMutate(leadsUrl);
        globalMutate("/api/crm/stats");
      } else {
        showToast("Error al crear lead", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    }
  }, [isDemo, newNombre, newTelefono, newMotivo, showDemo, showToast, leadsUrl]);

  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: string) => {
      if (isDemo) {
        showDemo("Cambiar estado disponible en producción.");
        return;
      }
      try {
        await fetch(`/api/crm/leads/${leadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status", estado: newStatus }),
        });
        globalMutate(`/api/crm/leads/${leadId}`);
        globalMutate(leadsUrl);
        globalMutate("/api/crm/stats");
        showToast("Estado actualizado", "success");
      } catch {
        showToast("Error al actualizar", "error");
      }
    },
    [isDemo, showDemo, showToast, leadsUrl],
  );

  const handleAddNote = useCallback(async () => {
    if (!selectedLeadId || !noteText.trim()) return;
    if (isDemo) {
      showDemo("Agregar notas disponible en producción.");
      return;
    }
    try {
      await fetch(`/api/crm/leads/${selectedLeadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notes", nota: noteText }),
      });
      setNoteText("");
      globalMutate(`/api/crm/leads/${selectedLeadId}`);
      showToast("Nota agregada", "success");
    } catch {
      showToast("Error", "error");
    }
  }, [isDemo, selectedLeadId, noteText, showDemo, showToast]);

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="CRM — Leads"
        description="Gestione el pipeline de leads y oportunidades comerciales"
        breadcrumbs={[
          {
            label:
              t("dashboard.mainPanel") !== "dashboard.mainPanel"
                ? t("dashboard.mainPanel")
                : "Panel",
            href: "/dashboard",
          },
          { label: "CRM" },
        ]}
        actions={
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo lead
          </Button>
        }
      />

      {/* Pipeline KPIs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(
            [
              "nuevo",
              "contactado",
              "interesado",
              "turno_agendado",
              "convertido",
              "perdido",
            ] as const
          ).map((key) => {
            const cfg = ESTADO_CONFIG[key]!;
            return (
              <button
                key={key}
                onClick={() => setEstadoFilter(estadoFilter === key ? "" : key)}
                className={`border rounded-lg p-3 text-left transition ${estadoFilter === key ? `${cfg.bg} border-2` : "bg-white border-border hover:border-celeste-light"}`}
              >
                <p className="text-[10px] font-bold tracking-wider uppercase text-ink-muted">
                  {cfg.label}
                </p>
                <p className={`text-lg font-bold ${cfg.color}`}>
                  {(stats as unknown as Record<string, number>)[key] ?? 0}
                </p>
              </button>
            );
          })}
          <div className="bg-white border border-border rounded-lg p-3">
            <p className="text-[10px] font-bold tracking-wider uppercase text-ink-muted">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Conversión
            </p>
            <p className="text-lg font-bold text-ink">{(stats.conversionRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            aria-label="Buscar leads"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-celeste-dark"
          />
        </div>
        {(estadoFilter || search) && (
          <Button
            variant="outline"
            onClick={() => {
              setEstadoFilter("");
              setSearch("");
              setPage(1);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[500px]">
        {/* Left: Lead List */}
        <div className="lg:col-span-2 space-y-2">
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}

          {!isLoading && leads.length === 0 && (
            <EmptyState
              icon={<Users className="w-10 h-10 text-ink-muted" />}
              title="Sin leads"
              description={
                search || estadoFilter
                  ? "No se encontraron leads con esos filtros."
                  : "No hay leads registrados aún."
              }
            />
          )}

          {leads.map((lead) => {
            const cfg = ESTADO_CONFIG[lead.estado] ?? ESTADO_CONFIG.nuevo!;
            return (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedLeadId(lead.id);
                  setNoteText("");
                }}
                className={`w-full text-left border rounded-lg p-3 transition hover:border-celeste-light ${selectedLeadId === lead.id ? "border-celeste bg-celeste-pale/20" : "bg-white border-border"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{lead.nombre}</p>
                    <p className="text-xs text-ink-muted flex items-center gap-2 mt-0.5">
                      <Phone className="w-3 h-3" /> {lead.telefono}
                      {lead.email && (
                        <>
                          <Mail className="w-3 h-3 ml-1" /> {lead.email}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${cfg.bg} ${cfg.color}`}
                    >
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-ink-muted" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-ink-muted">
                    {FUENTE_LABELS[lead.fuente] ?? lead.fuente}
                  </span>
                  <span className="text-[10px] text-ink-muted">· {fmtDate(lead.created_at)}</span>
                  {lead.motivo && (
                    <span className="text-[10px] text-ink-muted truncate">· {lead.motivo}</span>
                  )}
                </div>
              </button>
            );
          })}

          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>

        {/* Right: Lead Detail */}
        <div className="lg:col-span-3">
          {!selectedLeadId && (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded-lg">
              <EmptyState
                icon={<MessageSquare className="w-10 h-10 text-ink-muted" />}
                title="Seleccione un lead"
                description="Elija un lead del listado para ver detalles, cambiar estado o agregar notas."
              />
            </div>
          )}

          {selectedLeadId && loadingDetail && (
            <Card>
              <CardContent className="pt-6">
                <Skeleton className="h-48" />
              </CardContent>
            </Card>
          )}

          {selectedLeadId && selectedLead && !loadingDetail && (
            <Card>
              <CardContent className="pt-5 pb-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-ink">{selectedLead.nombre}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-ink-muted">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {selectedLead.telefono}
                      </span>
                      {selectedLead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {selectedLead.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLeadId(null)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <X className="w-4 h-4 text-ink-muted" />
                  </button>
                </div>

                {/* Status selector */}
                <div>
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1.5">
                    Estado
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(ESTADO_CONFIG).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => handleStatusChange(selectedLead.id, key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${selectedLead.estado === key ? `${cfg.bg} ${cfg.color} border-2` : "bg-white border-border text-ink-muted hover:border-celeste-light"}`}
                      >
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-ink-muted text-xs">Fuente:</span>{" "}
                    <span className="font-medium">
                      {FUENTE_LABELS[selectedLead.fuente] ?? selectedLead.fuente}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-xs">Prioridad:</span>{" "}
                    <span className="font-medium">{selectedLead.prioridad ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-xs">Asignado:</span>{" "}
                    <span className="font-medium">{selectedLead.assigned_to ?? "Sin asignar"}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted text-xs">Creado:</span>{" "}
                    <span className="font-medium">{fmtDate(selectedLead.created_at)}</span>
                  </div>
                  {selectedLead.motivo && (
                    <div className="col-span-2">
                      <span className="text-ink-muted text-xs">Motivo:</span>{" "}
                      <span className="font-medium">{selectedLead.motivo}</span>
                    </div>
                  )}
                  {selectedLead.tags && selectedLead.tags.length > 0 && (
                    <div className="col-span-2 flex items-center gap-1 flex-wrap">
                      <span className="text-ink-muted text-xs">Tags:</span>
                      {selectedLead.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-celeste-pale/50 text-celeste-dark text-[10px] font-medium rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isDemo) {
                        showDemo("Agendar turno disponible en producción.");
                        return;
                      }
                      window.location.href = `/dashboard/turnos?leadId=${selectedLead.id}&nombre=${encodeURIComponent(selectedLead.nombre)}`;
                    }}
                  >
                    <CalendarCheck className="w-4 h-4 mr-1.5" /> Agendar turno
                  </Button>
                  {selectedLead.telefono && (
                    <a
                      href={`https://wa.me/${selectedLead.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-xs font-medium border border-border rounded hover:border-green-400 hover:text-green-600 transition"
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" /> WhatsApp
                    </a>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                    Notas
                  </label>
                  {selectedLead.notas && (
                    <div className="bg-gray-50 border border-border rounded p-3 text-sm text-ink-light whitespace-pre-wrap">
                      {selectedLead.notas}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Agregar nota..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-celeste-dark"
                    />
                    <Button variant="outline" onClick={handleAddNote} disabled={!noteText.trim()}>
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Lead Modal */}
      {showNewModal && (
        <Modal open={showNewModal} title="Nuevo lead" onClose={() => setShowNewModal(false)}>
          <div className="space-y-4">
            <Input
              label="Nombre *"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Nombre completo"
            />
            <Input
              label="Teléfono *"
              value={newTelefono}
              onChange={(e) => setNewTelefono(e.target.value)}
              placeholder="+54 9 ..."
            />
            <Input
              label="Motivo"
              value={newMotivo}
              onChange={(e) => setNewMotivo(e.target.value)}
              placeholder="Motivo de consulta"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateLead}>Crear lead</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
