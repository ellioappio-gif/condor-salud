// ─── Admin Review Moderation API ─────────────────────────────
// GET  → list reviews by status (default: pending)
// PATCH → approve or reject a review, update doctor avg_rating

import { NextRequest, NextResponse } from "next/server";
import { type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

async function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const { createClient } = await import("@/lib/supabase/server");
  return createClient() as unknown as SupabaseClient;
}

// GET /api/admin/reviews?status=pending
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || "pending";
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("doctor_reviews_public")
      .select("*, doctor_public_profiles(display_name, slug, specialty)")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error({ error }, "Failed to fetch reviews for moderation");
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    const reviews = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id,
      doctorProfileId: row.doctor_profile_id,
      patientDisplayName: row.patient_display_name,
      rating: row.rating,
      title: row.title,
      body: row.body,
      isVerifiedPatient: row.is_verified_patient,
      status: row.status,
      createdAt: row.created_at,
      doctor: row.doctor_public_profiles
        ? {
            displayName: (row.doctor_public_profiles as Record<string, string>).display_name,
            slug: (row.doctor_public_profiles as Record<string, string>).slug,
            specialty: (row.doctor_public_profiles as Record<string, string>).specialty,
          }
        : null,
    }));

    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/reviews — Body: { reviewId, action: "approve" | "reject" }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, action } = body as { reviewId: string; action: string };

    if (!reviewId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "reviewId and action (approve|reject) required" },
        { status: 400 },
      );
    }

    const supabase = await getSupabase();
    const newStatus = action === "approve" ? "approved" : "rejected";

    const { error } = await supabase
      .from("doctor_reviews_public")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", reviewId);

    if (error) {
      logger.error({ error }, "Failed to moderate review");
      return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
    }

    // If approved, recalculate the doctor's avg rating
    if (action === "approve") {
      const { data: review } = await supabase
        .from("doctor_reviews_public")
        .select("doctor_profile_id")
        .eq("id", reviewId)
        .single();

      if (review) {
        const doctorProfileId = (review as Record<string, string>).doctor_profile_id;
        const { data: statsData } = await supabase
          .from("doctor_reviews_public")
          .select("rating")
          .eq("doctor_profile_id", doctorProfileId)
          .eq("status", "approved");

        if (statsData && statsData.length > 0) {
          const ratings = statsData.map((r: Record<string, number>) => Number(r.rating) || 0);
          const sum = ratings.reduce((a, b) => a + b, 0);
          const avg = Math.round((sum / ratings.length) * 10) / 10;
          await supabase
            .from("doctor_public_profiles")
            .update({ avg_rating: avg, review_count: ratings.length })
            .eq("id", doctorProfileId);
        }
      }
    }

    logger.info({ reviewId, action }, "Review moderated");
    return NextResponse.json({ ok: true, status: newStatus });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
