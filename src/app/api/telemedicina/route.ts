import { NextRequest, NextResponse } from "next/server";
import {
  getWaitingRoom,
  getConsultations,
  getScheduledConsultations,
  getTelemedicinaKPIs,
} from "@/lib/services/telemedicina";
import { logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "waiting-room";

  try {
    switch (resource) {
      case "waiting-room":
        return NextResponse.json(await getWaitingRoom());
      case "consultations":
        return NextResponse.json(await getConsultations());
      case "scheduled":
        return NextResponse.json(await getScheduledConsultations());
      case "kpis":
        return NextResponse.json(await getTelemedicinaKPIs());
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "telemedicina", resource }, "Telemedicina GET error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
