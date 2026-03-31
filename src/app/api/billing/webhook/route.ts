import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { handleSubscriptionWebhook } from "@/lib/services/seat-billing";
import { logger } from "@/lib/logger";

/**
 * POST /api/billing/webhook
 * MercadoPago PreApproval webhook handler.
 * Processes subscription status changes and auto-downgrades lapsed subscriptions.
 * Verifies webhook signature via HMAC (same pattern as payments/webhook).
 */
export async function POST(req: NextRequest) {
  try {
    // ── HMAC Signature Verification ──
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    // MercadoPago sends raw JSON body
    const body = (await req.json()) as {
      type?: string;
      data?: { id?: string };
      action?: string;
    };

    if (webhookSecret && xSignature) {
      const parts: Record<string, string> = {};
      (xSignature || "").split(",").forEach((part) => {
        const [k, v] = part.trim().split("=");
        if (k && v) parts[k] = v;
      });
      const ts = parts["ts"] || "";
      const hash = parts["v1"] || "";
      const dataId = body.data?.id || "";
      const manifest = `id:${dataId};request-id:${xRequestId || ""};ts:${ts};`;
      const expected = createHmac("sha256", webhookSecret).update(manifest).digest("hex");

      if (hash !== expected) {
        logger.warn("Billing webhook HMAC signature mismatch");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (webhookSecret) {
      // Secret configured but no signature in request—reject
      logger.warn("Billing webhook missing x-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Only handle preapproval events
    if (body.type !== "preapproval" && body.type !== "subscription_preapproval") {
      return NextResponse.json({ received: true });
    }

    const subscriptionId = body.data?.id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
    }

    // In production: fetch the PreApproval from MercadoPago to get current status
    // const mp = new MercadoPago(process.env.MP_ACCESS_TOKEN);
    // const preapproval = await mp.preapproval.get({ id: subscriptionId });
    // const status = preapproval.status; // "authorized", "paused", "cancelled", "pending"

    const status = body.action || "authorized";
    await handleSubscriptionWebhook(subscriptionId, status);

    return NextResponse.json({ received: true, processed: true });
  } catch (err) {
    logger.error({ err }, "[Billing Webhook] Error");
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
