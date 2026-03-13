import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitize, logger } from "@/lib/security/api-guard";

// TODO: Replace with Supabase insert when DB is connected
const waitlist: string[] = [];

export async function POST(request: NextRequest) {
  // ── Rate limit: 5 req / 60s per IP ──
  const limited = checkRateLimit(request, "waitlist", { limit: 5, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const email = sanitize(body.email || "", 254);

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
    }

    // Strict email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    waitlist.push(email);

    logger.info({ email: "[redacted]", count: waitlist.length }, "Waitlist signup");

    return NextResponse.json(
      { message: "¡Listo! Te contactamos pronto.", count: waitlist.length },
      { status: 201 },
    );
  } catch (err) {
    logger.error({ err, route: "waitlist" }, "Waitlist error");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
