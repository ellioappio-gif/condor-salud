// Doctor verification: submit, check status, upload documents
import { NextRequest, NextResponse } from "next/server";
import { submitVerification, getVerificationStatus } from "@/lib/services/doctor-verification";
import { logger } from "@/lib/logger";
import { doctorVerificationSchema } from "@/lib/validations/schemas";

// GET /api/doctors/verification/status
export async function GET(req: NextRequest) {
  try {
    const profileId = req.headers.get("x-profile-id") || "demo";
    const verification = await getVerificationStatus(profileId);
    return NextResponse.json({ verification });
  } catch (err) {
    logger.error({ err }, "GET /api/doctors/verification/status failed");
    return NextResponse.json({ verification: null });
  }
}

// POST /api/doctors/verification/submit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = doctorVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const profileId = req.headers.get("x-profile-id") || body.profileId;

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const verification = await submitVerification({
      profileId,
      matriculaNacional: body.matriculaNacional,
      matriculaProvincial: body.matriculaProvincial,
      dni: body.dni,
    });

    return NextResponse.json({ verification });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit";
    logger.error({ err }, "POST /api/doctors/verification/submit failed");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
