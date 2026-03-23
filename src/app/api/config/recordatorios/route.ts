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

    const supabase = getServiceClient();

    // Upsert config row
    if (body.config) {
      const row = {
        clinic_id: clinicId,
        auto_send: body.config.auto_send ?? true,
        send_24h: body.config.send_24h ?? true,
        send_2h: body.config.send_2h ?? true,
        send_post_visit: body.config.send_post_visit ?? false,
        whatsapp_enabled: body.config.whatsapp_enabled ?? true,
        sms_enabled: body.config.sms_enabled ?? false,
        email_enabled: body.config.email_enabled ?? false,
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
    if (body.templates && Array.isArray(body.templates)) {
      for (const tpl of body.templates) {
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
