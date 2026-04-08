"use client";

import { use, useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useDemoAction } from "@/components/DemoModal";
import { useIsDemo } from "@/lib/auth/context";
import { useAuth } from "@/lib/auth/context";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/i18n/context";
import { usePacientes, useTurnos, useFacturas } from "@/hooks/use-data";
import { EmptyState, TableSkeleton } from "@/components/ui";
import { Users, Calendar, FileText } from "lucide-react";
import type { Paciente } from "@/lib/services/data";
import { formatCurrency } from "@/lib/utils";

// ─── NOTE: No hardcoded patient data. ────────────────────────
// Real patient details come from usePacientes() via Supabase.
// Mock/demo data lives only in src/lib/services/data.ts
// (returned when isSupabaseConfigured() === false).

export default function PacienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showDemo } = useDemoAction();
  const { showToast } = useToast();
  const { t } = useLocale();
  const isDemo = useIsDemo();

  // ── Data hooks ─────────────────────────────────────────────
  const {
    data: allPacientes,
    isLoading: loadingPacientes,
    mutate: mutatePacientes,
  } = usePacientes();
  const { data: allTurnos, isLoading: loadingTurnos } = useTurnos();
  const { data: allFacturas, isLoading: loadingFacturas } = useFacturas();

  const paciente = allPacientes?.find((p) => p.id === id);
  const turnosPaciente =
    allTurnos?.filter(
      (t) =>
        t.pacienteId === id ||
        (!t.pacienteId && t.paciente?.toLowerCase() === paciente?.nombre?.toLowerCase()),
    ) ?? [];
  const facturasPaciente =
    allFacturas?.filter(
      (f) =>
        (f as any).pacienteId === id ||
        f.paciente?.toLowerCase() === paciente?.nombre?.toLowerCase(),
    ) ?? [];

  const isLoading = loadingPacientes || loadingTurnos || loadingFacturas;

  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditarPaciente = () => {
    if (isDemo) {
      showDemo("Editar paciente");
      return;
    }
    setShowEditModal(true);
  };

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Link href="/dashboard/pacientes" className="hover:text-celeste-dark transition">
            Pacientes
          </Link>
          <span>/</span>
          <span className="text-ink font-medium">Cargando...</span>
        </div>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  // ── Patient not found ──────────────────────────────────────
  if (!paciente) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Link href="/dashboard/pacientes" className="hover:text-celeste-dark transition">
            Pacientes
          </Link>
          <span>/</span>
          <span className="text-ink font-medium">No encontrado</span>
        </div>
        <EmptyState
          icon={<Users className="w-10 h-10 text-ink-muted" />}
          title="Paciente no encontrado"
          description={`No se encontro un paciente con ID "${id}". Puede que haya sido eliminado o que el enlace sea incorrecto.`}
          actionLabel="Volver a Pacientes"
          actionHref="/dashboard/pacientes"
        />
      </div>
    );
  }

  // ── Derived display values ─────────────────────────────────
  const nombre = paciente.nombre?.split(" ")[0] ?? "";
  const apellido = paciente.nombre?.split(" ").slice(1).join(" ") ?? "";
  const initials = `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Link href="/dashboard/pacientes" className="hover:text-celeste-dark transition">
          Pacientes
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">
          {apellido ? `${apellido}, ${nombre}` : paciente.nombre}
        </span>
      </div>

      {/* Header */}
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-celeste-pale flex items-center justify-center text-celeste-dark font-bold text-xl">
              {initials || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink">
                {apellido ? `${apellido}, ${nombre}` : paciente.nombre}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-ink-light">
                {paciente.dni && <span>DNI {paciente.dni}</span>}
                {paciente.financiador && (
                  <>
                    <span className="w-1 h-1 bg-ink-muted rounded-full" />
                    <span className="font-semibold text-celeste-dark">{paciente.financiador}</span>
                  </>
                )}
                {paciente.plan && (
                  <>
                    <span className="w-1 h-1 bg-ink-muted rounded-full" />
                    <span>{paciente.plan}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/agenda"
              className="px-4 py-2 text-sm font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark hover:text-celeste-dark transition"
            >
              Agendar turno
            </Link>
            <button
              onClick={handleEditarPaciente}
              className="px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition"
            >
              Editar paciente
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Datos personales */}
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-4">
            Datos Personales
          </h3>
          <div className="space-y-3 text-sm">
            {paciente.dni && (
              <div>
                <span className="text-ink-muted">DNI:</span>{" "}
                <span className="text-ink font-mono">{paciente.dni}</span>
              </div>
            )}
            {paciente.telefono && (
              <div>
                <span className="text-ink-muted">Telefono:</span>{" "}
                <span className="text-ink">{paciente.telefono}</span>
              </div>
            )}
            {paciente.email && (
              <div>
                <span className="text-ink-muted">Email:</span>{" "}
                <span className="text-ink">{paciente.email}</span>
              </div>
            )}
            {!paciente.dni && !paciente.telefono && !paciente.email && (
              <p className="text-xs text-ink-muted">
                Completa los datos del paciente para ver su informacion personal.
              </p>
            )}
          </div>
        </div>

        {/* Cobertura */}
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-4">
            Cobertura
          </h3>
          <div className="space-y-3 text-sm">
            {paciente.financiador ? (
              <>
                <div>
                  <span className="text-ink-muted">Financiador:</span>{" "}
                  <span className="text-ink font-semibold">{paciente.financiador}</span>
                </div>
                {paciente.plan && (
                  <div>
                    <span className="text-ink-muted">Plan:</span>{" "}
                    <span className="text-ink">{paciente.plan}</span>
                  </div>
                )}
                <div>
                  <span className="text-ink-muted">Estado:</span>{" "}
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                      paciente.estado === "activo"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {paciente.estado === "activo" ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-ink-muted">
                La cobertura se completa al registrar el financiador del paciente.
              </p>
            )}
          </div>
        </div>

        {/* Estado */}
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-4">
            Actividad
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-ink-muted">Ultima visita:</span>{" "}
              <span className="text-ink">{paciente.ultimaVisita || "Sin registros"}</span>
            </div>
            <div>
              <span className="text-ink-muted">Turnos proximos:</span>{" "}
              <span className="text-ink font-semibold">{turnosPaciente.length}</span>
            </div>
            <div>
              <span className="text-ink-muted">Facturas:</span>{" "}
              <span className="text-ink font-semibold">{facturasPaciente.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Turnos proximos */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase">
            Turnos Proximos
          </h3>
          <Link
            href="/dashboard/agenda"
            className="text-xs text-celeste-dark font-medium hover:underline"
          >
            Ver agenda
          </Link>
        </div>
        {turnosPaciente.length === 0 ? (
          <EmptyState
            compact
            icon={<Calendar className="w-8 h-8 text-ink-muted" />}
            title="Sin turnos proximos"
            description="Los turnos del paciente aparecen aca al agendarlos desde la agenda."
          />
        ) : (
          <table className="w-full text-sm" aria-label="Turnos del paciente">
            <tbody>
              {turnosPaciente.map((t, i) => (
                <tr
                  key={i}
                  className="border-t border-border-light first:border-t-0 hover:bg-celeste-pale/30 transition"
                >
                  <td className="px-5 py-3 font-semibold text-ink">{t.hora}</td>
                  <td className="px-5 py-3 text-ink-light">{t.profesional || "\u2014"}</td>
                  <td className="px-5 py-3 text-ink-light">{t.tipo}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        t.estado === "confirmado"
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Facturacion */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase">Facturacion</h3>
          <Link
            href="/dashboard/facturacion"
            className="text-xs text-celeste-dark font-medium hover:underline"
          >
            Ver todo
          </Link>
        </div>
        {facturasPaciente.length === 0 ? (
          <EmptyState
            compact
            icon={<FileText className="w-8 h-8 text-ink-muted" />}
            title="Sin facturas registradas"
            description="Las facturas aparecen aca a medida que se registran atenciones y se facturan practicas."
          />
        ) : (
          <table className="w-full text-sm" aria-label="Facturación del paciente">
            <thead>
              <tr className="bg-surface text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                <th scope="col" className="text-left px-5 py-2.5">
                  Financiador
                </th>
                <th scope="col" className="text-left px-5 py-2.5">
                  Paciente
                </th>
                <th scope="col" className="text-right px-5 py-2.5">
                  Monto
                </th>
                <th scope="col" className="text-center px-5 py-2.5">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {facturasPaciente.map((f, i) => (
                <tr key={i} className="border-t border-border-light">
                  <td className="px-5 py-3 text-xs font-semibold text-ink">{f.financiador}</td>
                  <td className="px-5 py-3 text-xs text-ink-light">{f.paciente}</td>
                  <td className="px-5 py-3 text-right text-ink">{formatCurrency(f.monto)}</td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        f.estado === "cobrada"
                          ? "bg-green-50 text-green-700"
                          : f.estado === "rechazada"
                            ? "bg-red-50 text-red-600"
                            : "bg-celeste-pale text-celeste-dark"
                      }`}
                    >
                      {f.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Patient Modal */}
      {showEditModal && paciente && (
        <EditPatientModal
          paciente={paciente}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            mutatePacientes();
            setShowEditModal(false);
            showToast(t("patients.patientUpdated"), "success");
          }}
        />
      )}
    </div>
  );
}

// ─── Insurance Options ──────────────────────────────────────
const INSURANCE_OPTIONS = [
  "PAMI",
  "OSDE",
  "Swiss Medical",
  "Galeno",
  "IOMA",
  "Medifé",
  "Sancor Salud",
  "Unión Personal",
  "Accord Salud",
  "OSECAC",
];

// ─── Edit Patient Modal ─────────────────────────────────────
function EditPatientModal({
  paciente,
  onClose,
  onUpdated,
}: {
  paciente: Paciente;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { t } = useLocale();
  const { showToast } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);

  // Form state — pre-filled with current patient data
  const [nombre, setNombre] = useState(paciente.nombre ?? "");
  const [dni, setDni] = useState(paciente.dni ?? "");
  const [email, setEmail] = useState(paciente.email ?? "");
  const [telefono, setTelefono] = useState(paciente.telefono ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(paciente.fechaNacimiento ?? "");
  const [direccion, setDireccion] = useState(paciente.direccion ?? "");
  const [financiador, setFinanciador] = useState(paciente.financiador ?? "");
  const [plan, setPlan] = useState(paciente.plan ?? "");
  const [notas, setNotas] = useState("");
  const [estado, setEstado] = useState<"activo" | "inactivo">(paciente.estado ?? "activo");

  // Open the dialog on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !dni.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/dashboard/patients/${paciente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          dni: dni.trim(),
          email: email.trim() || undefined,
          telefono: telefono.trim() || undefined,
          fechaNacimiento: fechaNacimiento || undefined,
          direccion: direccion.trim() || undefined,
          financiador: financiador || undefined,
          plan: plan.trim() || undefined,
          notas: notas.trim() || undefined,
          estado,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Error desconocido" }));
        showToast(data.error || t("patients.patientUpdateError"), "error");
        return;
      }

      onUpdated();
    } catch {
      showToast(t("patients.patientUpdateError"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-lg rounded-xl border border-border bg-white p-0 shadow-2xl backdrop:bg-black/40"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">{t("patients.editPatientTitle")}</h2>
            <p className="text-xs text-ink-muted mt-0.5">{t("patients.editPatientDesc")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-xl leading-none p-1"
            aria-label={t("patients.cancel")}
          >
            ×
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre — required */}
          <div className="sm:col-span-2">
            <label htmlFor="ep-nombre" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldNombre")} *
            </label>
            <input
              id="ep-nombre"
              type="text"
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("patients.fieldNombrePlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>

          {/* DNI — required */}
          <div>
            <label htmlFor="ep-dni" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldDNI")} *
            </label>
            <input
              id="ep-dni"
              type="text"
              required
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder={t("patients.fieldDNIPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="ep-telefono" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldTelefono")}
            </label>
            <input
              id="ep-telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder={t("patients.fieldTelefonoPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="ep-email" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldEmail")}
            </label>
            <input
              id="ep-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("patients.fieldEmailPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>

          {/* Fecha de nacimiento */}
          <div>
            <label htmlFor="ep-fecha" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldFechaNacimiento")}
            </label>
            <input
              id="ep-fecha"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>

          {/* Estado */}
          <div>
            <label htmlFor="ep-estado" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldEstado")}
            </label>
            <select
              id="ep-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as "activo" | "inactivo")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            >
              <option value="activo">{t("patients.statusActive")}</option>
              <option value="inactivo">{t("patients.statusInactive")}</option>
            </select>
          </div>

          {/* Financiador */}
          <div>
            <label
              htmlFor="ep-financiador"
              className="block text-xs font-medium text-ink-muted mb-1"
            >
              {t("patients.fieldFinanciador")}
            </label>
            <select
              id="ep-financiador"
              value={financiador}
              onChange={(e) => setFinanciador(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            >
              <option value="">{t("patients.selectInsurance")}</option>
              <option value="Particular">{t("patients.particular")}</option>
              {INSURANCE_OPTIONS.map((ins) => (
                <option key={ins} value={ins}>
                  {ins}
                </option>
              ))}
            </select>
          </div>

          {/* Plan */}
          <div>
            <label htmlFor="ep-plan" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldPlan")}
            </label>
            <input
              id="ep-plan"
              type="text"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder={t("patients.fieldPlanPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2">
            <label htmlFor="ep-direccion" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldDireccion")}
            </label>
            <input
              id="ep-direccion"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder={t("patients.fieldDireccionPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>

          {/* Notas */}
          <div className="sm:col-span-2">
            <label htmlFor="ep-notas" className="block text-xs font-medium text-ink-muted mb-1">
              {t("patients.fieldNotas")}
            </label>
            <textarea
              id="ep-notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder={t("patients.fieldNotasPlaceholder")}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-celeste-dark/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-ink-muted hover:text-ink border border-border rounded-lg transition"
          >
            {t("patients.cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || !nombre.trim() || !dni.trim()}
            className="px-5 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-lg hover:bg-celeste transition disabled:opacity-50"
          >
            {saving ? t("patients.saving") : t("patients.updatePatient")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
