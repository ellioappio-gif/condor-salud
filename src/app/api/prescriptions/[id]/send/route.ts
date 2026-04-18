// ─── Send Prescription API ───────────────────────────────────
// POST /api/prescriptions/[id]/send
// Body: { via: ["whatsapp"] | ["email"] | ["whatsapp", "email"] }
// Marks prescription as sent via the specified channels.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { sendPrescription } from "@/lib/services/prescription-qr";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

const SendSchema = z.object({
  via: z
    .array(z.enum(["whatsapp", "email"]))
    .min(1)
    .default(["whatsapp"]),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "rx-send", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  const { id } = params;

  try {
    const rawBody = await request.json();
    const parsed = SendSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const via = parsed.data.via;

    if (!isSupabaseConfigured()) {
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
    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "UPDATE",
      resourceType: "prescription",
      resourceId: id,
      newValues: { status: "sent", via },
      requestPath: "/api/prescriptions/[id]/send",
    });
    return NextResponse.json({ success: true, prescription: rx });
  } catch (err) {
    logger.error({ err, id }, "Send prescription failed");
    const message = err instanceof Error ? err.message : "Error al enviar receta";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
