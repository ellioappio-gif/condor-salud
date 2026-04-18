import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// ─── Schema ──────────────────────────────────────────────────

const adherenceLogSchema = z.object({
  medicationId: z.string().uuid(),
  takenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// ─── Demo Data ───────────────────────────────────────────────

function getDemoHistory() {
  const today = new Date();
  const days: { date: string; taken: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, taken: Math.random() > 0.15 });
  }
  const takenCount = days.filter((d) => d.taken).length;
  return {
    days,
    streak: 5,
    adherenceRate: Math.round((takenCount / days.length) * 100),
    totalTaken: takenCount,
    totalDays: days.length,
  };
}

// ─── GET: Adherence history ──────────────────────────────────

export async function GET() {
  return NextResponse.json(getDemoHistory());
}

// ─── POST: Log a dose ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adherenceLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Demo mode: optimistic success
    return NextResponse.json({
      ok: true,
      medicationId: parsed.data.medicationId,
      takenAt: parsed.data.takenAt,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
