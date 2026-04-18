// ─── Issue Prescription API ──────────────────────────────────
// POST /api/prescriptions/[id]/issue
// Transitions a draft prescription to active status.
// Triggers OSDE FHIR registration if coverage matches.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { issuePrescription } from "@/lib/services/prescription-qr";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "rx-issue", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  const { id } = params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      prescription: {
        id,
        status: "active",
        issuedAt: new Date().toISOString(),
        osde: null,
      },
    });
  }

  try {
    const rx = await issuePrescription(id);
    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "UPDATE",
      resourceType: "prescription",
      resourceId: id,
      newValues: { status: "active" },
      requestPath: "/api/prescriptions/[id]/issue",
    });
    return NextResponse.json({ success: true, prescription: rx });
  } catch (err) {
    logger.error({ err, id }, "Issue prescription failed");
    const message = err instanceof Error ? err.message : "Error al emitir receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
