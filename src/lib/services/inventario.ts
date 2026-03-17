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

// ─── Demo Data ───────────────────────────────────────────────

const DEMO_INVENTARIO: InventarioItem[] = [
  {
    id: "INV-001",
    nombre: "Enalapril 10mg",
    categoria: "Medicamento",
    presentacion: "Caja x30 comp.",
    stock: 245,
    stockMin: 50,
    unidad: "cajas",
    precioUnit: 3200,
    proveedor: "Droguería del Sud",
    ultimaCompra: "2026-03-01",
    vencimiento: "2027-11-01",
    estado: "OK",
  },
  {
    id: "INV-002",
    nombre: "Metformina 850mg",
    categoria: "Medicamento",
    presentacion: "Caja x60 comp.",
    stock: 132,
    stockMin: 40,
    unidad: "cajas",
    precioUnit: 4800,
    proveedor: "Droguería del Sud",
    ultimaCompra: "2026-02-15",
    vencimiento: "2027-08-01",
    estado: "OK",
  },
  {
    id: "INV-003",
    nombre: "Jeringa 5ml c/aguja",
    categoria: "Descartable",
    presentacion: "Caja x100",
    stock: 18,
    stockMin: 20,
    unidad: "cajas",
    precioUnit: 12500,
    proveedor: "Medistock",
    ultimaCompra: "2026-02-20",
    vencimiento: "—",
    estado: "Bajo",
  },
  {
    id: "INV-004",
    nombre: "Guantes nitrilo M",
    categoria: "Descartable",
    presentacion: "Caja x100",
    stock: 5,
    stockMin: 15,
    unidad: "cajas",
    precioUnit: 8900,
    proveedor: "Medistock",
    ultimaCompra: "2026-02-10",
    vencimiento: "—",
    estado: "Crítico",
  },
  {
    id: "INV-005",
    nombre: "Gel ecográfico",
    categoria: "Insumo",
    presentacion: "Bidón 5L",
    stock: 8,
    stockMin: 3,
    unidad: "bidones",
    precioUnit: 15000,
    proveedor: "EcoSuministros",
    ultimaCompra: "2026-01-25",
    vencimiento: "—",
    estado: "OK",
  },
  {
    id: "INV-006",
    nombre: "Tiras reactivas glucemia",
    categoria: "Reactivo",
    presentacion: "Caja x50",
    stock: 3,
    stockMin: 10,
    unidad: "cajas",
    precioUnit: 18500,
    proveedor: "Roche Diagnostics",
    ultimaCompra: "2026-02-05",
    vencimiento: "2026-09-01",
    estado: "Crítico",
  },
  {
    id: "INV-007",
    nombre: "Amoxicilina 500mg",
    categoria: "Medicamento",
    presentacion: "Caja x21 comp.",
    stock: 87,
    stockMin: 30,
    unidad: "cajas",
    precioUnit: 5600,
    proveedor: "Bagó",
    ultimaCompra: "2026-02-28",
    vencimiento: "2027-06-01",
    estado: "OK",
  },
  {
    id: "INV-008",
    nombre: "Gasas estériles 10x10",
    categoria: "Descartable",
    presentacion: "Paquete x10",
    stock: 156,
    stockMin: 50,
    unidad: "paquetes",
    precioUnit: 2400,
    proveedor: "Medistock",
    ultimaCompra: "2026-03-05",
    vencimiento: "—",
    estado: "OK",
  },
  {
    id: "INV-009",
    nombre: "Alcohol 70%",
    categoria: "Antiséptico",
    presentacion: "Bidón 5L",
    stock: 4,
    stockMin: 3,
    unidad: "bidones",
    precioUnit: 9800,
    proveedor: "Lab. Barracas",
    ultimaCompra: "2026-02-18",
    vencimiento: "—",
    estado: "OK",
  },
  {
    id: "INV-010",
    nombre: "Oxímetro de pulso",
    categoria: "Equipamiento",
    presentacion: "Unidad",
    stock: 6,
    stockMin: 2,
    unidad: "unidades",
    precioUnit: 45000,
    proveedor: "Medical Devices AR",
    ultimaCompra: "2026-01-10",
    vencimiento: "—",
    estado: "OK",
  },
  {
    id: "INV-011",
    nombre: "Suero fisiológico 500ml",
    categoria: "Solución",
    presentacion: "Bolsa 500ml",
    stock: 85,
    stockMin: 50,
    unidad: "bolsas",
    precioUnit: 420,
    proveedor: "Fresenius Kabi",
    ultimaCompra: "2026-03-02",
    vencimiento: "2026-12-01",
    estado: "OK",
  },
  {
    id: "INV-012",
    nombre: "Ibuprofeno 400mg",
    categoria: "Medicamento",
    presentacion: "Caja x30 comp.",
    stock: 45,
    stockMin: 30,
    unidad: "cajas",
    precioUnit: 3800,
    proveedor: "Roemmers",
    ultimaCompra: "2026-02-22",
    vencimiento: "2027-01-20",
    estado: "OK",
  },
];

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
