"use client";

import {
  useWizard,
  ESPECIALIDADES_OPTIONS,
  FINANCIADORES_OPTIONS,
  CLINIC_PLAN_OPTIONS,
} from "./WizardData";
import type { PlanTier } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle2,
  Building2,
  UserCircle,
  Settings,
  CreditCard,
  Star,
  FileText,
  Shield,
  Calendar,
  Users,
  BarChart3,
  Activity,
  Stethoscope,
  ClipboardList,
} from "lucide-react";

// ─── Reusable field wrapper ──────────────────────────────────

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
// Shows a feature that becomes available with the data entered in this step.

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border-light bg-white p-3">
      <div className="w-8 h-8 rounded-lg bg-celeste-pale flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-celeste-dark" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// ─── Step 1: Clinic info ─────────────────────────────────────

function StepClinica() {
  const { formData, updateForm } = useWizard();

  return (
    <div className="space-y-8">
      {/* Detailed explanation */}
      <div className="rounded-xl border border-celeste-100 bg-celeste-50/40 p-5">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-celeste-dark shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-ink">Datos de tu clínica</h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              Esta información identifica a tu centro de salud en toda la plataforma. El nombre de
              la clínica aparece en facturas, reportes, comunicaciones con pacientes y en el
              encabezado del dashboard. La dirección, teléfono y email se usan para los
              recordatorios automáticos y para que las obras sociales puedan contactarte.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-white/60 border border-celeste-100">
              <p className="text-xs font-semibold text-ink mb-1">Por qué es importante:</p>
              <ul className="text-xs text-ink-muted space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    El <strong className="text-ink">nombre</strong> se usa como identificador en
                    todas las facturas y presentaciones a financiadores
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    La <strong className="text-ink">dirección</strong> se incluye en los
                    recordatorios de turno que reciben tus pacientes por WhatsApp
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    El <strong className="text-ink">teléfono y email</strong> se usan para las
                    notificaciones del sistema y comunicación con obras sociales
                  </span>
                </li>
              </ul>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Solo el nombre es obligatorio ahora. Todo lo demás se puede completar después desde
              Configuración.
            </p>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Nombre de la clínica"
            required
            hint="Aparece en facturas, reportes y comunicaciones. Usá el nombre legal o comercial de tu centro."
          >
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Centro Médico San Martín"
              value={formData.nombre}
              onChange={(e) => updateForm({ nombre: e.target.value })}
              autoFocus
            />
          </Field>
        </div>
        <Field
          label="Dirección"
          hint="Se incluye en los recordatorios de turno por WhatsApp y en facturas."
        >
          <input
            type="text"
            className={inputClass}
            placeholder="Av. Santa Fe 2100, CABA"
            value={formData.direccion}
            onChange={(e) => updateForm({ direccion: e.target.value })}
          />
        </Field>
        <Field
          label="Teléfono"
          hint="Para notificaciones del sistema y contacto con obras sociales."
        >
          <input
            type="tel"
            className={inputClass}
            placeholder="+54 11 1234-5678"
            value={formData.telefono}
            onChange={(e) => updateForm({ telefono: e.target.value })}
          />
        </Field>
        <Field
          label="Email de la clínica"
          hint="Recibe alertas de rechazos, vencimientos y confirmaciones de pago."
        >
          <input
            type="email"
            className={inputClass}
            placeholder="admin@clinica.com"
            value={formData.email}
            onChange={(e) => updateForm({ email: e.target.value })}
          />
        </Field>
      </div>

      {/* What this enables */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
          Funcionalidades que se activan con estos datos
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <FeatureCard
            icon={FileText}
            title="Facturación con membrete"
            description="Las facturas y presentaciones a financiadores incluyen el nombre y datos de contacto de tu clínica."
          />
          <FeatureCard
            icon={Calendar}
            title="Recordatorios de turno"
            description="Los pacientes reciben recordatorios por WhatsApp con la dirección del consultorio."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Doctor profile ──────────────────────────────────

function StepProfesional() {
  const { formData, updateForm } = useWizard();

  return (
    <div className="space-y-8">
      {/* Detailed explanation */}
      <div className="rounded-xl border border-celeste-100 bg-celeste-50/40 p-5">
        <div className="flex items-start gap-3">
          <UserCircle className="h-5 w-5 text-celeste-dark shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-ink">Profesional responsable</h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              El sistema de salud argentino requiere que toda prescripción, derivación y facturación
              esté asociada a un profesional con matrícula habilitante. Este paso registra al médico
              o profesional principal que administra la clínica. La matrícula se valida contra el
              formato provincial (MP) o nacional (MN) y se usa en toda la documentación generada por
              la plataforma.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-white/60 border border-celeste-100">
              <p className="text-xs font-semibold text-ink mb-1">Por qué cada dato es necesario:</p>
              <ul className="text-xs text-ink-muted space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    El <strong className="text-ink">nombre</strong> aparece como responsable en las
                    presentaciones a PAMI, IOMA y otras obras sociales
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    La <strong className="text-ink">matrícula</strong> es obligatoria por regulación
                    sanitaria. Sin ella, los financiadores rechazan las presentaciones
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    La <strong className="text-ink">especialidad</strong> permite filtrar el
                    nomenclador y mostrar solo los códigos de prestación relevantes
                  </span>
                </li>
              </ul>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Podés agregar más profesionales después desde el panel de equipo. Este es el
              administrador principal de la clínica.
            </p>
          </div>
        </div>
      </div>

      {/* Form fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field
            label="Nombre completo del profesional"
            required
            hint="Nombre y apellido tal como figura en la matrícula. Se usa en facturas y presentaciones."
          >
            <input
              type="text"
              className={inputClass}
              placeholder="Ej: Dra. María González"
              value={formData.doctorNombre}
              onChange={(e) => updateForm({ doctorNombre: e.target.value })}
              autoFocus
            />
          </Field>
        </div>
        <Field
          label="Matrícula profesional"
          required
          hint="Formato: MP 12345 (provincial) o MN 67890 (nacional). Los financiadores la exigen en cada presentación."
        >
          <input
            type="text"
            className={inputClass}
            placeholder="Ej: MP 12345 o MN 67890"
            value={formData.doctorMatricula}
            onChange={(e) => updateForm({ doctorMatricula: e.target.value })}
          />
        </Field>
        <Field
          label="Especialidad principal"
          hint="Filtra el nomenclador y agiliza la carga de prestaciones en facturación."
        >
          <select
            className={inputClass}
            value={formData.doctorEspecialidad}
            onChange={(e) => updateForm({ doctorEspecialidad: e.target.value })}
          >
            <option value="">Seleccionar especialidad</option>
            {ESPECIALIDADES_OPTIONS.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* What this enables */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
          Funcionalidades que se activan con estos datos
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <FeatureCard
            icon={Shield}
            title="Auditoría pre-facturación"
            description="Valida que cada factura tenga matrícula, código de prestación y autorización antes de presentar."
          />
          <FeatureCard
            icon={Stethoscope}
            title="Nomenclador filtrado"
            description="Muestra solo los códigos de prestación relevantes a la especialidad del profesional."
          />
          <FeatureCard
            icon={Users}
            title="Panel de equipo"
            description="El profesional registrado puede invitar a otros médicos y asignar permisos por rol."
          />
          <FeatureCard
            icon={ClipboardList}
            title="Firma en documentación"
            description="Recetas, órdenes y derivaciones incluyen automáticamente nombre y matrícula."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Configuration ───────────────────────────────────

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
    <div className="space-y-8">
      {/* Detailed explanation */}
      <div className="rounded-xl border border-celeste-100 bg-celeste-50/40 p-5">
        <div className="flex items-start gap-3">
          <Settings className="h-5 w-5 text-celeste-dark shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-ink">Especialidades y cobertura</h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              Este paso configura dos pilares fundamentales de la operación de tu clínica: las
              especialidades que ofrecés y las obras sociales/prepagas con las que trabajás. Esta
              información determina qué secciones del dashboard se activan y cómo se organiza la
              facturación.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-white/60 border border-celeste-100">
              <p className="text-xs font-semibold text-ink mb-1">
                Cómo usa la plataforma esta información:
              </p>
              <ul className="text-xs text-ink-muted space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Especialidades</strong>: Filtran el nomenclador
                    para mostrar solo las prácticas habilitadas, organizan la agenda por servicio y
                    agrupan los reportes por área
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Financiadores</strong>: Habilitan el seguimiento de
                    facturación, cobros y rechazos por obra social. Cada financiador tiene sus
                    propios plazos de pago y reglas de presentación
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-ink">Dashboard personalizado</strong>: Los KPIs y
                    gráficos del panel principal se organizan automáticamente según los
                    financiadores que selecciones
                  </span>
                </li>
              </ul>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Este paso es opcional. Podés empezar sin seleccionar nada y configurarlo después desde
              el dashboard. Pero mientras más cargues ahora, más completo va a estar tu panel desde
              el primer día.
            </p>
          </div>
        </div>
      </div>

      {/* Especialidades */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">
          Especialidades que ofrece tu clínica
        </h3>
        <p className="text-xs text-ink-muted mb-3">
          Seleccioná todas las que correspondan. Esto organiza la agenda, filtra el nomenclador y
          agrupa los reportes de actividad por área médica.
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

      {/* Financiadores */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">Obras sociales y prepagas</h3>
        <p className="text-xs text-ink-muted mb-3">
          Seleccioná las que acepta tu clínica. Cada financiador tendrá su panel con métricas de
          facturación, tasa de rechazo, días promedio de cobro y estado de presentaciones.
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

      {/* What this enables */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
          Funcionalidades que se activan con estos datos
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <FeatureCard
            icon={BarChart3}
            title="Dashboard por financiador"
            description="Cada obra social tiene su fila con facturado, cobrado, tasa de rechazo y días de pago."
          />
          <FeatureCard
            icon={Activity}
            title="KPIs en tiempo real"
            description="Los indicadores del panel principal se calculan a partir de las facturas y cobros por financiador."
          />
          <FeatureCard
            icon={Shield}
            title="Seguimiento de rechazos"
            description="Monitoreo automático de rechazos por obra social con alertas de vencimiento de presentación."
          />
          <FeatureCard
            icon={Calendar}
            title="Agenda por especialidad"
            description="Los turnos se organizan por servicio, facilitando la gestión de consultorios y profesionales."
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Plan selection ──────────────────────────────────

function StepPlan() {
  const { formData, updateForm } = useWizard();

  return (
    <div className="space-y-8">
      {/* Detailed explanation */}
      <div className="rounded-xl border border-celeste-100 bg-celeste-50/40 p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-celeste-dark shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-ink">Elegí el plan para tu clínica</h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              El plan determina la capacidad de tu centro: cantidad de profesionales, sedes, módulos
              disponibles y nivel de soporte. Todos los planes incluyen el dashboard en tiempo real,
              gestión de pacientes y actualizaciones de nomenclador. La diferencia principal está en
              el volumen de operación y funcionalidades avanzadas como telemedicina, AI chatbot y
              analítica.
            </p>
            <div className="mt-3 p-3 rounded-lg bg-white/60 border border-celeste-100">
              <p className="text-xs font-semibold text-ink mb-1">Sobre precios y facturación:</p>
              <ul className="text-xs text-ink-muted space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    Todos los precios en <strong className="text-ink">pesos argentinos</strong> con
                    ajuste mensual IPC
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    La suscripción se gestiona a través de{" "}
                    <strong className="text-ink">MercadoPago</strong> con débito automático
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                  <span>
                    Podés <strong className="text-ink">cambiar de plan</strong> en cualquier momento
                    desde Configuración sin perder datos
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CLINIC_PLAN_OPTIONS.map((plan) => {
          const isSelected = formData.planTier === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => updateForm({ planTier: plan.id as PlanTier })}
              className={`
                relative flex flex-col rounded-xl border-2 p-5 text-left transition-all
                ${
                  isSelected
                    ? "border-celeste-dark bg-celeste-50/30 ring-1 ring-celeste-200"
                    : plan.highlighted
                      ? "border-celeste-200 bg-white hover:border-celeste-400"
                      : "border-gray-200 bg-white hover:border-gray-300"
                }
              `}
            >
              {/* Highlighted badge */}
              {plan.highlighted && (
                <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full bg-celeste-dark px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  <Star className="h-3 w-3" />
                  Más elegido
                </span>
              )}

              {/* Selection indicator */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-bold text-ink">{plan.name}</h4>
                  <p className="text-xs text-ink-muted mt-0.5">{plan.description}</p>
                </div>
                <div
                  className={`
                    flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition
                    ${isSelected ? "border-celeste-dark bg-celeste-dark" : "border-gray-300"}
                  `}
                >
                  {isSelected && (
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-bold text-ink">{plan.price}</span>
                {plan.priceNum > 0 && <span className="text-xs text-ink-muted ml-1">ARS/mes</span>}
              </div>

              {/* Features */}
              <ul className="space-y-1.5 text-xs text-ink-muted">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* IPC notice */}
      <p className="text-xs text-ink-muted text-center">
        Todos los precios en pesos argentinos con ajuste mensual IPC. Enterprise: contactanos para
        un presupuesto personalizado.
      </p>
    </div>
  );
}

// ─── Step 5: Confirmation ────────────────────────────────────

function StepConfirmacion() {
  const { formData, completeSetup, isSubmitting, setupError } = useWizard();

  const selectedPlan = CLINIC_PLAN_OPTIONS.find((p) => p.id === formData.planTier);

  return (
    <div className="space-y-8">
      {/* Instructions */}
      <div className="rounded-xl border border-green-100 bg-green-50/40 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-ink">Último paso: revisá y activá</h3>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              Revisá que toda la información sea correcta. Al activar, se crea tu espacio de trabajo
              con el dashboard en tiempo real. Tu clínica arranca con un panel completamente limpio
              — sin datos de ejemplo. Cada sección te guía para cargar la información real de tu
              operación.
            </p>
            <ol className="mt-3 space-y-1.5 text-sm text-ink-muted list-decimal list-inside">
              <li>Verificá los datos abajo</li>
              <li>
                Si necesitás corregir algo, usá el botón{" "}
                <strong className="text-ink">Anterior</strong>
              </li>
              <li>
                Cuando esté todo listo, hacé clic en{" "}
                <strong className="text-ink">Activar clínica</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Summary — Clinic */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Datos de la clínica
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard label="Clínica" value={formData.nombre || "—"} />
          <SummaryCard label="Dirección" value={formData.direccion || "No ingresada"} />
          <SummaryCard label="Teléfono" value={formData.telefono || "No ingresado"} />
          <SummaryCard label="Email" value={formData.email || "No ingresado"} />
        </div>
      </div>

      {/* Summary — Doctor */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Profesional responsable
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard label="Nombre" value={formData.doctorNombre || "—"} />
          <SummaryCard label="Matrícula" value={formData.doctorMatricula || "—"} />
          <SummaryCard
            label="Especialidad"
            value={formData.doctorEspecialidad || "No seleccionada"}
          />
        </div>
      </div>

      {/* Summary — Config */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Configuración
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            label="Especialidades"
            value={
              formData.especialidades.length
                ? formData.especialidades.join(", ")
                : "No seleccionadas"
            }
          />
          <SummaryCard
            label="Obras sociales"
            value={
              formData.financiadores.length ? formData.financiadores.join(", ") : "No seleccionadas"
            }
          />
        </div>
      </div>

      {/* Summary — Plan */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Plan seleccionado
        </h3>
        {selectedPlan ? (
          <div
            className={`rounded-xl border-2 p-4 ${
              selectedPlan.highlighted
                ? "border-celeste-200 bg-celeste-50/20"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-ink">{selectedPlan.name}</span>
                <span className="text-sm text-ink-muted ml-2">
                  {selectedPlan.price}
                  {selectedPlan.priceNum > 0 ? " ARS/mes" : ""}
                </span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </div>
        ) : (
          <SummaryCard label="Plan" value="No seleccionado" />
        )}
      </div>

      {/* What happens next — thorough */}
      <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        <h4 className="text-sm font-semibold text-ink mb-3">Al activar tu clínica:</h4>
        <ul className="space-y-2 text-xs text-ink-muted">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>
              Se crea tu espacio de trabajo con el{" "}
              <strong className="text-ink">dashboard en tiempo real</strong> — arrancás con un panel
              limpio, sin datos de ejemplo
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>
              Cada sección del dashboard incluye{" "}
              <strong className="text-ink">guías contextuales</strong> que te explican qué cargar y
              cómo
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>
              Podés empezar cargando{" "}
              <strong className="text-ink">pacientes, turnos o facturas</strong> en el orden que
              prefieras
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>
              Los <strong className="text-ink">KPIs y gráficos</strong> se generan automáticamente a
              medida que cargás datos reales
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            <span>
              Todo lo que no completaste en el wizard se puede configurar después desde{" "}
              <strong className="text-ink">Configuración</strong>
            </span>
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
            Activando...
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Activar clínica
          </>
        )}
      </button>
    </div>
  );
}

// ─── Summary card ────────────────────────────────────────────

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
  clinica: StepClinica,
  profesional: StepProfesional,
  configuracion: StepConfiguracion,
  plan: StepPlan,
  confirmacion: StepConfirmacion,
};

export function WizardStepContent() {
  const { step, validationError } = useWizard();
  const StepComponent = STEP_COMPONENTS[step.id];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
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

      {StepComponent ? <StepComponent /> : null}
    </div>
  );
}
