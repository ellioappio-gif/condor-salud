import { NextRequest, NextResponse } from "next/server";
import { getTriages, createTriage, saveClinicalNote, getTriageKPIs } from "@/lib/services/triage";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "triages";

  try {
    switch (resource) {
      case "triages":
        return NextResponse.json(await getTriages());
      case "kpis":
        return NextResponse.json(await getTriageKPIs());
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "triage", resource }, "Triage GET error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 15 req / 60s per IP ──
  const limited = checkRateLimit(req, "triage", { limit: 15, windowSec: 60 });
  if (limited) return limited;

  try {
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);
    const { action } = body;

    switch (action) {
      case "create-triage": {
        const triage = await createTriage(body.data as Parameters<typeof createTriage>[0]);
        return NextResponse.json(triage);
      }
      case "save-clinical-note": {
        const note = await saveClinicalNote(body.data as Parameters<typeof saveClinicalNote>[0]);
        return NextResponse.json(note);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "triage" }, "Triage POST error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
