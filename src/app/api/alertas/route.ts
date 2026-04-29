// ─── Alertas API Route ───────────────────────────────────────
// GET  /api/alertas          → list alerts for the clinic
// PATCH /api/alertas         → mark alerts read / dismiss
//
// Alerts come from the `alertas` table (migration 002).
// Falls back to demo data when Supabase is not configured.

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { isSupabaseConfigured } from "@/lib/env";
import { alertaPatchSchema } from "@/lib/validations/schemas";

function getServiceClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Build live alerts from upcoming appointments ────────────
async function buildAppointmentAlerts(
  clinicId: string,
  supabase: ReturnType<typeof getServiceClient>,
) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toISOString().split("T")[0];
  const nextWeekStr = new Date(now.getTime() + 7 * 86_400_000).toISOString().split("T")[0];

  const { data: turnos } = await supabase
    .from("turnos")
    .select("id, fecha, hora, paciente_nombre, estado, motivo, doctor_nombre")
    .eq("clinic_id", clinicId)
    .gte("fecha", todayStr)
    .lte("fecha", nextWeekStr)
    .not("estado", "eq", "cancelado")
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(30);

  if (!turnos || turnos.length === 0) return [];

  return (turnos as Record<string, string>[]).map((t) => {
    const isToday = t.fecha === todayStr;
    const isTomorrow = t.fecha === tomorrowStr;
    const label = isToday ? "hoy" : isTomorrow ? "mañana" : t.fecha;
    const hora = t.hora ? t.hora.slice(0, 5) : "";
    const doctor = t.doctor_nombre ? ` — ${t.doctor_nombre}` : "";
    const motivo = t.motivo ? ` · ${t.motivo}` : "";
    return {
      id: `turno-${t.id}`,
      tipo: "turno",
      titulo: `Turno ${label} a las ${hora}${doctor}`,
      detalle: `${t.paciente_nombre}${motivo}`,
      fecha: t.fecha,
      acento: isToday ? "gold" : "celeste",
      read: false,
    };
  });
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "alertas-read", { limit: 30, windowSec: 60 });
  if (limited) return limited;

  try {
    if (isSupabaseConfigured()) {
      const supabase = getServiceClient();

      // First try the alertas table
      const { data, error } = await supabase
        .from("alertas")
        .select("*")
        .eq("clinic_id", auth.user.clinicId)
        .order("fecha", { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        return NextResponse.json({ alertas: data });
      }

      // Fall back to live upcoming appointments
      const appointmentAlerts = await buildAppointmentAlerts(auth.user.clinicId, supabase);
      return NextResponse.json({ alertas: appointmentAlerts });
    }

    return NextResponse.json({ alertas: [] });
  } catch (err) {
    logger.error({ err, route: "alertas" }, "Failed to fetch alerts");
    return NextResponse.json({ alertas: [] });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "alertas-write", { limit: 15, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = sanitizeBody(await request.json());

    // ── I-04: Zod validation ──
    const parsed = alertaPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { action, ids } = parsed.data;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: "Demo mode — no changes persisted" });
    }

    const supabase = getServiceClient();

    if (action === "mark_all_read") {
      await supabase
        .from("alertas")
        .update({ read: true })
        .eq("clinic_id", auth.user.clinicId)
        .eq("read", false);
    } else if (action === "mark_read" && ids?.length) {
      await supabase
        .from("alertas")
        .update({ read: true })
        .eq("clinic_id", auth.user.clinicId)
        .in("id", ids);
    } else if (action === "dismiss" && ids?.length) {
      await supabase.from("alertas").delete().eq("clinic_id", auth.user.clinicId).in("id", ids);
    }

    logger.info({ route: "alertas", action, count: ids?.length }, "Alert action");
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err, route: "alertas" }, "Failed to update alerts");
    return NextResponse.json({ error: "Error actualizando alertas" }, { status: 500 });
  }
}
