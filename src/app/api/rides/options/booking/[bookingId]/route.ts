/**
 * GET /api/rides/options/booking/:bookingId
 *
 * Convenience endpoint — looks up a booking from Firestore and
 * builds ride options automatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { buildRideOptions } from "@/lib/services/ride-service";
import { getDoc, Collections } from "@/lib/services/firestore";

export async function GET(_request: NextRequest, { params }: { params: { bookingId: string } }) {
  const { bookingId } = params;

  try {
    const booking = await getDoc(Collections.BOOKINGS, bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    // Try to get doctor details for address/coords
    let doctor: Record<string, unknown> | null = null;
    if (booking.doctorId) {
      doctor = await getDoc(Collections.DOCTORS, booking.doctorId as string).catch(() => null);
    }

    const result = await buildRideOptions({
      doctorName: (booking.doctorName as string) || (doctor?.name as string) || "el médico",
      clinicAddress: (doctor?.address as string) || (booking.address as string) || "",
      clinicLat: (doctor?.lat as number) || null,
      clinicLng: (doctor?.lng as number) || null,
      specialty: (booking.specialty as string) || "",
      bookingDate: (booking.date as string) || "",
      bookingTime: (booking.time as string) || "",
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
