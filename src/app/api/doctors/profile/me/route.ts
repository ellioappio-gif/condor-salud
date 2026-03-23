// Dashboard API: Get/Update own public profile
// GET  → fetch my profile
// PUT  → upsert my profile

import { type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { upsertProfile, generateSlug } from "@/lib/services/doctor-profiles";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";

async function getProfileId(req: NextRequest): Promise<string> {
  // Extract from session header or cookie
  return req.headers.get("x-profile-id") || "demo-profile";
}

export async function GET(req: NextRequest) {
  try {
    const profileId = await getProfileId(req);

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ profile: null });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient() as unknown as SupabaseClient;

    const { data } = await supabase
      .from("doctor_public_profiles")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ profile: null });
    }

    // Map snake_case → camelCase
    const r = data as Record<string, unknown>;
    return NextResponse.json({
      profile: {
        slug: r.slug,
        displayName: r.display_name,
        specialty: r.specialty,
        subSpecialties: r.sub_specialties,
        bioEs: r.bio_es,
        bioEn: r.bio_en,
        photoUrl: r.photo_url,
        phone: r.phone,
        whatsapp: r.whatsapp,
        email: r.email,
        bookingUrl: r.booking_url,
        address: r.address,
        city: r.city,
        province: r.province,
        insuranceAccepted: r.insurance_accepted,
        languages: r.languages,
        education: r.education,
        experienceYears: r.experience_years,
        teleconsultaAvailable: r.teleconsulta_available,
        consultationFeeArs: r.consultation_fee_ars,
        consultationFeeUsd: r.consultation_fee_usd,
        seoTitle: r.seo_title,
        seoDescription: r.seo_description,
        published: r.published,
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /api/doctors/profile/me failed");
    return NextResponse.json({ profile: null });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profileId = await getProfileId(req);
    const body = await req.json();

    const slug = generateSlug(body.displayName || "doctor");

    const profile = await upsertProfile(profileId, {
      slug,
      displayName: body.displayName,
      specialty: body.specialty,
      subSpecialties: body.subSpecialties,
      bioEs: body.bioEs,
      bioEn: body.bioEn,
      photoUrl: body.photoUrl,
      phone: body.phone,
      whatsapp: body.whatsapp,
      email: body.email,
      bookingUrl: body.bookingUrl,
      address: body.address,
      city: body.city,
      province: body.province,
      insuranceAccepted: body.insuranceAccepted,
      languages: body.languages,
      education: body.education,
      experienceYears: body.experienceYears || null,
      teleconsultaAvailable: body.teleconsultaAvailable,
      consultationFeeArs: body.consultationFeeArs || null,
      consultationFeeUsd: body.consultationFeeUsd || null,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      published: body.published,
    });

    return NextResponse.json({ profile });
  } catch (err) {
    logger.error({ err }, "PUT /api/doctors/profile/me failed");
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
