// ─── DICOM Series API ────────────────────────────────────────
// GET /api/dicom/series - Get series for a study

import { NextRequest, NextResponse } from "next/server";
import { createDCM4CHEEClient } from "@/lib/dcm4chee/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const client = createDCM4CHEEClient();
    if (!client) {
      return NextResponse.json(
        { error: "DCM4CHEE not configured" },
        { status: 503 },
      );
    }

    const { searchParams } = req.nextUrl;
    const studyUID = searchParams.get("studyUID");

    if (!studyUID) {
      return NextResponse.json(
        { error: "studyUID is required" },
        { status: 400 },
      );
    }

    const response = await client.getStudySeries(studyUID);

    return NextResponse.json({
      series: response.data,
    });
  } catch (error) {
    console.error("Error fetching DICOM series:", error);
    return NextResponse.json(
      { error: "Failed to fetch series" },
      { status: 500 },
    );
  }
}
