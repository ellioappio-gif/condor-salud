// ─── Alertas API Route ───────────────────────────────────────
// GET  /api/alertas          → list alerts for the clinic
// PATCH /api/alertas         → mark alerts read / dismiss
//
// Alerts come from the `alertas` table (migration 002).
// Falls back to demo data when Supabase is not configured.

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { isSupabaseConfigured } from "@/lib/env";

function getServiceClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Demo fallback ───────────────────────────────────────────
const DEMO_ALERTAS: {
  id: string;
  tipo: string;
  titulo: string;
  detalle: string;
  fecha: string;
  acento: string;
  read: boolean;
}[] = [];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "alertas-read", { limit: 30, windowSec: 60 });
  if (limited) return limited;

  try {
    if (isSupabaseConfigured()) {
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from("alertas")
        .select("*")
        .eq("clinic_id", auth.user.clinicId)
        .order("fecha", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data && data.length > 0) {
        return NextResponse.json({ alertas: data });
      }
    }

    // Demo fallback
    return NextResponse.json({ alertas: DEMO_ALERTAS });
  } catch (err) {
    logger.error({ err, route: "alertas" }, "Failed to fetch alerts");
    return NextResponse.json({ alertas: DEMO_ALERTAS });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "alertas-write", { limit: 15, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = sanitizeBody(await request.json());
    const { action, ids } = body as {
      action: "mark_read" | "mark_all_read" | "dismiss";
      ids?: string[];
    };

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: "Demo mode — no changes persisted" });
    }

    const supabase = getServiceClient();

    if (action === "mark_all_read") {
      await supabase
        .from("alertas")
        .update({ read: true })
        .eq("clinic_id", auth.user.clinicId)
        .eq("read", false);
    } else if (action === "mark_read" && ids?.length) {
      await supabase
        .from("alertas")
        .update({ read: true })
        .eq("clinic_id", auth.user.clinicId)
        .in("id", ids);
    } else if (action === "dismiss" && ids?.length) {
      await supabase.from("alertas").delete().eq("clinic_id", auth.user.clinicId).in("id", ids);
    }

    logger.info({ route: "alertas", action, count: ids?.length }, "Alert action");
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err, route: "alertas" }, "Failed to update alerts");
    return NextResponse.json({ error: "Error actualizando alertas" }, { status: 500 });
  }
}
