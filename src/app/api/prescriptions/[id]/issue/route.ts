// ─── Issue Prescription API ──────────────────────────────────
// POST /api/prescriptions/[id]/issue
// Transitions a draft prescription to active status.
// Triggers OSDE FHIR registration if coverage matches.

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { issuePrescription } from "@/lib/services/prescription-qr";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!isSupabaseConfigured()) {
    // Demo mode: return a mock issued prescription
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
    return NextResponse.json({ success: true, prescription: rx });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al emitir receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
