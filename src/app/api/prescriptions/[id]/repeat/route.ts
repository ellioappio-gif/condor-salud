// ─── Repeat Prescription API ─────────────────────────────────
// POST /api/prescriptions/[id]/repeat
// Clones an existing prescription as a new draft.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { repeatPrescription } from "@/lib/services/prescription-qr";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "rx-repeat", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  const { id } = params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: true,
      prescription: {
        id: `rx-repeat-${Date.now()}`,
        status: "draft",
        repeatOf: id,
        createdAt: new Date().toISOString(),
      },
    });
  }

  try {
    const rx = await repeatPrescription(id);
    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "CREATE",
      resourceType: "prescription",
      resourceId: id,
      newValues: { repeatOf: id },
      requestPath: "/api/prescriptions/[id]/repeat",
    });
    return NextResponse.json({ success: true, prescription: rx });
  } catch (err) {
    logger.error({ err, id }, "Repeat prescription failed");
    const message = err instanceof Error ? err.message : "Error al repetir receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
