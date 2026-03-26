// ─── Send Prescription API ───────────────────────────────────
// POST /api/prescriptions/[id]/send
// Body: { via: ["whatsapp"] | ["email"] | ["whatsapp", "email"] }
// Marks prescription as sent via the specified channels.

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { sendPrescription } from "@/lib/services/prescription-qr";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const body = await request.json();
    const via: ("whatsapp" | "email")[] = body.via || ["whatsapp"];

    if (!isSupabaseConfigured()) {
      // Demo mode
      return NextResponse.json({
        success: true,
        prescription: {
          id,
          status: "sent",
          sentAt: new Date().toISOString(),
          sentVia: via,
        },
      });
    }

    const rx = await sendPrescription(id, via);
    return NextResponse.json({ success: true, prescription: rx });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
