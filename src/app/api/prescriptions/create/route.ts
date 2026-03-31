import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit } from "@/lib/security/api-guard";
import * as rxService from "@/lib/services/prescription-qr";

const CreatePrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  patientName: z.string().min(1).max(200),
  doctorName: z.string().min(1).max(200),
  medications: z
    .array(
      z.object({
        medicationName: z.string().min(1).max(200),
        genericName: z.string().max(200).optional(),
        dosage: z.string().min(1).max(100),
        frequency: z.string().min(1).max(100),
        duration: z.string().max(100).optional(),
        quantity: z.number().int().positive().max(999).optional(),
        notes: z.string().max(500).optional(),
      }),
    )
    .min(1)
    .max(10),
  diagnosis: z.string().min(1).max(500).optional(),
  notes: z.string().max(1000).optional(),
});

// POST /api/prescriptions/create — Create a new digital prescription
export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  // 2. Rate limit: 10 prescriptions per doctor per 60s
  const limited = checkRateLimit(request, `rx-create:${auth.user.id}`, {
    limit: 10,
    windowSec: 60,
  });
  if (limited) return limited;

  try {
    const body = await request.json();

    // 3. Zod validation
    const parsed = CreatePrescriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const prescription = await rxService.createPrescription(parsed.data);
    const verificationUrl = rxService.buildVerificationUrl(prescription.verificationToken);

    return NextResponse.json({ prescription, verificationUrl }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create prescription";
    logger.error({ err }, "POST /api/prescriptions/create failed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
