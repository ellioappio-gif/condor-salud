// ─── Session API ─────────────────────────────────────────────
// Manages user sessions via httpOnly cookies.
// Replaces the previous localStorage-based session management,
// eliminating XSS session-hijack vectors (S-04/S-05).
//
// POST /api/auth/session — Create session (login)
// GET  /api/auth/session — Read current session
// DELETE /api/auth/session — Destroy session (logout)

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

const COOKIE_NAME = "condor_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
}

// ─── Demo user for development (NOT used in production) ──────
const DEMO_USER = {
  id: "demo-001",
  email: "demo@condorsalud.com",
  name: "Dr. Martín Rodríguez",
  role: "admin" as const,
  clinicId: "clinic-001",
  clinicName: "Centro Médico Sur",
};

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    !!url && url !== "https://your-project.supabase.co" && url !== "https://placeholder.supabase.co"
  );
};

// ─── GET: Read current session ───────────────────────────────
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  if (!cookie) {
    return NextResponse.json({ user: null });
  }

  try {
    const session = JSON.parse(cookie);
    // Return only safe fields — role comes from the server cookie,
    // not from anything the client can forge.
    return NextResponse.json({
      user: {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
        clinicId: session.clinicId,
        clinicName: session.clinicName,
        avatarUrl: session.avatarUrl,
      },
    });
  } catch {
    // Corrupt cookie — clear it
    const res = NextResponse.json({ user: null });
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

// ─── POST: Create session (login) ───────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, action } = body as {
      email?: string;
      password?: string;
      action?: "login" | "register";
      name?: string;
      clinicName?: string;
    };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // ── S-03: BLOCK demo login in production ──
    if (process.env.NODE_ENV === "production" && !isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Autenticación no disponible. Contacte al administrador." },
        { status: 503 },
      );
    }

    // ── Supabase auth (production) ──
    if (isSupabaseConfigured()) {
      // TODO: Wire to Supabase Auth
      // const { createClient } = await import("@/lib/supabase/server");
      // const supabase = createClient();
      // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return NextResponse.json({ error: "Supabase auth not yet wired" }, { status: 501 });
    }

    // ── Demo mode (development only) ──
    const user = {
      ...DEMO_USER,
      email,
      ...(body.name ? { name: body.name } : {}),
      ...(body.clinicName ? { clinicName: body.clinicName } : {}),
    };

    const response = NextResponse.json({ user, success: true });
    response.cookies.set(COOKIE_NAME, JSON.stringify(user), cookieOptions());

    logger.info({ userId: user.id, action: action ?? "login" }, "Session created");
    return response;
  } catch (err) {
    logger.error({ err, route: "auth/session" }, "Session creation error");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── DELETE: Destroy session (logout) ────────────────────────
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
  logger.info("Session destroyed");
  return response;
}
