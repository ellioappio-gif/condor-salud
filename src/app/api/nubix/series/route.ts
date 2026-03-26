import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { isDcm4cheeConfigured, createDCM4CHEEClient } from "@/lib/dcm4chee/client";
import { logger } from "@/lib/logger";

// ─── Mock series for demo mode ───────────────────────────────
function getMockSeries(studyUID: string) {
  return [
    {
      seriesInstanceUID: `${studyUID}.1`,
      seriesNumber: 1,
      modality: "CT",
      seriesDescription: "Serie axial con contraste",
      numberOfInstances: 120,
      bodyPartExamined: "CHEST",
    },
    {
      seriesInstanceUID: `${studyUID}.2`,
      seriesNumber: 2,
      modality: "CT",
      seriesDescription: "Reconstrucción coronal",
      numberOfInstances: 80,
      bodyPartExamined: "CHEST",
    },
    {
      seriesInstanceUID: `${studyUID}.3`,
      seriesNumber: 3,
      modality: "CT",
      seriesDescription: "Reconstrucción sagital",
      numberOfInstances: 48,
      bodyPartExamined: "CHEST",
    },
  ];
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const studyInstanceUID = searchParams.get("studyInstanceUID");

  if (!studyInstanceUID) {
    return NextResponse.json({ error: "Missing studyInstanceUID" }, { status: 400 });
  }

  // ── Demo mode ──
  if (!isDcm4cheeConfigured()) {
    return NextResponse.json({ series: getMockSeries(studyInstanceUID) });
  }

  // ── Live mode ──
  try {
    const client = createDCM4CHEEClient();
    if (!client) {
      return NextResponse.json({ error: "PACS not configured" }, { status: 503 });
    }

    const dicomSeries = await client.getStudySeries(studyInstanceUID);
    return NextResponse.json({ series: dicomSeries });
  } catch (err) {
    logger.error({ err, route: "nubix/series" }, "Series fetch failed");
    return NextResponse.json({ error: "Series fetch failed" }, { status: 502 });
  }
}
