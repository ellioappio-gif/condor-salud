// ─── Reportes Service ────────────────────────────────────────
// CRUD for the reportes table. Used by reportes dashboard.
// Manages report definitions, generation, and download tracking.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

export interface ReporteEntry {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  frecuencia: string;
  formato: string;
  ultimaGeneracion: string;
  archivoUrl?: string;
}

export interface ReporteFilter {
  categoria?: string;
  search?: string;
}

export interface GenerateReporteInput {
  reporteId: string;
  formato?: "PDF" | "Excel";
  dateFrom?: string;
  dateTo?: string;
}

// ─── Demo Data ───────────────────────────────────────────────

const DEMO_REPORTES: ReporteEntry[] = [];

// ─── Read Operations ─────────────────────────────────────────

export async function getReportesList(filter?: ReporteFilter): Promise<ReporteEntry[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    let query = (sb as any).from("reportes").select("*").order("nombre");

    if (filter?.categoria && filter.categoria !== "Todos") {
      query = query.eq("categoria", filter.categoria);
    }
    if (filter?.search) {
      query = query.or(`nombre.ilike.%${filter.search}%,descripcion.ilike.%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapReporteFromDB);
  }

  await delay(120);
  let items = [...DEMO_REPORTES];
  if (filter?.categoria && filter.categoria !== "Todos") {
    items = items.filter((r) => r.categoria === filter.categoria);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter(
      (r) => r.nombre.toLowerCase().includes(q) || r.descripcion.toLowerCase().includes(q),
    );
  }
  return items;
}

export async function getReporteById(id: string): Promise<ReporteEntry | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data } = await (sb as any).from("reportes").select("*").eq("id", id).single();
    return data ? mapReporteFromDB(data) : null;
  }

  return DEMO_REPORTES.find((r) => r.id === id) ?? null;
}

// ─── Write Operations ────────────────────────────────────────

export async function markReporteGenerated(id: string, archivoUrl?: string): Promise<ReporteEntry> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const updates: Record<string, any> = {
      ultima_generacion: new Date().toISOString(),
    };
    if (archivoUrl) updates.archivo_url = archivoUrl;

    const { data, error } = await (sb as any)
      .from("reportes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapReporteFromDB(data);
  }

  throw new Error("Cannot update reporte in demo mode");
}

// ─── Stats ───────────────────────────────────────────────────

export async function getReportesStats() {
  if (isSupabaseConfigured()) {
    const items = await getReportesList();
    const categorias = new Set(items.map((r) => r.categoria));
    return {
      totalReportes: items.length,
      categorias: categorias.size,
      generadosEsteMes: items.filter(
        (r) => r.ultimaGeneracion >= new Date().toISOString().slice(0, 7),
      ).length,
    };
  }

  return {
    totalReportes: DEMO_REPORTES.length,
    categorias: new Set(DEMO_REPORTES.map((r) => r.categoria)).size,
    generadosEsteMes: 0,
  };
}

// ─── Categories ──────────────────────────────────────────────

export async function getReportesCategorias(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const items = await getReportesList();
    return Array.from(new Set(items.map((r) => r.categoria))).sort();
  }

  return Array.from(new Set(DEMO_REPORTES.map((r) => r.categoria))).sort();
}

// ─── Helpers ─────────────────────────────────────────────────

function mapReporteFromDB(row: any): ReporteEntry {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    descripcion: row.descripcion ?? "",
    frecuencia: row.frecuencia ?? "Mensual",
    formato: row.formato ?? "PDF",
    ultimaGeneracion: row.ultima_generacion
      ? (new Date(row.ultima_generacion).toISOString().split("T")[0] ?? "")
      : "",
    archivoUrl: row.archivo_url,
  };
}
