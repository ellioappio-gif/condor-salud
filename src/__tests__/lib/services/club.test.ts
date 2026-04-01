import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to mock Supabase before importing the service
const mockMaybeSingle = vi.fn();
const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockEqStatus = vi.fn(() => ({ order: mockOrder }));
const mockEqPatient = vi.fn(() => ({ eq: mockEqStatus }));
const mockSelect = vi.fn(() => ({ eq: mockEqPatient }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: () => true,
}));

// club.ts uses @supabase/supabase-js directly via getSupabase()
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// Import after mocks
import { calculatePrescriptionFee } from "@/lib/services/club";

describe("club service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculatePrescriptionFee", () => {
    it("returns full price when patient has no membership", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const fee = await calculatePrescriptionFee("patient-1", "Amoxicilina 500mg", 5000);

      expect(fee.originalPrice).toBe(5000);
      expect(fee.discountPct).toBe(0);
      expect(fee.finalPrice).toBe(5000);
      expect(fee.patientId).toBe("patient-1");
      expect(fee.medicationName).toBe("Amoxicilina 500mg");
      expect(fee.paymentStatus).toBe("pending");
    });

    it("applies 0% discount for basico plan (prescription discounts removed)", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "m-1",
          patient_id: "patient-1",
          plan_id: "p-1",
          status: "active",
          started_at: new Date().toISOString(),
          club_plans: {
            id: "p-1",
            slug: "basico",
            name_es: "Básico",
            name_en: "Basic",
            price_ars: 9000,
            price_usd: 0,
            prescription_discount: 0,
            max_teleconsultas: 1,
            includes_delivery: false,
            includes_cora_priority: false,
            active: true,
            sort_order: 1,
          },
        },
        error: null,
      });

      const fee = await calculatePrescriptionFee("patient-1", "Ibuprofeno 400mg", 2000);

      expect(fee.originalPrice).toBe(2000);
      expect(fee.discountPct).toBe(0);
      expect(fee.finalPrice).toBe(2000);
      expect(fee.clubPlanSlug).toBe("basico");
    });

    it("applies 0% discount for plus plan (prescription discounts removed)", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "m-2",
          patient_id: "patient-2",
          plan_id: "p-2",
          status: "active",
          started_at: new Date().toISOString(),
          club_plans: {
            id: "p-2",
            slug: "plus",
            name_es: "Plus",
            name_en: "Plus",
            price_ars: 24500,
            price_usd: 0,
            prescription_discount: 0,
            max_teleconsultas: 3,
            includes_delivery: true,
            includes_cora_priority: true,
            active: true,
            sort_order: 2,
          },
        },
        error: null,
      });

      const fee = await calculatePrescriptionFee("patient-2", "Omeprazol 20mg", 3000);

      expect(fee.originalPrice).toBe(3000);
      expect(fee.discountPct).toBe(0);
      expect(fee.finalPrice).toBe(3000);
      expect(fee.clubPlanSlug).toBe("plus");
    });

    it("applies 0% discount for familiar plan (prescription discounts removed)", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "m-3",
          patient_id: "patient-3",
          plan_id: "p-3",
          status: "active",
          started_at: new Date().toISOString(),
          club_plans: {
            id: "p-3",
            slug: "familiar",
            name_es: "Familiar",
            name_en: "Family",
            price_ars: 90000,
            price_usd: 0,
            prescription_discount: 0,
            max_teleconsultas: 999,
            includes_delivery: true,
            includes_cora_priority: true,
            active: true,
            sort_order: 3,
          },
        },
        error: null,
      });

      const fee = await calculatePrescriptionFee("patient-3", "Losartan 50mg", 1500);

      expect(fee.originalPrice).toBe(1500);
      expect(fee.discountPct).toBe(0);
      expect(fee.finalPrice).toBe(1500);
      expect(fee.clubPlanSlug).toBe("familiar");
    });

    it("returns original price when discount is zero", async () => {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: "m-4",
          patient_id: "patient-4",
          plan_id: "p-4",
          status: "active",
          started_at: new Date().toISOString(),
          club_plans: {
            id: "p-4",
            slug: "basico",
            name_es: "Básico",
            name_en: "Basic",
            price_ars: 9000,
            price_usd: 0,
            prescription_discount: 0,
            max_teleconsultas: 1,
            includes_delivery: false,
            includes_cora_priority: false,
            active: true,
            sort_order: 1,
          },
        },
        error: null,
      });

      const fee = await calculatePrescriptionFee("patient-4", "Test Med", 33.33);

      expect(fee.finalPrice).toBe(33.33);
    });

    it("returns 0 discount for zero-priced medications", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const fee = await calculatePrescriptionFee("patient-5", "Gratis Med", 0);

      expect(fee.originalPrice).toBe(0);
      expect(fee.finalPrice).toBe(0);
    });
  });
});
