import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Flexible Supabase mock chain ────────────────────────────
let mockQueryResult: { data: unknown; error: unknown; count?: number } = {
  data: null,
  error: null,
};

function createChainProxy(): Record<string, unknown> {
  const terminal = () => Promise.resolve(mockQueryResult);
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "single" || prop === "maybeSingle") return vi.fn(terminal);
        if (prop === "then") return terminal().then.bind(terminal());
        // Any method call returns the same proxy for chaining
        return vi.fn(() => createChainProxy());
      },
    },
  ) as Record<string, unknown>;
}

const mockFrom = vi.fn(() => createChainProxy());

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { getCategories, getTimeline, getCategoryStats } from "@/lib/services/health-tracker";

describe("health-tracker service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryResult = { data: null, error: null };
  });

  describe("getCategories", () => {
    it("returns empty array on error", async () => {
      mockQueryResult = { data: null, error: { message: "db error" } };
      const result = await getCategories();
      expect(result).toEqual([]);
    });

    it("returns mapped categories", async () => {
      mockQueryResult = {
        data: [
          {
            id: "c-1",
            name: "Glucosa",
            slug: "glucosa",
            icon: "droplet",
            color: "#F6B40E",
            default_unit: "mg/dL",
            min_value: 50,
            max_value: 400,
            active: true,
            sort_order: 1,
          },
          {
            id: "c-2",
            name: "Peso",
            slug: "peso",
            icon: "scale",
            color: "#75AADB",
            default_unit: "kg",
            min_value: null,
            max_value: null,
            active: true,
            sort_order: 2,
          },
        ],
        error: null,
      };

      const result = await getCategories();
      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe("Glucosa");
      expect(result[0]!.slug).toBe("glucosa");
      expect(result[0]!.defaultUnit).toBe("mg/dL");
      expect(result[1]!.name).toBe("Peso");
    });
  });

  describe("getTimeline", () => {
    it("returns empty array on error", async () => {
      mockQueryResult = { data: null, error: { message: "fail" } };
      const result = await getTimeline("patient-1");
      expect(result).toEqual([]);
    });

    it("returns mapped items with category info", async () => {
      mockQueryResult = {
        data: [
          {
            id: "i-1",
            patient_id: "patient-1",
            category_id: "c-1",
            value: 120,
            unit: "mg/dL",
            notes: "Before breakfast",
            measured_at: "2025-01-15T08:00:00Z",
            created_at: "2025-01-15T08:00:00Z",
            health_tracker_categories: {
              name: "Glucosa",
              icon: "droplet",
              color: "#F6B40E",
              default_unit: "mg/dL",
            },
          },
        ],
        error: null,
      };

      const result = await getTimeline("patient-1");
      expect(result).toHaveLength(1);
      expect(result[0]!.value).toBe(120);
      expect(result[0]!.categoryName).toBe("Glucosa");
      expect(result[0]!.categoryIcon).toBe("droplet");
    });
  });

  describe("getCategoryStats", () => {
    it("returns zeros when no data", async () => {
      mockQueryResult = { data: [], error: null };
      const stats = await getCategoryStats("patient-1", "c-1");
      expect(stats.avg).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.count).toBe(0);
    });

    it("computes stats correctly", async () => {
      mockQueryResult = {
        data: [
          {
            id: "i-1",
            patient_id: "p-1",
            category_id: "c-1",
            value: 100,
            measured_at: "2025-01-15T08:00:00Z",
            created_at: "2025-01-15T08:00:00Z",
          },
          {
            id: "i-2",
            patient_id: "p-1",
            category_id: "c-1",
            value: 150,
            measured_at: "2025-01-14T08:00:00Z",
            created_at: "2025-01-14T08:00:00Z",
          },
          {
            id: "i-3",
            patient_id: "p-1",
            category_id: "c-1",
            value: 200,
            measured_at: "2025-01-13T08:00:00Z",
            created_at: "2025-01-13T08:00:00Z",
          },
        ],
        error: null,
      };

      const stats = await getCategoryStats("patient-1", "c-1");
      expect(stats.count).toBe(3);
      expect(stats.avg).toBe(150);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
      expect(stats.latest).toBeDefined();
      expect(stats.latest!.value).toBe(100); // first in array (desc order)
    });
  });
});
