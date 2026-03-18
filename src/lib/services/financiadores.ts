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

// ─── Empty fallback array (no demo data) ────────────────────

const DEMO_FINANCIADORES: FinanciadorExtended[] = [];

// ─── Read Operations ─────────────────────────────────────────

export async function getFinanciadoresExtended(
  filter?: FinanciadorFilter,
): Promise<FinanciadorExtended[]> {
  if (isSupabaseConfigured()) {
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

  throw new Error("Cannot update financiador in demo mode");
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
