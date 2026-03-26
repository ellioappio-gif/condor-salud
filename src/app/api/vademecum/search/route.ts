// ─── Vademécum Drug Search API ───────────────────────────────
// GET /api/vademecum/search?q=losartan&limit=10

import { NextResponse } from "next/server";
import { searchDrugs } from "@/lib/services/vademecum";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
  const includeControlled = searchParams.get("controlled") === "true";

  if (!q || q.length < 2) {
    return NextResponse.json({ drugs: [], source: "local", total: 0 });
  }

  const result = await searchDrugs(q, { limit, includeControlled });
  return NextResponse.json(result);
}
