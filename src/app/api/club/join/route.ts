import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import * as club from "@/lib/services/club";

// POST /api/club/join — Join a club plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, planSlug, mpSubscriptionId } = body;

    if (!patientId || !planSlug) {
      return NextResponse.json({ error: "patientId and planSlug are required" }, { status: 400 });
    }

    const membership = await club.createMembership({
      patientId,
      planSlug,
      mpSubscriptionId,
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to join club";
    logger.error({ err }, "POST /api/club/join failed");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
