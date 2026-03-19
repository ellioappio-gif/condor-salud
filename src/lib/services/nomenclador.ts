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

// ─── Demo Data ───────────────────────────────────────────────

const DEMO_NOMENCLADOR: NomencladorEntry[] = [
  {
    id: "n1",
    codigo: "420101",
    descripcion: "Consulta médica en consultorio",
    capitulo: "Consultas",
    modulo: "Módulo 1",
    valorSSS: 12500,
    valorPAMI: 10800,
    valorOSDE: 18200,
    valorSwiss: 17500,
    valorGaleno: 16800,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n2",
    codigo: "420201",
    descripcion: "Consulta médica domiciliaria",
    capitulo: "Consultas",
    modulo: "Módulo 1",
    valorSSS: 18000,
    valorPAMI: 15200,
    valorOSDE: 24600,
    valorSwiss: 23800,
    valorGaleno: 22500,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n3",
    codigo: "420301",
    descripcion: "Interconsulta especializada",
    capitulo: "Consultas",
    modulo: "Módulo 1",
    valorSSS: 15800,
    valorPAMI: 13400,
    valorOSDE: 22100,
    valorSwiss: 21000,
    valorGaleno: 20200,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n4",
    codigo: "660101",
    descripcion: "Hemograma completo",
    capitulo: "Laboratorio",
    modulo: "Módulo 6",
    valorSSS: 8200,
    valorPAMI: 7100,
    valorOSDE: 12500,
    valorSwiss: 11800,
    valorGaleno: 11200,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n5",
    codigo: "660201",
    descripcion: "Perfil tiroideo (TSH + T3 + T4)",
    capitulo: "Laboratorio",
    modulo: "Módulo 6",
    valorSSS: 22400,
    valorPAMI: 19200,
    valorOSDE: 32000,
    valorSwiss: 30500,
    valorGaleno: 29000,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n6",
    codigo: "660301",
    descripcion: "Glucemia",
    capitulo: "Laboratorio",
    modulo: "Módulo 6",
    valorSSS: 3800,
    valorPAMI: 3200,
    valorOSDE: 5600,
    valorSwiss: 5200,
    valorGaleno: 4900,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n7",
    codigo: "660401",
    descripcion: "HbA1c (hemoglobina glicosilada)",
    capitulo: "Laboratorio",
    modulo: "Módulo 6",
    valorSSS: 14200,
    valorPAMI: 12100,
    valorOSDE: 20800,
    valorSwiss: 19500,
    valorGaleno: 18500,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n8",
    codigo: "660501",
    descripcion: "Perfil lipídico completo",
    capitulo: "Laboratorio",
    modulo: "Módulo 6",
    valorSSS: 16500,
    valorPAMI: 14100,
    valorOSDE: 24200,
    valorSwiss: 22800,
    valorGaleno: 21500,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n9",
    codigo: "380101",
    descripcion: "Electrocardiograma (ECG)",
    capitulo: "Cardiología",
    modulo: "Módulo 3",
    valorSSS: 9800,
    valorPAMI: 8400,
    valorOSDE: 14500,
    valorSwiss: 13800,
    valorGaleno: 13000,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n10",
    codigo: "380201",
    descripcion: "Ecocardiograma doppler",
    capitulo: "Cardiología",
    modulo: "Módulo 3",
    valorSSS: 32000,
    valorPAMI: 27500,
    valorOSDE: 48000,
    valorSwiss: 45000,
    valorGaleno: 42000,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n11",
    codigo: "340101",
    descripcion: "Radiografía de tórax (F y P)",
    capitulo: "Diagnóstico por Imagen",
    modulo: "Módulo 3",
    valorSSS: 8500,
    valorPAMI: 7200,
    valorOSDE: 12800,
    valorSwiss: 12000,
    valorGaleno: 11500,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n12",
    codigo: "340201",
    descripcion: "Ecografía abdominal",
    capitulo: "Diagnóstico por Imagen",
    modulo: "Módulo 3",
    valorSSS: 18000,
    valorPAMI: 15500,
    valorOSDE: 28000,
    valorSwiss: 26000,
    valorGaleno: 24500,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n13",
    codigo: "340301",
    descripcion: "Mamografía bilateral",
    capitulo: "Diagnóstico por Imagen",
    modulo: "Módulo 3",
    valorSSS: 22000,
    valorPAMI: 18800,
    valorOSDE: 35000,
    valorSwiss: 33000,
    valorGaleno: 31000,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n14",
    codigo: "340401",
    descripcion: "TAC cerebro s/contraste",
    capitulo: "Diagnóstico por Imagen",
    modulo: "Módulo 3",
    valorSSS: 42000,
    valorPAMI: 36000,
    valorOSDE: 65000,
    valorSwiss: 62000,
    valorGaleno: 58000,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n15",
    codigo: "340501",
    descripcion: "RMN cerebro c/contraste",
    capitulo: "Diagnóstico por Imagen",
    modulo: "Módulo 3",
    valorSSS: 55000,
    valorPAMI: 47000,
    valorOSDE: 85000,
    valorSwiss: 80000,
    valorGaleno: 75000,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n16",
    codigo: "440101",
    descripcion: "Sesión kinesiología",
    capitulo: "Rehabilitación",
    modulo: "Módulo 4",
    valorSSS: 6200,
    valorPAMI: 5300,
    valorOSDE: 9500,
    valorSwiss: 9000,
    valorGaleno: 8500,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n17",
    codigo: "440201",
    descripcion: "Sesión fonoaudiología",
    capitulo: "Rehabilitación",
    modulo: "Módulo 4",
    valorSSS: 7800,
    valorPAMI: 6600,
    valorOSDE: 12000,
    valorSwiss: 11200,
    valorGaleno: 10500,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
  {
    id: "n18",
    codigo: "500101",
    descripcion: "Endoscopia digestiva alta",
    capitulo: "Procedimientos",
    modulo: "Módulo 5",
    valorSSS: 38000,
    valorPAMI: 32500,
    valorOSDE: 58000,
    valorSwiss: 55000,
    valorGaleno: 52000,
    vigente: true,
    ultimaActualizacion: "2026-03-01",
  },
];

// ─── Read Operations ─────────────────────────────────────────

export async function getNomencladorEntries(
  filter?: NomencladorFilter,
): Promise<NomencladorEntry[]> {
  if (isSupabaseConfigured()) {
    try {
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
    } catch {
      return [];
    }
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
