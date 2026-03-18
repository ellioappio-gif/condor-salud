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
const DEMO_ALERTAS = [
  {
    id: "ALR-001",
    tipo: "pago",
    titulo: "Pago recibido — OSDE",
    detalle: "Se acreditó el pago de OSDE correspondiente al período enero 2026 por $1.245.800.",
    fecha: "2026-03-07",
    acento: "celeste",
    read: false,
  },
  {
    id: "ALR-002",
    tipo: "rechazo",
    titulo: "3 rechazos nuevos — PAMI",
    detalle:
      "Se detectaron 3 nuevos rechazos en la última presentación de PAMI. Motivo principal: documentación faltante.",
    fecha: "2026-03-07",
    acento: "gold",
    read: false,
  },
  {
    id: "ALR-003",
    tipo: "nomenclador",
    titulo: "Actualización arancelaria — Swiss Medical",
    detalle:
      "Swiss Medical publicó nuevos aranceles vigentes desde 01/03/2026. Incremento promedio: 12.5%.",
    fecha: "2026-03-06",
    acento: "celeste",
    read: false,
  },
  {
    id: "ALR-004",
    tipo: "vencimiento",
    titulo: "Stock crítico — Guantes nitrilo M",
    detalle:
      "El stock de guantes nitrilo talle M está por debajo del mínimo (5 cajas de 15 requeridas).",
    fecha: "2026-03-06",
    acento: "gold",
    read: false,
  },
  {
    id: "ALR-005",
    tipo: "vencimiento",
    titulo: "Stock crítico — Tiras reactivas glucemia",
    detalle: "Solo quedan 3 cajas de tiras reactivas (mínimo: 10). Vencimiento cercano: 06/2026.",
    fecha: "2026-03-06",
    acento: "celeste",
    read: true,
  },
  {
    id: "ALR-006",
    tipo: "vencimiento",
    titulo: "Vencimiento de autorización — Holter (Ramírez)",
    detalle:
      "La autorización de Swiss Medical para Holter 24hs de Sofía Ramírez vence el 28/02. Renovar antes de presentar.",
    fecha: "2026-03-05",
    acento: "gold",
    read: true,
  },
  {
    id: "ALR-007",
    tipo: "inflacion",
    titulo: "Backup del sistema completado",
    detalle: "El backup diario del sistema se completó exitosamente a las 03:00. Tamaño: 2.4GB.",
    fecha: "2026-03-07",
    acento: "celeste",
    read: true,
  },
  {
    id: "ALR-008",
    tipo: "nomenclador",
    titulo: "Nuevo arancel PAMI — Resolución 2024/2026",
    detalle:
      "Se publicó la Resolución 2024/2026 con actualización de aranceles PAMI vigente desde 01/03/2026.",
    fecha: "2026-03-04",
    acento: "gold",
    read: true,
  },
  {
    id: "ALR-009",
    tipo: "pago",
    titulo: "Demora en pago — Galeno",
    detalle:
      "El pago de Galeno correspondiente a enero 2026 supera los 90 días. Monto pendiente: $342.600.",
    fecha: "2026-03-03",
    acento: "gold",
    read: true,
  },
  {
    id: "ALR-010",
    tipo: "vencimiento",
    titulo: "Presentación vence mañana — IOMA",
    detalle: "La fecha límite de presentación del período febrero 2026 para IOMA es el 10/03/2026.",
    fecha: "2026-03-09",
    acento: "gold",
    read: false,
  },
];

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
