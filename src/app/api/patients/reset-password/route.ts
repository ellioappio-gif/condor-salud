// POST /api/patients/reset-password/request
// POST /api/patients/reset-password/confirm

import { NextRequest, NextResponse } from "next/server";
import * as patientAuth from "@/lib/services/patient-auth";
import { logger } from "@/lib/logger";
import { passwordResetRequestSchema, passwordResetConfirmSchema } from "@/lib/validations/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Determine if this is a request or confirm based on body fields
    if (body.token && body.password) {
      const parsed = passwordResetConfirmSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const result = await patientAuth.resetPassword({
        token: parsed.data.token,
        password: parsed.data.password,
      });
      return NextResponse.json(result);
    }

    if (body.email) {
      const parsed = passwordResetRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Email inválido", details: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      const result = await patientAuth.requestPasswordReset(parsed.data.email);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Proporcione email (solicitar) o token+password (confirmar)" },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    logger.error({ err }, "Password reset error");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
