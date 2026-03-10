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

export async function GET(req: NextRequest) {
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
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create-prescription": {
        const rx = await createPrescription(body.data);
        return NextResponse.json(rx);
      }
      case "update-delivery": {
        await updateDeliveryStatus(body.deliveryId, body.status, body.progress ?? 0);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
