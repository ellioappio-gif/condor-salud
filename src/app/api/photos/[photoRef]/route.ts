/**
 * GET /api/photos/:photoRef
 *
 * Proxies Google Places photos to the client, hiding the API key.
 */

import { NextRequest, NextResponse } from "next/server";
import { GooglePlacesService } from "@/lib/services/google-places";

export const runtime = "nodejs";

let placesService: GooglePlacesService | null = null;

function getService() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY not configured");
  if (!placesService) placesService = new GooglePlacesService(key);
  return placesService;
}

export async function GET(request: NextRequest, { params }: { params: { photoRef: string } }) {
  try {
    const { photoRef } = params;
    const places = getService();
    const maxWidth = parseInt(request.nextUrl.searchParams.get("maxwidth") || "400");

    const response = await places.fetchPhoto(photoRef, maxWidth);

    if (!response.ok) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (err: unknown) {
    console.error("[photos/proxy]", err);
    return NextResponse.json({ error: "Photo proxy error" }, { status: 500 });
  }
}
