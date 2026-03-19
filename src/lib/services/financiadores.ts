// ─── Financiadores Service ───────────────────────────────────
// CRUD for the financiadores table. Used by financiadores dashboard.
// Demo mode returns mock data; Supabase mode queries real DB.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";
import type { Financiador, FinanciadorType } from "@/lib/types";

// ─── Extended type for dashboard display ─────────────────────

export interface FinanciadorExtended extends Financiador {
  contacto: string;
  ultimaLiquidacion: string;
}

export interface FinanciadorFilter {
  type?: FinanciadorType;
  search?: string;
}

export interface FinanciadorStats {
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  diasPromedioGlobal: number;
  tasaRechazoGlobal: number;
}

// ─── Demo Data ───────────────────────────────────────────────

const DEMO_FINANCIADORES: FinanciadorExtended[] = [
  {
    id: "1",
    name: "PAMI",
    type: "pami",
    facturado: 1400000,
    cobrado: 980000,
    tasaRechazo: 12,
    diasPromedioPago: 68,
    facturasPendientes: 23,
    ultimoPago: "2026-02-28",
    contacto: "delegacion.caba@pami.gob.ar",
    ultimaLiquidacion: "Febrero 2026",
  },
  {
    id: "2",
    name: "OSDE",
    type: "prepaga",
    facturado: 890000,
    cobrado: 845000,
    tasaRechazo: 4,
    diasPromedioPago: 32,
    facturasPendientes: 8,
    ultimoPago: "2026-03-05",
    contacto: "prestadores@osde.com.ar",
    ultimaLiquidacion: "Marzo 2026",
  },
  {
    id: "3",
    name: "Swiss Medical",
    type: "prepaga",
    facturado: 620000,
    cobrado: 595000,
    tasaRechazo: 2,
    diasPromedioPago: 28,
    facturasPendientes: 5,
    ultimoPago: "2026-03-07",
    contacto: "prestadores@swissmedical.com.ar",
    ultimaLiquidacion: "Marzo 2026",
  },
  {
    id: "4",
    name: "IOMA",
    type: "os",
    facturado: 410000,
    cobrado: 312000,
    tasaRechazo: 18,
    diasPromedioPago: 82,
    facturasPendientes: 31,
    ultimoPago: "2026-01-15",
    contacto: "prestadores@ioma.gba.gov.ar",
    ultimaLiquidacion: "Enero 2026",
  },
  {
    id: "5",
    name: "Galeno",
    type: "prepaga",
    facturado: 280000,
    cobrado: 268000,
    tasaRechazo: 3,
    diasPromedioPago: 35,
    facturasPendientes: 4,
    ultimoPago: "2026-03-02",
    contacto: "admin@galeno.com.ar",
    ultimaLiquidacion: "Marzo 2026",
  },
  {
    id: "6",
    name: "Medifé",
    type: "prepaga",
    facturado: 195000,
    cobrado: 178000,
    tasaRechazo: 5,
    diasPromedioPago: 38,
    facturasPendientes: 6,
    ultimoPago: "2026-02-25",
    contacto: "prestadores@medife.com.ar",
    ultimaLiquidacion: "Febrero 2026",
  },
  {
    id: "7",
    name: "Obra Social Bancaria",
    type: "os",
    facturado: 150000,
    cobrado: 128000,
    tasaRechazo: 8,
    diasPromedioPago: 55,
    facturasPendientes: 12,
    ultimoPago: "2026-02-10",
    contacto: "salud@osbancaria.com.ar",
    ultimaLiquidacion: "Febrero 2026",
  },
];

// ─── Read Operations ─────────────────────────────────────────

export async function getFinanciadoresExtended(
  filter?: FinanciadorFilter,
): Promise<FinanciadorExtended[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      let query = (sb as any)
        .from("financiadores")
        .select("*")
        .eq("activo", true)
        .order("facturado", { ascending: false });

      if (filter?.type) query = query.eq("type", filter.type);
      if (filter?.search) query = query.ilike("name", `%${filter.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapFinanciadorFromDB);
    } catch {
      return [];
    }
  }

  await delay(120);
  let items = [...DEMO_FINANCIADORES];
  if (filter?.type) items = items.filter((f) => f.type === filter.type);
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter((f) => f.name.toLowerCase().includes(q));
  }
  return items;
}

export async function getFinanciadorById(id: string): Promise<FinanciadorExtended | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as any)
      .from("financiadores")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data ? mapFinanciadorFromDB(data) : null;
  }

  return DEMO_FINANCIADORES.find((f) => f.id === id) ?? null;
}

// ─── Write Operations ────────────────────────────────────────

export async function updateFinanciador(
  id: string,
  updates: Partial<Pick<FinanciadorExtended, "contacto" | "ultimaLiquidacion">>,
): Promise<FinanciadorExtended> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const dbUpdates: Record<string, any> = {};
    if (updates.contacto) dbUpdates.contacto_email = updates.contacto;
    if (updates.ultimaLiquidacion) dbUpdates.ultima_liquidacion = updates.ultimaLiquidacion;

    const { data, error } = await (sb as any)
      .from("financiadores")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapFinanciadorFromDB(data);
  }

  throw new Error("Cannot update in demo mode");
}

// ─── Stats ───────────────────────────────────────────────────

export async function getFinanciadorStats(): Promise<FinanciadorStats> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data } = await (sb as any)
      .from("financiadores")
      .select("facturado,cobrado,tasa_rechazo,dias_promedio_pago,facturas_pendientes")
      .eq("activo", true);

    const items = data ?? [];
    const totalFacturado = items.reduce((s: number, f: any) => s + Number(f.facturado), 0);
    const totalCobrado = items.reduce((s: number, f: any) => s + Number(f.cobrado), 0);
    const totalPendiente = totalFacturado - totalCobrado;
    const diasPromedioGlobal =
      items.length > 0
        ? Math.round(
            items.reduce((s: number, f: any) => s + f.dias_promedio_pago, 0) / items.length,
          )
        : 0;
    const tasaRechazoGlobal =
      items.length > 0
        ? Number(
            (
              items.reduce((s: number, f: any) => s + Number(f.tasa_rechazo), 0) / items.length
            ).toFixed(1),
          )
        : 0;

    return { totalFacturado, totalCobrado, totalPendiente, diasPromedioGlobal, tasaRechazoGlobal };
  }

  return {
    totalFacturado: 3945000,
    totalCobrado: 3306000,
    totalPendiente: 639000,
    diasPromedioGlobal: 48,
    tasaRechazoGlobal: 7.4,
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function mapFinanciadorFromDB(row: any): FinanciadorExtended {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    facturado: Number(row.facturado),
    cobrado: Number(row.cobrado),
    tasaRechazo: Number(row.tasa_rechazo),
    diasPromedioPago: row.dias_promedio_pago,
    facturasPendientes: row.facturas_pendientes,
    ultimoPago: row.ultimo_pago ?? undefined,
    contacto: row.contacto_email ?? "",
    ultimaLiquidacion: row.ultima_liquidacion ?? "",
  };
}
