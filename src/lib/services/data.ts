// ─── Centralized Data Service ────────────────────────────────
// No mock data. New clinics start with a clean slate.
// When Supabase is connected, real DB queries are used automatically.
//
// Every function returns a Promise to match async DB patterns.

import type {
  Factura,
  Rechazo,
  Financiador,
  InflacionMes,
  Alerta,
  KPI,
  FacturaEstado,
  FinanciadorType,
  RechazoMotivo,
} from "@/lib/types";
import { delay } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";

// ─── Simulate network latency in dev ─────────────────────────
const SIM_DELAY = process.env.NODE_ENV === "development" ? 150 : 0;

// ─── Pacientes ───────────────────────────────────────────────
export interface Paciente {
  id: string;
  nombre: string;
  dni: string;
  financiador: string;
  plan: string;
  ultimaVisita: string;
  estado: "activo" | "inactivo";
  email: string;
  telefono: string;
  fechaNacimiento: string;
  direccion: string;
}

const PACIENTES: Paciente[] = [];

// ─── Facturas ────────────────────────────────────────────────

const FACTURAS: Factura[] = [];

// ─── Rechazos ────────────────────────────────────────────────

const RECHAZOS: Rechazo[] = [];

// ─── Financiadores ───────────────────────────────────────────

const FINANCIADORES: Financiador[] = [];

// ─── Inflación ───────────────────────────────────────────────

const INFLACION: InflacionMes[] = [];

// ─── Alertas ─────────────────────────────────────────────────

const ALERTAS: Alerta[] = [];

// ─── Agenda / Turnos ─────────────────────────────────────────
export interface Turno {
  id: string;
  hora: string;
  paciente: string;
  tipo: string;
  financiador: string;
  profesional: string;
  estado: "confirmado" | "pendiente" | "cancelado" | "atendido";
  notas?: string;
}

const TURNOS: Turno[] = [];

// ─── Inventario ──────────────────────────────────────────────
export interface InventarioItem {
  id: string;
  nombre: string;
  categoria: string;
  stock: number;
  minimo: number;
  unidad: string;
  precio: number;
  proveedor: string;
  vencimiento?: string;
  lote?: string;
}

const INVENTARIO: InventarioItem[] = [];

// ─── Nomenclador ─────────────────────────────────────────────
export interface NomencladorEntry {
  id: string;
  codigo: string;
  descripcion: string;
  capitulo: string;
  valorOSDE: number;
  valorSwiss: number;
  valorPAMI: number;
  valorGaleno: number;
  vigente: boolean;
  ultimaActualizacion: string;
}

const NOMENCLADOR: NomencladorEntry[] = [];

// ─── Reportes ────────────────────────────────────────────────
export interface Reporte {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  ultimaGen: string;
  formato: string;
}

const REPORTES: Reporte[] = [];

// ─── Auditoría ───────────────────────────────────────────────
export interface AuditoriaItem {
  id: string;
  fecha: string;
  paciente: string;
  prestacion: string;
  financiador: string;
  tipo: string;
  severidad: "alta" | "media" | "baja";
  detalle: string;
  estado: "pendiente" | "revisado" | "resuelto";
}

const AUDITORIA: AuditoriaItem[] = [];

// ─── KPI builders ────────────────────────────────────────────
// When Supabase is configured, compute KPIs from real data.
// Otherwise, return empty array — no demo numbers.

export async function getDashboardKPIs(): Promise<KPI[]> {
  if (isSupabaseConfigured()) {
    try {
      const { fetchDashboardKPIs } = await import("@/lib/services/supabase-queries");
      return await fetchDashboardKPIs();
    } catch {
      /* fall through */
    }
  }
  return [];
}

export async function getFacturacionKPIs(): Promise<KPI[]> {
  if (isSupabaseConfigured()) {
    try {
      const { fetchFacturacionKPIs } = await import("@/lib/services/supabase-queries");
      return await fetchFacturacionKPIs();
    } catch {
      /* fall through */
    }
  }
  return [];
}

export async function getRechazosKPIs(): Promise<KPI[]> {
  if (isSupabaseConfigured()) {
    try {
      const { fetchRechazosKPIs } = await import("@/lib/services/supabase-queries");
      return await fetchRechazosKPIs();
    } catch {
      /* fall through */
    }
  }
  return [];
}

export async function getPacientesKPIs(): Promise<KPI[]> {
  if (isSupabaseConfigured()) {
    try {
      const { fetchPacientesKPIs } = await import("@/lib/services/supabase-queries");
      return await fetchPacientesKPIs();
    } catch {
      /* fall through */
    }
  }
  return [];
}

export async function getAgendaKPIs(): Promise<KPI[]> {
  if (isSupabaseConfigured()) {
    try {
      const { fetchAgendaKPIs } = await import("@/lib/services/supabase-queries");
      return await fetchAgendaKPIs();
    } catch {
      /* fall through */
    }
  }
  return [];
}

export async function getInventarioKPIs(): Promise<KPI[]> {
  if (isSupabaseConfigured()) {
    try {
      const { fetchInventarioKPIs } = await import("@/lib/services/supabase-queries");
      return await fetchInventarioKPIs();
    } catch {
      /* fall through */
    }
  }
  return [];
}

// ─── Service functions ───────────────────────────────────────
// When Supabase is configured, delegate to real queries.
// Otherwise, return empty arrays — new clinics start clean.

export async function getPacientes(): Promise<Paciente[]> {
  if (isSupabaseConfigured()) {
    const { fetchPacientes } = await import("@/lib/services/supabase-queries");
    return fetchPacientes();
  }
  await delay(SIM_DELAY);
  return [...PACIENTES];
}

export async function getPaciente(id: string): Promise<Paciente | null> {
  if (isSupabaseConfigured()) {
    const { fetchPaciente } = await import("@/lib/services/supabase-queries");
    return fetchPaciente(id);
  }
  await delay(SIM_DELAY);
  return PACIENTES.find((p) => p.id === id) ?? null;
}

export async function getFacturas(): Promise<Factura[]> {
  if (isSupabaseConfigured()) {
    const { fetchFacturas } = await import("@/lib/services/supabase-queries");
    return fetchFacturas();
  }
  await delay(SIM_DELAY);
  return [...FACTURAS];
}

export async function getRechazos(): Promise<Rechazo[]> {
  if (isSupabaseConfigured()) {
    const { fetchRechazos } = await import("@/lib/services/supabase-queries");
    return fetchRechazos();
  }
  await delay(SIM_DELAY);
  return [...RECHAZOS];
}

export async function getFinanciadores(): Promise<Financiador[]> {
  if (isSupabaseConfigured()) {
    const { fetchFinanciadores } = await import("@/lib/services/supabase-queries");
    return fetchFinanciadores();
  }
  await delay(SIM_DELAY);
  return [...FINANCIADORES];
}

export async function getInflacion(): Promise<InflacionMes[]> {
  if (isSupabaseConfigured()) {
    const { fetchInflacion } = await import("@/lib/services/supabase-queries");
    return fetchInflacion();
  }
  await delay(SIM_DELAY);
  return [...INFLACION];
}

export async function getAlertas(): Promise<Alerta[]> {
  if (isSupabaseConfigured()) {
    const { fetchAlertas } = await import("@/lib/services/supabase-queries");
    return fetchAlertas();
  }
  await delay(SIM_DELAY);
  return [...ALERTAS];
}

export async function getTurnos(): Promise<Turno[]> {
  if (isSupabaseConfigured()) {
    const { fetchTurnos } = await import("@/lib/services/supabase-queries");
    return fetchTurnos();
  }
  await delay(SIM_DELAY);
  return [...TURNOS];
}

export async function getInventario(): Promise<InventarioItem[]> {
  if (isSupabaseConfigured()) {
    const { fetchInventario } = await import("@/lib/services/supabase-queries");
    return fetchInventario();
  }
  await delay(SIM_DELAY);
  return [...INVENTARIO];
}

export async function getNomenclador(): Promise<NomencladorEntry[]> {
  if (isSupabaseConfigured()) {
    const { fetchNomenclador } = await import("@/lib/services/supabase-queries");
    return fetchNomenclador();
  }
  await delay(SIM_DELAY);
  return [...NOMENCLADOR];
}

export async function getReportes(): Promise<Reporte[]> {
  if (isSupabaseConfigured()) {
    const { fetchReportes } = await import("@/lib/services/supabase-queries");
    return fetchReportes();
  }
  await delay(SIM_DELAY);
  return [...REPORTES];
}

export async function getAuditoria(): Promise<AuditoriaItem[]> {
  if (isSupabaseConfigured()) {
    const { fetchAuditoria } = await import("@/lib/services/supabase-queries");
    return fetchAuditoria();
  }
  await delay(SIM_DELAY);
  return [...AUDITORIA];
}
