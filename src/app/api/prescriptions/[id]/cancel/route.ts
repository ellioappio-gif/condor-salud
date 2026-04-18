// ─── Cancel Prescription API ─────────────────────────────────
// POST /api/prescriptions/[id]/cancel
// Body: { reason?: string }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { cancelPrescription } from "@/lib/services/prescription-qr";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

const CancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "rx-cancel", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  const { id } = params;

  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsed = CancelSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const reason = parsed.data.reason;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Receta anulada (demo)",
      });
    }

    await cancelPrescription(id, reason);
    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "DELETE",
      resourceType: "prescription",
      resourceId: id,
      newValues: { reason },
      requestPath: "/api/prescriptions/[id]/cancel",
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err, id }, "Cancel prescription failed");
    const message = err instanceof Error ? err.message : "Error al anular receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
