// ─── AR Aging API ─────────────────────────────────────────────
// GET /api/billing/aging → aging buckets grouped by financiador
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { isSupabaseConfigured } from "@/lib/env";

interface AgingRow {
  financiador: string;
  corriente: number;
  dias30: number;
  dias60: number;
  dias90: number;
}

const DEMO_AGING: AgingRow[] = [
  { financiador: "PAMI", corriente: 845200, dias30: 612400, dias60: 234500, dias90: 156800 },
  { financiador: "OSDE", corriente: 523600, dias30: 312000, dias60: 98400, dias90: 0 },
  { financiador: "Swiss Medical", corriente: 412800, dias30: 187600, dias60: 0, dias90: 0 },
  { financiador: "IOMA", corriente: 298400, dias30: 245600, dias60: 178900, dias90: 89200 },
  { financiador: "Galeno", corriente: 187200, dias30: 0, dias60: 0, dias90: 0 },
  { financiador: "Particular", corriente: 156000, dias30: 78400, dias60: 45200, dias90: 32100 },
];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "billing-aging", { limit: 30, windowSec: 60 });
  if (limited) return limited;

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ aging: DEMO_AGING });
    }

    // Live mode: bucket invoices by age
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const clinicId = auth.user?.clinicId;
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("financiador, monto, fecha, estado")
      .eq("clinic_id", clinicId)
      .in("estado", ["presentada", "pendiente", "en_observacion"]);

    if (error) {
      logger.error({ error }, "Aging query failed");
      return NextResponse.json({ aging: DEMO_AGING });
    }

    const now = Date.now();
    const buckets: Record<string, AgingRow> = {};

    for (const inv of invoices ?? []) {
      const age = Math.floor((now - new Date(inv.fecha).getTime()) / 86400000);
      if (!buckets[inv.financiador]) {
        buckets[inv.financiador] = {
          financiador: inv.financiador,
          corriente: 0,
          dias30: 0,
          dias60: 0,
          dias90: 0,
        };
      }
      const b = buckets[inv.financiador]!;
      if (age <= 30) b.corriente += inv.monto;
      else if (age <= 60) b.dias30 += inv.monto;
      else if (age <= 90) b.dias60 += inv.monto;
      else b.dias90 += inv.monto;
    }

    const aging = Object.values(buckets).sort(
      (a, b) =>
        b.corriente +
        b.dias30 +
        b.dias60 +
        b.dias90 -
        (a.corriente + a.dias30 + a.dias60 + a.dias90),
    );
    return NextResponse.json({ aging: aging.length > 0 ? aging : DEMO_AGING });
  } catch (err) {
    logger.error({ err }, "Aging API error");
    return NextResponse.json({ aging: DEMO_AGING });
  }
}
