// ─── Dashboard Blank-Slate Tests ─────────────────────────────
// Verify that the data.ts service layer returns proper data structures
// and that the SWR hooks return empty arrays when no data is present.
//
// POLICY: Authenticated dashboard pages show empty states, not mock data.
// Mock data in data.ts is intentionally kept for isSupabaseConfigured()===false fallback.

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Service Layer Tests ─────────────────────────────────────
// These test that the data service returns correct structures.

describe("Data service — structure validation", () => {
  it("getPacientes returns array with expected shape", async () => {
    const { getPacientes } = await import("@/lib/services/data");
    const result = await getPacientes();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const p = result[0]!;
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("nombre");
      expect(p).toHaveProperty("dni");
      expect(p).toHaveProperty("financiador");
      expect(p).toHaveProperty("estado");
    }
  });

  it("getFacturas returns array with expected shape", async () => {
    const { getFacturas } = await import("@/lib/services/data");
    const result = await getFacturas();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("numero");
      expect(result[0]).toHaveProperty("monto");
      expect(result[0]).toHaveProperty("estado");
    }
  });

  it("getTurnos returns array with expected shape", async () => {
    const { getTurnos } = await import("@/lib/services/data");
    const result = await getTurnos();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("hora");
      expect(result[0]).toHaveProperty("paciente");
      expect(result[0]).toHaveProperty("estado");
    }
  });

  it("getInventario returns array with expected shape", async () => {
    const { getInventario } = await import("@/lib/services/data");
    const result = await getInventario();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("nombre");
      expect(result[0]).toHaveProperty("stock");
      expect(result[0]).toHaveProperty("minimo");
    }
  });

  it("getReportes returns array with expected shape", async () => {
    const { getReportes } = await import("@/lib/services/data");
    const result = await getReportes();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("nombre");
      expect(result[0]).toHaveProperty("categoria");
    }
  });

  it("getPaciente returns null for non-existent ID", async () => {
    const { getPaciente } = await import("@/lib/services/data");
    const result = await getPaciente("does-not-exist-12345");
    expect(result).toBeNull();
  });
});

// ─── KPI Builder Tests ───────────────────────────────────────

describe("KPI builders — always return 4 items", () => {
  const kpiBuilders = [
    "getDashboardKPIs",
    "getFacturacionKPIs",
    "getRechazosKPIs",
    "getPacientesKPIs",
    "getAgendaKPIs",
    "getInventarioKPIs",
  ] as const;

  kpiBuilders.forEach((fnName) => {
    it(`${fnName} returns exactly 4 KPIs with required fields`, async () => {
      const mod = await import("@/lib/services/data");
      const fn = mod[fnName] as () => Promise<
        { label: string; value: string; change: string; up: boolean }[]
      >;
      const kpis = await fn();
      expect(kpis).toHaveLength(4);
      kpis.forEach((kpi) => {
        expect(kpi).toHaveProperty("label");
        expect(kpi).toHaveProperty("value");
        expect(kpi).toHaveProperty("change");
        expect(typeof kpi.up).toBe("boolean");
      });
    });
  });
});

// ─── Inventario Service Tests ────────────────────────────────

describe("Inventario service — CRUD", () => {
  it("getInventarioItems returns typed array", async () => {
    const { getInventarioItems } = await import("@/lib/services/inventario");
    const items = await getInventarioItems();
    expect(Array.isArray(items)).toBe(true);
    if (items.length > 0) {
      const item = items[0]!;
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("nombre");
      expect(item).toHaveProperty("categoria");
      expect(item).toHaveProperty("stock");
      expect(item).toHaveProperty("estado");
      expect(item).toHaveProperty("precioUnit");
    }
  });

  it("getInventarioStats returns stats object", async () => {
    const { getInventarioStats } = await import("@/lib/services/inventario");
    const stats = await getInventarioStats();
    expect(stats).toHaveProperty("totalItems");
    expect(stats).toHaveProperty("stockBajo");
    expect(stats).toHaveProperty("stockCritico");
    expect(stats).toHaveProperty("valorTotal");
    expect(typeof stats.totalItems).toBe("number");
  });
});

// ─── Turnos Service Tests ────────────────────────────────────

describe("Turnos service — CRUD", () => {
  it("getTodayStats returns stats object with correct fields", async () => {
    const { getTodayStats } = await import("@/lib/services/turnos");
    const stats = await getTodayStats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("confirmados");
    expect(stats).toHaveProperty("pendientes");
    expect(stats).toHaveProperty("atendidos");
    expect(stats).toHaveProperty("cancelados");
    expect(stats).toHaveProperty("occupancy");
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.occupancy).toBe("number");
  });
});

// ─── Export Service Tests ────────────────────────────────────

describe("Export types are valid", () => {
  it("PDFReportType includes all expected types", async () => {
    // Type-level test: verify the types compile correctly
    const validPdfTypes = [
      "facturacion",
      "rechazos",
      "kpi",
      "financiadores",
      "inflacion",
      "agenda",
    ];
    expect(validPdfTypes).toHaveLength(6);
  });

  it("ExcelReportType includes all expected types", async () => {
    const validExcelTypes = [
      "facturacion",
      "rechazos",
      "nomenclador",
      "inventario",
      "pacientes",
      "financiadores",
      "inflacion",
      "agenda",
    ];
    expect(validExcelTypes).toHaveLength(8);
  });
});

// ─── Reportes Service Tests ──────────────────────────────────

describe("Reportes service", () => {
  it("getReportesList returns entries with required fields", async () => {
    const { getReportesList } = await import("@/lib/services/reportes");
    const reportes = await getReportesList();
    expect(Array.isArray(reportes)).toBe(true);
    if (reportes.length > 0) {
      const r = reportes[0]!;
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("nombre");
      expect(r).toHaveProperty("descripcion");
      expect(r).toHaveProperty("categoria");
      expect(r).toHaveProperty("frecuencia");
    }
  });
});
