// ─── GET /api/prescriptions/[id]/status ──────────────────────
// Returns registration status for both OSDE and RCTA channels.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { logger } from "@/lib/logger";
import { isRCTAConfigured, getPrescriptionStatus } from "@/lib/services/rcta";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;

  // TODO: Fetch prescription from Firestore to get stored registration data
  // const prescriptionDoc = await db.collection('prescriptions').doc(id).get();

  const result: {
    prescriptionId: string;
    osde?: { status: string; registeredAt?: string };
    rcta?: { status: string; prescriptionId?: string; pdfUrl?: string; dispensedAt?: string };
  } = {
    prescriptionId: id,
  };

  // ── Check RCTA status if credentials are available
  if (isRCTAConfigured()) {
    try {
      // TODO: Get rctaPrescriptionId from Firestore doc
      const rctaStatus = await getPrescriptionStatus(id);
      result.rcta = {
        status: rctaStatus.status,
        prescriptionId: id,
        pdfUrl: rctaStatus.pdfUrl,
        dispensedAt: rctaStatus.dispensedAt,
      };
    } catch (err) {
      logger.warn({ err, prescriptionId: id }, "Failed to check RCTA status");
      result.rcta = { status: "unknown" };
    }
  }

  // ── Demo mode response
  if (!result.osde && !result.rcta) {
    return NextResponse.json({
      prescriptionId: id,
      status: "demo",
      message: "Prescription status check — demo mode (no RCTA/OSDE credentials configured)",
    });
  }

  return NextResponse.json(result);
}
