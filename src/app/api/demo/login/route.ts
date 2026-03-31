import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { checkRateLimit } from "@/lib/security/api-guard";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const DEMO_PASS = process.env.DEMO_ADMIN_PASSWORD || "demo1234";

/**
 * POST /api/demo/login
 * Authenticate for the demo admin panel.
 */
export async function POST(req: NextRequest) {
  // Rate limit: 20 attempts per IP per 60s (permissive for demos)
  const limited = checkRateLimit(req, "demo-login", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const { password } = body as { password?: string };

    if (!password || password !== DEMO_PASS) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = jwt.sign({ role: "demo_admin" }, JWT_SECRET, { expiresIn: "12h" });
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
