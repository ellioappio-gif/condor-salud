// ─── Reminder Config API Route ───────────────────────────────
// GET  /api/config/recordatorios — Read the clinic's reminder settings + templates
// PUT  /api/config/recordatorios — Upsert reminder settings + template active states
//
// Persists to Supabase tables: reminder_config, reminder_templates.
// Falls back to empty response when Supabase is not configured.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { recordatorioConfigPutSchema } from "@/lib/validations/schemas";

import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service config");
  return createClient(url, key);
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "reminder-config-read", { limit: 30, windowSec: 60 });
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ config: null, templates: [] });
  }

  try {
    const { clinicId } = auth.user;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic associated" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: config, error: cfgErr } = await supabase
      .from("reminder_config")
      .select("*")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (cfgErr) {
      logger.error({ err: cfgErr, route: "config/recordatorios" }, "Failed to fetch config");
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const { data: templates, error: tplErr } = await supabase
      .from("reminder_templates")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true });

    if (tplErr) {
      logger.error({ err: tplErr, route: "config/recordatorios" }, "Failed to fetch templates");
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({
      config: config || null,
      templates: templates || [],
    });
  } catch (err) {
    logger.error({ err, route: "config/recordatorios" }, "Unexpected error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT ─────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "reminder-config-write", { limit: 10, windowSec: 60 });
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, message: "Demo mode — settings not persisted" });
  }

  try {
    const { clinicId } = auth.user;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic associated" }, { status: 400 });
    }

    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);

    const parsed = recordatorioConfigPutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = getServiceClient();

    // Upsert config row
    if (parsed.data.config) {
      const cfg = parsed.data.config;
      const row = {
        clinic_id: clinicId,
        auto_send: cfg.auto_send,
        send_24h: cfg.send_24h,
        send_2h: cfg.send_2h,
        send_post_visit: cfg.send_post_visit,
        whatsapp_enabled: cfg.whatsapp_enabled,
        sms_enabled: cfg.sms_enabled,
        email_enabled: cfg.email_enabled,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("reminder_config")
        .upsert(row, { onConflict: "clinic_id" });

      if (upsertErr) {
        logger.error({ err: upsertErr, route: "config/recordatorios" }, "Failed to upsert config");
        return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
      }
    }

    // Upsert template active states
    if (parsed.data.templates && parsed.data.templates.length > 0) {
      for (const tpl of parsed.data.templates) {
        const row = {
          clinic_id: clinicId,
          template_id: tpl.id,
          nombre: tpl.nombre,
          mensaje: tpl.mensaje,
          tipo: tpl.tipo,
          timing: tpl.timing,
          activo: tpl.activo ?? true,
          updated_at: new Date().toISOString(),
        };

        const { error: tplErr } = await supabase
          .from("reminder_templates")
          .upsert(row, { onConflict: "clinic_id,template_id" });

        if (tplErr) {
          logger.error(
            { err: tplErr, template: tpl.id, route: "config/recordatorios" },
            "Failed to upsert template",
          );
        }
      }
    }

    // Return updated state
    const { data: config } = await supabase
      .from("reminder_config")
      .select("*")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    const { data: templates } = await supabase
      .from("reminder_templates")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: true });

    logger.info({ route: "config/recordatorios", clinicId }, "Reminder config saved");

    return NextResponse.json({
      config: config || null,
      templates: templates || [],
    });
  } catch (err) {
    logger.error({ err, route: "config/recordatorios" }, "Unexpected error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
