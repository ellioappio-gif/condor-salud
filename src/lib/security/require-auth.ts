// ─── API Auth Guard ──────────────────────────────────────────
// Server-side authentication check for API routes.
// Reads the httpOnly session cookie (or Supabase / Google OAuth session)
// and returns 401 if the request is not authenticated.
//
// Usage in any API route:
//   const auth = await requireAuth(req);
//   if (auth.error) return auth.error;
//   // auth.user is now available
//
// S-01: Addresses the audit finding that 9/11 API routes had zero auth.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";

const SESSION_COOKIE = "condor_session";
const GOOGLE_SESSION_COOKIE = "condor_google_session";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  clinicId: string;
  clinicName: string;
}

type AuthResult = { error: NextResponse; user?: never } | { error?: never; user: AuthUser };

/**
 * Verify the caller is authenticated.
 * Priority: 1) Demo session cookie  2) Google OAuth session  3) Supabase JWT
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  // ── 1. Check encrypted httpOnly session cookie ──
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      const { decrypt } = await import("@/lib/security/crypto");
      const decrypted = decrypt(cookie);
      const session = JSON.parse(decrypted) as AuthUser;
      if (session.id && session.email && session.role) {
        return { user: session };
      }
    } catch {
      // Corrupt / tampered cookie — fall through
    }
  }

  // ── 2. Check Google OAuth session cookie ──
  const googleCookie = req.cookies.get(GOOGLE_SESSION_COOKIE)?.value;
  if (googleCookie) {
    try {
      // The Google session cookie is encrypted with AES-256-GCM.
      // Import dynamically to avoid circular deps.
      const { decrypt } = await import("@/lib/security/crypto");
      const decrypted = decrypt(googleCookie);
      const googleSession = JSON.parse(decrypted) as {
        id?: string;
        email?: string;
        name?: string;
        role?: string;
        clinicId?: string;
        clinicName?: string;
        access_token?: string;
        refresh_token?: string;
      };
      if (googleSession.id && googleSession.email) {
        return {
          user: {
            id: googleSession.id,
            email: googleSession.email,
            name: googleSession.name ?? "Google User",
            role: googleSession.role ?? "medico",
            clinicId: googleSession.clinicId ?? "pending",
            clinicName: googleSession.clinicName ?? "Sin asignar",
          },
        };
      }
    } catch {
      // Corrupt / expired encrypted cookie — fall through
      logger.debug("Google OAuth session cookie decryption failed");
    }
  }

  // ── 3. Check Supabase session (when configured) ──
  // The @supabase/ssr cookie is base64-encoded JSON (possibly chunked),
  // NOT a raw JWT. We must use the Supabase SDK to parse it correctly.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {
            // API routes are read-only for cookies
          },
          remove() {
            // API routes are read-only for cookies
          },
        },
      });

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user && !error) {
        const meta = (user.user_metadata ?? {}) as Record<string, string>;
        return {
          user: {
            id: user.id,
            email: user.email ?? meta.email ?? "unknown",
            name: meta.full_name ?? meta.name ?? "Supabase User",
            role: meta.role ?? "admin",
            clinicId: meta.clinic_id ?? "clinic-001",
            clinicName: meta.clinic_name ?? "Clínica",
          },
        };
      }

      if (error) {
        logger.warn({ err: error.message, route: req.nextUrl.pathname }, "Supabase getUser failed");
      }
    } catch (err) {
      logger.warn({ err, route: req.nextUrl.pathname }, "Supabase auth check failed");
    }
  }

  // ── 4. Demo mode fallback ──────────────────────────────────
  // When no real auth is found, return the demo user so that all
  // API routes work in demo / investor-preview mode.
  // Security: Only allow demo fallback in development or when DEMO_MODE is explicitly enabled.
  const isDemoMode = process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true";

  if (isDemoMode) {
    logger.debug({ route: req.nextUrl.pathname }, "No auth found — falling back to demo user");
    return {
      user: {
        id: "demo-doctor-001",
        email: "demo@condorsalud.com",
        name: "Dr. Rodriguez",
        role: "admin",
        clinicId: "demo-clinic-001",
        clinicName: "Clinica San Martin",
      },
    };
  }

  // Production: no auth found — return 401
  logger.warn({ route: req.nextUrl.pathname }, "No auth found — returning 401");
  return {
    error: NextResponse.json(
      { error: "No autorizado. Iniciá sesión para continuar." },
      { status: 401 },
    ),
  };
}
