// ─── Red de Interconsultas Service ───────────────────────────
// Manages the physician referral network, interconsulta requests,
// and study orders between networked professionals.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";

/** Tables network_doctors, interconsultas, solicitudes_estudio are not in
 *  generated Supabase types yet. Use untyped client for these queries. */
async function untypedClient() {
  const { createClient } = await import("@/lib/supabase/client");
  // eslint-disable-next-line
  return createClient() as any;
}

// ─── Types ───────────────────────────────────────────────────

export interface NetworkDoctor {
  id: string;
  nombre: string;
  especialidad: string;
  institucion: string;
  telefono: string;
  email: string;
  matricula: string;
  disponibilidad: "disponible" | "limitada" | "no_disponible";
  avatar?: string;
  /** Turnaround time for interconsultas in days */
  turnaroundDays?: number;
}

export type InterconsultaEstado =
  | "pendiente"
  | "aceptada"
  | "en_curso"
  | "completada"
  | "rechazada"
  | "cancelada";

export type InterconsultaPrioridad = "urgente" | "alta" | "normal" | "baja";

export interface Interconsulta {
  id: string;
  paciente: string;
  pacienteId?: string;
  doctorOrigen: string;
  doctorDestino: string;
  doctorDestinoId: string;
  especialidad: string;
  motivo: string;
  prioridad: InterconsultaPrioridad;
  estado: InterconsultaEstado;
  fecha: string; // YYYY-MM-DD
  notas?: string;
  adjuntos?: string[];
  respuesta?: string;
}

export type EstudioTipo =
  | "laboratorio"
  | "imagen"
  | "ecografia"
  | "electrocardiograma"
  | "endoscopia"
  | "otro";

export type EstudioEstado = "solicitado" | "en_proceso" | "completado" | "cancelado";

export interface SolicitudEstudio {
  id: string;
  paciente: string;
  pacienteId?: string;
  doctorSolicitante: string;
  centroDestino: string;
  centroDestinoId?: string;
  tipo: EstudioTipo;
  estudio: string;
  indicacion: string;
  prioridad: InterconsultaPrioridad;
  estado: EstudioEstado;
  fecha: string;
  resultadoUrl?: string;
}

export interface CreateInterconsultaInput {
  paciente: string;
  pacienteId?: string;
  doctorDestinoId: string;
  especialidad: string;
  motivo: string;
  prioridad: InterconsultaPrioridad;
  notas?: string;
}

export interface CreateEstudioInput {
  paciente: string;
  pacienteId?: string;
  centroDestinoId?: string;
  centroDestino: string;
  tipo: EstudioTipo;
  estudio: string;
  indicacion: string;
  prioridad: InterconsultaPrioridad;
}

// ─── Network Directory ───────────────────────────────────────

export async function getNetworkDoctors(especialidad?: string): Promise<NetworkDoctor[]> {
  if (isSupabaseConfigured()) {
    const sb = await untypedClient();

    let query = sb.from("network_doctors").select("*").order("especialidad").order("nombre");

    if (especialidad && especialidad !== "Todas") {
      query = query.eq("especialidad", especialidad);
    }

    const { data } = await query;
    return (data ?? []) as NetworkDoctor[];
  }

  await delay(150);
  let docs = DEMO_DOCTORS;
  if (especialidad && especialidad !== "Todas") {
    docs = docs.filter((d) => d.especialidad === especialidad);
  }
  return docs;
}

export async function getNetworkSpecialties(): Promise<string[]> {
  const docs = await getNetworkDoctors();
  const set = new Set(docs.map((d) => d.especialidad));
  return ["Todas", ...Array.from(set).sort()];
}

// ─── Interconsultas CRUD ─────────────────────────────────────

export async function getInterconsultas(): Promise<Interconsulta[]> {
  if (isSupabaseConfigured()) {
    const sb = await untypedClient();
    const { data } = await sb
      .from("interconsultas")
      .select("*")
      .order("fecha", { ascending: false });
    return (data ?? []) as Interconsulta[];
  }

  await delay(150);
  return DEMO_INTERCONSULTAS;
}

export async function createInterconsulta(
  input: CreateInterconsultaInput,
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const sb = await untypedClient();
    const {
      data: { user },
    } = await sb.auth.getUser();

    const { error } = await sb.from("interconsultas").insert({
      paciente: input.paciente,
      paciente_id: input.pacienteId,
      doctor_origen: user?.user_metadata?.full_name ?? "Médico",
      doctor_destino_id: input.doctorDestinoId,
      especialidad: input.especialidad,
      motivo: input.motivo,
      prioridad: input.prioridad,
      estado: "pendiente",
      notas: input.notas ?? null,
      fecha: new Date().toISOString().slice(0, 10),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  await delay(300);
  return { success: true };
}

export async function updateInterconsultaEstado(
  id: string,
  estado: InterconsultaEstado,
  respuesta?: string,
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const sb = await untypedClient();
    const updates: Record<string, unknown> = { estado };
    if (respuesta) updates.respuesta = respuesta;
    const { error } = await sb.from("interconsultas").update(updates).eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  await delay(200);
  return { success: true };
}

// ─── Solicitud de Estudios CRUD ──────────────────────────────

export async function getSolicitudesEstudio(): Promise<SolicitudEstudio[]> {
  if (isSupabaseConfigured()) {
    const sb = await untypedClient();
    const { data } = await sb
      .from("solicitudes_estudio")
      .select("*")
      .order("fecha", { ascending: false });
    return (data ?? []) as SolicitudEstudio[];
  }

  await delay(150);
  return DEMO_ESTUDIOS;
}

export async function createSolicitudEstudio(
  input: CreateEstudioInput,
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const sb = await untypedClient();
    const {
      data: { user },
    } = await sb.auth.getUser();

    const { error } = await sb.from("solicitudes_estudio").insert({
      paciente: input.paciente,
      paciente_id: input.pacienteId,
      doctor_solicitante: user?.user_metadata?.full_name ?? "Médico",
      centro_destino: input.centroDestino,
      centro_destino_id: input.centroDestinoId,
      tipo: input.tipo,
      estudio: input.estudio,
      indicacion: input.indicacion,
      prioridad: input.prioridad,
      estado: "solicitado",
      fecha: new Date().toISOString().slice(0, 10),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  await delay(300);
  return { success: true };
}

// ─── Stats ───────────────────────────────────────────────────

export interface InterconsultaStats {
  totalDoctors: number;
  specialties: number;
  pendientes: number;
  completadas: number;
  estudiosEnCurso: number;
}

export async function getInterconsultaStats(): Promise<InterconsultaStats> {
  const [docs, ics, estudios] = await Promise.all([
    getNetworkDoctors(),
    getInterconsultas(),
    getSolicitudesEstudio(),
  ]);

  const specialties = new Set(docs.map((d) => d.especialidad)).size;

  return {
    totalDoctors: docs.length,
    specialties,
    pendientes: ics.filter(
      (i) => i.estado === "pendiente" || i.estado === "aceptada" || i.estado === "en_curso",
    ).length,
    completadas: ics.filter((i) => i.estado === "completada").length,
    estudiosEnCurso: estudios.filter((e) => e.estado === "solicitado" || e.estado === "en_proceso")
      .length,
  };
}

// ─── Empty fallback arrays (no demo data) ───────────────────

const DEMO_DOCTORS: NetworkDoctor[] = [];
const DEMO_INTERCONSULTAS: Interconsulta[] = [];
const DEMO_ESTUDIOS: SolicitudEstudio[] = [];
