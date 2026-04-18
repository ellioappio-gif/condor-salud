// ─── GET / POST / DELETE  /api/availability ──────────────────
// CRUD for doctor_availability table (admin side).
// Uses service-role client for DB ops (RLS bypass).

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";
import { availabilitySchema } from "@/lib/validations/schemas";

export const runtime = "nodejs";

/* ── Auth helper ──────────────────────────────────────── */

async function requireAuth(): Promise<
  { user: { id: string; role?: string }; error?: never } | { user?: never; error: NextResponse }
> {
  if (!isSupabaseConfigured()) {
    // Demo mode — allow through
    return { user: { id: "demo" } };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { user: { id: user.id, role: user.user_metadata?.role } };
  } catch {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

/* ── GET — list availability for a doctor ─────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const doctorId = req.nextUrl.searchParams.get("doctorId");
  const weekStart = req.nextUrl.searchParams.get("weekStart"); // YYYY-MM-DD

  if (isSupabaseConfigured()) {
    const sb = getServiceClient();

    let query = sb
      .from("doctor_availability")
      .select("*")
      .order("date", { ascending: true })
      .order("time_slot", { ascending: true });

    if (doctorId) query = query.eq("doctor_id", doctorId);
    if (weekStart) {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      query = query.gte("date", weekStart).lt("date", end.toISOString().split("T")[0]);
    }

    const { data, error } = await query;
    if (error) {
      logger.error({ err: error }, "GET /api/availability failed");
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }
    return NextResponse.json({ slots: data ?? [] });
  }

  // Demo mode
  return NextResponse.json({ slots: [] });
}

/* ── POST — create availability slots (bulk) ──────────── */

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const { doctorId, date, timeSlots } = body as {
      doctorId: string;
      date: string;
      timeSlots: string[];
    };

    if (!doctorId || !date || !timeSlots?.length) {
      return NextResponse.json(
        { error: "doctorId, date and timeSlots[] are required" },
        { status: 400 },
      );
    }

    if (isSupabaseConfigured()) {
      const sb = getServiceClient();

      const rows = timeSlots.map((ts: string) => ({
        doctor_id: doctorId,
        date,
        time_slot: ts,
        booked: false,
      }));

      const { data, error } = await sb
        .from("doctor_availability")
        .upsert(rows, { onConflict: "doctor_id,date,time_slot", ignoreDuplicates: true })
        .select();

      if (error) {
        logger.error({ err: error }, "POST /api/availability failed");
        return NextResponse.json({ error: "Insert failed" }, { status: 500 });
      }
      return NextResponse.json({ created: data?.length ?? 0 });
    }

    return NextResponse.json({ created: timeSlots.length });
  } catch (err) {
    logger.error({ err }, "POST /api/availability error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* ── DELETE — remove an availability slot ─────────────── */

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { slotId } = body as { slotId: string };

    if (!slotId) {
      return NextResponse.json({ error: "slotId is required" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const sb = getServiceClient();

      const { error } = await sb
        .from("doctor_availability")
        .delete()
        .eq("id", slotId)
        .eq("booked", false); // Can only delete unbooked slots

      if (error) {
        logger.error({ err: error }, "DELETE /api/availability failed");
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/availability error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
