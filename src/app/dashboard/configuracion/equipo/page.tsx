"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { isSupabaseConfigured } from "@/lib/env";
import { Loader2, AlertCircle, UserPlus, X, Send } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface TeamMember {
  id: string;
  full_name: string | null;
  role: string;
  especialidad: string | null;
  matricula: string | null;
  active: boolean;
  email?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  medico: "Médico",
  facturacion: "Facturación",
  recepcion: "Recepción",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 text-red-600",
  medico: "bg-celeste-pale text-celeste-dark",
  facturacion: "bg-gold-pale text-[#B8860B]",
  recepcion: "bg-green-50 text-green-700",
};

const ROLE_PERMS: Record<string, string> = {
  admin: "Acceso total a todas las funcionalidades",
  medico: "Pacientes, Agenda, Verificación, Nomenclador, Reportes",
  facturacion: "Facturación, Rechazos, Financiadores, Auditoría, Reportes",
  recepcion: "Pacientes, Agenda, Verificación, Inventario",
};

const inputClass =
  "w-full rounded-[4px] border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-celeste-dark focus:border-celeste-dark transition";

// ─── Page ────────────────────────────────────────────────────

export default function EquipoPage() {
  const { showToast } = useToast();
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite modal state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("recepcion");
  const [inviting, setInviting] = useState(false);

  const isAdmin = user?.role === "admin";

  // ── Fetch team data ────────────────────────────────────────
  const fetchTeam = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.clinicId) {
      setLoading(false);
      setError("No se pudo cargar la información del equipo.");
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();

      // Fetch team members
      const { data: profiles } = await (sb as ReturnType<typeof createClient>)
        .from("profiles")
        .select("id, full_name, role, especialidad, matricula, active")
        .eq("clinic_id", user.clinicId)
        .order("full_name");

      setMembers((profiles || []) as unknown as TeamMember[]);

      // Fetch invitations (if admin)
      if (isAdmin) {
        const res = await fetch("/api/team/invite");
        if (res.ok) {
          const data = await res.json();
          setInvitations(data.invitations || []);
        }
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [user?.clinicId, isAdmin]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // ── Send invitation ────────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Error al enviar la invitación");
        return;
      }
      showToast(t("toast.config.inviteSent"), "success");
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("recepcion");
      fetchTeam(); // Refresh
    } catch {
      showToast(t("toast.config.connectionError"), "error");
    } finally {
      setInviting(false);
    }
  };

  // ── Cancel invitation ──────────────────────────────────────
  const handleCancelInvite = async (invId: string) => {
    try {
      const res = await fetch("/api/team/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: invId }),
      });
      if (res.ok) {
        showToast(t("toast.config.inviteCancelled"));
        fetchTeam();
      }
    } catch {
      showToast(t("toast.config.cancelError"), "error");
    }
  };

  // ── Loading / Error states ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-celeste-dark" />
        <span className="ml-2 text-sm text-ink-muted">Cargando equipo...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-ink-muted">{error}</p>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Link href="/dashboard/configuracion" className="hover:text-celeste-dark transition">
          Configuración
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">Equipo</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Equipo</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {members.length} miembro{members.length !== 1 ? "s" : ""} activo
            {members.length !== 1 ? "s" : ""}
            {pendingInvitations.length > 0 &&
              ` · ${pendingInvitations.length} invitación${pendingInvitations.length !== 1 ? "es" : ""} pendiente${pendingInvitations.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste-700 transition"
          >
            <UserPlus className="h-4 w-4" />
            Invitar miembro
          </button>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="bg-white border border-celeste-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">Invitar nuevo miembro</h3>
            <button onClick={() => setShowInvite(false)} className="text-ink-muted hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-ink-muted mb-1">Email</label>
              <input
                type="email"
                className={inputClass}
                placeholder="nombre@clinica.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-ink-muted mb-1">Rol</label>
              <select
                className={inputClass}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="medico">Médico</option>
                <option value="facturacion">Facturación</option>
                <option value="recepcion">Recepción</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="flex items-center gap-1.5 rounded-[4px] bg-celeste-dark px-4 py-2 text-xs font-bold text-white hover:bg-celeste-700 transition disabled:opacity-50"
            >
              {inviting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Enviar invitación
            </button>
          </div>
        </div>
      )}

      {/* Team table */}
      <div className="bg-white border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-[#F8FAFB] text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              <th scope="col" className="text-left px-5 py-2.5">
                Miembro
              </th>
              <th scope="col" className="text-left px-5 py-2.5">
                Rol
              </th>
              <th scope="col" className="text-left px-5 py-2.5">
                Especialidad
              </th>
              <th scope="col" className="text-left px-5 py-2.5">
                Matrícula
              </th>
              <th scope="col" className="text-center px-5 py-2.5">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr
                key={m.id}
                className="border-t border-border-light hover:bg-celeste-pale/30 transition"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-celeste-pale flex items-center justify-center text-celeste-dark text-xs font-bold">
                      {(m.full_name || "?")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        {m.full_name || "Sin nombre"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${ROLE_COLORS[m.role] || "bg-gray-100 text-gray-600"}`}
                  >
                    {ROLE_LABELS[m.role] || m.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-ink-light">{m.especialidad || "—"}</td>
                <td className="px-5 py-3 font-mono text-[10px] text-ink-muted">
                  {m.matricula || "—"}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      m.active !== false
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {m.active !== false ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-ink-muted">
                  No hay miembros en el equipo. Invitá al primer profesional.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-gold-pale/30 border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-3">
            Invitaciones Pendientes
          </h3>
          {pendingInvitations.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-semibold text-ink">{inv.email}</p>
                <p className="text-[10px] text-ink-muted">
                  Rol: {ROLE_LABELS[inv.role] || inv.role} · Enviada:{" "}
                  {new Date(inv.created_at).toLocaleDateString(locale === "en" ? "en-US" : "es-AR")}{" "}
                  · Expira:{" "}
                  {new Date(inv.expires_at).toLocaleDateString(locale === "en" ? "en-US" : "es-AR")}
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-[4px] hover:bg-red-50 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Roles */}
      <div className="bg-white border border-border rounded-lg p-5">
        <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-4">
          Roles y Permisos
        </h3>
        <div className="space-y-3">
          {Object.entries(ROLE_LABELS).map(([key, label]) => {
            const count = members.filter((m) => m.role === key).length;
            return (
              <div
                key={key}
                className="flex items-center gap-4 py-2 border-b border-border-light last:border-0"
              >
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded w-28 text-center ${ROLE_COLORS[key]}`}
                >
                  {label}
                </span>
                <p className="text-xs text-ink-light flex-1">{ROLE_PERMS[key]}</p>
                <span className="text-xs text-ink-muted">
                  {count} usuario{count !== 1 ? "s" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
