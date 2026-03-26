// ─── Cancel Prescription API ─────────────────────────────────
// POST /api/prescriptions/[id]/cancel
// Body: { reason?: string }

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { cancelPrescription } from "@/lib/services/prescription-qr";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const body = await request.json().catch(() => ({}));
    const reason = (body as Record<string, string>).reason;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: "Receta anulada (demo)",
      });
    }

    await cancelPrescription(id, reason);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al anular receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
