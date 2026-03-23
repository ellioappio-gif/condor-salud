// Admin API: List & review doctor verifications
// GET  → list pending verifications
// PATCH → approve/reject a verification

import { NextRequest, NextResponse } from "next/server";
import { listPendingVerifications, reviewVerification } from "@/lib/services/doctor-verification";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const verifications = await listPendingVerifications();
    return NextResponse.json({ verifications });
  } catch (err) {
    logger.error({ err }, "GET /api/admin/verifications failed");
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { verificationId, action, reviewedBy, rejectionReason } = body as {
      verificationId: string;
      action: "approved" | "rejected";
      reviewedBy: string;
      rejectionReason?: string;
    };

    if (!verificationId || !action || !reviewedBy) {
      return NextResponse.json(
        { error: "verificationId, action, and reviewedBy are required" },
        { status: 400 },
      );
    }

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'approved' or 'rejected'" },
        { status: 400 },
      );
    }

    await reviewVerification({
      verificationId,
      reviewerId: reviewedBy,
      status: action,
      rejectionReason,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "PATCH /api/admin/verifications failed");
    return NextResponse.json({ error: "Failed to review verification" }, { status: 500 });
  }
}
