import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// SH-07: CSP violation report endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    logger.warn({ cspReport: body }, "CSP violation report");
    return NextResponse.json({ received: true }, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  }
}
