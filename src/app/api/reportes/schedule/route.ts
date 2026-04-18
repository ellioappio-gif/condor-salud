// ─── Report Schedule API ──────────────────────────────────────
// GET  /api/reportes/schedule  → list schedules
// POST /api/reportes/schedule  → create/update a schedule
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { isSupabaseConfigured } from "@/lib/env";
import { z } from "zod";

const scheduleSchema = z.object({
  reportId: z.string().min(1),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  format: z.enum(["pdf", "excel", "both"]).default("pdf"),
  recipients: z.array(z.string().email()).min(1, "Al menos un destinatario"),
  enabled: z.boolean().default(true),
});

// Demo fallback
const DEMO_SCHEDULES = [
  {
    id: "SCH-1",
    reportId: "R01",
    frequency: "monthly",
    format: "pdf",
    recipients: ["admin@clinica.com"],
    enabled: true,
    nextRun: "2026-04-01",
  },
  {
    id: "SCH-2",
    reportId: "R02",
    frequency: "weekly",
    format: "excel",
    recipients: ["facturacion@clinica.com"],
    enabled: true,
    nextRun: "2026-03-14",
  },
];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "report-schedule-read", { limit: 30, windowSec: 60 });
  if (limited) return limited;

  try {
    if (isSupabaseConfigured()) {
      const { createClient } = require("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { data, error } = await supabase
        .from("report_schedules")
        .select("*")
        .eq("clinic_id", auth.user.clinicId)
        .order("created_at", { ascending: false });

      if (!error && data?.length) {
        return NextResponse.json({ schedules: data });
      }
    }
    return NextResponse.json({ schedules: DEMO_SCHEDULES });
  } catch (err) {
    logger.error({ err }, "Report schedule GET error");
    return NextResponse.json({ schedules: DEMO_SCHEDULES });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "report-schedule-write", { limit: 10, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = sanitizeBody(await req.json());
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: "Demo mode — no changes persisted" });
    }

    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.from("report_schedules").upsert(
      {
        clinic_id: auth.user.clinicId,
        report_id: parsed.data.reportId,
        frequency: parsed.data.frequency,
        format: parsed.data.format,
        recipients: parsed.data.recipients,
        enabled: parsed.data.enabled,
      },
      { onConflict: "clinic_id,report_id" },
    );

    if (error) throw error;
    logger.info({ route: "report-schedule" }, "Schedule saved");
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Report schedule POST error");
    return NextResponse.json({ error: "Error guardando programación" }, { status: 500 });
  }
}
