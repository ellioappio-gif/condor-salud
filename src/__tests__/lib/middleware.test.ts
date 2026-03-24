import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Middleware Logic Tests ──────────────────────────────────
// We test the pure logic functions extracted from middleware.ts
// without needing the full Next.js runtime. Instead, we test
// the route classification and sanitization logic directly.

// ── Route classification (mirrors middleware.ts) ──────────────

const AUTH_ROUTES = ["/auth/login", "/auth/registro", "/auth/forgot-password"];

const PUBLIC_PAGE_PREFIXES = [
  "/",
  "/planes",
  "/partnerships",
  "/club",
  "/acs",
  "/privacidad",
  "/terminos",
  "/status",
  "/offline",
  "/paciente",
  "/auth",
  "/rx",
  "/medicos",
  "/sieczkowski",
];

const PUBLIC_API_PREFIXES = [
  "/api/health",
  "/api/status",
  "/api/chatbot",
  "/api/waitlist",
  "/api/auth",
  "/api/csp-report",
  "/api/webhooks",
  "/api/patients/register",
  "/api/patients/login",
  "/api/patients/refresh",
  "/api/patients/reset-password",
  "/api/payments/webhook",
  "/api/admin/login",
  "/api/rides",
  "/api/chat",
  "/api/demo",
  "/api/billing",
  "/api/team/accept",
  "/api/club",
  "/api/prescriptions",
  "/api/doctors/public",
  "/api/doctors/profile",
  "/api/doctors/verification",
  "/api/admin/verifications",
  "/api/health-tracker",
  "/api/cron",
];

function sanitizeRedirect(value: string | null): string {
  if (!value) return "/dashboard";
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes(":")) return value;
  return "/dashboard";
}

function isPublicPage(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PAGE_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p));
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

// ── Tests ────────────────────────────────────────────────────

describe("sanitizeRedirect — open redirect prevention", () => {
  it("returns /dashboard for null", () => {
    expect(sanitizeRedirect(null)).toBe("/dashboard");
  });

  it("returns /dashboard for empty string", () => {
    expect(sanitizeRedirect("")).toBe("/dashboard");
  });

  it("allows valid relative paths", () => {
    expect(sanitizeRedirect("/dashboard/pacientes")).toBe("/dashboard/pacientes");
  });

  it("allows deep relative paths", () => {
    expect(sanitizeRedirect("/dashboard/facturacion?tab=pending")).toBe(
      "/dashboard/facturacion?tab=pending",
    );
  });

  it("blocks absolute URLs (open redirect)", () => {
    expect(sanitizeRedirect("https://evil.com/phishing")).toBe("/dashboard");
  });

  it("blocks protocol-relative URLs", () => {
    expect(sanitizeRedirect("//evil.com/phishing")).toBe("/dashboard");
  });

  it("blocks javascript: protocol", () => {
    expect(sanitizeRedirect("javascript:alert(1)")).toBe("/dashboard");
  });

  it("blocks data: protocol", () => {
    expect(sanitizeRedirect("data:text/html,<script>alert(1)</script>")).toBe("/dashboard");
  });

  it("blocks URLs with colon (non-relative)", () => {
    expect(sanitizeRedirect("/foo:bar")).toBe("/dashboard");
  });
});

describe("isPublicPage — route classification", () => {
  it("root (/) is public", () => {
    expect(isPublicPage("/")).toBe(true);
  });

  it("/planes is public", () => {
    expect(isPublicPage("/planes")).toBe(true);
    expect(isPublicPage("/planes?tier=basic")).toBe(true);
  });

  it("/club is public", () => {
    expect(isPublicPage("/club")).toBe(true);
  });

  it("/auth/login is public", () => {
    expect(isPublicPage("/auth/login")).toBe(true);
  });

  it("/paciente/* is public (separate auth)", () => {
    expect(isPublicPage("/paciente/dashboard")).toBe(true);
  });

  it("/rx/* is public (prescription verification)", () => {
    expect(isPublicPage("/rx/abc123")).toBe(true);
  });

  it("/medicos/* is public (SEO doctor profiles)", () => {
    expect(isPublicPage("/medicos/dr-juan-perez")).toBe(true);
  });

  it("/sieczkowski is public (investor page)", () => {
    expect(isPublicPage("/sieczkowski")).toBe(true);
  });

  it("/privacidad is public", () => {
    expect(isPublicPage("/privacidad")).toBe(true);
  });

  it("/dashboard is NOT public", () => {
    expect(isPublicPage("/dashboard")).toBe(false);
  });

  it("/dashboard/pacientes is NOT public", () => {
    expect(isPublicPage("/dashboard/pacientes")).toBe(false);
  });

  it("/admin is NOT public", () => {
    expect(isPublicPage("/admin")).toBe(false);
  });

  it("/settings is NOT public", () => {
    expect(isPublicPage("/settings")).toBe(false);
  });
});

describe("isPublicApi — API route classification", () => {
  it("/api/health is public", () => {
    expect(isPublicApi("/api/health")).toBe(true);
  });

  it("/api/chatbot is public", () => {
    expect(isPublicApi("/api/chatbot")).toBe(true);
  });

  it("/api/auth/* is public", () => {
    expect(isPublicApi("/api/auth/session")).toBe(true);
  });

  it("/api/patients/login is public", () => {
    expect(isPublicApi("/api/patients/login")).toBe(true);
  });

  it("/api/patients/register is public", () => {
    expect(isPublicApi("/api/patients/register")).toBe(true);
  });

  it("/api/cron/* is public (auth via CRON_SECRET)", () => {
    expect(isPublicApi("/api/cron/health-reminders")).toBe(true);
  });

  it("/api/club/* is public (patient JWT auth)", () => {
    expect(isPublicApi("/api/club/join")).toBe(true);
  });

  it("/api/doctors/public/* is public", () => {
    expect(isPublicApi("/api/doctors/public/search")).toBe(true);
  });

  it("/api/payments/webhook is public (HMAC auth)", () => {
    expect(isPublicApi("/api/payments/webhook")).toBe(true);
  });

  it("/api/internal/secret is NOT public", () => {
    expect(isPublicApi("/api/internal/secret")).toBe(false);
  });

  it("/api/something-random is NOT public", () => {
    expect(isPublicApi("/api/something-random")).toBe(false);
  });
});

describe("AUTH_ROUTES constant", () => {
  it("includes login page", () => {
    expect(AUTH_ROUTES).toContain("/auth/login");
  });

  it("includes registration page", () => {
    expect(AUTH_ROUTES).toContain("/auth/registro");
  });

  it("includes forgot-password page", () => {
    expect(AUTH_ROUTES).toContain("/auth/forgot-password");
  });

  it("does NOT include dashboard", () => {
    expect(AUTH_ROUTES).not.toContain("/dashboard");
  });
});

describe("CSP nonce generation (unit concept)", () => {
  it("crypto.getRandomValues produces unique values", () => {
    const a = new Uint8Array(16);
    const b = new Uint8Array(16);
    crypto.getRandomValues(a);
    crypto.getRandomValues(b);
    const aStr = btoa(Array.from(a, (x) => String.fromCharCode(x)).join(""));
    const bStr = btoa(Array.from(b, (x) => String.fromCharCode(x)).join(""));
    expect(aStr).not.toBe(bStr);
    expect(aStr.length).toBeGreaterThan(10);
  });
});
