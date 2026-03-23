import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase with a flexible chain builder
function createMockChain(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const handler = () => new Proxy(chain, { get: () => handler });

  // Terminal methods
  const terminal = vi.fn().mockResolvedValue(finalResult);

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "single" || prop === "maybeSingle") return terminal;
        if (prop === "then") return terminal().then;
        return () =>
          new Proxy(
            {},
            {
              get(_t, p) {
                if (p === "single" || p === "maybeSingle") return terminal;
                return () =>
                  new Proxy(
                    {},
                    {
                      get(_t2, p2) {
                        if (p2 === "single" || p2 === "maybeSingle") return terminal;
                        return () =>
                          new Proxy(
                            {},
                            {
                              get(_t3, p3) {
                                if (p3 === "single" || p3 === "maybeSingle") return terminal;
                                return () => ({ single: terminal, maybeSingle: terminal });
                              },
                            },
                          );
                      },
                    },
                  );
              },
            },
          );
      },
    },
  );
}

let mockResult = { data: null as unknown, error: null as unknown };
const mockFrom = vi.fn((_table?: string) => createMockChain(mockResult));

vi.mock("@/lib/env", () => ({
  isSupabaseConfigured: () => true,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    from: (table: string) => mockFrom(table),
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { submitVerification, isDoctorVerified } from "@/lib/services/doctor-verification";

describe("doctor-verification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = { data: null, error: null };
  });

  describe("submitVerification", () => {
    it("throws when already approved", async () => {
      mockResult = { data: { id: "v-1", status: "approved" }, error: null };

      await expect(
        submitVerification({
          profileId: "p-1",
          matriculaNacional: "MN-12345",
        }),
      ).rejects.toThrow("Already verified");
    });

    it("throws when pending", async () => {
      mockResult = { data: { id: "v-2", status: "pending" }, error: null };

      await expect(
        submitVerification({
          profileId: "p-1",
          matriculaNacional: "MN-12345",
        }),
      ).rejects.toThrow("Verification already pending");
    });
  });

  describe("isDoctorVerified", () => {
    it("returns false when no verification exists", async () => {
      mockResult = { data: null, error: null };
      const result = await isDoctorVerified("profile-1");
      expect(result).toBe(false);
    });
  });
});
