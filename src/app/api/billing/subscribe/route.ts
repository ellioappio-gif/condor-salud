import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { getSeatPlan, upgradeToPlan, type SeatPlanId } from "@/lib/services/seat-billing";
import { isMercadoPagoConfigured } from "@/lib/services/mercadopago";
import { logger } from "@/lib/logger";

// ─── Plan ID mapping from env ────────────────────────────────

const PLAN_IDS: Record<string, Record<string, string | undefined>> = {
  profesional: {
    monthly: process.env.MP_PLAN_ID_PROFESIONAL_MONTHLY,
    annual: process.env.MP_PLAN_ID_PROFESIONAL_ANUAL,
  },
  premium: {
    monthly: process.env.MP_PLAN_ID_PREMIUM_MONTHLY,
    annual: process.env.MP_PLAN_ID_PREMIUM_ANUAL,
  },
};

const FRONTEND_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * POST /api/billing/subscribe
 * Create a MercadoPago PreApproval subscription for a doctor.
 * Body: { doctorId, plan, billingCycle, payerEmail }
 *
 * Returns the init_point URL for the doctor to complete payment on MercadoPago.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      doctorId?: string;
      plan?: SeatPlanId;
      billingCycle?: "monthly" | "annual";
      payerEmail?: string;
    };

    if (!body.doctorId || !body.plan || !body.billingCycle || !body.payerEmail) {
      return NextResponse.json(
        { error: "doctorId, plan, billingCycle, and payerEmail are required" },
        { status: 400 },
      );
    }

    const planDef = getSeatPlan(body.plan);
    if (planDef.price === 0) {
      return NextResponse.json({ error: "Cannot subscribe to free plan" }, { status: 400 });
    }

    // ── MercadoPago PreApproval ──────────────────────────────
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { error: "Sistema de pagos no configurado. Contactá soporte." },
        { status: 503 },
      );
    }

    const mpPlanId = PLAN_IDS[body.plan]?.[body.billingCycle];
    const accessToken = process.env.MP_ACCESS_TOKEN!;
    const client = new MercadoPagoConfig({ accessToken });
    const preApproval = new PreApproval(client);

    const price = body.billingCycle === "annual" ? planDef.priceAnnual : planDef.price;
    const externalRef = `seat_${body.doctorId}_${body.plan}_${Date.now()}`;

    const result = await preApproval.create({
      body: {
        reason: `Cóndor Salud — Plan ${planDef.name} (${body.billingCycle === "annual" ? "anual" : "mensual"})`,
        external_reference: externalRef,
        payer_email: body.payerEmail,
        ...(mpPlanId
          ? { preapproval_plan_id: mpPlanId }
          : {
              auto_recurring: {
                frequency: body.billingCycle === "annual" ? 12 : 1,
                frequency_type: "months",
                transaction_amount: price,
                currency_id: "ARS",
              },
            }),
        back_url: `${FRONTEND_URL}/dashboard/configuracion/facturacion?subscription=complete`,
      },
    });

    if (!result.id || !result.init_point) {
      logger.error({ result }, "MercadoPago PreApproval created without init_point");
      return NextResponse.json(
        { error: "Error al crear la suscripción en MercadoPago" },
        { status: 502 },
      );
    }

    // Store subscription record (with trial if applicable)
    const record = await upgradeToPlan(
      body.doctorId,
      body.plan,
      body.billingCycle,
      result.id,
      planDef.trialDays,
    );

    logger.info(
      { doctorId: body.doctorId, plan: body.plan, preApprovalId: result.id },
      "MercadoPago PreApproval subscription created",
    );

    return NextResponse.json({
      success: true,
      subscriptionId: result.id,
      record,
      initPoint: result.init_point,
      trialDays: planDef.trialDays,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create subscription");
    return NextResponse.json({ error: "Error al crear la suscripción" }, { status: 500 });
  }
}
