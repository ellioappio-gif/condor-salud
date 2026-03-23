// Public API: Doctor profiles search & listing
// GET /api/doctors/public?specialty=...&city=...&limit=20&offset=0

import { NextRequest, NextResponse } from "next/server";
import { searchPublicDoctors, getSpecialties, getCities } from "@/lib/services/doctor-profiles";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Return filter options
    if (action === "filters") {
      const [specialties, cities] = await Promise.all([getSpecialties(), getCities()]);
      return NextResponse.json({ specialties, cities });
    }

    // Search doctors
    const filters = {
      specialty: url.searchParams.get("specialty") || undefined,
      city: url.searchParams.get("city") || undefined,
      language: url.searchParams.get("language") || undefined,
      insurance: url.searchParams.get("insurance") || undefined,
      teleconsulta: url.searchParams.get("teleconsulta") === "true" || undefined,
      featured: url.searchParams.get("featured") === "true" || undefined,
      limit: parseInt(url.searchParams.get("limit") || "20"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    const result = await searchPublicDoctors(filters);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /api/doctors/public failed");
    return NextResponse.json({ doctors: [], total: 0 }, { status: 500 });
  }
}
