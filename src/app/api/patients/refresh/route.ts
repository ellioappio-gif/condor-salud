// POST /api/patients/refresh

import { NextRequest, NextResponse } from "next/server";
import * as patientAuth from "@/lib/services/patient-auth";
import { logger } from "@/lib/logger";
import { patientRefreshSchema } from "@/lib/validations/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = patientRefreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: "refreshToken es obligatorio" }, { status: 400 });
    }

    const result = await patientAuth.refreshAccessToken(refreshToken);
    if (!result) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (err) {
    logger.error({ err }, "Token refresh error");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
