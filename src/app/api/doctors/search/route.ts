/**
 * GET /api/doctors/search
 *
 * Query params:
 *   specialty (string, required)
 *   city (string, default "Buenos Aires")
 *   neighborhood (string, optional)
 *   insurance, english, whatsapp, booking, telehealth — filters
 *   nearby, lat, lng, radius — for nearby search
 *   limit (number, default 20)
 */

import { NextRequest, NextResponse } from "next/server";
import { GooglePlacesService } from "@/lib/services/google-places";
import { DoctorEnrichmentService } from "@/lib/services/doctor-enrichment";
import type { SearchDoctor } from "@/lib/doctor-search";

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

export async function GET(request: NextRequest) {
  try {
    const { places, enrichment } = getServices();
    const params = request.nextUrl.searchParams;

    const specialty = params.get("specialty") || "";
    const city = params.get("city") || "Buenos Aires";
    const neighborhood = params.get("neighborhood") || undefined;
    const limit = Math.min(parseInt(params.get("limit") || "20"), 50);

    const nearby = params.get("nearby") === "true";
    const lat = parseFloat(params.get("lat") || "0");
    const lng = parseFloat(params.get("lng") || "0");
    const radius = parseInt(params.get("radius") || "2000");

    // Filters
    const insuranceFilter = params.get("insurance")?.toLowerCase() || null;
    const englishFilter = params.get("english") === "true";
    const whatsappFilter = params.get("whatsapp") === "true";
    const bookingFilter = params.get("booking") === "true";
    const telehealthFilter = params.get("telehealth") === "true";

    // Fetch places
    let rawPlaces;
    if (nearby && lat && lng) {
      rawPlaces = await places.nearbyDoctors({ lat, lng, radiusMeters: radius, specialty });
    } else {
      if (!specialty) {
        return NextResponse.json({ error: "Parámetro specialty es obligatorio" }, { status: 400 });
      }
      rawPlaces = await places.searchDoctors({ specialty, city, neighborhood, maxResults: limit });
    }

    // Enrich
    const enrichResults = await enrichment.enrichBatch(
      rawPlaces.map((p) => ({ website: p.website, name: p.name })),
    );

    // Combine
    const emptyEnrichment = {
      enriched: false,
      enrichmentSource: null as "scrape" | "cache" | "failed" | null,
      whatsapp: null,
      bookingUrl: null,
      bookingType: null,
      englishSpeaking: false,
      insurances: [] as string[],
      telehealth: false,
    };
    let doctors: SearchDoctor[] = rawPlaces.map((place, i) => {
      const e = enrichResults[i] ?? emptyEnrichment;
      return {
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
        source: "google_places" as const,
        enriched: e.enriched,
        enrichmentSource: e.enrichmentSource,
        whatsapp: e.whatsapp,
        whatsappUrl: DoctorEnrichmentService.buildWhatsAppUrl(e.whatsapp, place.name, specialty),
        bookingUrl: e.bookingUrl,
        bookingType: e.bookingType,
        englishSpeaking: e.englishSpeaking,
        insurances: e.insurances,
        telehealth: e.telehealth,
      };
    });

    // Apply filters
    if (insuranceFilter) {
      doctors = doctors.filter((d) =>
        d.insurances.some((ins) => ins.toLowerCase().includes(insuranceFilter)),
      );
    }
    if (englishFilter) doctors = doctors.filter((d) => d.englishSpeaking);
    if (whatsappFilter) doctors = doctors.filter((d) => !!d.whatsapp);
    if (bookingFilter) doctors = doctors.filter((d) => !!d.bookingUrl);
    if (telehealthFilter) doctors = doctors.filter((d) => d.telehealth);

    return NextResponse.json({
      doctors: doctors.slice(0, limit),
      total: doctors.length,
      query: { specialty, city, neighborhood },
    });
  } catch (err: unknown) {
    console.error("[doctors/search]", err);
    const msg = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
