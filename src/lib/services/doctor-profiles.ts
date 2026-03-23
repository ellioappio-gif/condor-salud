// ─── Doctor Public Profiles Service ──────────────────────────
// SEO-optimized public doctor pages. Handles CRUD for profiles,
// reviews, and search/filter for the public directory.

import { type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";
import type { DoctorPublicProfile, DoctorPublicReview } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────

async function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const { createClient } = await import("@/lib/supabase/server");
  return createClient() as unknown as SupabaseClient;
}

/** Generate URL slug from doctor name */
export function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ─── Public: Get by Slug ─────────────────────────────────────

export async function getProfileBySlug(slug: string): Promise<DoctorPublicProfile | null> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("doctor_public_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !data) return null;
  return mapProfile(data);
}

// ─── Public: List/Search ─────────────────────────────────────

export interface DoctorSearchFilters {
  specialty?: string;
  city?: string;
  language?: string;
  insurance?: string;
  teleconsulta?: boolean;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

export async function searchPublicDoctors(
  filters?: DoctorSearchFilters,
): Promise<{ doctors: DoctorPublicProfile[]; total: number }> {
  const supabase = await getSupabase();

  let query = supabase
    .from("doctor_public_profiles")
    .select("*", { count: "exact" })
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("avg_rating", { ascending: false });

  if (filters?.specialty) {
    query = query.eq("specialty", filters.specialty);
  }
  if (filters?.city) {
    query = query.eq("city", filters.city);
  }
  if (filters?.language) {
    query = query.contains("languages", [filters.language]);
  }
  if (filters?.insurance) {
    query = query.contains("insurance_accepted", [filters.insurance]);
  }
  if (filters?.teleconsulta) {
    query = query.eq("teleconsulta_available", true);
  }
  if (filters?.featured) {
    query = query.eq("featured", true);
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error({ error }, "Failed to search public doctors");
    return { doctors: [], total: 0 };
  }

  return {
    doctors: (data || []).map(mapProfile),
    total: count || 0,
  };
}

// ─── Public: Get Reviews ─────────────────────────────────────

export async function getApprovedReviews(
  doctorProfileId: string,
  limit = 10,
): Promise<DoctorPublicReview[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("doctor_reviews_public")
    .select("*")
    .eq("doctor_profile_id", doctorProfileId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapReview);
}

// ─── Public: Submit Review ───────────────────────────────────

export async function submitReview(input: {
  doctorProfileId: string;
  patientId?: string;
  patientDisplayName: string;
  rating: number;
  title?: string;
  body?: string;
}): Promise<DoctorPublicReview> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("doctor_reviews_public")
    .insert({
      doctor_profile_id: input.doctorProfileId,
      patient_id: input.patientId || null,
      patient_display_name: input.patientDisplayName,
      rating: input.rating,
      title: input.title || null,
      body: input.body || null,
      is_verified_patient: !!input.patientId,
      status: "pending", // Requires moderation
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error({ error }, "Failed to submit review");
    throw new Error("Failed to submit review");
  }

  return mapReview(data);
}

// ─── Dashboard: Create/Update Profile ────────────────────────

export async function upsertProfile(
  profileId: string,
  input: Partial<Omit<DoctorPublicProfile, "id" | "profileId" | "avgRating" | "reviewCount">>,
): Promise<DoctorPublicProfile> {
  const supabase = await getSupabase();

  // Check if profile exists
  const { data: existing } = await supabase
    .from("doctor_public_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  const slug = input.slug || generateSlug(input.displayName || "doctor");

  const payload = {
    profile_id: profileId,
    slug,
    display_name: input.displayName || "Doctor",
    specialty: input.specialty || "Medicina General",
    sub_specialties: input.subSpecialties || [],
    bio_es: input.bioEs || null,
    bio_en: input.bioEn || null,
    photo_url: input.photoUrl || null,
    matricula_nacional: input.matriculaNacional || null,
    matricula_provincial: input.matriculaProvincial || null,
    is_verified: input.isVerified || false,
    phone: input.phone || null,
    whatsapp: input.whatsapp || null,
    email: input.email || null,
    booking_url: input.bookingUrl || null,
    address: input.address || null,
    city: input.city || null,
    province: input.province || null,
    lat: input.lat || null,
    lng: input.lng || null,
    insurance_accepted: input.insuranceAccepted || [],
    languages: input.languages || ["es"],
    education: input.education || [],
    experience_years: input.experienceYears || null,
    teleconsulta_available: input.teleconsultaAvailable || false,
    consultation_fee_ars: input.consultationFeeArs || null,
    consultation_fee_usd: input.consultationFeeUsd || null,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
    published: input.published ?? false,
    featured: input.featured ?? false,
    updated_at: new Date().toISOString(),
  };

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("doctor_public_profiles")
      .update(payload)
      .eq("profile_id", profileId)
      .select("*")
      .single();
    if (error) throw new Error(`Update failed: ${error.message}`);
    result = data;
  } else {
    const { data, error } = await supabase
      .from("doctor_public_profiles")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(`Insert failed: ${error.message}`);
    result = data;
  }

  return mapProfile(result);
}

// ─── Get All Specialties (for filters) ───────────────────────

export async function getSpecialties(): Promise<string[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("doctor_public_profiles")
    .select("specialty")
    .eq("published", true);

  if (!data) return [];
  const set = new Set(data.map((r: Record<string, unknown>) => r.specialty as string));
  return Array.from(set).sort();
}

// ─── Get All Cities (for filters) ────────────────────────────

export async function getCities(): Promise<string[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("doctor_public_profiles")
    .select("city")
    .eq("published", true)
    .not("city", "is", null);

  if (!data) return [];
  const set = new Set(data.map((r: Record<string, unknown>) => r.city as string).filter(Boolean));
  return Array.from(set).sort();
}

// ─── Get All Slugs (for generateStaticParams) ────────────────

export async function getAllSlugs(): Promise<string[]> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("doctor_public_profiles")
    .select("slug")
    .eq("published", true);

  if (!data) return [];
  return data.map((r: Record<string, unknown>) => r.slug as string);
}

// ─── Mappers ─────────────────────────────────────────────────

function mapProfile(row: Record<string, unknown>): DoctorPublicProfile {
  const r = row as Record<string, string | number | boolean | string[] | null>;
  return {
    id: r.id as string,
    profileId: r.profile_id as string,
    slug: r.slug as string,
    displayName: r.display_name as string,
    specialty: r.specialty as string,
    subSpecialties: (r.sub_specialties as string[]) || [],
    bioEs: (r.bio_es as string) || undefined,
    bioEn: (r.bio_en as string) || undefined,
    photoUrl: (r.photo_url as string) || undefined,
    matriculaNacional: (r.matricula_nacional as string) || undefined,
    matriculaProvincial: (r.matricula_provincial as string) || undefined,
    isVerified: (r.is_verified as boolean) || false,
    phone: (r.phone as string) || undefined,
    whatsapp: (r.whatsapp as string) || undefined,
    email: (r.email as string) || undefined,
    bookingUrl: (r.booking_url as string) || undefined,
    address: (r.address as string) || undefined,
    city: (r.city as string) || undefined,
    province: (r.province as string) || undefined,
    lat: (r.lat as number) || undefined,
    lng: (r.lng as number) || undefined,
    insuranceAccepted: (r.insurance_accepted as string[]) || [],
    languages: (r.languages as string[]) || ["es"],
    education: (row.education as DoctorPublicProfile["education"]) || [],
    experienceYears: (r.experience_years as number) || undefined,
    teleconsultaAvailable: (r.teleconsulta_available as boolean) || false,
    consultationFeeArs: (r.consultation_fee_ars as number) || undefined,
    consultationFeeUsd: (r.consultation_fee_usd as number) || undefined,
    seoTitle: (r.seo_title as string) || undefined,
    seoDescription: (r.seo_description as string) || undefined,
    published: (r.published as boolean) || false,
    featured: (r.featured as boolean) || false,
    avgRating: Number(r.avg_rating) || 0,
    reviewCount: Number(r.review_count) || 0,
  };
}

function mapReview(row: Record<string, unknown>): DoctorPublicReview {
  const r = row as Record<string, string | number | boolean | null>;
  return {
    id: r.id as string,
    doctorProfileId: r.doctor_profile_id as string,
    patientId: (r.patient_id as string) || undefined,
    patientDisplayName: r.patient_display_name as string,
    rating: r.rating as number,
    title: (r.title as string) || undefined,
    body: (r.body as string) || undefined,
    isVerifiedPatient: (r.is_verified_patient as boolean) || false,
    status: r.status as DoctorPublicReview["status"],
    createdAt: r.created_at as string,
  };
}
