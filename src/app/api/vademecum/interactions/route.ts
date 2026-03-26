// ─── Vademécum Drug Interaction Check API ────────────────────
// POST /api/vademecum/interactions
// Body: { drugIds: ["d-001", "d-002"] }

import { NextResponse } from "next/server";
import { checkInteractions } from "@/lib/services/vademecum";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const drugIds: string[] = body.drugIds || [];

    if (!Array.isArray(drugIds) || drugIds.length < 2) {
      return NextResponse.json({
        interactions: [],
        hasContraindicated: false,
        hasHigh: false,
      });
    }

    const result = await checkInteractions(drugIds);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al verificar interacciones" }, { status: 500 });
  }
}
