// ─── Payment Config API Route ────────────────────────────────
// GET  /api/config/pagos — Read the clinic's payment settings, methods, and rules
// PUT  /api/config/pagos — Upsert payment settings + billing rules
//
// Persists to Supabase tables: payment_config, billing_rules.
// Integrates with MercadoPago service for payment method data.
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

  const limited = checkRateLimit(req, "payment-config-read", { limit: 30, windowSec: 60 });
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      config: null,
      paymentMethods: [],
      transactions: [],
      billingRules: [],
    });
  }

  try {
    const { clinicId } = auth.user;
    if (!clinicId) {
      return NextResponse.json({ error: "No clinic associated" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Fetch payment config
    const { data: config, error: cfgErr } = await supabase
      .from("payment_config")
      .select("*")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    if (cfgErr) {
      logger.error({ err: cfgErr, route: "config/pagos" }, "Failed to fetch config");
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Fetch billing rules
    const { data: billingRules, error: rulesErr } = await supabase
      .from("billing_rules")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("financiador", { ascending: true });

    if (rulesErr) {
      logger.error({ err: rulesErr, route: "config/pagos" }, "Failed to fetch billing rules");
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Fetch recent transactions (last 50)
    const { data: transactions, error: txErr } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (txErr) {
      logger.error({ err: txErr, route: "config/pagos" }, "Failed to fetch transactions");
      // Non-fatal — continue with empty
    }

    // Fetch patient payment methods
    const { data: paymentMethods, error: pmErr } = await supabase
      .from("patient_payment_methods")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false });

    if (pmErr) {
      logger.error({ err: pmErr, route: "config/pagos" }, "Failed to fetch payment methods");
    }

    return NextResponse.json({
      config: config || null,
      paymentMethods: paymentMethods || [],
      transactions: transactions || [],
      billingRules: billingRules || [],
    });
  } catch (err) {
    logger.error({ err, route: "config/pagos" }, "Unexpected error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PUT ─────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "payment-config-write", { limit: 10, windowSec: 60 });
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

    // Upsert payment config
    if (body.config) {
      const row = {
        clinic_id: clinicId,
        mp_connected: body.config.mp_connected ?? false,
        mp_access_token: body.config.mp_access_token ?? null,
        auto_billing: body.config.auto_billing ?? false,
        send_receipt: body.config.send_receipt ?? true,
        payment_reminder: body.config.payment_reminder ?? true,
        accepted_methods: body.config.accepted_methods ?? [
          "efectivo",
          "debito",
          "credito",
          "transferencia",
          "mercadopago",
        ],
        copay_enabled: body.config.copay_enabled ?? false,
        default_currency: body.config.default_currency ?? "ARS",
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("payment_config")
        .upsert(row, { onConflict: "clinic_id" });

      if (upsertErr) {
        logger.error({ err: upsertErr, route: "config/pagos" }, "Failed to upsert config");
        return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
      }
    }

    // Upsert billing rules
    if (body.billingRules && Array.isArray(body.billingRules)) {
      for (const rule of body.billingRules) {
        const row = {
          clinic_id: clinicId,
          financiador: rule.financiador,
          copago: rule.copago ?? false,
          monto: rule.monto ?? "0",
          auto_charge: rule.autoCharge ?? false,
          updated_at: new Date().toISOString(),
        };

        const { error: ruleErr } = await supabase
          .from("billing_rules")
          .upsert(row, { onConflict: "clinic_id,financiador" });

        if (ruleErr) {
          logger.error(
            { err: ruleErr, financiador: rule.financiador, route: "config/pagos" },
            "Failed to upsert billing rule",
          );
        }
      }
    }

    // Return updated state
    const { data: config } = await supabase
      .from("payment_config")
      .select("*")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    const { data: billingRules } = await supabase
      .from("billing_rules")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("financiador", { ascending: true });

    logger.info({ route: "config/pagos", clinicId }, "Payment config saved");

    return NextResponse.json({
      config: config || null,
      billingRules: billingRules || [],
    });
  } catch (err) {
    logger.error({ err, route: "config/pagos" }, "Unexpected error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
