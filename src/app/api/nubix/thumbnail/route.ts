import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { isDcm4cheeConfigured, createDCM4CHEEClient } from "@/lib/dcm4chee/client";
import { logger } from "@/lib/logger";

/** Generate a simple medical cross SVG placeholder (128×128) */
function placeholderSVG(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#1a1a2e" rx="4"/>
  <rect x="52" y="24" width="24" height="80" fill="#3A6A99" rx="3"/>
  <rect x="24" y="52" width="80" height="24" fill="#3A6A99" rx="3"/>
  <text x="64" y="120" text-anchor="middle" fill="#737373" font-size="10" font-family="sans-serif">DICOM</text>
</svg>`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const studyUID = searchParams.get("studyUID");
  const seriesUID = searchParams.get("seriesUID");
  const instanceUID = searchParams.get("instanceUID");

  // ── Demo mode: return placeholder SVG ──
  if (!isDcm4cheeConfigured()) {
    return new NextResponse(placeholderSVG(), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // ── Live mode: proxy WADO-URI ──
  if (!studyUID || !seriesUID || !instanceUID) {
    return NextResponse.json({ error: "Missing UID params" }, { status: 400 });
  }

  try {
    const client = createDCM4CHEEClient();
    if (!client) {
      return new NextResponse(placeholderSVG(), {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    const thumbnailUrl = client.getThumbnailUrl(studyUID, seriesUID, instanceUID);
    const res = await fetch(thumbnailUrl, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return new NextResponse(placeholderSVG(), {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    logger.error({ err, route: "nubix/thumbnail" }, "Thumbnail fetch failed");
    return new NextResponse(placeholderSVG(), {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
}
