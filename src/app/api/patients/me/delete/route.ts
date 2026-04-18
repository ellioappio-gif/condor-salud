// ─── Patient Account Deletion API ────────────────────────────
// DELETE /api/patients/me/delete — Soft-deletes patient account
// Required for DNPDP (Ley 25.326) compliance

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "patient-delete", { limit: 3, windowSec: 60 });
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      message: "Cuenta eliminada (modo demo)",
    });
  }

  try {
    const { getServiceClient } = await import("@/lib/supabase/service");
    const sb = getServiceClient();

    const { data: patient } = await sb
      .from("pacientes")
      .select("id")
      .eq("email", auth.user.email)
      .is("deleted_at", null)
      .maybeSingle();

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Soft-delete patient record
    const { error } = await sb.from("pacientes").update({ deleted_at: now }).eq("id", patient.id);

    if (error) throw error;

    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "DELETE",
      resourceType: "patient",
      resourceId: patient.id,
      requestPath: "/api/patients/me/delete",
    });

    return NextResponse.json({
      success: true,
      message: "Tu cuenta ha sido eliminada. Los datos se conservarán según la normativa vigente.",
    });
  } catch (err) {
    logger.error({ err }, "Patient account deletion failed");
    return NextResponse.json({ error: "Error al eliminar cuenta" }, { status: 500 });
  }
}
