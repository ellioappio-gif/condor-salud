/**
 * GET /api/doctors/:placeId
 *
 * Returns full details + enrichment for a single doctor.
 */

import { NextRequest, NextResponse } from "next/server";
import { GooglePlacesService } from "@/lib/services/google-places";
import { DoctorEnrichmentService } from "@/lib/services/doctor-enrichment";
import type { SearchDoctor } from "@/lib/doctor-search";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

let placesService: GooglePlacesService | null = null;
let enrichmentService: DoctorEnrichmentService | null = null;

function getServices() {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not configured");
  if (!placesService) placesService = new GooglePlacesService(key);
  if (!enrichmentService) enrichmentService = new DoctorEnrichmentService();
  return { places: placesService, enrichment: enrichmentService };
}

export async function GET(request: NextRequest, { params }: { params: { placeId: string } }) {
  try {
    const { placeId } = params;
    const { places, enrichment } = getServices();
    const specialty = request.nextUrl.searchParams.get("specialty") || undefined;

    const place = await places.getDetails(placeId);
    const enriched = await enrichment.enrich({ website: place.website, name: place.name });

    const doctor: SearchDoctor = {
      placeId: place.placeId,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      website: place.website,
      rating: place.rating,
      reviewCount: place.reviewCount,
      hours: place.hours,
      isOpenNow: place.isOpenNow,
      photoRef: place.photoRef,
      photoUrl: place.photoRef ? places.photoUrl(place.photoRef) : null,
      googleMapsUrl: place.googleMapsUrl,
      source: "google_places",
      enriched: enriched.enriched,
      enrichmentSource: enriched.enrichmentSource,
      whatsapp: enriched.whatsapp,
      whatsappUrl: DoctorEnrichmentService.buildWhatsAppUrl(
        enriched.whatsapp,
        place.name,
        specialty,
      ),
      bookingUrl: enriched.bookingUrl,
      bookingType: enriched.bookingType,
      englishSpeaking: enriched.englishSpeaking,
      insurances: enriched.insurances,
      telehealth: enriched.telehealth,
    };

    return NextResponse.json(doctor);
  } catch (err: unknown) {
    logger.error({ err }, "[doctors/detail]");
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
