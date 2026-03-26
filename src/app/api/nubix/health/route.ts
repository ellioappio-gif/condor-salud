import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { isDcm4cheeConfigured, createDCM4CHEEClient } from "@/lib/dcm4chee/client";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Demo mode ──
  if (!isDcm4cheeConfigured()) {
    return NextResponse.json({ status: "demo" });
  }

  // ── Live mode: ping dcm4chee ──
  try {
    const client = createDCM4CHEEClient();
    if (!client) {
      return NextResponse.json({ status: "disconnected", error: "Client not initialized" });
    }

    // Lightweight health check — search with limit=1
    await client.searchStudies({ limit: 1 });
    return NextResponse.json({ status: "connected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.warn({ err, route: "nubix/health" }, "PACS health check failed");
    return NextResponse.json({ status: "disconnected", error: message });
  }
}
