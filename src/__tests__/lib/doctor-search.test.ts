import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getGoogleMapsSearchUrl,
  getGoogleMapsSpecialtyUrl,
  getGoogleMapsPlaceUrl,
  isGooglePlacesConfigured,
} from "@/lib/doctor-search";

// ── URL builders ─────────────────────────────────────────────

describe("getGoogleMapsSearchUrl", () => {
  it("encodes doctor name for Google Maps search", () => {
    const url = getGoogleMapsSearchUrl("Dra. Laura Fernández");
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain("Dra.%20Laura%20Fern%C3%A1ndez");
    expect(url).toContain("Buenos%20Aires%20Argentina");
  });

  it("handles simple ASCII names", () => {
    const url = getGoogleMapsSearchUrl("Dr. Martin Garcia");
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain("Martin");
  });
});

describe("getGoogleMapsSpecialtyUrl", () => {
  it("encodes specialty for Google Maps search", () => {
    const url = getGoogleMapsSpecialtyUrl("Cardiología");
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain("Cardiolog");
    expect(url).toContain("Buenos%20Aires%20Argentina");
  });

  it("encodes Pediatría", () => {
    const url = getGoogleMapsSpecialtyUrl("Pediatría");
    expect(url).toContain("google.com/maps/search");
    expect(url).toContain("Pediatr");
  });
});

describe("getGoogleMapsPlaceUrl", () => {
  it("builds place URL from placeId", () => {
    const url = getGoogleMapsPlaceUrl("ChIJN1t_tDeuEmsRUsoyG83frY4");
    expect(url).toBe("https://www.google.com/maps/place/?q=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4");
  });
});

// ── Configuration check ──────────────────────────────────────

describe("isGooglePlacesConfigured", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns false when GOOGLE_MAPS_API_KEY is not set", () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    expect(isGooglePlacesConfigured()).toBe(false);
  });

  it("returns true when GOOGLE_MAPS_API_KEY is set", () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key-123";
    expect(isGooglePlacesConfigured()).toBe(true);
  });
});

// ── DoctorEnrichmentService ──────────────────────────────────

describe("DoctorEnrichmentService.buildWhatsAppUrl", () => {
  it("returns null for null phone", async () => {
    const { DoctorEnrichmentService } = await import("@/lib/services/doctor-enrichment");
    expect(DoctorEnrichmentService.buildWhatsAppUrl(null, "Dr. Test")).toBeNull();
  });

  it("builds WhatsApp URL with pre-filled message", async () => {
    const { DoctorEnrichmentService } = await import("@/lib/services/doctor-enrichment");
    const url = DoctorEnrichmentService.buildWhatsAppUrl(
      "5491112345678",
      "Dr. Test",
      "Cardiología",
    );
    expect(url).toContain("wa.me/5491112345678");
    expect(url).toContain("Dr.%20Test");
    expect(url).toContain("Cardiolog");
  });
});
