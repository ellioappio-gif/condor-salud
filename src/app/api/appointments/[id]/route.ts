import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const appointmentUpdateSchema = z.object({
  status: z.enum(["cancelado", "pendiente", "confirmado"]).optional(),
  cancelledBy: z.enum(["patient", "doctor", "clinic"]).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = appointmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Demo mode — return success
      return NextResponse.json({
        id,
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      });
    }

    // Verify patient owns this appointment
    const { data: appointment } = await (supabase as any)
      .from("appointments")
      .select("id, patient_id, date, time")
      .eq("id", id)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.patient_id !== user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // 2-hour business rule for cancellation
    if (parsed.data.status === "cancelado") {
      const aptDateTime = new Date(`${appointment.date}T${appointment.time}`);
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      if (aptDateTime <= twoHoursFromNow) {
        return NextResponse.json(
          { error: "No se puede cancelar un turno con menos de 2 horas de antelación" },
          { status: 422 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.status) updateData.status = parsed.data.status;
    if (parsed.data.cancelledBy) updateData.cancelled_by = parsed.data.cancelledBy;
    if (parsed.data.date) updateData.date = parsed.data.date;
    if (parsed.data.time) updateData.time = parsed.data.time;

    const { data, error } = await (supabase as any)
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Error actualizando turno" }, { status: 500 });
  }
}
