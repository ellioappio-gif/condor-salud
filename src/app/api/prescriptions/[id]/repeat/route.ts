// ─── Repeat Prescription API ─────────────────────────────────
// POST /api/prescriptions/[id]/repeat
// Clones an existing prescription as a new draft.

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { repeatPrescription } from "@/lib/services/prescription-qr";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!isSupabaseConfigured()) {
    // Demo mode: simulate repeat
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
    return NextResponse.json({ success: true, prescription: rx });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al repetir receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
