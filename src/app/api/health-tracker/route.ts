// Health Tracker API
// GET  → timeline + categories
// POST → record measurement
// DELETE → delete measurement

import { NextRequest, NextResponse } from "next/server";
import {
  getCategories,
  recordMeasurement,
  getTimeline,
  getCategoryStats,
  deleteMeasurement,
} from "@/lib/services/health-tracker";
import { requirePatientAuth } from "@/lib/security/jwt-auth";
import { logger } from "@/lib/logger";

async function getPatientId(req: NextRequest): Promise<string | NextResponse> {
  const auth = await requirePatientAuth(req);
  if (auth.error) return auth.error;
  return auth.user.id;
}

export async function GET(req: NextRequest) {
  try {
    const result = await getPatientId(req);
    if (result instanceof NextResponse) return result;
    const patientId = result;
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "categories") {
      const categories = await getCategories();
      return NextResponse.json({ categories });
    }

    if (action === "stats") {
      const categoryId = url.searchParams.get("categoryId");
      if (!categoryId) {
        return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
      }
      const days = parseInt(url.searchParams.get("days") || "30");
      const stats = await getCategoryStats(patientId, categoryId, days);
      return NextResponse.json({ stats });
    }

    // Default: timeline
    const categoryId = url.searchParams.get("categoryId") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const [timeline, categories] = await Promise.all([
      getTimeline(patientId, { categoryId, limit }),
      getCategories(),
    ]);

    return NextResponse.json({ timeline, categories });
  } catch (err) {
    logger.error({ err }, "GET /api/health-tracker failed");
    return NextResponse.json({ timeline: [], categories: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await getPatientId(req);
    if (result instanceof NextResponse) return result;
    const patientId = result;
    const body = await req.json();

    if (!body.categoryId || body.value === undefined) {
      return NextResponse.json({ error: "categoryId and value are required" }, { status: 400 });
    }

    const item = await recordMeasurement({
      patientId,
      categoryId: body.categoryId,
      value: Number(body.value),
      unit: body.unit,
      notes: body.notes,
      measuredAt: body.measuredAt,
    });

    return NextResponse.json({ item });
  } catch (err) {
    logger.error({ err }, "POST /api/health-tracker failed");
    return NextResponse.json({ error: "Failed to record measurement" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const result = await getPatientId(req);
    if (result instanceof NextResponse) return result;
    const patientId = result;
    const url = new URL(req.url);
    const itemId = url.searchParams.get("id");

    if (!itemId) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deleteMeasurement(itemId, patientId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/health-tracker failed");
    return NextResponse.json({ error: "Failed to delete measurement" }, { status: 500 });
  }
}
