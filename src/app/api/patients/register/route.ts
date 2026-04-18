// POST /api/patients/register

import { NextRequest, NextResponse } from "next/server";
import * as patientAuth from "@/lib/services/patient-auth";
import { checkRateLimit } from "@/lib/security/api-guard";
import { logger } from "@/lib/logger";
import { patientRegisterSchema } from "@/lib/validations/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Rate limit: 3 attempts per IP per 60s
  const limited = checkRateLimit(request, "patients-register", { limit: 3, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = patientRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password, name, phone } = parsed.data;

    const result = await patientAuth.register({ email, password, name, phone });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    logger.error({ err }, "Patient register error");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
