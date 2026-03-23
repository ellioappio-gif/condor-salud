import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import * as rxService from "@/lib/services/prescription-qr";

// POST /api/prescriptions/create — Create a new digital prescription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.patientId || !body.patientName || !body.doctorName || !body.medications?.length) {
      return NextResponse.json(
        { error: "patientId, patientName, doctorName, and medications are required" },
        { status: 400 },
      );
    }

    const prescription = await rxService.createPrescription(body);
    const verificationUrl = rxService.buildVerificationUrl(prescription.verificationToken);

    return NextResponse.json({ prescription, verificationUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create prescription";
    logger.error({ err }, "POST /api/prescriptions/create failed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
