/**
 * GET /api/rides/options
 *
 * Returns Uber + Cabify + InDrive deep links pre-filled with
 * the doctor's address as the destination.
 *
 * Query params: address (required), doctorName, destLat, destLng,
 *   pickupLat, pickupLng, specialty, bookingDate, bookingTime
 */

import { NextRequest, NextResponse } from "next/server";
import { buildRideOptions } from "@/lib/services/ride-service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const address = searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address requerido" }, { status: 400 });
  }

  try {
    const result = await buildRideOptions({
      doctorName: searchParams.get("doctorName") || "el médico",
      clinicAddress: address,
      clinicLat: searchParams.get("destLat") ? parseFloat(searchParams.get("destLat")!) : null,
      clinicLng: searchParams.get("destLng") ? parseFloat(searchParams.get("destLng")!) : null,
      patientLat: searchParams.get("pickupLat") ? parseFloat(searchParams.get("pickupLat")!) : null,
      patientLng: searchParams.get("pickupLng") ? parseFloat(searchParams.get("pickupLng")!) : null,
      specialty: searchParams.get("specialty") || "",
      bookingDate: searchParams.get("bookingDate") || "",
      bookingTime: searchParams.get("bookingTime") || "",
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
