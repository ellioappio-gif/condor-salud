// ─── Inventario Service ──────────────────────────────────────
// CRUD for the inventario table. Used by inventario dashboard.
// Tracks medical supplies, medications, and equipment.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

export interface InventarioItem {
  id: string;
  nombre: string;
  categoria: string;
  presentacion: string;
  stock: number;
  stockMin: number;
  unidad: string;
  precioUnit: number;
  proveedor: string;
  ultimaCompra: string;
  vencimiento: string;
  lote?: string;
  estado: "OK" | "Bajo" | "Crítico" | "Vencido";
}

export interface InventarioFilter {
  categoria?: string;
  estado?: string;
  search?: string;
}

export interface CreateInventarioInput {
  nombre: string;
  categoria: string;
  presentacion?: string;
  stock: number;
  stockMin: number;
  unidad: string;
  precioUnit: number;
  proveedor: string;
  vencimiento?: string;
  lote?: string;
}

export interface UpdateInventarioInput {
  stock?: number;
  stockMin?: number;
  precioUnit?: number;
  proveedor?: string;
  ultimaCompra?: string;
  vencimiento?: string;
}

export interface InventarioStats {
  totalItems: number;
  stockBajo: number;
  stockCritico: number;
  proximoVencimiento: number;
  valorTotal: number;
  categorias: number;
}

// ─── Empty fallback array (no demo data) ────────────────────

const DEMO_INVENTARIO: InventarioItem[] = [];

// ─── Read Operations ─────────────────────────────────────────

export async function getInventarioItems(filter?: InventarioFilter): Promise<InventarioItem[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    let query = (sb as any).from("inventario").select("*").order("nombre");

    if (filter?.categoria && filter.categoria !== "Todas") {
      query = query.eq("categoria", filter.categoria);
    }
    if (filter?.estado && filter.estado !== "Todos") {
      query = query.eq("estado", filter.estado);
    }
    if (filter?.search) {
      query = query.ilike("nombre", `%${filter.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapInventarioFromDB);
  }

  await delay(120);
  let items = [...DEMO_INVENTARIO];
  if (filter?.categoria && filter.categoria !== "Todas") {
    items = items.filter((i) => i.categoria === filter.categoria);
  }
  if (filter?.estado && filter.estado !== "Todos") {
    items = items.filter((i) => i.estado === filter.estado);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    items = items.filter((i) => i.nombre.toLowerCase().includes(q));
  }
  return items;
}

export async function getInventarioById(id: string): Promise<InventarioItem | null> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as any).from("inventario").select("*").eq("id", id).single();
    if (error) return null;
    return data ? mapInventarioFromDB(data) : null;
  }

  return DEMO_INVENTARIO.find((i) => i.id === id) ?? null;
}

// ─── Write Operations ────────────────────────────────────────

export async function createInventarioItem(input: CreateInventarioInput): Promise<InventarioItem> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data, error } = await (sb as any)
      .from("inventario")
      .insert({
        nombre: input.nombre,
        categoria: input.categoria,
        presentacion: input.presentacion,
        stock: input.stock,
        stock_minimo: input.stockMin,
        unidad: input.unidad,
        precio_unitario: input.precioUnit,
        proveedor: input.proveedor,
        vencimiento: input.vencimiento,
        lote: input.lote,
        ultima_compra: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();
    if (error) throw error;
    return mapInventarioFromDB(data);
  }

  throw new Error("Cannot create item in demo mode");
}

export async function updateInventarioItem(
  id: string,
  input: UpdateInventarioInput,
): Promise<InventarioItem> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const updates: Record<string, any> = {};
    if (input.stock !== undefined) updates.stock = input.stock;
    if (input.stockMin !== undefined) updates.stock_minimo = input.stockMin;
    if (input.precioUnit !== undefined) updates.precio_unitario = input.precioUnit;
    if (input.proveedor) updates.proveedor = input.proveedor;
    if (input.ultimaCompra) updates.ultima_compra = input.ultimaCompra;
    if (input.vencimiento) updates.vencimiento = input.vencimiento;

    const { data, error } = await (sb as any)
      .from("inventario")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return mapInventarioFromDB(data);
  }

  throw new Error("Cannot update item in demo mode");
}

// ─── Stats ───────────────────────────────────────────────────

export async function getInventarioStats(): Promise<InventarioStats> {
  if (isSupabaseConfigured()) {
    const items = await getInventarioItems();
    const categorias = new Set(items.map((i) => i.categoria));
    return {
      totalItems: items.length,
      stockBajo: items.filter((i) => i.estado === "Bajo").length,
      stockCritico: items.filter((i) => i.estado === "Crítico").length,
      proximoVencimiento: items.filter(
        (i) => i.vencimiento !== "—" && i.vencimiento <= "2026-09-16",
      ).length,
      valorTotal: items.reduce((s, i) => s + i.stock * i.precioUnit, 0),
      categorias: categorias.size,
    };
  }

  const categorias = new Set(DEMO_INVENTARIO.map((i) => i.categoria));
  return {
    totalItems: DEMO_INVENTARIO.length,
    stockBajo: DEMO_INVENTARIO.filter((i) => i.estado === "Bajo").length,
    stockCritico: DEMO_INVENTARIO.filter((i) => i.estado === "Crítico").length,
    proximoVencimiento: 3,
    valorTotal: DEMO_INVENTARIO.reduce((s, i) => s + i.stock * i.precioUnit, 0),
    categorias: categorias.size,
  };
}

// ─── Categories ──────────────────────────────────────────────

export async function getInventarioCategorias(): Promise<string[]> {
  if (isSupabaseConfigured()) {
    const items = await getInventarioItems();
    return Array.from(new Set(items.map((i) => i.categoria))).sort();
  }

  return Array.from(new Set(DEMO_INVENTARIO.map((i) => i.categoria))).sort();
}

// ─── Helpers ─────────────────────────────────────────────────

function mapInventarioFromDB(row: any): InventarioItem {
  const stock = row.stock ?? 0;
  const stockMin = row.stock_minimo ?? 0;
  const vencimiento: string = row.vencimiento
    ? (new Date(row.vencimiento).toISOString().split("T")[0] ?? "—")
    : "—";

  let estado: InventarioItem["estado"] = "OK";
  if (row.estado) {
    estado = row.estado;
  } else {
    const today = new Date().toISOString().split("T")[0] ?? "";
    if (vencimiento !== "—" && vencimiento <= today) estado = "Vencido";
    else if (stock <= 0) estado = "Crítico";
    else if (stock < stockMin) estado = "Bajo";
  }

  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    presentacion: row.presentacion ?? "",
    stock,
    stockMin,
    unidad: row.unidad ?? "unidad",
    precioUnit: Number(row.precio_unitario ?? 0),
    proveedor: row.proveedor ?? "",
    ultimaCompra: row.ultima_compra ?? "",
    vencimiento,
    lote: row.lote,
    estado,
  };
}
