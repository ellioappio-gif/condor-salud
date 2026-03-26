// ─── DICOM Studies API ───────────────────────────────────────
// GET /api/dicom/studies - Search DICOM studies

import { NextRequest, NextResponse } from "next/server";
import { createDCM4CHEEClient } from "@/lib/dcm4chee/client";
import type { StudySearchParams } from "@/lib/dcm4chee/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const client = createDCM4CHEEClient();
    if (!client) {
      return NextResponse.json({ error: "DCM4CHEE not configured" }, { status: 503 });
    }

    const { searchParams } = req.nextUrl;
    const params: StudySearchParams = {
      patientID: searchParams.get("patientID") || undefined,
      patientName: searchParams.get("patientName") || undefined,
      studyInstanceUID: searchParams.get("studyUID") || undefined,
      accessionNumber: searchParams.get("accessionNumber") || undefined,
      studyDateFrom: searchParams.get("dateFrom") || undefined,
      studyDateTo: searchParams.get("dateTo") || undefined,
      modality: searchParams.get("modality") || undefined,
      limit: Number(searchParams.get("limit")) || 50,
      offset: Number(searchParams.get("offset")) || 0,
    };

    const response = await client.searchStudies(params);

    return NextResponse.json({
      studies: response.data,
      total: response.total,
      offset: response.offset,
      limit: response.limit,
    });
  } catch (error) {
    console.error("Error searching DICOM studies:", error);
    return NextResponse.json({ error: "Failed to search studies" }, { status: 500 });
  }
}
