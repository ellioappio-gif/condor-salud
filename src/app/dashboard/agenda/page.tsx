"use client";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { useDemoAction } from "@/components/DemoModal";

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const horas = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

const profesionales = [
  {
    id: 1,
    nombre: "Dr. Martín Rodríguez",
    especialidad: "Cardiología",
    color: "bg-celeste-pale text-celeste-dark border-celeste",
  },
  {
    id: 2,
    nombre: "Dra. Laura Pérez",
    especialidad: "Clínica Médica",
    color: "bg-celeste-pale text-celeste-dark border-celeste-light",
  },
  {
    id: 3,
    nombre: "Dr. Carlos Martínez",
    especialidad: "Ecografía",
    color: "bg-celeste-pale text-celeste-dark border-celeste",
  },
  {
    id: 4,
    nombre: "Dra. Ana Fernández",
    especialidad: "Laboratorio",
    color: "bg-green-50 text-green-700 border-green-300",
  },
];

interface Turno {
  id: number;
  hora: string;
  dia: number;
  paciente: string;
  pacienteId: string;
  profesionalId: number;
  tipo: string;
  estado: "Confirmado" | "Pendiente" | "En espera" | "Atendido" | "Cancelado";
  financiador: string;
  recordatorio?: "Enviado" | "Confirmado" | "Sin enviar" | "Sin respuesta";
}

const turnosMock: Turno[] = [
  {
    id: 1,
    hora: "08:00",
    dia: 0,
    paciente: "González, María Elena",
    pacienteId: "P001",
    profesionalId: 1,
    tipo: "Control",
    estado: "Confirmado",
    financiador: "PAMI",
    recordatorio: "Confirmado",
  },
  {
    id: 2,
    hora: "08:30",
    dia: 0,
    paciente: "López, Juan Carlos",
    pacienteId: "P002",
    profesionalId: 2,
    tipo: "Consulta",
    estado: "Confirmado",
    financiador: "OSDE 310",
    recordatorio: "Confirmado",
  },
  {
    id: 3,
    hora: "09:00",
    dia: 0,
    paciente: "Ramírez, Sofía",
    pacienteId: "P003",
    profesionalId: 1,
    tipo: "Primera vez",
    estado: "Pendiente",
    financiador: "Swiss Medical",
    recordatorio: "Sin respuesta",
  },
  {
    id: 4,
    hora: "10:00",
    dia: 0,
    paciente: "Díaz, Roberto",
    pacienteId: "P004",
    profesionalId: 3,
    tipo: "Ecografía",
    estado: "En espera",
    financiador: "PAMI",
    recordatorio: "Enviado",
  },
  {
    id: 5,
    hora: "10:30",
    dia: 0,
    paciente: "Morales, Carolina",
    pacienteId: "P005",
    profesionalId: 4,
    tipo: "Laboratorio",
    estado: "Confirmado",
    financiador: "Galeno",
    recordatorio: "Confirmado",
  },
  {
    id: 6,
    hora: "08:00",
    dia: 1,
    paciente: "Suárez, Héctor",
    pacienteId: "P006",
    profesionalId: 1,
    tipo: "Control",
    estado: "Confirmado",
    financiador: "PAMI",
    recordatorio: "Confirmado",
  },
  {
    id: 7,
    hora: "09:30",
    dia: 1,
    paciente: "Romero, Lucía",
    pacienteId: "P007",
    profesionalId: 2,
    tipo: "Consulta",
    estado: "Pendiente",
    financiador: "Medifé",
    recordatorio: "Enviado",
  },
  {
    id: 8,
    hora: "11:00",
    dia: 1,
    paciente: "Torres, Miguel",
    pacienteId: "P008",
    profesionalId: 3,
    tipo: "Ecografía",
    estado: "Confirmado",
    financiador: "OSDE 210",
    recordatorio: "Confirmado",
  },
  {
    id: 9,
    hora: "08:30",
    dia: 2,
    paciente: "Herrera, Patricia",
    pacienteId: "P009",
    profesionalId: 1,
    tipo: "Control",
    estado: "Confirmado",
    financiador: "PAMI",
    recordatorio: "Enviado",
  },
  {
    id: 10,
    hora: "10:00",
    dia: 2,
    paciente: "Castro, Fernando",
    pacienteId: "P010",
    profesionalId: 2,
    tipo: "Consulta",
    estado: "Pendiente",
    financiador: "IOMA",
    recordatorio: "Sin respuesta",
  },
  {
    id: 11,
    hora: "14:00",
    dia: 2,
    paciente: "Vega, Daniela",
    pacienteId: "P011",
    profesionalId: 4,
    tipo: "Laboratorio",
    estado: "Confirmado",
    financiador: "Swiss Medical",
    recordatorio: "Confirmado",
  },
  {
    id: 12,
    hora: "09:00",
    dia: 3,
    paciente: "Aguirre, Pablo",
    pacienteId: "P012",
    profesionalId: 1,
    tipo: "Primera vez",
    estado: "Pendiente",
    financiador: "Sancor Salud",
    recordatorio: "Sin enviar",
  },
  {
    id: 13,
    hora: "15:00",
    dia: 3,
    paciente: "Méndez, Valeria",
    pacienteId: "P001",
    profesionalId: 2,
    tipo: "Control",
    estado: "Confirmado",
    financiador: "PAMI",
    recordatorio: "Sin enviar",
  },
  {
    id: 14,
    hora: "08:00",
    dia: 4,
    paciente: "Luna, Ricardo",
    pacienteId: "P002",
    profesionalId: 1,
    tipo: "Consulta",
    estado: "Confirmado",
    financiador: "OSDE 310",
    recordatorio: "Sin enviar",
  },
  {
    id: 15,
    hora: "10:30",
    dia: 4,
    paciente: "Ríos, Andrea",
    pacienteId: "P003",
    profesionalId: 3,
    tipo: "Ecografía",
    estado: "Pendiente",
    financiador: "Swiss Medical",
    recordatorio: "Sin enviar",
  },
  {
    id: 16,
    hora: "09:00",
    dia: 5,
    paciente: "Ortiz, Sergio",
    pacienteId: "P004",
    profesionalId: 2,
    tipo: "Consulta",
    estado: "Pendiente",
    financiador: "PAMI",
    recordatorio: "Sin enviar",
  },
];

const estadoColor: Record<string, string> = {
  Confirmado: "bg-green-50 text-green-700",
  Pendiente: "bg-amber-50 text-amber-700",
  "En espera": "bg-celeste-pale text-celeste-dark",
  Atendido: "bg-border-light text-ink-muted",
  Cancelado: "bg-red-50 text-red-600",
};

const recordatorioColor: Record<string, string> = {
  Confirmado: "text-green-600",
  Enviado: "text-celeste-dark",
  "Sin respuesta": "text-amber-600",
  "Sin enviar": "text-gray-300",
};

const CLINIC_GMAPS = "https://maps.google.com/?q=Av+San+Martin+1520+CABA+Argentina";

export default function AgendaPage() {
  const { showToast } = useToast();
  const { showDemo } = useDemoAction();
  const [vista, setVista] = useState<"semana" | "lista">("semana");
  const [profFilter, setProfFilter] = useState(0);

  const filtered =
    profFilter === 0 ? turnosMock : turnosMock.filter((t) => t.profesionalId === profFilter);

  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));

  const fechasDias = diasSemana.map((_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const total = filtered.length;
  const confirmados = filtered.filter((t) => t.estado === "Confirmado").length;
  const pendientes = filtered.filter((t) => t.estado === "Pendiente").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Agenda</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Semana del {fechasDias[0]} al {fechasDias[5]}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVista("semana")}
            className={`px-4 py-2 text-sm rounded-[4px] font-medium transition ${vista === "semana" ? "bg-celeste-dark text-white" : "border border-border text-ink-light hover:border-celeste-dark"}`}
          >
            Semana
          </button>
          <button
            onClick={() => setVista("lista")}
            className={`px-4 py-2 text-sm rounded-[4px] font-medium transition ${vista === "lista" ? "bg-celeste-dark text-white" : "border border-border text-ink-light hover:border-celeste-dark"}`}
          >
            Lista
          </button>
          <button
            onClick={() => showDemo("Nuevo turno")}
            className="px-4 py-2 text-sm font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition"
          >
            + Nuevo turno
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Turnos esta semana", value: total, color: "border-celeste" },
          { label: "Confirmados", value: confirmados, color: "border-green-400" },
          { label: "Pendientes", value: pendientes, color: "border-amber-400" },
          {
            label: "Disponibilidad",
            value: `${Math.round((1 - total / (horas.length * 6)) * 100)}%`,
            color: "border-celeste",
          },
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

      {/* WhatsApp reminders bar */}
      <div className="bg-white border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#25D366]/10 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink">Recordatorios WhatsApp activos</p>
            <p className="text-[10px] text-ink-muted">
              24hs antes · Con link a Google Maps ·{" "}
              {filtered.filter((t) => t.recordatorio === "Confirmado").length} confirmados,{" "}
              {filtered.filter((t) => t.recordatorio === "Enviado").length} enviados,{" "}
              {filtered.filter((t) => t.recordatorio === "Sin respuesta").length} sin respuesta
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/configuracion/whatsapp"
          className="px-3 py-1.5 text-[10px] font-semibold text-celeste-dark border border-celeste rounded-[4px] hover:bg-celeste-pale transition"
        >
          Configurar recordatorios
        </Link>
      </div>

      {/* Prof filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
          Profesional:
        </span>
        <button
          onClick={() => setProfFilter(0)}
          className={`px-3 py-1.5 text-xs rounded-[4px] transition ${profFilter === 0 ? "bg-ink text-white" : "border border-border text-ink-light hover:border-ink"}`}
        >
          Todos
        </button>
        {profesionales.map((p) => (
          <button
            key={p.id}
            onClick={() => setProfFilter(p.id)}
            className={`px-3 py-1.5 text-xs rounded-[4px] border transition ${profFilter === p.id ? p.color + " border font-semibold" : "border-border text-ink-light hover:border-ink"}`}
          >
            {p.nombre.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      {vista === "semana" ? (
        /* Calendar grid */
        <div className="bg-white border border-border rounded-lg overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-16 px-3 py-2 text-[10px] font-bold tracking-wider text-ink-muted uppercase bg-[#F8FAFB]">
                  Hora
                </th>
                {diasSemana.map((d, i) => (
                  <th
                    key={d}
                    className={`px-2 py-2 text-[10px] font-bold tracking-wider uppercase ${i === (hoy.getDay() + 6) % 7 ? "text-celeste-dark bg-celeste-pale/40" : "text-ink-muted bg-[#F8FAFB]"}`}
                  >
                    {d} {fechasDias[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map((hora) => (
                <tr key={hora} className="border-t border-border-light hover:bg-[#FCFCFD]">
                  <td className="px-3 py-1.5 text-[10px] font-mono text-ink-muted text-center">
                    {hora}
                  </td>
                  {diasSemana.map((_, di) => {
                    const turno = filtered.find((t) => t.hora === hora && t.dia === di);
                    if (!turno) return <td key={di} className="px-1 py-1" />;
                    const prof = profesionales.find((p) => p.id === turno.profesionalId);
                    return (
                      <td key={di} className="px-1 py-1">
                        <Link
                          href={`/dashboard/pacientes/${turno.pacienteId}`}
                          className={`block p-1.5 rounded text-[10px] border-l-2 ${prof?.color || ""} hover:shadow-sm transition relative`}
                        >
                          <div className="font-semibold truncate">{turno.paciente}</div>
                          <div className="text-ink-muted truncate">
                            {turno.tipo} · {turno.financiador}
                          </div>
                          {turno.recordatorio && turno.recordatorio !== "Sin enviar" && (
                            <span
                              className={`absolute top-1 right-1 ${recordatorioColor[turno.recordatorio]}`}
                              title={`WA: ${turno.recordatorio}`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                className="w-3 h-3 fill-current"
                                aria-hidden="true"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                            </span>
                          )}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* List view */
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFB] text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                <th className="text-left px-5 py-2.5">Día</th>
                <th className="text-left px-5 py-2.5">Hora</th>
                <th className="text-left px-5 py-2.5">Paciente</th>
                <th className="text-left px-5 py-2.5">Profesional</th>
                <th className="text-left px-5 py-2.5">Tipo</th>
                <th className="text-left px-5 py-2.5">Financiador</th>
                <th className="text-center px-5 py-2.5">Estado</th>
                <th className="text-center px-5 py-2.5">WA</th>
                <th className="text-center px-5 py-2.5">Maps</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => a.dia - b.dia || a.hora.localeCompare(b.hora))
                .map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-border-light hover:bg-celeste-pale/30 transition"
                  >
                    <td className="px-5 py-3 text-xs font-semibold text-ink">
                      {diasSemana[t.dia]} {fechasDias[t.dia]}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink">{t.hora}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/pacientes/${t.pacienteId}`}
                        className="text-celeste-dark font-semibold text-xs hover:underline"
                      >
                        {t.paciente}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-light">
                      {profesionales.find((p) => p.id === t.profesionalId)?.nombre}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-light">{t.tipo}</td>
                    <td className="px-5 py-3 text-xs text-ink-light">{t.financiador}</td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${estadoColor[t.estado]}`}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 ${recordatorioColor[t.recordatorio || "Sin enviar"]}`}
                        title={t.recordatorio || "Sin enviar"}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5 fill-current"
                          aria-hidden="true"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        <span className="text-[9px] font-semibold">
                          {t.recordatorio === "Sin enviar" ? "—" : t.recordatorio?.charAt(0)}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <a
                        href={CLINIC_GMAPS}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-600 transition"
                        title="Abrir Google Maps"
                      >
                        <svg className="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-ink-muted">
        {profesionales.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${p.color.split(" ")[0]}`} />
            <span>
              {p.nombre} — {p.especialidad}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
