// ─── POST /api/bookings  — Create a new appointment ──────────
// ─── DELETE /api/bookings — Cancel an existing appointment ────
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/* ── Types ────────────────────────────────────────────── */

interface BookingPayload {
  specialty: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // HH:mm
  type: "presencial" | "teleconsulta";
  doctorId?: string; // optional — assigned later if omitted
  notes?: string;
}

interface CancelPayload {
  appointmentId: string;
  reason?: string;
}

/* ── POST — create booking ────────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BookingPayload;
    const { specialty, date, time, type } = body;

    if (!specialty || !date || !time) {
      return NextResponse.json({ error: "specialty, date and time are required" }, { status: 400 });
    }

    // ── Supabase path ─────────────────────────────────
    if (isSupabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/server");
      const sb = createClient();
      // appointments table exists (migration 005) but isn't in generated types yet
      const sbAny = sb as unknown as { from: (t: string) => ReturnType<typeof sb.from> };

      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await sb
        .from("pacientes")
        .select("id, nombre, email")
        .eq("email", user.email ?? "")
        .maybeSingle();

      const patientId = profile?.id ?? user.id;

      // Look up doctor name if doctorId provided
      let doctorName = "A asignar";
      if (body.doctorId) {
        const { data: doc } = await sb
          .from("doctors")
          .select("name")
          .eq("id", body.doctorId)
          .maybeSingle();
        if (doc) doctorName = doc.name;
      }

      // Insert into appointments table
      const { data: apt, error: insertErr } = await sbAny
        .from("appointments")
        .insert({
          patient_id: patientId,
          specialty,
          appointment_date: date,
          appointment_time: time,
          is_telemedicine: type === "teleconsulta",
          doctor_profile_id: body.doctorId || null,
          status: "confirmed",
          booked_via: "web",
          notes: body.notes || null,
        })
        .select("id")
        .single();

      if (insertErr) {
        logger.error({ err: insertErr }, "Failed to insert appointment");
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
      }

      // ── Fire-and-forget: send email + notification ──
      try {
        const { sendBookingConfirmation } = await import("@/lib/services/email-sendgrid");
        await sendBookingConfirmation({
          patientEmail: user.email ?? "",
          patientName: profile?.nombre ?? user.email ?? "Paciente",
          doctorName,
          specialty,
          date,
          time,
          address: type === "teleconsulta" ? "Videollamada" : "A confirmar",
          bookingId: apt.id,
        });
      } catch (emailErr) {
        logger.warn({ err: emailErr }, "Email send failed (non-blocking)");
      }

      return NextResponse.json({
        id: apt.id,
        doctor: doctorName,
        specialty,
        date,
        time,
        type,
        location: type === "teleconsulta" ? "Videollamada" : "A confirmar",
        status: "confirmado",
      });
    }

    // ── Demo mode — return a fake booking ─────────────
    const demoId = `demo-${Date.now()}`;
    return NextResponse.json({
      id: demoId,
      doctor: "A asignar",
      specialty,
      date,
      time,
      type,
      location: type === "teleconsulta" ? "Videollamada" : "Consultorio 3 - Sede Belgrano",
      status: "confirmado",
    });
  } catch (err) {
    logger.error({ err }, "POST /api/bookings failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* ── DELETE — cancel booking ──────────────────────────── */

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as CancelPayload;
    const { appointmentId, reason } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/server");
      const sb = createClient();
      const sbAny = sb as unknown as { from: (t: string) => ReturnType<typeof sb.from> };

      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Fetch the appointment to get doctor info for email
      const { data: apt } = await sbAny
        .from("appointments")
        .select("*")
        .eq("id", appointmentId)
        .maybeSingle();

      if (!apt) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }

      // Update status to cancelled
      const { error: updateErr } = await sbAny
        .from("appointments")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

      if (updateErr) {
        logger.error({ err: updateErr }, "Failed to cancel appointment");
        return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
      }

      // Fire-and-forget: send cancellation email
      try {
        const { sendBookingCancellation } = await import("@/lib/services/email-sendgrid");
        const aptRow = apt as Record<string, unknown>;
        await sendBookingCancellation({
          patientEmail: user.email ?? "",
          patientName: user.email ?? "Paciente",
          doctorName: "Profesional",
          date: String(aptRow.appointment_date ?? new Date().toISOString()),
          reason: reason || "Cancelado por el paciente",
        });
      } catch (emailErr) {
        logger.warn({ err: emailErr }, "Cancel email send failed (non-blocking)");
      }

      return NextResponse.json({ success: true });
    }

    // Demo mode
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/bookings failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
