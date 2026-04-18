import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const npsSchema = z.object({
  appointmentId: z.string().uuid(),
  score: z.number().int().min(0).max(10),
  feedback: z.string().max(500).optional(),
});

const DEMO_STATS = {
  score: 72,
  total: 48,
  promoters: 29,
  passives: 12,
  detractors: 7,
  recentComments: [
    {
      score: 9,
      feedback: "Excelente atención, muy profesional.",
      createdAt: "2025-04-10T10:00:00Z",
      doctorName: "Dr. Francisco Martínez",
    },
    {
      score: 10,
      feedback: "Me sentí muy cómoda. Recomiendo 100%.",
      createdAt: "2025-04-08T14:00:00Z",
      doctorName: "Dra. Carolina López",
    },
    {
      score: 7,
      feedback: "Buena atención pero mucha espera.",
      createdAt: "2025-04-05T09:00:00Z",
      doctorName: "Dr. Alejandro Ruiz",
    },
    {
      score: 3,
      feedback: "No me explicaron bien el diagnóstico.",
      createdAt: "2025-04-03T16:00:00Z",
      doctorName: "Dra. Laura Sánchez",
    },
    {
      score: 9,
      feedback: "Muy atento y dedicado.",
      createdAt: "2025-04-01T11:00:00Z",
      doctorName: "Dr. Francisco Martínez",
    },
  ],
};

// GET — NPS stats for dashboard
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(DEMO_STATS);

    const { data: surveys } = await (supabase as any)
      .from("nps_surveys")
      .select("score, feedback, created_at, doctor_id")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!surveys || surveys.length === 0) return NextResponse.json(DEMO_STATS);

    const promoters = surveys.filter((s: any) => s.score >= 9).length;
    const detractors = surveys.filter((s: any) => s.score <= 6).length;
    const passives = surveys.length - promoters - detractors;
    const npsScore = Math.round(((promoters - detractors) / surveys.length) * 100);

    return NextResponse.json({
      score: npsScore,
      total: surveys.length,
      promoters,
      passives,
      detractors,
      recentComments: surveys
        .filter((s: any) => s.feedback)
        .slice(0, 5)
        .map((s: any) => ({
          score: s.score,
          feedback: s.feedback,
          createdAt: s.created_at,
        })),
    });
  } catch {
    return NextResponse.json(DEMO_STATS);
  }
}

// POST — Submit NPS rating
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = npsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, demo: true });
    }

    const { error } = await (supabase as any).from("nps_surveys").insert({
      appointment_id: parsed.data.appointmentId,
      patient_id: user.id,
      clinic_id: user.user_metadata?.clinic_id,
      score: parsed.data.score,
      feedback: parsed.data.feedback,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Ya respondiste esta encuesta" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error guardando encuesta" }, { status: 500 });
  }
}
