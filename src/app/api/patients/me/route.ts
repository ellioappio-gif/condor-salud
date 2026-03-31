// GET  /api/patients/me  — get current patient profile
// PUT  /api/patients/me  — update current patient profile

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePatientAuth } from "@/lib/security/jwt-auth";
import * as patientAuth from "@/lib/services/patient-auth";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

// Allowlist for updatable patient fields — prevents mass assignment
const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(200).optional(),
  province: z.string().max(200).optional(),
  dateOfBirth: z.string().max(20).optional(),
  bloodType: z.string().max(10).optional(),
  emergencyContact: z.string().max(200).optional(),
  emergencyPhone: z.string().max(30).optional(),
  allergies: z.array(z.string().max(200)).max(50).optional(),
  medications: z.array(z.string().max(200)).max(50).optional(),
  conditions: z.array(z.string().max(200)).max(50).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requirePatientAuth(request);
  if (auth.error) return auth.error;

  try {
    const patient = await patientAuth.getById(auth.user.id);
    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }
    return NextResponse.json(patient);
  } catch (err) {
    logger.error({ err }, "Get patient profile error");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePatientAuth(request);
  if (auth.error) return auth.error;

  try {
    const raw = await request.json();
    const parsed = UpdateProfileSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const patient = await patientAuth.updateProfile(auth.user.id, parsed.data);
    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }
    return NextResponse.json(patient);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error interno";
    logger.error({ err }, "Update patient profile error");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
