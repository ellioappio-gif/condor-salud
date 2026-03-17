// ─── Facturación Service ─────────────────────────────────────
// CRUD for the facturas table. Used by the facturacion dashboard.
// Demo mode returns mock data; Supabase mode queries real DB.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";
import type { Factura, FacturaEstado } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────

export interface FacturaFilter {
  financiador?: string;
  estado?: FacturaEstado;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CreateFacturaInput {
  numero: string;
  fecha: string;
  financiador: string;
  paciente: string;
  pacienteId?: string;
  prestacion: string;
  codigoNomenclador?: string;
  monto: number;
  estado?: FacturaEstado;
}

export interface UpdateFacturaInput {
  estado?: FacturaEstado;
  fechaPresentacion?: string;
  fechaCobro?: string;
  cae?: string;
  notas?: string;
}

export interface FacturacionStats {
  totalFacturado: number;
  totalCobrado: number;
  totalRechazado: number;
  totalPendiente: number;
  cantidadFacturas: number;
  tasaCobro: number;
}

// ─── Read Operations ─────────────────────────────────────────

export async function getFacturasFiltered(filter?: FacturaFilter): Promise<Factura[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    let query = (sb as any).from("facturas").select("*").order("fecha", { ascending: false });

    if (filter?.financiador && filter.financiador !== "Todos") {
      query = query.eq("financiador", filter.financiador);
    }
    if (filter?.estado && filter.estado !== ("todos" as any)) {
      query = query.eq("estado", filter.estado);
    }
    if (filter?.dateFrom) query = query.gte("fecha", filter.dateFrom);
    if (filter?.dateTo) query = query.lte("fecha", filter.dateTo);
    if (filter?.search) {
      query = query.or(`paciente.ilike.%${filter.search}%,numero.ilike.%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapFacturaFromDB);
  }

  // Demo mode
  await delay(120);
  const { getFacturas } = await import("@/lib/services/data");
  let items = await getFacturas();

  if (filter?.financiador && filter.financiador !== "Todos") {
    items = items.filter((f) => f.financiador === filter.financiador);
  }
  if (filter?.estado && filter.estado !== ("todos" as any)) {
    items = items.filter((f) => f.estado === filter.estado);
  }
  return items;
}

export async function getFacturaById(id: string): Promise<Factura | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as any).from("facturas").select("*").eq("id", id).single();
    if (error) return null;
    return data ? mapFacturaFromDB(data) : null;
  }

  const { getFacturas } = await import("@/lib/services/data");
  const all = await getFacturas();
  return all.find((f) => f.id === id) ?? null;
}

// ─── Write Operations ────────────────────────────────────────

export async function createFactura(input: CreateFacturaInput): Promise<Factura> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as any)
      .from("facturas")
      .insert({
        numero: input.numero,
        fecha: input.fecha,
        financiador: input.financiador,
        paciente: input.paciente,
        paciente_id: input.pacienteId,
        prestacion: input.prestacion,
        codigo_nomenclador: input.codigoNomenclador,
        monto: input.monto,
        estado: input.estado ?? "pendiente",
      })
      .select()
      .single();
    if (error) throw error;
    return mapFacturaFromDB(data);
  }

  throw new Error("Cannot create factura in demo mode");
}

export async function updateFactura(id: string, input: UpdateFacturaInput): Promise<Factura> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const updates: Record<string, any> = {};
    if (input.estado) updates.estado = input.estado;
    if (input.fechaPresentacion) updates.fecha_presentacion = input.fechaPresentacion;
    if (input.fechaCobro) updates.fecha_cobro = input.fechaCobro;
    if (input.cae) updates.cae = input.cae;

    const { data, error } = await (sb as any)
      .from("facturas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapFacturaFromDB(data);
  }

  throw new Error("Cannot update factura in demo mode");
}

// ─── Stats ───────────────────────────────────────────────────

export async function getFacturacionStats(): Promise<FacturacionStats> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data } = await (sb as any).from("facturas").select("monto,estado");

    const items = data ?? [];
    const totalFacturado = items.reduce((s: number, f: any) => s + Number(f.monto), 0);
    const totalCobrado = items
      .filter((f: any) => f.estado === "cobrada")
      .reduce((s: number, f: any) => s + Number(f.monto), 0);
    const totalRechazado = items
      .filter((f: any) => f.estado === "rechazada")
      .reduce((s: number, f: any) => s + Number(f.monto), 0);
    const totalPendiente = items
      .filter((f: any) => ["presentada", "pendiente", "en_observacion"].includes(f.estado))
      .reduce((s: number, f: any) => s + Number(f.monto), 0);

    return {
      totalFacturado,
      totalCobrado,
      totalRechazado,
      totalPendiente,
      cantidadFacturas: items.length,
      tasaCobro: totalFacturado > 0 ? (totalCobrado / totalFacturado) * 100 : 0,
    };
  }

  return {
    totalFacturado: 9400000,
    totalCobrado: 7850000,
    totalRechazado: 293500,
    totalPendiente: 1256500,
    cantidadFacturas: 10,
    tasaCobro: 83.5,
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function mapFacturaFromDB(row: any): Factura {
  return {
    id: row.id,
    numero: row.numero,
    fecha: row.fecha,
    financiador: row.financiador,
    paciente: row.paciente,
    prestacion: row.prestacion,
    codigoNomenclador: row.codigo_nomenclador ?? "",
    monto: Number(row.monto),
    estado: row.estado,
    fechaPresentacion: row.fecha_presentacion ?? undefined,
    fechaCobro: row.fecha_cobro ?? undefined,
    cae: row.cae ?? undefined,
  };
}
