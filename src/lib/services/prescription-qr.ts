// ─── Digital Prescription QR Service ─────────────────────────
// Create, verify, and manage digital prescriptions with QR codes.
// Full lifecycle: draft → active (issued) → sent → dispensed → expired/cancelled
// Integrates with OSDE FHIR registration when coverage matches.

import { type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  DigitalPrescription,
  PrescriptionMedication,
  PrescriptionDiagnosis,
  DrugSnapshot,
  OSDEPrescriptionData,
} from "@/lib/types";
import { isOSDECoverage, registerWithOSDE, isOSDEConfigured } from "@/lib/services/osde";

// ─── Helpers ─────────────────────────────────────────────────

async function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const { createClient } = await import("@/lib/supabase/server");
  return createClient() as unknown as SupabaseClient;
}

/** Generate a short, URL-safe verification token */
function generateToken(): string {
  return randomBytes(12).toString("base64url"); // 16-char token
}

/** Get the base URL for QR codes */
function getBaseUrl(): string {
  return process.env.QR_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://condorsalud.com";
}

// ─── Create Prescription ─────────────────────────────────────

export interface CreatePrescriptionInput {
  clinicId?: string;
  doctorProfileId?: string;
  patientId: string;
  patientName: string;
  patientDni?: string;
  doctorName: string;
  doctorMatricula?: string;
  doctorCuit?: string;
  specialty?: string;
  diagnosis?: string;
  diagnoses?: PrescriptionDiagnosis[];
  notes?: string;
  coverageName?: string;
  coveragePlan?: string;
  coverageNumber?: string;
  /** If true, create as draft (not issued). Default false → active. */
  asDraft?: boolean;
  medications: {
    medicationName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration?: string;
    quantity?: number;
    notes?: string;
    drug?: DrugSnapshot;
  }[];
}

export async function createPrescription(
  input: CreatePrescriptionInput,
): Promise<DigitalPrescription> {
  const supabase = await getSupabase();
  const token = generateToken();

  // Insert prescription
  const { data: rx, error } = await supabase
    .from("digital_prescriptions")
    .insert({
      clinic_id: input.clinicId || null,
      doctor_profile_id: input.doctorProfileId || null,
      patient_id: input.patientId,
      patient_name: input.patientName,
      patient_dni: input.patientDni || null,
      doctor_name: input.doctorName,
      doctor_matricula: input.doctorMatricula || null,
      doctor_cuit: input.doctorCuit || null,
      specialty: input.specialty || null,
      diagnosis: input.diagnosis || null,
      diagnoses: input.diagnoses ? JSON.stringify(input.diagnoses) : null,
      notes: input.notes || null,
      verification_token: token,
      status: input.asDraft ? "draft" : "active",
      coverage_name: input.coverageName || null,
      coverage_plan: input.coveragePlan || null,
      coverage_number: input.coverageNumber || null,
    })
    .select("*")
    .single();

  if (error || !rx) {
    logger.error({ error }, "Failed to create prescription");
    throw new Error("Failed to create prescription");
  }

  // Insert medications
  const meds: PrescriptionMedication[] = [];
  for (let i = 0; i < input.medications.length; i++) {
    const med = input.medications[i]!;
    const { data: medRow, error: medErr } = await supabase
      .from("prescription_medications")
      .insert({
        prescription_id: rx.id,
        medication_name: med.medicationName,
        generic_name: med.genericName || null,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration || null,
        quantity: med.quantity || null,
        notes: med.notes || null,
        drug_snapshot: med.drug ? JSON.stringify(med.drug) : null,
        sort_order: i,
      })
      .select("*")
      .single();

    if (medRow && !medErr) {
      meds.push(mapMedication(medRow));
    }
  }

  logger.info({ prescriptionId: rx.id, token }, "Digital prescription created");

  return {
    ...mapPrescription(rx),
    medications: meds,
  };
}

// ─── Verify (Public) ─────────────────────────────────────────

/** Verify a prescription by its public token. Used on /rx/[token] */
export async function verifyPrescription(token: string): Promise<DigitalPrescription | null> {
  const supabase = await getSupabase();

  const { data: rx, error } = await supabase
    .from("digital_prescriptions")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (error || !rx) return null;

  // Fetch medications
  const { data: medsData } = await supabase
    .from("prescription_medications")
    .select("*")
    .eq("prescription_id", rx.id)
    .order("sort_order");

  return {
    ...mapPrescription(rx),
    medications: (medsData || []).map(mapMedication),
  };
}

// ─── Get by ID (Authenticated) ──────────────────────────────

export async function getPrescriptionById(id: string): Promise<DigitalPrescription | null> {
  const supabase = await getSupabase();

  const { data: rx, error } = await supabase
    .from("digital_prescriptions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !rx) return null;

  const { data: medsData } = await supabase
    .from("prescription_medications")
    .select("*")
    .eq("prescription_id", id)
    .order("sort_order");

  return {
    ...mapPrescription(rx),
    medications: (medsData || []).map(mapMedication),
  };
}

// ─── List for Clinic ─────────────────────────────────────────

export async function listPrescriptions(
  clinicId: string,
  options?: { status?: string; limit?: number },
): Promise<DigitalPrescription[]> {
  const supabase = await getSupabase();

  let query = supabase
    .from("digital_prescriptions")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("issued_at", { ascending: false })
    .limit(options?.limit || 50);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((r: Record<string, unknown>) => ({
    ...mapPrescription(r),
    medications: [],
  }));
}

// ─── Mark Dispensed ──────────────────────────────────────────

export async function markDispensed(token: string, dispensedBy: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("digital_prescriptions")
    .update({
      status: "dispensed",
      dispensed_at: new Date().toISOString(),
      dispensed_by: dispensedBy,
      updated_at: new Date().toISOString(),
    })
    .eq("verification_token", token)
    .eq("status", "active");

  if (error) {
    logger.error({ error }, "Failed to mark prescription dispensed");
    throw new Error("Failed to mark dispensed");
  }
}

// ─── Issue Prescription (draft → active) ─────────────────────

/**
 * Issue a draft prescription: set status to active, trigger OSDE
 * registration if coverage is OSDE, and generate PDF.
 */
export async function issuePrescription(prescriptionId: string): Promise<DigitalPrescription> {
  const rx = await getPrescriptionById(prescriptionId);
  if (!rx) throw new Error("Prescription not found");
  if (rx.status !== "draft") throw new Error(`Cannot issue: status is ${rx.status}`);

  const supabase = await getSupabase();

  // Check if OSDE registration is needed
  let osdeData: OSDEPrescriptionData | undefined;
  if (isOSDECoverage(rx.coverageName)) {
    if (isOSDEConfigured()) {
      osdeData = await registerWithOSDE(rx, rx.medications);
    } else {
      osdeData = {
        status: "no_credentials",
      };
    }
  }

  const { error } = await supabase
    .from("digital_prescriptions")
    .update({
      status: "active",
      issued_at: new Date().toISOString(),
      osde_data: osdeData ? JSON.stringify(osdeData) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prescriptionId);

  if (error) {
    logger.error({ error }, "Failed to issue prescription");
    throw new Error("Failed to issue prescription");
  }

  return { ...rx, status: "active", osde: osdeData };
}

// ─── Send Prescription (active → sent) ──────────────────────

export async function sendPrescription(
  prescriptionId: string,
  via: ("whatsapp" | "email")[],
): Promise<DigitalPrescription> {
  const rx = await getPrescriptionById(prescriptionId);
  if (!rx) throw new Error("Prescription not found");
  if (rx.status !== "active" && rx.status !== "sent") {
    throw new Error(`Cannot send: status is ${rx.status}`);
  }

  const supabase = await getSupabase();

  // In production, this would call WhatsApp/email services
  // For now, we just mark as sent
  const sentVia = Array.from(new Set([...(rx.sentVia || []), ...via]));

  const { error } = await supabase
    .from("digital_prescriptions")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_via: JSON.stringify(sentVia),
      updated_at: new Date().toISOString(),
    })
    .eq("id", prescriptionId);

  if (error) {
    logger.error({ error }, "Failed to send prescription");
    throw new Error("Failed to send prescription");
  }

  logger.info({ prescriptionId, via }, "Prescription sent");
  return { ...rx, status: "sent", sentAt: new Date().toISOString(), sentVia };
}

// ─── Cancel Prescription ─────────────────────────────────────

export async function cancelPrescription(prescriptionId: string, reason?: string): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("digital_prescriptions")
    .update({
      status: "cancelled",
      notes: reason ? `[ANULADA] ${reason}` : "[ANULADA]",
      updated_at: new Date().toISOString(),
    })
    .eq("id", prescriptionId)
    .in("status", ["draft", "active", "sent"]);

  if (error) {
    logger.error({ error }, "Failed to cancel prescription");
    throw new Error("Failed to cancel prescription");
  }
}

// ─── Repeat Prescription ─────────────────────────────────────

export async function repeatPrescription(prescriptionId: string): Promise<DigitalPrescription> {
  const original = await getPrescriptionById(prescriptionId);
  if (!original) throw new Error("Original prescription not found");

  // Create a new prescription based on the original
  return createPrescription({
    clinicId: original.clinicId,
    doctorProfileId: original.doctorProfileId,
    patientId: original.patientId,
    patientName: original.patientName,
    patientDni: original.patientDni,
    doctorName: original.doctorName,
    doctorMatricula: original.doctorMatricula,
    doctorCuit: original.doctorCuit,
    specialty: original.specialty,
    diagnosis: original.diagnosis,
    diagnoses: original.diagnoses,
    notes: `Repetición de receta ${original.verificationToken}`,
    coverageName: original.coverageName,
    coveragePlan: original.coveragePlan,
    coverageNumber: original.coverageNumber,
    asDraft: true,
    medications: original.medications.map((med) => ({
      medicationName: med.medicationName,
      genericName: med.genericName,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      quantity: med.quantity,
      notes: med.notes,
      drug: med.drug,
    })),
  });
}

// ─── QR URL Builder ──────────────────────────────────────────

/** Build the public verification URL for a prescription */
export function buildVerificationUrl(token: string): string {
  return `${getBaseUrl()}/rx/${token}`;
}

// ─── Mappers ─────────────────────────────────────────────────

function mapPrescription(row: Record<string, unknown>): Omit<DigitalPrescription, "medications"> {
  const r = row as Record<string, string | number | boolean | null>;
  return {
    id: r.id as string,
    clinicId: (r.clinic_id as string) || undefined,
    doctorProfileId: (r.doctor_profile_id as string) || undefined,
    patientId: r.patient_id as string,
    patientName: r.patient_name as string,
    patientDni: (r.patient_dni as string) || undefined,
    doctorName: r.doctor_name as string,
    doctorMatricula: (r.doctor_matricula as string) || undefined,
    doctorCuit: (r.doctor_cuit as string) || undefined,
    specialty: (r.specialty as string) || undefined,
    diagnosis: (r.diagnosis as string) || undefined,
    diagnoses: r.diagnoses
      ? ((typeof r.diagnoses === "string"
          ? JSON.parse(r.diagnoses)
          : r.diagnoses) as PrescriptionDiagnosis[])
      : undefined,
    notes: (r.notes as string) || undefined,
    verificationToken: r.verification_token as string,
    status: r.status as DigitalPrescription["status"],
    issuedAt: r.issued_at as string,
    expiresAt: r.expires_at as string,
    sentAt: (r.sent_at as string) || undefined,
    sentVia: r.sent_via
      ? ((typeof r.sent_via === "string" ? JSON.parse(r.sent_via) : r.sent_via) as (
          | "whatsapp"
          | "email"
        )[])
      : undefined,
    dispensedAt: (r.dispensed_at as string) || undefined,
    dispensedBy: (r.dispensed_by as string) || undefined,
    pdfPath: (r.pdf_path as string) || undefined,
    pdfUrl: (r.pdf_url as string) || undefined,
    coverageName: (r.coverage_name as string) || undefined,
    coveragePlan: (r.coverage_plan as string) || undefined,
    coverageNumber: (r.coverage_number as string) || undefined,
    osde: r.osde_data
      ? ((typeof r.osde_data === "string"
          ? JSON.parse(r.osde_data)
          : r.osde_data) as OSDEPrescriptionData)
      : undefined,
    repeatOf: (r.repeat_of as string) || undefined,
    createdAt: r.created_at as string,
  };
}

function mapMedication(row: Record<string, unknown>): PrescriptionMedication {
  const r = row as Record<string, string | number | null>;
  return {
    id: r.id as string,
    prescriptionId: r.prescription_id as string,
    medicationName: r.medication_name as string,
    genericName: (r.generic_name as string) || undefined,
    dosage: r.dosage as string,
    frequency: r.frequency as string,
    duration: (r.duration as string) || undefined,
    quantity: r.quantity != null ? Number(r.quantity) : undefined,
    notes: (r.notes as string) || undefined,
    sortOrder: (r.sort_order as number) || 0,
    drug: r.drug_snapshot
      ? ((typeof r.drug_snapshot === "string"
          ? JSON.parse(r.drug_snapshot as string)
          : r.drug_snapshot) as DrugSnapshot)
      : undefined,
  };
}
