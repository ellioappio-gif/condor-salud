import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildVerificationUrl } from "@/lib/services/prescription-qr";

describe("prescription-qr service", () => {
  describe("buildVerificationUrl", () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    it("builds URL with default base", () => {
      // When no env vars are set, fallback to condorsalud.com
      delete process.env.QR_BASE_URL;
      delete process.env.NEXT_PUBLIC_APP_URL;
      const url = buildVerificationUrl("abc123");
      expect(url).toBe("https://condorsalud.com/rx/abc123");
    });

    it("uses QR_BASE_URL when set", () => {
      process.env.QR_BASE_URL = "https://custom.example.com";
      const url = buildVerificationUrl("token-xyz");
      expect(url).toBe("https://custom.example.com/rx/token-xyz");
    });

    it("falls back to NEXT_PUBLIC_APP_URL", () => {
      delete process.env.QR_BASE_URL;
      process.env.NEXT_PUBLIC_APP_URL = "https://app.condorsalud.com";
      const url = buildVerificationUrl("test");
      expect(url).toBe("https://app.condorsalud.com/rx/test");
    });

    it("prefers QR_BASE_URL over NEXT_PUBLIC_APP_URL", () => {
      process.env.QR_BASE_URL = "https://qr.example.com";
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
      const url = buildVerificationUrl("t1");
      expect(url).toBe("https://qr.example.com/rx/t1");
    });

    it("handles empty token", () => {
      const url = buildVerificationUrl("");
      expect(url).toContain("/rx/");
    });

    it("handles special chars in token", () => {
      const url = buildVerificationUrl("abc-_123");
      expect(url).toContain("/rx/abc-_123");
    });
  });
});
