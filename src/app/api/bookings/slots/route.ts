// ─── GET /api/bookings/slots?specialty=X&date=YYYY-MM-DD ─────
// Returns available time slots for a given specialty + date.
// With Supabase: queries doctor_availability table.
// Demo mode: returns realistic hardcoded slots.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

const DEMO_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const specialty = searchParams.get("specialty");
  const date = searchParams.get("date");

  if (!specialty || !date) {
    return NextResponse.json({ error: "specialty and date are required" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const sb = createClient();

      // Get doctors for this specialty
      const { data: doctors } = await sb
        .from("doctors")
        .select("id")
        .ilike("specialty", `%${specialty}%`)
        .eq("active", true);

      if (!doctors || doctors.length === 0) {
        return NextResponse.json({ slots: DEMO_SLOTS });
      }

      const doctorIds = doctors.map((d) => d.id);

      // Get available (unbooked) slots for these doctors on the date
      const { data: slots } = await sb
        .from("doctor_availability")
        .select("time_slot, doctor_id")
        .in("doctor_id", doctorIds)
        .eq("date", date)
        .eq("booked", false)
        .order("time_slot", { ascending: true });

      if (!slots || slots.length === 0) {
        // No configured availability — fall back to demo slots
        return NextResponse.json({ slots: DEMO_SLOTS });
      }

      // Deduplicate time slots (multiple doctors may share a time)
      const timeSet = new Set<string>();
      for (const s of slots) {
        const t = String(s.time_slot);
        timeSet.add(t.length > 5 ? t.slice(0, 5) : t);
      }
      const uniqueTimes = Array.from(timeSet).sort();

      return NextResponse.json({ slots: uniqueTimes });
    } catch {
      return NextResponse.json({ slots: DEMO_SLOTS });
    }
  }

  // Demo mode: randomly remove a few slots to simulate booked times
  const dayHash = date.split("-").reduce((a, b) => a + Number(b), 0);
  const available = DEMO_SLOTS.filter((_, i) => (i + dayHash) % 5 !== 0);
  return NextResponse.json({ slots: available });
}
