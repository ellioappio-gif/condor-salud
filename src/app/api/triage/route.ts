import { NextRequest, NextResponse } from "next/server";
import { getTriages, createTriage, saveClinicalNote, getTriageKPIs } from "@/lib/services/triage";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { triageActionSchema } from "@/lib/validations/schemas";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

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
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Rate limit: 15 req / 60s per IP ──
  const limited = checkRateLimit(req, "triage", { limit: 15, windowSec: 60 });
  if (limited) return limited;

  try {
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);

    // Validate request body shape
    const parsed = triageActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { action } = parsed.data;

    switch (action) {
      case "create-triage": {
        const triage = await createTriage(parsed.data.data as Parameters<typeof createTriage>[0]);
        return NextResponse.json(triage);
      }
      case "save-clinical-note": {
        const note = await saveClinicalNote(
          parsed.data.data as Parameters<typeof saveClinicalNote>[0],
        );
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
