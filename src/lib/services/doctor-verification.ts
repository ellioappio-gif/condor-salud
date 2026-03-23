// ─── Doctor Verification Service ─────────────────────────────
// Matrícula + DNI upload, admin review workflow.
// Statuses: pending → approved | rejected | needs_review

import { type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  DoctorVerification,
  DoctorVerificationStatus,
  VerificationDocument,
  VerificationDocumentType,
} from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────

async function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const { createClient } = await import("@/lib/supabase/server");
  return createClient() as unknown as SupabaseClient;
}

// ─── Submit Verification ─────────────────────────────────────

export async function submitVerification(input: {
  profileId: string;
  matriculaNacional?: string;
  matriculaProvincial?: string;
  dni?: string;
}): Promise<DoctorVerification> {
  const supabase = await getSupabase();

  // Check if already has a pending/approved verification
  const { data: existing } = await supabase
    .from("doctor_verifications")
    .select("id, status")
    .eq("profile_id", input.profileId)
    .in("status", ["pending", "approved"])
    .limit(1)
    .maybeSingle();

  if (existing?.status === "approved") {
    throw new Error("Already verified");
  }

  if (existing?.status === "pending") {
    throw new Error("Verification already pending");
  }

  const { data, error } = await supabase
    .from("doctor_verifications")
    .insert({
      profile_id: input.profileId,
      matricula_nacional: input.matriculaNacional || null,
      matricula_provincial: input.matriculaProvincial || null,
      dni: input.dni || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error({ error }, "Failed to submit verification");
    throw new Error("Failed to submit verification");
  }

  logger.info({ profileId: input.profileId }, "Doctor verification submitted");
  return mapVerification(data, []);
}

// ─── Upload Document ─────────────────────────────────────────

export async function uploadVerificationDoc(input: {
  verificationId: string;
  documentType: VerificationDocumentType;
  storagePath: string;
  fileName: string;
  mimeType: string;
}): Promise<VerificationDocument> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("verification_documents")
    .insert({
      verification_id: input.verificationId,
      document_type: input.documentType,
      storage_path: input.storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error({ error }, "Failed to upload verification document");
    throw new Error("Failed to upload document");
  }

  return mapDocument(data);
}

// ─── Get Verification Status ─────────────────────────────────

export async function getVerificationStatus(profileId: string): Promise<DoctorVerification | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("doctor_verifications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  // Fetch documents
  const { data: docs } = await supabase
    .from("verification_documents")
    .select("*")
    .eq("verification_id", data.id);

  return mapVerification(data, (docs || []).map(mapDocument));
}

// ─── Admin: List Pending Verifications ───────────────────────

export async function listPendingVerifications(): Promise<DoctorVerification[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("doctor_verifications")
    .select("*")
    .in("status", ["pending", "needs_review"])
    .order("submitted_at", { ascending: true });

  if (error || !data) return [];

  // Batch fetch documents
  const ids = data.map((d: Record<string, unknown>) => d.id);
  const { data: allDocs } = await supabase
    .from("verification_documents")
    .select("*")
    .in("verification_id", ids);

  const docMap = new Map<string, VerificationDocument[]>();
  for (const doc of (allDocs || []) as Record<string, unknown>[]) {
    const vid = doc.verification_id as string;
    if (!docMap.has(vid)) docMap.set(vid, []);
    docMap.get(vid)!.push(mapDocument(doc));
  }

  return data.map((row: Record<string, unknown>) =>
    mapVerification(row, docMap.get(row.id as string) || []),
  );
}

// ─── Admin: Review Verification ──────────────────────────────

export async function reviewVerification(input: {
  verificationId: string;
  reviewerId: string;
  status: "approved" | "rejected" | "needs_review";
  rejectionReason?: string;
}): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("doctor_verifications")
    .update({
      status: input.status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: input.reviewerId,
      rejection_reason: input.rejectionReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.verificationId);

  if (error) {
    logger.error({ error }, "Failed to review verification");
    throw new Error("Failed to review verification");
  }

  logger.info(
    { verificationId: input.verificationId, status: input.status },
    "Doctor verification reviewed",
  );
}

// ─── Check if doctor is verified ─────────────────────────────

export async function isDoctorVerified(profileId: string): Promise<boolean> {
  const verification = await getVerificationStatus(profileId);
  return verification?.status === "approved";
}

// ─── Mappers ─────────────────────────────────────────────────

function mapVerification(
  row: Record<string, unknown>,
  documents: VerificationDocument[],
): DoctorVerification {
  const r = row as Record<string, string | null>;
  return {
    id: r.id as string,
    profileId: r.profile_id as string,
    matriculaNacional: r.matricula_nacional || undefined,
    matriculaProvincial: r.matricula_provincial || undefined,
    dni: r.dni || undefined,
    status: r.status as DoctorVerificationStatus,
    submittedAt: r.submitted_at as string,
    reviewedAt: r.reviewed_at || undefined,
    reviewedBy: r.reviewed_by || undefined,
    rejectionReason: r.rejection_reason || undefined,
    documents,
  };
}

function mapDocument(row: Record<string, unknown>): VerificationDocument {
  const r = row as Record<string, string>;
  return {
    id: r.id!,
    verificationId: r.verification_id!,
    documentType: r.document_type as VerificationDocumentType,
    storagePath: r.storage_path!,
    fileName: r.file_name!,
    mimeType: r.mime_type!,
    uploadedAt: r.uploaded_at!,
  };
}
