// ─── Patient Data Export API ─────────────────────────────────
// GET /api/patients/me/export — Downloads patient record as JSON
// Required for DNPDP (Ley 25.326) compliance

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "patient-export", { limit: 5, windowSec: 60 });
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      patient: { name: "Demo Patient", email: "demo@example.com" },
      appointments: [],
      prescriptions: [],
      exportedAt: new Date().toISOString(),
      note: "Datos de demo — no hay datos reales almacenados.",
    });
  }

  try {
    const { getServiceClient } = await import("@/lib/supabase/service");
    const sb = getServiceClient();

    // Get patient record
    const { data: patient } = await sb
      .from("pacientes")
      .select("*")
      .eq("email", auth.user.email)
      .is("deleted_at", null)
      .maybeSingle();

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // Get appointments
    const { data: appointments } = await sb
      .from("appointments")
      .select("*")
      .eq("patient_id", patient.id)
      .is("deleted_at", null)
      .order("appointment_date", { ascending: false });

    // Get prescriptions
    const { data: prescriptions } = await sb
      .from("digital_prescriptions")
      .select("*, prescription_medications(*)")
      .eq("patient_id", patient.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Get triages
    const { data: triages } = await sb
      .from("triages")
      .select("*")
      .eq("patient_id", patient.id)
      .is("deleted_at", null);

    const exportData = {
      patient,
      appointments: appointments ?? [],
      prescriptions: prescriptions ?? [],
      triages: triages ?? [],
      exportedAt: new Date().toISOString(),
    };

    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "VIEW",
      resourceType: "patient_data_export",
      resourceId: patient.id,
      requestPath: "/api/patients/me/export",
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="mis-datos-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err) {
    logger.error({ err }, "Patient data export failed");
    return NextResponse.json({ error: "Error al exportar datos" }, { status: 500 });
  }
}
