// ─── DICOM Viewer API ────────────────────────────────────────
// GET /api/dicom/viewer - Redirect to DICOM viewer

import { NextRequest, NextResponse } from "next/server";
import { getStudyViewerUrl } from "@/lib/dcm4chee/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const studyUID = searchParams.get("studyUID");
  const viewerType = searchParams.get("viewer") || "ohif";

  if (!studyUID) {
    return NextResponse.json({ error: "studyUID is required" }, { status: 400 });
  }

  const viewerUrl = getStudyViewerUrl(studyUID, viewerType);

  if (!viewerUrl) {
    return NextResponse.json({ error: "DCM4CHEE not configured" }, { status: 503 });
  }

  return NextResponse.redirect(viewerUrl);
}
