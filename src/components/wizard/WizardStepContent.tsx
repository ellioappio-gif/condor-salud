"use client";

import {
  useWizard,
  ESPECIALIDADES_OPTIONS,
  FINANCIADORES_OPTIONS,
  SISTEMA_ANTERIOR_OPTIONS,
} from "./WizardData";
import { FileUpload } from "@/components/ui/FileUpload";
import { Toggle } from "@/components/ui/Toggle";
import {
  Feather,
  Building2,
  Download,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Bot,
  Bell,
  FileText,
  Camera,
  Shield,
  BarChart3,
  Calendar,
  Stethoscope,
  Video,
} from "lucide-react";

// ─── Reusable form field ─────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-[4px] border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-celeste-dark focus:border-celeste-dark transition";

// ─── Feature explanation card ────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  color = "celeste",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color?: "celeste" | "green" | "amber" | "purple";
}) {
  const colorMap = {
    celeste: "border-celeste-200 bg-celeste-50/60 text-celeste-dark",
    green: "border-green-200 bg-green-50/60 text-green-700",
    amber: "border-amber-200 bg-amber-50/60 text-amber-700",
    purple: "border-purple-200 bg-purple-50/60 text-purple-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs mt-0.5 opacity-80">{description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step renderers ──────────────────────────────────────────

function StepBienvenida() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-center gap-4 rounded-2xl border border-celeste-100 bg-celeste-50/60 p-6">
        <Feather className="h-12 w-12 text-celeste-dark shrink-0" />
        <div>
          <h2 className="text-lg font-bold text-ink">Configurá tu clínica en 5 pasos</h2>
          <p className="text-sm text-ink-muted mt-1">
            Cargá datos básicos, importá pacientes desde planillas, y activá WhatsApp AI para turnos
            automáticos, recordatorios y recetas digitales.
          </p>
        </div>
      </div>

      {/* Steps preview */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            n: 1,
            label: "Datos de la clínica",
            desc: "Nombre, dirección, CUIT, logo (cámara habilitada)",
          },
          { n: 2, label: "Equipo médico", desc: "Profesionales, roles, importar planilla" },
          { n: 3, label: "Importar datos", desc: "Pacientes, documentos, fotos escaneadas" },
          {
            n: 4,
            label: "WhatsApp AI + Config",
            desc: "Bot IA, recordatorios 24hs, recetas digitales",
          },
          { n: 5, label: "Confirmación", desc: "Revisión final y activación" },
        ].map((s) => (
          <div
            key={s.n}
            className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-celeste-100 text-sm font-bold text-celeste-dark">
              {s.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{s.label}</p>
              <p className="text-xs text-ink-muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* What you get */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">¿Qué incluye Cóndor Salud?</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <FeatureCard
            icon={Bot}
            title="WhatsApp AI"
            description="Bot inteligente que agenda turnos, pregunta síntomas y evalúa gravedad automáticamente."
            color="celeste"
          />
          <FeatureCard
            icon={Bell}
            title="Recordatorios 24hs"
            description="Envía recordatorios de turnos automáticos por WhatsApp. El paciente confirma, cancela o reprograma."
            color="green"
          />
          <FeatureCard
            icon={FileText}
            title="Recetas digitales"
            description="Envía recetas digitales firmadas por WhatsApp con validez legal (Ley 27.553)."
            color="purple"
          />
          <FeatureCard
            icon={BarChart3}
            title="Dashboard en tiempo real"
            description="KPIs de facturación, cobros, rechazos e inflación actualizados al instante."
            color="amber"
          />
          <FeatureCard
            icon={Shield}
            title="Auditoría automática"
            description="Detecta errores de facturación, duplicados y autorizaciones vencidas antes de presentar."
            color="celeste"
          />
          <FeatureCard
            icon={Video}
            title="Telemedicina"
            description="Videollamadas integradas con Daily.co para consultas a distancia."
            color="green"
          />
        </div>
      </div>

      <div className="rounded-xl border border-celeste-200 bg-celeste-50 p-4">
        <p className="text-sm text-ink-muted">
          <strong className="text-celeste-dark">Tip:</strong> Solo el nombre de la clínica es
          obligatorio. Todo lo demás se puede completar después desde Configuración.
        </p>
      </div>
    </div>
  );
}

function StepClinica() {
  const { formData, updateForm } = useWizard();

  return (
    <div className="space-y-5">
      {/* Feature explanation */}
      <div className="grid gap-2 sm:grid-cols-2 mb-2">
        <FeatureCard
          icon={Building2}
          title="Datos en facturas y reportes"
          description="Nombre, CUIT y dirección aparecen automáticamente en facturas PDF, notas de crédito y reportes."
        />
        <FeatureCard
          icon={Camera}
          title="Cámara habilitada"
          description="Desde el celular podés sacar fotos directamente para subir el logo o documentos."
          color="green"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre de la clínica" required>
          <input
            type="text"
            className={inputClass}
            placeholder="Ej: Centro Médico San Martín"
            value={formData.nombre}
            onChange={(e) => updateForm({ nombre: e.target.value })}
            autoFocus
          />
        </Field>
        <Field label="CUIT" hint="Sin guiones, 11 dígitos">
          <input
            type="text"
            className={inputClass}
            placeholder="20-12345678-9"
            value={formData.cuit}
            onChange={(e) => updateForm({ cuit: e.target.value })}
            maxLength={13}
          />
        </Field>
        <Field label="Dirección">
          <input
            type="text"
            className={inputClass}
            placeholder="Av. Santa Fe 2100, CABA"
            value={formData.direccion}
            onChange={(e) => updateForm({ direccion: e.target.value })}
          />
        </Field>
        <Field label="Teléfono">
          <input
            type="tel"
            className={inputClass}
            placeholder="+54 11 1234-5678"
            value={formData.telefono}
            onChange={(e) => updateForm({ telefono: e.target.value })}
          />
        </Field>
        <Field label="Email de la clínica" hint="Para comunicaciones con pacientes">
          <input
            type="email"
            className={inputClass}
            placeholder="admin@clinica.com"
            value={formData.email}
            onChange={(e) => updateForm({ email: e.target.value })}
          />
        </Field>
      </div>

      <FileUpload
        label="Logo de la clínica"
        hint="Se muestra en facturas, reportes, dashboard y recetas digitales. PNG o JPG, máx. 2 MB."
        files={formData.logoFiles}
        onChange={(f) => updateForm({ logoFiles: f })}
        accept="image/png,image/jpeg,image/webp"
        maxFiles={1}
        maxSize={2 * 1024 * 1024}
        enableCamera
      />
    </div>
  );
}

function StepEquipo() {
  const { formData, updateForm } = useWizard();

  return (
    <div className="space-y-6">
      {/* Feature explanation */}
      <div className="grid gap-2 sm:grid-cols-2 mb-2">
        <FeatureCard
          icon={Shield}
          title="Permisos por rol"
          description="Admin: acceso total. Médico: HC + agenda. Facturación: cobros + reportes. Recepción: turnos + pacientes."
        />
        <FeatureCard
          icon={Stethoscope}
          title="Cada médico, su agenda"
          description="Los profesionales con rol 'médico' reciben su propia agenda y lista de pacientes automáticamente."
          color="green"
        />
      </div>

      <Field label="Cantidad de profesionales" hint="Incluye médicos, administrativos y recepción">
        <input
          type="number"
          min={1}
          max={500}
          className={inputClass + " max-w-[120px]"}
          value={formData.cantidadProfesionales}
          onChange={(e) =>
            updateForm({ cantidadProfesionales: Math.max(1, Number(e.target.value) || 1) })
          }
        />
      </Field>

      {/* Manual entry */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-celeste-dark" />
          Agregar miembros manualmente
        </h3>
        <TeamMemberForm />
      </div>

      {/* Or import */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-xs font-medium text-ink-muted uppercase tracking-wider">
            o importá desde planilla
          </span>
        </div>
      </div>

      <FileUpload
        label="Planilla del equipo"
        hint="Subí un Excel o CSV con columnas: Nombre, Email, Rol, Especialidad. Descargá la plantilla →"
        files={formData.teamFiles}
        onChange={(f) => updateForm({ teamFiles: f })}
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        maxFiles={3}
      />

      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-celeste-dark hover:underline"
      >
        <Download className="h-4 w-4" />
        Descargar plantilla de equipo (.xlsx)
      </a>
    </div>
  );
}

function TeamMemberForm() {
  const { formData, updateForm } = useWizard();

  const addMember = () => {
    updateForm({
      teamMembers: [...formData.teamMembers, { name: "", email: "", role: "medico" }],
    });
  };

  const updateMember = (index: number, patch: Partial<(typeof formData.teamMembers)[0]>) => {
    const updated = formData.teamMembers.map((m, i) => (i === index ? { ...m, ...patch } : m));
    updateForm({ teamMembers: updated });
  };

  const removeMember = (index: number) => {
    updateForm({ teamMembers: formData.teamMembers.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      {formData.teamMembers.map((member, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end rounded-lg border border-gray-200 bg-gray-50/50 p-3"
        >
          <div>
            <label className="text-xs text-ink-muted">Nombre</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Dr. Juan Pérez"
              value={member.name}
              onChange={(e) => updateMember(i, { name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted">Email</label>
            <input
              type="email"
              className={inputClass}
              placeholder="juan@clinica.com"
              value={member.email}
              onChange={(e) => updateMember(i, { email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-ink-muted">Rol</label>
            <select
              className={inputClass}
              value={member.role}
              onChange={(e) =>
                updateMember(i, {
                  role: e.target.value as "admin" | "medico" | "facturacion" | "recepcion",
                })
              }
            >
              <option value="medico">Médico</option>
              <option value="admin">Admin</option>
              <option value="facturacion">Facturación</option>
              <option value="recepcion">Recepción</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => removeMember(i)}
            className="p-2 text-gray-400 hover:text-red-500 transition"
            aria-label={`Eliminar ${member.name || "miembro"}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addMember}
        className="flex items-center gap-2 rounded-[4px] border border-dashed border-celeste px-4 py-2.5 text-sm font-medium text-celeste-dark hover:bg-celeste-50 transition"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Agregar miembro
      </button>
    </div>
  );
}

function StepImportacion() {
  const { formData, updateForm } = useWizard();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-celeste-200 bg-celeste-50 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-celeste-dark shrink-0 mt-0.5" />
        <div className="text-sm text-ink-muted">
          <p className="font-medium text-ink mb-1">Este paso es opcional</p>
          <p>
            Si ya tenés datos en planillas Excel, CSV o documentos PDF, podés subirlos acá. Si
            empezás de cero, simplemente avanzá al siguiente paso.
          </p>
        </div>
      </div>

      {/* Feature explanation */}
      <div className="grid gap-2 sm:grid-cols-2">
        <FeatureCard
          icon={Camera}
          title="Usá la cámara del celular"
          description="Escaneá documentos, habilitaciones o historias clínicas en papel sacando una foto directamente."
          color="green"
        />
        <FeatureCard
          icon={FileText}
          title="Importación inteligente"
          description="El sistema detecta automáticamente las columnas de tu planilla y mapea los datos al formato correcto."
          color="celeste"
        />
      </div>

      <FileUpload
        label="Planilla de pacientes"
        hint="Excel o CSV con columnas: Nombre, DNI, Financiador, Teléfono, Email. Descargá la plantilla abajo."
        files={formData.patientFiles}
        onChange={(f) => updateForm({ patientFiles: f })}
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        maxFiles={5}
      />

      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-celeste-dark hover:underline"
      >
        <Download className="h-4 w-4" />
        Descargar plantilla de pacientes (.xlsx)
      </a>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-xs font-medium text-ink-muted uppercase tracking-wider">
            documentos adicionales
          </span>
        </div>
      </div>

      <FileUpload
        label="Contratos, habilitaciones y otros documentos"
        hint="PDF, imágenes u otros archivos relevantes. Usá la cámara del celular para escanear documentos en papel."
        files={formData.documentFiles}
        onChange={(f) => updateForm({ documentFiles: f })}
        maxFiles={20}
        enableCamera
      />
    </div>
  );
}

function StepConfiguracion() {
  const { formData, updateForm } = useWizard();

  const toggleEspecialidad = (esp: string) => {
    const current = formData.especialidades;
    updateForm({
      especialidades: current.includes(esp) ? current.filter((e) => e !== esp) : [...current, esp],
    });
  };

  const toggleFinanciador = (fin: string) => {
    const current = formData.financiadores;
    updateForm({
      financiadores: current.includes(fin) ? current.filter((f) => f !== fin) : [...current, fin],
    });
  };

  return (
    <div className="space-y-6">
      {/* ─── WhatsApp AI ─────────────────────────────────── */}
      <div className="space-y-4 rounded-2xl border-2 border-celeste-200 bg-celeste-50/40 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10">
            <MessageSquare className="h-5 w-5 text-[#25D366]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">WhatsApp AI para tu clínica</h3>
            <p className="text-xs text-ink-muted">
              Ingresá el número de WhatsApp y activá las funciones de inteligencia artificial
            </p>
          </div>
        </div>

        <Field
          label="Número de WhatsApp de la clínica"
          hint="Formato: +54 11 1234-5678. Este número recibe y envía mensajes automáticos."
        >
          <input
            type="tel"
            className={inputClass}
            placeholder="+54 11 1234-5678"
            value={formData.whatsappNumber}
            onChange={(e) => updateForm({ whatsappNumber: e.target.value })}
          />
        </Field>

        <Toggle
          checked={formData.enableWhatsapp}
          onChange={(v) => updateForm({ enableWhatsapp: v })}
          label="Activar WhatsApp AI"
          description="Bot con IA que responde automáticamente a tus pacientes por WhatsApp."
        />

        {formData.enableWhatsapp && (
          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            <FeatureCard
              icon={Bot}
              title="Auto-agendar turnos"
              description="El bot conversa con el paciente, pregunta especialidad y horario preferido, y agenda el turno."
              color="celeste"
            />
            <FeatureCard
              icon={Stethoscope}
              title="Triage de síntomas"
              description="Pregunta síntomas y gravedad (leve/moderado/urgente/emergencia), sugiere especialidad y prioriza el turno."
              color="amber"
            />
            <FeatureCard
              icon={Bell}
              title="Recordatorios automáticos"
              description="Envía recordatorio 24 hs y 2 hs antes. El paciente responde 1=Confirmar, 2=Cancelar, 3=Reprogramar."
              color="green"
            />
            <FeatureCard
              icon={FileText}
              title="Recetas digitales"
              description="Los médicos envían recetas firmadas por WhatsApp con validez legal (Ley 27.553 de Receta Electrónica)."
              color="purple"
            />
          </div>
        )}
      </div>

      {/* ─── Especialidades ──────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Especialidades de la clínica</h3>
        <p className="text-xs text-ink-muted mb-3">
          Seleccioná todas las que correspondan. El bot de WhatsApp sugiere especialidades según los
          síntomas del paciente.
        </p>
        <div className="flex flex-wrap gap-2">
          {ESPECIALIDADES_OPTIONS.map((esp) => {
            const selected = formData.especialidades.includes(esp);
            return (
              <button
                key={esp}
                type="button"
                onClick={() => toggleEspecialidad(esp)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                  selected
                    ? "bg-celeste-dark text-white border-celeste-dark"
                    : "bg-white text-ink-muted border-gray-200 hover:border-celeste hover:text-celeste-dark"
                }`}
              >
                {esp}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Financiadores ───────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">Obras sociales y prepagas</h3>
        <p className="text-xs text-ink-muted mb-3">
          Se usan para facturación automática, verificación de cobertura y reportes de cobro por
          financiador.
        </p>
        <div className="flex flex-wrap gap-2">
          {FINANCIADORES_OPTIONS.map((fin) => {
            const selected = formData.financiadores.includes(fin);
            return (
              <button
                key={fin}
                type="button"
                onClick={() => toggleFinanciador(fin)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                  selected
                    ? "bg-celeste-dark text-white border-celeste-dark"
                    : "bg-white text-ink-muted border-gray-200 hover:border-celeste hover:text-celeste-dark"
                }`}
              >
                {fin}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Sistema anterior ────────────────────────────── */}
      <Field label="¿Qué sistema usaban antes?" hint="Nos ayuda a optimizar la migración de datos.">
        <select
          className={inputClass}
          value={formData.sistemaAnterior}
          onChange={(e) => updateForm({ sistemaAnterior: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {SISTEMA_ANTERIOR_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      {/* ─── Telemedicina ────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-5">
        <h3 className="text-sm font-semibold text-ink">Telemedicina</h3>
        <Toggle
          checked={formData.enableTelemedicina}
          onChange={(v) => updateForm({ enableTelemedicina: v })}
          label="Habilitar videollamadas"
          description="Los médicos pueden iniciar videollamadas con pacientes directamente desde la agenda. Integrado con Daily.co, sin instalar nada."
        />
      </div>
    </div>
  );
}

function StepConfirmacion() {
  const { formData, completeSetup, isSubmitting, setupError } = useWizard();

  const allFiles = [
    ...formData.logoFiles,
    ...formData.teamFiles,
    ...formData.patientFiles,
    ...formData.documentFiles,
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-200 bg-green-50/60 p-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-ink">Revisión final</h2>
        <p className="text-sm text-ink-muted mt-1">
          Verificá que todo esté correcto antes de activar tu clínica.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard label="Clínica" value={formData.nombre || "—"} />
        <SummaryCard label="CUIT" value={formData.cuit || "No ingresado"} />
        <SummaryCard label="Dirección" value={formData.direccion || "No ingresada"} />
        <SummaryCard label="Email" value={formData.email || "No ingresado"} />
        <SummaryCard label="Teléfono" value={formData.telefono || "No ingresado"} />
        <SummaryCard label="Profesionales" value={String(formData.cantidadProfesionales)} />
        <SummaryCard
          label="Especialidades"
          value={
            formData.especialidades.length ? formData.especialidades.join(", ") : "No seleccionadas"
          }
        />
        <SummaryCard
          label="Financiadores"
          value={
            formData.financiadores.length ? formData.financiadores.join(", ") : "No seleccionados"
          }
        />
        <SummaryCard
          label="Miembros del equipo"
          value={
            formData.teamMembers.length
              ? formData.teamMembers.map((m) => m.name || m.email).join(", ")
              : "Ninguno"
          }
        />
        <SummaryCard
          label="Archivos subidos"
          value={allFiles.length ? `${allFiles.length} archivo(s)` : "Ninguno"}
        />
        <SummaryCard
          label="WhatsApp AI"
          value={
            formData.enableWhatsapp
              ? `Activado${formData.whatsappNumber ? ` · ${formData.whatsappNumber}` : ""}`
              : "Desactivado"
          }
        />
        <SummaryCard
          label="Telemedicina"
          value={formData.enableTelemedicina ? "Habilitada" : "Deshabilitada"}
        />
      </div>

      {/* What happens next */}
      <div className="rounded-xl border border-celeste-200 bg-celeste-50 p-4">
        <h4 className="text-sm font-semibold text-ink mb-2">¿Qué pasa al activar?</h4>
        <ul className="space-y-1.5 text-xs text-ink-muted">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            Tu dashboard se activa con datos reales (sin datos de ejemplo)
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            El equipo médico recibe invitaciones por email
          </li>
          {formData.enableWhatsapp && (
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
              WhatsApp AI empieza a responder pacientes y enviar recordatorios 24hs
            </li>
          )}
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            Los archivos importados se procesan en segundo plano
          </li>
        </ul>
      </div>

      {setupError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {setupError}
        </div>
      )}

      <button
        onClick={completeSetup}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-[4px] bg-celeste-dark px-6 py-3 text-sm font-bold text-white transition hover:bg-celeste-700 disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Activando clínica...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Activar clínica y comenzar
          </>
        )}
      </button>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-ink mt-0.5 truncate">{value}</p>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────

const STEP_COMPONENTS: Record<string, React.ComponentType> = {
  bienvenida: StepBienvenida,
  clinica: StepClinica,
  equipo: StepEquipo,
  importacion: StepImportacion,
  configuracion: StepConfiguracion,
  confirmacion: StepConfirmacion,
};

export function WizardStepContent() {
  const { step, validationError } = useWizard();
  const StepComponent = STEP_COMPONENTS[step.id];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      {/* Step header */}
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted mb-1">
          {step.subtitle}
        </p>
        <p className="text-sm text-ink-muted leading-relaxed">{step.description}</p>
      </div>

      {/* Validation error */}
      {validationError && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {validationError}
        </div>
      )}

      {/* Step body */}
      {StepComponent ? <StepComponent /> : null}
    </div>
  );
}
