import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import * as club from "@/lib/services/club";

// GET /api/club/status?patientId=xxx — Get membership status
export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    const membership = await club.getActiveMembership(patientId);
    const plans = await club.getClubPlans();

    return NextResponse.json({
      isMember: membership !== null,
      membership,
      plans,
    });
  } catch (err) {
    logger.error({ err }, "GET /api/club/status failed");
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
  }
}
