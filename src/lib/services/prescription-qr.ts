// ─── Digital Prescription QR Service ─────────────────────────
// Create, verify, and manage digital prescriptions with QR codes.
// Each prescription gets a unique verification token for public
// verification at /rx/[token].

import { type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";
import type { DigitalPrescription, PrescriptionMedication } from "@/lib/types";

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
  doctorName: string;
  doctorMatricula?: string;
  specialty?: string;
  diagnosis?: string;
  notes?: string;
  medications: {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration?: string;
    quantity?: number;
    notes?: string;
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
      doctor_name: input.doctorName,
      doctor_matricula: input.doctorMatricula || null,
      specialty: input.specialty || null,
      diagnosis: input.diagnosis || null,
      notes: input.notes || null,
      verification_token: token,
      status: "active",
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
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration || null,
        quantity: med.quantity || null,
        notes: med.notes || null,
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
    doctorName: r.doctor_name as string,
    doctorMatricula: (r.doctor_matricula as string) || undefined,
    specialty: (r.specialty as string) || undefined,
    diagnosis: (r.diagnosis as string) || undefined,
    notes: (r.notes as string) || undefined,
    verificationToken: r.verification_token as string,
    status: r.status as DigitalPrescription["status"],
    issuedAt: r.issued_at as string,
    expiresAt: r.expires_at as string,
    dispensedAt: (r.dispensed_at as string) || undefined,
    dispensedBy: (r.dispensed_by as string) || undefined,
    pdfPath: (r.pdf_path as string) || undefined,
    createdAt: r.created_at as string,
  };
}

function mapMedication(row: Record<string, unknown>): PrescriptionMedication {
  const r = row as Record<string, string | number | null>;
  return {
    id: r.id as string,
    prescriptionId: r.prescription_id as string,
    medicationName: r.medication_name as string,
    dosage: r.dosage as string,
    frequency: r.frequency as string,
    duration: (r.duration as string) || undefined,
    quantity: r.quantity != null ? Number(r.quantity) : undefined,
    notes: (r.notes as string) || undefined,
    sortOrder: (r.sort_order as number) || 0,
  };
}
