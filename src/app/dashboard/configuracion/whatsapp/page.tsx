"use client";
import { useState } from "react";
import Link from "next/link";
import { useDemoAction } from "@/components/DemoModal";

/* ---------- Types ---------- */
interface ReminderConfig {
  enabled: boolean;
  hoursBeforeFirst: number;
  hoursBeforeSecond: number;
  confirmationReply: boolean;
  cancellationReply: boolean;
  rescheduleReply: boolean;
  includeGoogleMaps: boolean;
  includeClinicPhone: boolean;
  includePreparation: boolean;
}

interface MessageTemplate {
  id: string;
  name: string;
  trigger: string;
  template: string;
  active: boolean;
}

/* ---------- Data ---------- */
const CLINIC_ADDRESS = "Av. San Martín 1520, Piso 2°, CABA";
const CLINIC_PHONE = "(011) 4523-8800";
const CLINIC_NAME = "Centro Médico San Martín";
const GMAPS_LINK = "https://maps.google.com/?q=Av+San+Martin+1520+CABA+Argentina";

const defaultTemplates: MessageTemplate[] = [
  {
    id: "reminder-24h",
    name: "Recordatorio 24 horas",
    trigger: "24 horas antes del turno",
    template:
      `Hola {{paciente_nombre}}, te recordamos tu turno en *${CLINIC_NAME}*:\n\n` +
      `Fecha: *{{turno_fecha}}*\n` +
      `Hora: *{{turno_hora}}*\n` +
      `Profesional: *{{profesional_nombre}}*\n` +
      `Tipo: {{turno_tipo}}\n\n` +
      `Cómo llegar: ${GMAPS_LINK}\n\n` +
      `Respondé:\n` +
      `*1* - Confirmar turno\n` +
      `*2* - Cancelar turno\n` +
      `*3* - Reprogramar`,
    active: true,
  },
  {
    id: "reminder-2h",
    name: "Recordatorio 2 horas",
    trigger: "2 horas antes del turno",
    template:
      `Hola {{paciente_nombre}}, tu turno es *hoy a las {{turno_hora}}* con {{profesional_nombre}}.\n\n` +
      `Dirección: ${CLINIC_ADDRESS}\n` +
      `Abrir en Google Maps: ${GMAPS_LINK}\n\n` +
      `Te esperamos!`,
    active: true,
  },
  {
    id: "confirmation",
    name: "Confirmación de turno",
    trigger: "Al agendar un turno nuevo",
    template:
      `Hola {{paciente_nombre}}, tu turno fue agendado:\n\n` +
      `Fecha: *{{turno_fecha}}*\n` +
      `Hora: *{{turno_hora}}*\n` +
      `Profesional: *{{profesional_nombre}}*\n` +
      `Tipo: {{turno_tipo}}\n` +
      `Financiador: {{financiador}}\n\n` +
      `Dirección: ${CLINIC_ADDRESS}\n` +
      `Google Maps: ${GMAPS_LINK}\n\n` +
      `24 hs antes te enviaremos un recordatorio. Respondé *CANCELAR* si necesitás cancelar.`,
    active: true,
  },
  {
    id: "cancellation",
    name: "Confirmación de cancelación",
    trigger: "Al cancelar un turno",
    template:
      `Hola {{paciente_nombre}}, tu turno del *{{turno_fecha}}* a las *{{turno_hora}}* fue cancelado correctamente.\n\n` +
      `Para agendar uno nuevo, contactanos al ${CLINIC_PHONE} o respondé *TURNO*.`,
    active: true,
  },
  {
    id: "reschedule",
    name: "Turno reprogramado",
    trigger: "Al reprogramar un turno",
    template:
      `Hola {{paciente_nombre}}, tu turno fue reprogramado:\n\n` +
      `Nueva fecha: *{{turno_fecha}}*\n` +
      `Nueva hora: *{{turno_hora}}*\n` +
      `Profesional: *{{profesional_nombre}}*\n\n` +
      `Dirección: ${CLINIC_ADDRESS}\n` +
      `Google Maps: ${GMAPS_LINK}`,
    active: true,
  },
  {
    id: "post-visit",
    name: "Post-consulta",
    trigger: "1 hora después de la consulta",
    template:
      `Hola {{paciente_nombre}}, gracias por visitarnos en *${CLINIC_NAME}*.\n\n` +
      `Si necesitás un nuevo turno o tenés consultas, escribinos por acá o llamanos al ${CLINIC_PHONE}.`,
    active: false,
  },
];

const recentReminders = [
  {
    paciente: "González, María Elena",
    turno: "10/03 08:00",
    estado: "Confirmado",
    enviado: "09/03 08:00",
    respuesta: "1 - Confirmar",
  },
  {
    paciente: "López, Juan Carlos",
    turno: "10/03 08:30",
    estado: "Confirmado",
    enviado: "09/03 08:30",
    respuesta: "1 - Confirmar",
  },
  {
    paciente: "Ramírez, Sofía",
    turno: "10/03 09:00",
    estado: "Sin respuesta",
    enviado: "09/03 09:00",
    respuesta: "—",
  },
  {
    paciente: "Díaz, Roberto",
    turno: "10/03 10:00",
    estado: "Cancelado",
    enviado: "09/03 10:00",
    respuesta: "2 - Cancelar",
  },
  {
    paciente: "Morales, Carolina",
    turno: "10/03 10:30",
    estado: "Reprogramado",
    enviado: "09/03 10:30",
    respuesta: "3 - Reprogramar",
  },
  {
    paciente: "Suárez, Héctor",
    turno: "11/03 08:00",
    estado: "Pendiente",
    enviado: "Prog. 10/03 08:00",
    respuesta: "—",
  },
  {
    paciente: "Romero, Lucía",
    turno: "11/03 09:30",
    estado: "Pendiente",
    enviado: "Prog. 10/03 09:30",
    respuesta: "—",
  },
  {
    paciente: "Torres, Miguel",
    turno: "11/03 11:00",
    estado: "Pendiente",
    enviado: "Prog. 10/03 11:00",
    respuesta: "—",
  },
];

const estadoColor: Record<string, string> = {
  Confirmado: "bg-green-50 text-green-700",
  "Sin respuesta": "bg-amber-50 text-amber-700",
  Cancelado: "bg-red-50 text-red-600",
  Reprogramado: "bg-celeste-pale text-celeste-dark",
  Pendiente: "bg-gray-50 text-gray-500",
};

/* ---------- Component ---------- */
export default function WhatsAppConfigPage() {
  const { showDemo } = useDemoAction();
  const [config, setConfig] = useState<ReminderConfig>({
    enabled: true,
    hoursBeforeFirst: 24,
    hoursBeforeSecond: 2,
    confirmationReply: true,
    cancellationReply: true,
    rescheduleReply: true,
    includeGoogleMaps: true,
    includeClinicPhone: true,
    includePreparation: false,
  });
  const [templates, setTemplates] = useState(defaultTemplates);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>("reminder-24h");

  const toggle = (key: keyof ReminderConfig) =>
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleTemplate = (id: string) =>
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));

  const previewMsg = templates.find((t) => t.id === previewTemplate);
  const previewText = previewMsg?.template
    .replace(/\{\{paciente_nombre\}\}/g, "María Elena")
    .replace(/\{\{turno_fecha\}\}/g, "Martes 11/03/2026")
    .replace(/\{\{turno_hora\}\}/g, "08:00")
    .replace(/\{\{profesional_nombre\}\}/g, "Dr. Martín Rodríguez")
    .replace(/\{\{turno_tipo\}\}/g, "Control cardiológico")
    .replace(/\{\{financiador\}\}/g, "PAMI");

  const activeCount = templates.filter((t) => t.active).length;
  const confirmados = recentReminders.filter((r) => r.estado === "Confirmado").length;
  const sinResp = recentReminders.filter((r) => r.estado === "Sin respuesta").length;

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Link href="/dashboard/configuracion" className="hover:text-celeste-dark transition">
          Configuración
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">WhatsApp Turnos</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">WhatsApp Turnos</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Recordatorios automáticos y confirmaciones de turnos vía WhatsApp
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => showDemo("Enviar recordatorio de prueba")}
            className="px-4 py-2 text-sm font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark hover:text-celeste-dark transition"
          >
            Enviar prueba
          </button>
          <button
            onClick={() => showDemo("Guardar configuración de WhatsApp")}
            className="px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Mensajes hoy", value: "12", color: "border-celeste" },
          { label: "Confirmados", value: `${confirmados}`, color: "border-green-400" },
          { label: "Sin respuesta", value: `${sinResp}`, color: "border-amber-400" },
          { label: "Plantillas activas", value: `${activeCount}/6`, color: "border-celeste" },
        ].map((k) => (
          <div
            key={k.label}
            className={`bg-white border border-border rounded-lg p-4 border-l-[3px] ${k.color}`}
          >
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
              {k.label}
            </p>
            <p className="text-xl font-bold text-ink mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Connection status */}
      <div className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#25D366]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">WhatsApp Business API</h3>
              <p className="text-[10px] text-ink-muted">
                Conectado · Línea: +54 9 11 4523-8800 · Última actividad: hace 5 min
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold rounded bg-green-50 text-green-700 border border-green-200">
            Conectado
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left: Configuration */}
        <div className="space-y-5">
          {/* Reminder settings */}
          <div className="bg-white border border-border rounded-lg p-5">
            <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-4">
              Recordatorios Automáticos
            </h3>
            <div className="space-y-4">
              {/* Master toggle */}
              <div className="flex items-center justify-between py-2 border-b border-border-light">
                <div>
                  <p className="text-xs font-semibold text-ink">Recordatorios activos</p>
                  <p className="text-[10px] text-ink-muted">
                    Enviar recordatorios automáticos antes de cada turno
                  </p>
                </div>
                <button
                  onClick={() => toggle("enabled")}
                  className={`w-10 h-5 rounded-full transition relative ${config.enabled ? "bg-[#25D366]" : "bg-border"}`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition ${config.enabled ? "left-5" : "left-0.5"}`}
                  />
                </button>
              </div>

              {/* Timing */}
              <div className="flex items-center justify-between py-2 border-b border-border-light">
                <div>
                  <p className="text-xs font-semibold text-ink">Primer recordatorio</p>
                  <p className="text-[10px] text-ink-muted">Cuántas horas antes del turno</p>
                </div>
                <select
                  value={config.hoursBeforeFirst}
                  onChange={(e) =>
                    setConfig({ ...config, hoursBeforeFirst: Number(e.target.value) })
                  }
                  className="text-xs border border-border rounded px-2 py-1.5 text-ink"
                >
                  <option value={48}>48 horas</option>
                  <option value={24}>24 horas</option>
                  <option value={12}>12 horas</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border-light">
                <div>
                  <p className="text-xs font-semibold text-ink">Segundo recordatorio</p>
                  <p className="text-[10px] text-ink-muted">Recordatorio corto previo al turno</p>
                </div>
                <select
                  value={config.hoursBeforeSecond}
                  onChange={(e) =>
                    setConfig({ ...config, hoursBeforeSecond: Number(e.target.value) })
                  }
                  className="text-xs border border-border rounded px-2 py-1.5 text-ink"
                >
                  <option value={4}>4 horas</option>
                  <option value={2}>2 horas</option>
                  <option value={1}>1 hora</option>
                </select>
              </div>

              {/* Google Maps */}
              <div className="flex items-center justify-between py-2 border-b border-border-light">
                <div>
                  <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-red-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    Incluir Google Maps
                  </p>
                  <p className="text-[10px] text-ink-muted">
                    Link con direcciones a la clínica en cada recordatorio
                  </p>
                </div>
                <button
                  onClick={() => toggle("includeGoogleMaps")}
                  className={`w-10 h-5 rounded-full transition relative ${config.includeGoogleMaps ? "bg-[#25D366]" : "bg-border"}`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition ${config.includeGoogleMaps ? "left-5" : "left-0.5"}`}
                  />
                </button>
              </div>

              {/* Clinic address display */}
              {config.includeGoogleMaps && (
                <div className="bg-[#F8FAFB] rounded-lg p-3">
                  <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase mb-1.5">
                    Dirección configurada
                  </p>
                  <p className="text-xs font-semibold text-ink">{CLINIC_ADDRESS}</p>
                  <a
                    href={GMAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-celeste-dark font-medium hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    Ver en Google Maps
                  </a>
                </div>
              )}

              {/* Reply options */}
              {[
                {
                  key: "confirmationReply" as const,
                  label: "Respuesta de confirmación",
                  desc: "Paciente puede confirmar respondiendo '1'",
                },
                {
                  key: "cancellationReply" as const,
                  label: "Respuesta de cancelación",
                  desc: "Paciente puede cancelar respondiendo '2'",
                },
                {
                  key: "rescheduleReply" as const,
                  label: "Respuesta de reprogramación",
                  desc: "Paciente puede pedir reprogramar respondiendo '3'",
                },
                {
                  key: "includeClinicPhone" as const,
                  label: "Incluir teléfono clínica",
                  desc: `Agregar ${CLINIC_PHONE} en los mensajes`,
                },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
                >
                  <div>
                    <p className="text-xs font-semibold text-ink">{opt.label}</p>
                    <p className="text-[10px] text-ink-muted">{opt.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(opt.key)}
                    className={`w-10 h-5 rounded-full transition relative ${config[opt.key] ? "bg-celeste-dark" : "bg-border"}`}
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition ${config[opt.key] ? "left-5" : "left-0.5"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Message templates list */}
          <div className="bg-white border border-border rounded-lg p-5">
            <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-4">
              Plantillas de Mensajes
            </h3>
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                    previewTemplate === t.id
                      ? "border-celeste bg-celeste-pale/20"
                      : "border-border-light hover:border-border"
                  }`}
                  onClick={() => setPreviewTemplate(t.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-ink">{t.name}</p>
                      {!t.active && (
                        <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-gray-100 text-gray-400">
                          INACTIVO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-muted mt-0.5">{t.trigger}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTemplate(t.id);
                    }}
                    className={`w-9 h-5 rounded-full transition relative shrink-0 ${t.active ? "bg-[#25D366]" : "bg-border"}`}
                  >
                    <span
                      className={`block w-3.5 h-3.5 rounded-full bg-white shadow absolute top-[3px] transition ${t.active ? "left-[18px]" : "left-[3px]"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview + Recent */}
        <div className="space-y-5">
          {/* WhatsApp Preview */}
          <div className="bg-white border border-border rounded-lg p-5">
            <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-4">
              Vista Previa del Mensaje
            </h3>
            {/* Phone mockup */}
            <div className="bg-[#ECE5DD] rounded-xl p-4 max-w-sm mx-auto">
              {/* Chat header */}
              <div className="bg-[#075E54] rounded-t-lg px-3 py-2.5 flex items-center gap-2.5 -mx-4 -mt-4 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{CLINIC_NAME}</p>
                  <p className="text-white/60 text-[10px]">en línea</p>
                </div>
              </div>
              {/* Message bubble */}
              <div className="bg-white rounded-lg p-3 shadow-sm relative">
                <pre className="text-xs text-ink whitespace-pre-wrap font-sans leading-relaxed">
                  {previewText}
                </pre>
                <p className="text-[9px] text-ink-muted text-right mt-1.5">08:00</p>
              </div>
              {/* Patient reply */}
              <div className="flex justify-end mt-2">
                <div className="bg-[#DCF8C6] rounded-lg px-3 py-2 shadow-sm max-w-[70%]">
                  <p className="text-xs text-ink">1</p>
                  <p className="text-[9px] text-ink-muted text-right mt-0.5">08:02</p>
                </div>
              </div>
              {/* Auto-reply */}
              <div className="bg-white rounded-lg p-3 shadow-sm mt-2">
                <p className="text-xs text-ink leading-relaxed">
                  Perfecto María Elena, tu turno del *Martes 11/03* a las *08:00* queda confirmado.
                  Te esperamos!
                </p>
                <p className="text-[9px] text-ink-muted text-right mt-1.5">08:02</p>
              </div>
            </div>
            <p className="text-[10px] text-ink-muted text-center mt-3">
              Seleccioná una plantilla de la lista para ver su vista previa
            </p>
          </div>

          {/* Recent reminders */}
          <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase">
                Recordatorios Recientes
              </h3>
              <Link
                href="/dashboard/agenda"
                className="text-[10px] text-celeste-dark font-medium hover:underline"
              >
                Ver agenda
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFB] text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                  <th className="text-left px-4 py-2">Paciente</th>
                  <th className="text-left px-4 py-2">Turno</th>
                  <th className="text-left px-4 py-2">Enviado</th>
                  <th className="text-center px-4 py-2">Estado</th>
                  <th className="text-left px-4 py-2">Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {recentReminders.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-border-light hover:bg-celeste-pale/30 transition"
                  >
                    <td className="px-4 py-2.5 text-xs font-semibold text-ink">{r.paciente}</td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-ink-muted">{r.turno}</td>
                    <td className="px-4 py-2.5 text-[10px] text-ink-muted">{r.enviado}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${estadoColor[r.estado]}`}
                      >
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-ink-muted">{r.respuesta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
