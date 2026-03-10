import { describe, it, expect, vi, beforeEach } from "vitest";

describe("env validation", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("exports clientEnv with defaults", async () => {
    const { clientEnv } = await import("@/lib/env");
    expect(clientEnv).toBeDefined();
    expect(clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(typeof clientEnv.NEXT_PUBLIC_SUPABASE_URL).toBe("string");
  });

  it("isSupabaseConfigured returns false for placeholder", async () => {
    const { isSupabaseConfigured } = await import("@/lib/env");
    // Default value is placeholder, so it should not be "configured"
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("exports serverEnv on server side", async () => {
    const { serverEnv } = await import("@/lib/env");
    // In test (jsdom) typeof window !== 'undefined', so serverEnv is empty
    // but the module should not throw
    expect(serverEnv).toBeDefined();
  });
});
