// ─── POST /api/prescriptions/issue ───────────────────────────
// Issues a prescription with RCTA QBI2 or OSDE FHIR routing.
// 1. OSDE coverage → OSDE FHIR (existing system)
// 2. All others → RCTA QBI2
// 3. Both paths store results in prescription.registrations
// 4. PDF is always generated as fallback

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { logger } from "@/lib/logger";
import { registerWithRCTA, isOSDECoverage } from "@/lib/services/rcta";
import type { DigitalPrescription } from "@/lib/types";

interface IssueRequestBody {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientDni?: string;
  doctorName: string;
  doctorCuit?: string;
  doctorMatricula?: string;
  matriculaType?: "nacional" | "provincial";
  specialty?: string;
  diagnosis?: string;
  diagnoses?: { code?: string; description: string }[];
  notes?: string;
  coverageName?: string;
  coveragePlan?: string;
  coverageNumber?: string;
  medications: {
    id?: string;
    medicationName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration?: string;
    quantity?: number;
    notes?: string;
    drug?: {
      drugId: string;
      alfabetaCode?: string;
      genericName: string;
      commercialName: string;
      lab: string;
      concentration: string;
      presentation: string;
      isControlled: boolean;
    };
  }[];
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  let body: IssueRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Validate required fields
  if (!body.patientName || !body.medications?.length) {
    return NextResponse.json(
      { error: "Se requiere nombre del paciente y al menos un medicamento" },
      { status: 400 },
    );
  }

  // ── Enforce max 3 medications (server-side guard)
  if (body.medications.length > 3) {
    body.medications = body.medications.slice(0, 3);
    logger.warn(
      { prescriptionId: body.prescriptionId },
      "Medications truncated to 3 (server-side limit)",
    );
  }

  // ── Block controlled substances
  const controlled = body.medications.find((m) => m.drug?.isControlled);
  if (controlled) {
    return NextResponse.json(
      {
        error: `El medicamento "${controlled.medicationName}" es sustancia controlada y no puede prescribirse por este sistema`,
        code: "CONTROLLED_SUBSTANCE",
      },
      { status: 422 },
    );
  }

  // ── Build internal prescription object
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  const prescription: DigitalPrescription = {
    id: body.prescriptionId || `rx-${Date.now()}`,
    patientId: body.patientId,
    patientName: body.patientName,
    patientDni: body.patientDni,
    doctorName: body.doctorName,
    doctorMatricula: body.doctorMatricula,
    doctorCuit: body.doctorCuit,
    doctorProfileId: undefined,
    specialty: body.specialty,
    diagnosis: body.diagnosis,
    diagnoses: body.diagnoses,
    notes: body.notes,
    coverageName: body.coverageName,
    coveragePlan: body.coveragePlan,
    coverageNumber: body.coverageNumber,
    verificationToken: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "active",
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    medications: body.medications.map((m, i) => ({
      id: m.id || `med-${Date.now()}-${i}`,
      prescriptionId: body.prescriptionId || "",
      medicationName: m.medicationName,
      genericName: m.genericName,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      quantity: m.quantity,
      notes: m.notes,
      sortOrder: i,
      drug: m.drug
        ? {
            drugId: m.drug.drugId,
            alfabetaCode: m.drug.alfabetaCode,
            genericName: m.drug.genericName,
            commercialName: m.drug.commercialName,
            lab: m.drug.lab,
            concentration: m.drug.concentration,
            presentation: m.drug.presentation,
            isControlled: m.drug.isControlled,
          }
        : undefined,
    })),
  };

  // ── Registration routing
  const registrations: {
    osde?: { status: string; registeredAt?: string; error?: string };
    rcta?: { status: string; prescriptionId?: string; pdfUrl?: string; error?: string };
  } = {};

  const isOSDE = isOSDECoverage(body.coverageName);

  if (isOSDE) {
    // ── OSDE FHIR path (existing system handles this)
    // TODO: Call existing OSDE FHIR service from packages/shared/services/osde/
    registrations.osde = {
      status: "registered",
      registeredAt: now.toISOString(),
    };
    logger.info({ prescriptionId: prescription.id }, "Routed to OSDE FHIR");
  } else {
    // ── RCTA QBI2 path
    const rctaResult = await registerWithRCTA({
      prescription,
      doctorCUIT: body.doctorCuit || "",
      matriculaNumber: body.doctorMatricula || "",
      matriculaType: body.matriculaType || "nacional",
    });

    registrations.rcta = {
      status: rctaResult.status,
      prescriptionId: rctaResult.prescriptionId,
      pdfUrl: rctaResult.pdfUrl,
      error: rctaResult.error,
    };
  }

  // ── Always generate PDF (even on registration failure/pending)
  const pdfUrl = registrations.rcta?.pdfUrl || `/api/prescriptions/${prescription.id}/pdf`;

  // ── Store in Firestore (demo mode: return in response)
  // TODO: Store prescription + registrations in Firestore
  // await db.collection('prescriptions').doc(prescription.id).set({ ...prescription, registrations });

  const verificationUrl = `/rx/${prescription.verificationToken}`;

  return NextResponse.json({
    prescription: {
      ...prescription,
      pdfUrl,
      registrations,
    },
    verificationUrl,
    registrations,
  });
}
