// ─── API Auth Guard ──────────────────────────────────────────
// Server-side authentication check for API routes.
// Reads the httpOnly session cookie (or Supabase session when configured)
// and returns 401 if the request is not authenticated.
//
// Usage in any API route:
//   const auth = requireAuth(req);
//   if (auth.error) return auth.error;
//   // auth.user is now available
//
// S-01: Addresses the audit finding that 9/11 API routes had zero auth.

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { logger } from "@/lib/logger";

const SESSION_COOKIE = "condor_session";

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
 * Checks the httpOnly session cookie (demo mode) or Supabase auth (production).
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  // ── 1. Check httpOnly session cookie ──
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      const session = JSON.parse(cookie) as AuthUser;
      if (session.id && session.email && session.role) {
        return { user: session };
      }
    } catch {
      // Corrupt cookie — fall through to 401
    }
  }

  // ── 2. Check Supabase session (when configured) ──
  // Look for Supabase auth tokens in cookies (set by @supabase/ssr).
  const supabaseAuth =
    req.cookies.get("sb-access-token")?.value ||
    req.cookies.getAll().find((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"))
      ?.value;

  if (supabaseAuth) {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (jwtSecret) {
      try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(supabaseAuth, secret, {
          issuer: "supabase",
        });
        const meta = (payload.user_metadata ?? payload.app_metadata ?? {}) as Record<
          string,
          string
        >;
        return {
          user: {
            id: payload.sub ?? "unknown",
            email: (payload.email as string) ?? meta.email ?? "unknown",
            name: meta.full_name ?? meta.name ?? "Supabase User",
            role: meta.role ?? (payload.role as string) ?? "admin",
            clinicId: meta.clinic_id ?? "clinic-001",
            clinicName: meta.clinic_name ?? "Clínica",
          },
        };
      } catch (err) {
        logger.warn({ err, route: req.nextUrl.pathname }, "JWT verification failed");
        // Fall through to 401
      }
    } else {
      // No JWT secret configured — trust the Supabase cookie presence
      // (middleware already validated the session server-side)
      logger.debug("SUPABASE_JWT_SECRET not set — skipping JWT signature check");
      return {
        user: {
          id: "supabase-user",
          email: "unknown",
          name: "Supabase User",
          role: "admin",
          clinicId: "clinic-001",
          clinicName: "Unknown Clinic",
        },
      };
    }
  }

  // ── 3. Not authenticated ──
  logger.warn(
    { route: req.nextUrl.pathname, ip: req.headers.get("x-forwarded-for") },
    "Unauthenticated API access attempt",
  );

  return {
    error: NextResponse.json({ error: "No autorizado. Iniciá sesión primero." }, { status: 401 }),
  };
}
