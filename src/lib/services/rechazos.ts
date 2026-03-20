// ─── Rechazos Service ────────────────────────────────────────
import type { SupabaseClient, DBRow } from "@/lib/services/db-types";
// CRUD for the rechazos table. Used by the rechazos dashboard.
// Demo mode returns mock data; Supabase mode queries real DB.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";
import type { Rechazo, RechazoMotivo } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────

export interface RechazoFilter {
  financiador?: string;
  estado?: string;
  motivo?: RechazoMotivo;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface RechazoStats {
  totalRechazado: number;
  pendientes: number;
  reprocesados: number;
  reprocesables: number;
  tasaRecupero: number;
  motivoCounts: Record<string, number>;
}

export interface ReprocesarInput {
  rechazoId: string;
  nuevaFacturaNumero?: string;
  notas?: string;
}

// ─── Read Operations ─────────────────────────────────────────

export async function getRechazosFiltered(filter?: RechazoFilter): Promise<Rechazo[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    let query = (sb as SupabaseClient)
      .from("rechazos")
      .select("*")
      .order("fecha_rechazo", { ascending: false });

    if (filter?.financiador && filter.financiador !== "Todos") {
      query = query.eq("financiador", filter.financiador);
    }
    if (filter?.estado && filter.estado !== "todos") {
      query = query.eq("estado", filter.estado);
    }
    if (filter?.motivo) query = query.eq("motivo", filter.motivo);
    if (filter?.dateFrom) query = query.gte("fecha_rechazo", filter.dateFrom);
    if (filter?.dateTo) query = query.lte("fecha_rechazo", filter.dateTo);
    if (filter?.search) {
      query = query.or(`paciente.ilike.%${filter.search}%,factura_numero.ilike.%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapRechazoFromDB);
  }

  // Demo mode
  await delay(120);
  const { getRechazos } = await import("@/lib/services/data");
  let items = await getRechazos();

  if (filter?.financiador && filter.financiador !== "Todos") {
    items = items.filter((r) => r.financiador === filter.financiador);
  }
  if (filter?.estado && filter.estado !== "todos") {
    items = items.filter((r) => r.estado === filter.estado);
  }
  if (filter?.motivo) {
    items = items.filter((r) => r.motivo === filter.motivo);
  }
  return items;
}

export async function getRechazoById(id: string): Promise<Rechazo | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as SupabaseClient)
      .from("rechazos")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data ? mapRechazoFromDB(data) : null;
  }

  const { getRechazos } = await import("@/lib/services/data");
  const all = await getRechazos();
  return all.find((r) => r.id === id) ?? null;
}

// ─── Write Operations ────────────────────────────────────────

export async function reprocesarRechazo(input: ReprocesarInput): Promise<Rechazo> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as SupabaseClient)
      .from("rechazos")
      .update({
        estado: "reprocesado",
        fecha_resolucion: new Date().toISOString().split("T")[0],
      })
      .eq("id", input.rechazoId)
      .select()
      .single();
    if (error) throw error;
    return mapRechazoFromDB(data);
  }

  throw new Error("Cannot reprocesar in demo mode");
}

export async function descartarRechazo(id: string): Promise<Rechazo> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as SupabaseClient)
      .from("rechazos")
      .update({ estado: "descartado" })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapRechazoFromDB(data);
  }

  throw new Error("Cannot descartar in demo mode");
}

// ─── Stats ───────────────────────────────────────────────────

export async function getRechazoStats(): Promise<RechazoStats> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data } = await (sb as SupabaseClient)
      .from("rechazos")
      .select("monto,estado,reprocesable,motivo");

    const items = data ?? [];
    const totalRechazado = items.reduce((s: number, r: DBRow) => s + Number(r.monto), 0);
    const pendientes = items.filter((r: DBRow) => r.estado === "pendiente").length;
    const reprocesados = items.filter((r: DBRow) => r.estado === "reprocesado");
    const reprocesables = items.filter(
      (r: DBRow) => r.estado === "pendiente" && r.reprocesable,
    ).length;
    const montoReprocesado = reprocesados.reduce((s: number, r: DBRow) => s + Number(r.monto), 0);
    const motivoCounts = items.reduce(
      (acc: Record<string, number>, r: DBRow) => {
        acc[r.motivo] = (acc[r.motivo] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalRechazado,
      pendientes,
      reprocesados: reprocesados.length,
      reprocesables,
      tasaRecupero: totalRechazado > 0 ? (montoReprocesado / totalRechazado) * 100 : 0,
      motivoCounts,
    };
  }

  return {
    totalRechazado: 293500,
    pendientes: 6,
    reprocesados: 2,
    reprocesables: 4,
    tasaRecupero: 12.3,
    motivoCounts: {
      sin_autorizacion: 2,
      codigo_invalido: 1,
      afiliado_no_encontrado: 1,
      duplicada: 1,
      datos_incompletos: 1,
      vencida: 1,
      nomenclador_desactualizado: 1,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function mapRechazoFromDB(row: DBRow): Rechazo {
  return {
    id: row.id,
    facturaId: row.factura_id ?? "",
    facturaNumero: row.factura_numero,
    financiador: row.financiador,
    paciente: row.paciente,
    prestacion: row.prestacion,
    monto: Number(row.monto),
    motivo: row.motivo,
    motivoDetalle: row.motivo_detalle ?? "",
    fechaRechazo: row.fecha_rechazo,
    fechaPresentacion: row.fecha_presentacion,
    reprocesable: row.reprocesable ?? false,
    estado: row.estado,
  };
}
