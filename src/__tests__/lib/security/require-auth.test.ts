import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock @supabase/ssr before importing requireAuth
const mockGetUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

// Mock logger to prevent output
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock crypto — encrypt/decrypt are identity functions in tests
vi.mock("@/lib/security/crypto", () => ({
  encrypt: (text: string) => text,
  decrypt: (text: string) => text,
}));

describe("requireAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    mockGetUser.mockReset();
    // Default: Supabase getUser returns no user
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  function makeRequest(cookies: Record<string, string> = {}): NextRequest {
    const url = new URL("http://localhost:3000/api/test");
    const req = new NextRequest(url);
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value);
    }
    return req;
  }

  it("returns user when valid session cookie is present", async () => {
    const { requireAuth } = await import("@/lib/security/require-auth");
    const session = {
      id: "u1",
      email: "doc@clinica.com",
      name: "Dr. Test",
      role: "admin",
      clinicId: "c1",
      clinicName: "Test Clinic",
    };
    const req = makeRequest({ condor_session: JSON.stringify(session) });
    const result = await requireAuth(req);

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe("u1");
    expect(result.user?.email).toBe("doc@clinica.com");
    expect(result.user?.role).toBe("admin");
  });

  it("returns demo user when no cookies at all (demo mode)", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    const { requireAuth } = await import("@/lib/security/require-auth");
    const req = makeRequest({});
    const result = await requireAuth(req);

    // DEMO MODE: returns demo user instead of 401
    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe("demo-doctor-001");
    expect(result.user?.email).toBe("demo@condorsalud.com");
  });

  it("returns demo user when session cookie is corrupt (demo mode)", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    const { requireAuth } = await import("@/lib/security/require-auth");
    const req = makeRequest({ condor_session: "not-json" });
    const result = await requireAuth(req);

    // DEMO MODE: falls through to demo user instead of 401
    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe("demo-doctor-001");
  });

  it("returns demo user when session cookie is missing required fields (demo mode)", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    const { requireAuth } = await import("@/lib/security/require-auth");
    const partial = { id: "u1" }; // missing email and role
    const req = makeRequest({ condor_session: JSON.stringify(partial) });
    const result = await requireAuth(req);

    // DEMO MODE: falls through to demo user instead of 401
    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe("demo-doctor-001");
  });

  it("falls back to supabase auth when no condor_session", async () => {
    // Mock Supabase getUser returning a valid user
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "sb-user-123",
          email: "nicole@clinica.com",
          user_metadata: {
            full_name: "Nicole R.",
            role: "recepcion",
            clinic_id: "clinic-cmr",
            clinic_name: "Centro Médico Roca",
          },
        },
      },
      error: null,
    });

    const { requireAuth } = await import("@/lib/security/require-auth");
    const req = makeRequest({ "sb-test-auth-token": "some-supabase-token" });
    const result = await requireAuth(req);

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe("sb-user-123");
    expect(result.user?.email).toBe("nicole@clinica.com");
    expect(result.user?.role).toBe("recepcion");
    expect(result.user?.clinicId).toBe("clinic-cmr");
  });

  it("returns user when session has all required fields", async () => {
    const { requireAuth } = await import("@/lib/security/require-auth");
    const session = {
      id: "user-123",
      email: "user@test.com",
      name: "Test User",
      role: "medico",
      clinicId: "clinic-456",
      clinicName: "Clinica Test",
    };
    const req = makeRequest({ condor_session: JSON.stringify(session) });
    const result = await requireAuth(req);

    expect(result.error).toBeUndefined();
    expect(result.user?.role).toBe("medico");
    expect(result.user?.clinicId).toBe("clinic-456");
  });
});
