import { NextRequest, NextResponse } from "next/server";
import { getTriages, createTriage, saveClinicalNote, getTriageKPIs } from "@/lib/services/triage";

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
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create-triage": {
        const triage = await createTriage(body.data);
        return NextResponse.json(triage);
      }
      case "save-clinical-note": {
        const note = await saveClinicalNote(body.data);
        return NextResponse.json(note);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
