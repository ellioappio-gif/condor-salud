// ─── GET /api/clinics/[slug]/slots?doctorId=X&date=YYYY-MM-DD ──
// Public endpoint: returns available (unbooked) time slots for
// a specific doctor on a specific date.
// No auth required — used by the public booking page.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = req.nextUrl;
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!doctorId || !date) {
    return NextResponse.json({ error: "doctorId and date are required" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const sb = createClient(url, key);
      const sbAny = sb as unknown as { from: (t: string) => ReturnType<typeof sb.from> };

      // Verify clinic exists
      const { data: clinic } = (await sbAny
        .from("clinics")
        .select("id")
        .eq("slug", params.slug)
        .eq("active", true)
        .single()) as { data: { id: string } | null };

      if (!clinic) {
        return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
      }

      // Verify doctor belongs to this clinic
      const { data: doctor } = (await sbAny
        .from("doctors")
        .select("id")
        .eq("id", doctorId)
        .eq("clinic_id", clinic.id)
        .eq("active", true)
        .single()) as { data: { id: string } | null };

      if (!doctor) {
        return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
      }

      // Get available slots
      const { data: slots } = (await sbAny
        .from("doctor_availability")
        .select("time_slot")
        .eq("doctor_id", doctorId)
        .eq("date", date)
        .eq("booked", false)
        .order("time_slot", { ascending: true })) as {
        data: { time_slot: string }[] | null;
      };

      // Also check existing bookings that would block a slot
      const { data: booked } = (await sbAny
        .from("clinic_bookings")
        .select("hora")
        .eq("doctor_id", doctorId)
        .eq("fecha", date)
        .not("status", "in", '("cancelled")')) as { data: { hora: string }[] | null };

      const bookedSet = new Set((booked ?? []).map((b) => b.hora));

      const available = (slots ?? [])
        .map((s) => {
          const t = String(s.time_slot);
          return t.length > 5 ? t.slice(0, 5) : t;
        })
        .filter((t) => !bookedSet.has(t));

      return NextResponse.json({ slots: available });
    } catch {
      return NextResponse.json({ slots: [] });
    }
  }

  // Demo fallback
  return NextResponse.json({
    slots: ["10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "14:00", "14:15", "14:30"],
  });
}
