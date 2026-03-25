// ─── Cóndor Club Salud Service ───────────────────────────────
// Patient membership management with teleconsultas and medical benefits.
// Plans: Básico ($9,000), Plus ($24,500), Familiar ($90,000).

import { type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";
import type { ClubPlan, ClubMembership, PrescriptionFee } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────

async function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const { createClient } = await import("@/lib/supabase/server");
  return createClient() as unknown as SupabaseClient;
}

// ─── Club Plans ──────────────────────────────────────────────

/** Get all active club plans, sorted */
export async function getClubPlans(): Promise<ClubPlan[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("club_plans")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  if (error) {
    logger.error({ error }, "Failed to fetch club plans");
    throw new Error("Failed to fetch club plans");
  }

  return (data || []).map(mapPlan);
}

/** Get a single plan by slug */
export async function getClubPlanBySlug(slug: string): Promise<ClubPlan | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("club_plans").select("*").eq("slug", slug).single();

  if (error || !data) return null;
  return mapPlan(data);
}

// ─── Memberships ─────────────────────────────────────────────

/** Check if a patient has an active club membership */
export async function getActiveMembership(patientId: string): Promise<ClubMembership | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("club_memberships")
    .select("*, club_plans(*)")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapMembership(data);
}

/** Check if patient is a club member (quick boolean) */
export async function isClubMember(patientId: string): Promise<boolean> {
  const membership = await getActiveMembership(patientId);
  return membership !== null;
}

/** Create a new club membership */
export async function createMembership(input: {
  patientId: string;
  planSlug: string;
  mpSubscriptionId?: string;
}): Promise<ClubMembership> {
  const plan = await getClubPlanBySlug(input.planSlug);
  if (!plan) throw new Error(`Unknown plan: ${input.planSlug}`);

  // Cancel any existing active membership first
  const existing = await getActiveMembership(input.patientId);
  if (existing) {
    await cancelMembership(input.patientId, "upgraded");
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("club_memberships")
    .insert({
      patient_id: input.patientId,
      plan_id: plan.id,
      status: "active",
      mp_subscription_id: input.mpSubscriptionId || null,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select("*, club_plans(*)")
    .single();

  if (error || !data) {
    logger.error({ error }, "Failed to create club membership");
    throw new Error("Failed to create membership");
  }

  logger.info({ patientId: input.patientId, plan: input.planSlug }, "Club membership created");
  return mapMembership(data);
}

/** Cancel a patient's active membership */
export async function cancelMembership(patientId: string, reason?: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("club_memberships")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("patient_id", patientId)
    .eq("status", "active");

  if (error) {
    logger.error({ error }, "Failed to cancel membership");
    throw new Error("Failed to cancel membership");
  }

  logger.info({ patientId, reason }, "Club membership cancelled");
}

/** Process MercadoPago subscription webhook for renewals */
export async function processSubscriptionWebhook(payload: {
  subscriptionId: string;
  status: "authorized" | "paused" | "cancelled";
}): Promise<void> {
  const supabase = await getSupabase();

  if (payload.status === "cancelled") {
    await supabase
      .from("club_memberships")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("mp_subscription_id", payload.subscriptionId)
      .eq("status", "active");
    return;
  }

  if (payload.status === "authorized") {
    // Renew — extend expiration by 30 days
    await supabase
      .from("club_memberships")
      .update({
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("mp_subscription_id", payload.subscriptionId)
      .eq("status", "active");
    return;
  }

  if (payload.status === "paused") {
    await supabase
      .from("club_memberships")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("mp_subscription_id", payload.subscriptionId)
      .eq("status", "active");
  }
}

// ─── Prescription Fee Splitting ──────────────────────────────

/** Calculate fee for a prescription medication with club discount */
export async function calculatePrescriptionFee(
  patientId: string,
  medicationName: string,
  originalPrice: number,
): Promise<PrescriptionFee> {
  const membership = await getActiveMembership(patientId);
  const discountPct = membership?.plan?.prescriptionDiscount ?? 0;
  const finalPrice = Math.round(originalPrice * (1 - discountPct) * 100) / 100;

  return {
    id: "",
    patientId,
    medicationName,
    originalPrice,
    discountPct,
    finalPrice,
    clubPlanSlug: membership?.plan?.slug,
    paymentStatus: "pending",
    createdAt: new Date().toISOString(),
  };
}

/** Record a prescription fee charge */
export async function recordPrescriptionFee(
  fee: Omit<PrescriptionFee, "id" | "createdAt">,
): Promise<PrescriptionFee> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("prescription_fees")
    .insert({
      patient_id: fee.patientId,
      prescription_id: fee.prescriptionId || null,
      medication_name: fee.medicationName,
      original_price: fee.originalPrice,
      discount_pct: fee.discountPct,
      final_price: fee.finalPrice,
      club_plan_slug: fee.clubPlanSlug || null,
      payment_status: fee.paymentStatus,
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error({ error }, "Failed to record prescription fee");
    throw new Error("Failed to record fee");
  }

  return {
    id: data.id,
    patientId: data.patient_id,
    prescriptionId: data.prescription_id,
    medicationName: data.medication_name,
    originalPrice: Number(data.original_price),
    discountPct: Number(data.discount_pct),
    finalPrice: Number(data.final_price),
    clubPlanSlug: data.club_plan_slug,
    paymentStatus: data.payment_status,
    createdAt: data.created_at,
  };
}

// ─── Mappers ─────────────────────────────────────────────────

function mapPlan(row: Record<string, unknown>): ClubPlan {
  const r = row as Record<string, string | number | boolean | null>;
  return {
    id: r.id as string,
    slug: r.slug as ClubPlan["slug"],
    nameEs: r.name_es as string,
    nameEn: r.name_en as string,
    priceArs: Number(r.price_ars),
    priceUsd: Number(r.price_usd),
    prescriptionDiscount: 0, // legacy — removed
    maxTeleconsultas: r.max_teleconsultas as number,
    includesDelivery: r.includes_delivery as boolean,
    includesCoraPriority: r.includes_cora_priority as boolean,
    includesRecordsRequest: true, // all plans include records request
    active: r.active as boolean,
    sortOrder: r.sort_order as number,
  };
}

function mapMembership(row: Record<string, unknown>): ClubMembership {
  const r = row as Record<string, string | number | boolean | null | Record<string, unknown>>;
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    planId: r.plan_id as string,
    plan: r.club_plans ? mapPlan(r.club_plans as Record<string, unknown>) : undefined,
    status: r.status as ClubMembership["status"],
    mpSubscriptionId: (r.mp_subscription_id as string) || undefined,
    startedAt: r.started_at as string,
    expiresAt: (r.expires_at as string) || undefined,
    cancelledAt: (r.cancelled_at as string) || undefined,
  };
}
