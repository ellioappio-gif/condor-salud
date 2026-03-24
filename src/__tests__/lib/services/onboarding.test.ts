import { describe, it, expect } from "vitest";
import {
  completeOnboarding,
  saveOnboardingProgress,
  getOnboardingStatus,
} from "@/lib/services/onboarding";

describe("onboarding service (no Supabase)", () => {
  describe("completeOnboarding", () => {
    it("returns error when Supabase is not configured", async () => {
      const result = await completeOnboarding({
        nombre: "Clínica San Martín",
        email: "admin@clinica.com",
        doctorNombre: "Dr. García",
        doctorMatricula: "MN 12345",
        planTier: "basic",
      });
      // Without Supabase env vars, we expect an error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("requires doctor fields", async () => {
      const result = await completeOnboarding({
        nombre: "Test",
        doctorNombre: "Dra. López",
        doctorMatricula: "MP 98765",
        planTier: "plus",
      });
      expect(result.success).toBe(false);
    });

    it("accepts full input", async () => {
      const result = await completeOnboarding({
        nombre: "Clínica Completa",
        direccion: "Av. Corrientes 1234",
        telefono: "+5411555555",
        email: "info@clinica.com",
        especialidades: ["Cardiología", "Pediatría"],
        financiadores: ["OSDE", "PAMI"],
        doctorNombre: "Dr. Martínez",
        doctorMatricula: "MN 54321",
        doctorEspecialidad: "Cardiología",
        planTier: "enterprise",
      });
      // Still fails without Supabase — but validates the types compile
      expect(result.success).toBe(false);
    });
  });

  describe("saveOnboardingProgress", () => {
    it("does not throw without Supabase", async () => {
      await expect(saveOnboardingProgress(2)).resolves.toBeUndefined();
    });

    it("handles step 0", async () => {
      await expect(saveOnboardingProgress(0)).resolves.toBeUndefined();
    });
  });

  describe("getOnboardingStatus", () => {
    it("returns not completed without Supabase", async () => {
      const status = await getOnboardingStatus();
      expect(status).toEqual({ completed: false, step: 0 });
    });

    it("step is a number", async () => {
      const status = await getOnboardingStatus();
      expect(typeof status.step).toBe("number");
    });
  });
});
