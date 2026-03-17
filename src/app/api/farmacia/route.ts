import { NextRequest, NextResponse } from "next/server";
import {
  getMedications,
  getPrescriptions,
  getDeliveries,
  getRecurringOrders,
  createPrescription,
  updateDeliveryStatus,
  getFarmaciaKPIs,
} from "@/lib/services/farmacia";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { farmaciaActionSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "medications";

  try {
    switch (resource) {
      case "medications":
        return NextResponse.json(await getMedications());
      case "prescriptions":
        return NextResponse.json(await getPrescriptions());
      case "deliveries":
        return NextResponse.json(await getDeliveries());
      case "recurring":
        return NextResponse.json(await getRecurringOrders());
      case "kpis":
        return NextResponse.json(await getFarmaciaKPIs());
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "farmacia", resource }, "Farmacia GET error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Rate limit: 10 req / 60s per IP ──
  const limited = checkRateLimit(req, "farmacia", { limit: 10, windowSec: 60 });
  if (limited) return limited;

  try {
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);

    // Validate request body shape
    const parsed = farmaciaActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { action } = parsed.data;

    switch (action) {
      case "create-prescription": {
        const rx = await createPrescription(
          parsed.data.data as Parameters<typeof createPrescription>[0],
        );
        return NextResponse.json(rx);
      }
      case "update-delivery": {
        await updateDeliveryStatus(
          parsed.data.deliveryId,
          parsed.data.status,
          parsed.data.progress,
        );
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "farmacia" }, "Farmacia POST error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
