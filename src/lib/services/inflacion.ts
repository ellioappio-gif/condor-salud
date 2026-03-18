// ─── Inflación Service ───────────────────────────────────────
// CRUD for the inflacion_mensual table. Used by inflacion dashboard.
// Tracks IPC impact on billing cycles and payment delays.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";
import type { InflacionMes } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────

export interface InflacionFilter {
  period?: "3m" | "6m" | "12m";
  financiador?: string;
}

export interface FinanciadorInflacion {
  name: string;
  diasPromedio: number;
  perdidaPorDia: number;
  perdidaTotal: number;
  montoAfectado: number;
}

export interface InflacionStats {
  perdidaAcumulada: number;
  ipcPromedio: number;
  diasDemoraPromedio: number;
  tendencia: "mejorando" | "empeorando" | "estable";
}

// ─── Empty fallback arrays (no demo data) ───────────────────

const DEMO_MESES: InflacionMes[] = [];

const DEMO_FINANCIADORES_INFLACION: FinanciadorInflacion[] = [];

// ─── Read Operations ─────────────────────────────────────────

export async function getInflacionMensual(filter?: InflacionFilter): Promise<InflacionMes[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();

    let limit = 6;
    if (filter?.period === "3m") limit = 3;
    else if (filter?.period === "12m") limit = 12;

    const { data, error } = await (sb as any)
      .from("inflacion_mensual")
      .select("*")
      .order("anio", { ascending: false })
      .order("mes_num", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).reverse().map(mapInflacionFromDB);
  }

  await delay(120);
  const count = filter?.period === "3m" ? 3 : filter?.period === "12m" ? 12 : 6;
  return DEMO_MESES.slice(-count);
}

export async function getFinanciadoresInflacion(
  financiadorFilter?: string,
): Promise<FinanciadorInflacion[]> {
  if (isSupabaseConfigured()) {
    // Computed from financiadores + inflacion tables
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const { data } = await (sb as any)
      .from("financiadores")
      .select("name,dias_promedio_pago,cobrado")
      .eq("activo", true);

    if (data && data.length > 0) {
      return data.map((f: any) => ({
        name: f.name,
        diasPromedio: f.dias_promedio_pago,
        perdidaPorDia: 0.11,
        perdidaTotal:
          (Number((((f.dias_promedio_pago * 0.11) / 100) * Number(f.cobrado)).toFixed(0)) /
            Number(f.cobrado)) *
          100,
        montoAfectado: Number(f.cobrado),
      }));
    }
  }

  await delay(80);
  if (financiadorFilter && financiadorFilter !== "Todos") {
    return DEMO_FINANCIADORES_INFLACION.filter((f) => f.name === financiadorFilter);
  }
  return [...DEMO_FINANCIADORES_INFLACION];
}

// ─── Stats ───────────────────────────────────────────────────

export async function getInflacionStats(): Promise<InflacionStats> {
  if (isSupabaseConfigured()) {
    const data = await getInflacionMensual({ period: "6m" });
    if (data.length > 0) {
      const perdidaAcumulada = data.reduce((s, m) => s + m.perdidaReal, 0);
      const ipcPromedio = Number((data.reduce((s, m) => s + m.ipc, 0) / data.length).toFixed(1));
      const diasDemoraPromedio = Math.round(
        data.reduce((s, m) => s + m.diasDemora, 0) / data.length,
      );
      const last3 = data.slice(-3);
      const first3 = data.slice(0, 3);
      const avgLast = last3.reduce((s, m) => s + m.perdidaPorcentaje, 0) / last3.length;
      const avgFirst = first3.reduce((s, m) => s + m.perdidaPorcentaje, 0) / first3.length;
      const tendencia =
        avgLast < avgFirst - 0.5
          ? "mejorando"
          : avgLast > avgFirst + 0.5
            ? "empeorando"
            : "estable";

      return { perdidaAcumulada, ipcPromedio, diasDemoraPromedio, tendencia };
    }
  }

  return {
    perdidaAcumulada: 1195000,
    ipcPromedio: 3.1,
    diasDemoraPromedio: 47,
    tendencia: "mejorando",
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function mapInflacionFromDB(row: any): InflacionMes {
  return {
    mes: row.mes,
    ipc: Number(row.ipc),
    facturado: Number(row.facturado),
    cobrado: Number(row.cobrado),
    diasDemora: row.dias_demora,
    perdidaReal: Number(row.perdida_real),
    perdidaPorcentaje: Number(row.perdida_porcentaje),
  };
}
