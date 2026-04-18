// Admin API: List & review doctor verifications
// GET  → list pending verifications
// PATCH → approve/reject a verification

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listPendingVerifications, reviewVerification } from "@/lib/services/doctor-verification";
import { requireAdminAuth } from "@/lib/security/jwt-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

const ReviewSchema = z.object({
  verificationId: z.string().uuid("verificationId must be a UUID"),
  action: z.enum(["approved", "rejected"]),
  reviewedBy: z.string().min(1),
  rejectionReason: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth.error) return auth.error;

  try {
    const verifications = await listPendingVerifications();
    return NextResponse.json({ verifications });
  } catch (err) {
    logger.error({ err }, "GET /api/admin/verifications failed");
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "admin-verifications", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { verificationId, action, reviewedBy, rejectionReason } = parsed.data;

    await reviewVerification({
      verificationId,
      reviewerId: reviewedBy,
      status: action,
      rejectionReason,
    });

    await logAuditEvent({
      userId: reviewedBy,
      action: "UPDATE",
      resourceType: "doctor_verification",
      resourceId: verificationId,
      newValues: { status: action },
      requestPath: "/api/admin/verifications",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "PATCH /api/admin/verifications failed");
    return NextResponse.json({ error: "Failed to review verification" }, { status: 500 });
  }
}
