import { describe, it, expect } from "vitest";
import {
  getSeatPlan,
  getAllSeatPlans,
  getTrialDaysRemaining,
  type SeatPlanId,
} from "@/lib/services/seat-billing";

describe("seat-billing service", () => {
  describe("getAllSeatPlans", () => {
    it("returns all seat plans", () => {
      const plans = getAllSeatPlans();
      expect(plans.length).toBeGreaterThanOrEqual(3);
    });

    it("includes free, basic, plus, enterprise", () => {
      const plans = getAllSeatPlans();
      const ids = plans.map((p) => p.id);
      expect(ids).toContain("free");
      expect(ids).toContain("basic");
      expect(ids).toContain("plus");
      expect(ids).toContain("enterprise");
    });

    it("free plan has $0 price", () => {
      const plans = getAllSeatPlans();
      const free = plans.find((p) => p.id === "free");
      expect(free).toBeDefined();
      expect(free!.price).toBe(0);
    });

    it("basic plan is $50 USD equivalent", () => {
      const plans = getAllSeatPlans();
      const basic = plans.find((p) => p.id === "basic");
      expect(basic).toBeDefined();
      expect(basic!.price).toBe(60_000); // ARS equivalent
    });

    it("plus plan is $120 USD equivalent", () => {
      const plans = getAllSeatPlans();
      const plus = plans.find((p) => p.id === "plus");
      expect(plus).toBeDefined();
      expect(plus!.price).toBe(144_000); // ARS equivalent
    });

    it("enterprise plan is $180 USD equivalent", () => {
      const plans = getAllSeatPlans();
      const ent = plans.find((p) => p.id === "enterprise");
      expect(ent).toBeDefined();
      expect(ent!.price).toBe(216_000); // ARS equivalent
    });

    it("plans are sorted by price ascending", () => {
      const plans = getAllSeatPlans();
      for (let i = 1; i < plans.length; i++) {
        const curr = plans[i];
        const prev = plans[i - 1];
        if (curr && prev) {
          expect(curr.price).toBeGreaterThanOrEqual(prev.price);
        }
      }
    });
  });

  describe("getSeatPlan", () => {
    it("returns correct plan by ID", () => {
      const plan = getSeatPlan("basic");
      expect(plan).toBeDefined();
      expect(plan!.id).toBe("basic");
      expect(plan!.name).toBeDefined();
    });

    it("throws for invalid ID", () => {
      expect(() => getSeatPlan("nonexistent" as SeatPlanId)).toThrow(
        "Unknown seat plan: nonexistent",
      );
    });

    it("free plan has limited features", () => {
      const plan = getSeatPlan("free");
      expect(plan).toBeDefined();
      expect(plan!.maxBookingsPerMonth).toBe(20);
      expect(plan!.features.telehealth).toBe(false);
      expect(plan!.features.aiChatbot).toBe(false);
      expect(plan!.features.eBilling).toBe(false);
      expect(plan!.features.agenda).toBe(true);
    });

    it("enterprise plan has all features enabled", () => {
      const plan = getSeatPlan("enterprise");
      expect(plan).toBeDefined();
      expect(plan!.features.telehealth).toBe(true);
      expect(plan!.features.eBilling).toBe(true);
      expect(plan!.features.aiChatbot).toBe(true);
      expect(plan!.features.customBranding).toBe(true);
      expect(plan!.features.mercadopagoCobro).toBe(true);
    });
  });

  describe("getTrialDaysRemaining", () => {
    it("returns 0 when no trial date", () => {
      expect(getTrialDaysRemaining({ trialEndsAt: undefined } as any)).toBe(0);
    });

    it("returns 0 when trial has expired", () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      expect(getTrialDaysRemaining({ trialEndsAt: pastDate } as any)).toBe(0);
    });

    it("returns positive days when trial is active", () => {
      const futureDate = new Date(Date.now() + 7 * 86400000).toISOString();
      const days = getTrialDaysRemaining({ trialEndsAt: futureDate } as any);
      expect(days).toBeGreaterThanOrEqual(6);
      expect(days).toBeLessThanOrEqual(8);
    });
  });
});
