import { describe, it, expect } from "vitest";
import { generateSlug } from "@/lib/services/doctor-profiles";

describe("doctor-profiles service", () => {
  describe("generateSlug", () => {
    it("converts simple name to kebab-case", () => {
      expect(generateSlug("María García")).toBe("maria-garcia");
    });

    it("strips accents", () => {
      expect(generateSlug("José Ángel López")).toBe("jose-angel-lopez");
    });

    it("removes special characters", () => {
      expect(generateSlug("Dr. Juan O'Brien (MD)")).toBe("dr-juan-obrien-md");
    });

    it("collapses multiple spaces and dashes", () => {
      expect(generateSlug("Ana   María  --  Pérez")).toBe("ana-maria-perez");
    });

    it("handles empty string", () => {
      expect(generateSlug("")).toBe("");
    });

    it("handles single word", () => {
      expect(generateSlug("Rodríguez")).toBe("rodriguez");
    });

    it("lowercases everything", () => {
      expect(generateSlug("CARLOS MARTÍNEZ")).toBe("carlos-martinez");
    });

    it("handles ñ", () => {
      expect(generateSlug("Niño Muñoz")).toBe("nino-munoz");
    });

    it("handles Unicode combining marks", () => {
      expect(generateSlug("Ñoño Peña")).toBe("nono-pena");
    });
  });
});
