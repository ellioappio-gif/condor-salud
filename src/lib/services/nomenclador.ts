// ─── Nomenclador Service ─────────────────────────────────────
// CRUD for the nomenclador table. Used by nomenclador dashboard.
// Manages medical procedure codes and values per financiador.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

export interface NomencladorEntry {
  id: string;
  codigo: string;
  descripcion: string;
  capitulo: string;
  modulo: string;
  valorSSS: number;
  valorPAMI: number;
  valorOSDE: number;
  valorSwiss: number;
  valorGaleno: number;
  vigente: boolean;
  ultimaActualizacion: string;
}

export interface NomencladorFilter {
  capitulo?: string;
  search?: string;
  vigente?: boolean;
}

export interface UpdateNomencladorInput {
  valorSSS?: number;
  valorPAMI?: number;
  valorOSDE?: number;
  valorSwiss?: number;
  valorGaleno?: number;
  vigente?: boolean;
}

export interface NomencladorStats {
  totalCodigos: number;
  vigentes: number;
  capitulos: number;
  ultimaActualizacion: string;
}

// ─── Empty fallback array (no demo data) ────────────────────

const DEMO_NOMENCLADOR: NomencladorEntry[] = [];

// ─── Read Operations ─────────────────────────────────────────

export async function getNomencladorEntries(
  filter?: NomencladorFilter,
): Promise<NomencladorEntry[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    let query = (sb as any).from("nomenclador").select("*").order("codigo");

    if (filter?.capitulo && filter.capitulo !== "Todos") {
      query = query.eq("capitulo", filter.capitulo);
    }
    if (filter?.vigente !== undefined) {
      query = query.eq("vigente", filter.vigente);
    }
    if (filter?.search) {
      query = query.or(`codigo.ilike.%${filter.search}%,descripcion.ilike.%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapNomencladorFromDB);
  }

  await delay(120);
  let items = [...DEMO_NOMENCLADOR];
  if (filter?.capitulo && filter.capitulo !== "Todos") {
    items = items.filter((n) => n.capitulo === filter.capitulo);
  }
  if (filter?.vigente !== undefined) {
    items = items.filter((n) => n.vigente === filter.vigente);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter((n) => n.codigo.includes(q) || n.descripcion.toLowerCase().includes(q));
  }
  return items;
}

export async function getNomencladorByCodigo(codigo: string): Promise<NomencladorEntry | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data } = await (sb as any)
      .from("nomenclador")
      .select("*")
      .eq("codigo", codigo)
      .single();
    return data ? mapNomencladorFromDB(data) : null;
  }

  return DEMO_NOMENCLADOR.find((n) => n.codigo === codigo) ?? null;
}

// ─── Write Operations ────────────────────────────────────────

export async function updateNomencladorEntry(
  id: string,
  input: UpdateNomencladorInput,
): Promise<NomencladorEntry> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const updates: Record<string, any> = {};
    if (input.valorSSS !== undefined) updates.valor_sss = input.valorSSS;
    if (input.valorPAMI !== undefined) updates.valor_pami = input.valorPAMI;
    if (input.valorOSDE !== undefined) updates.valor_osde = input.valorOSDE;
    if (input.valorSwiss !== undefined) updates.valor_swiss = input.valorSwiss;
    if (input.valorGaleno !== undefined) updates.valor_galeno = input.valorGaleno;
    if (input.vigente !== undefined) updates.vigente = input.vigente;
    updates.ultima_actualizacion = new Date().toISOString().split("T")[0];

    const { data, error } = await (sb as any)
      .from("nomenclador")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapNomencladorFromDB(data);
  }

  throw new Error("Cannot update nomenclador in demo mode");
}

// ─── Stats ───────────────────────────────────────────────────

export async function getNomencladorStats(): Promise<NomencladorStats> {
  if (isSupabaseConfigured()) {
    const items = await getNomencladorEntries();
    const capitulos = new Set(items.map((n) => n.capitulo));
    const ultimaFecha = items.reduce(
      (max, n) => (n.ultimaActualizacion > max ? n.ultimaActualizacion : max),
      "",
    );
    return {
      totalCodigos: items.length,
      vigentes: items.filter((n) => n.vigente).length,
      capitulos: capitulos.size,
      ultimaActualizacion: ultimaFecha,
    };
  }

  return {
    totalCodigos: DEMO_NOMENCLADOR.length,
    vigentes: DEMO_NOMENCLADOR.filter((n) => n.vigente).length,
    capitulos: new Set(DEMO_NOMENCLADOR.map((n) => n.capitulo)).size,
    ultimaActualizacion: "2026-03-01",
  };
}

// ─── Capitulos ───────────────────────────────────────────────

export async function getNomencladorCapitulos(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const items = await getNomencladorEntries();
    return Array.from(new Set(items.map((n) => n.capitulo))).sort();
  }

  return Array.from(new Set(DEMO_NOMENCLADOR.map((n) => n.capitulo))).sort();
}

// ─── Helpers ─────────────────────────────────────────────────

function mapNomencladorFromDB(row: any): NomencladorEntry {
  return {
    id: row.id,
    codigo: row.codigo,
    descripcion: row.descripcion,
    capitulo: row.capitulo,
    modulo: row.modulo ?? "",
    valorSSS: Number(row.valor_sss ?? 0),
    valorPAMI: Number(row.valor_pami ?? 0),
    valorOSDE: Number(row.valor_osde ?? 0),
    valorSwiss: Number(row.valor_swiss ?? 0),
    valorGaleno: Number(row.valor_galeno ?? 0),
    vigente: row.vigente ?? true,
    ultimaActualizacion: row.ultima_actualizacion ?? "",
  };
}
