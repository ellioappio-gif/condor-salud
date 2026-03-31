import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { logger } from "@/lib/logger";
import * as club from "@/lib/services/club";

// POST /api/club/webhook — MercadoPago subscription webhook
export async function POST(request: NextRequest) {
  try {
    // ── HMAC Signature Verification ──
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    const body = await request.json();

    if (webhookSecret && xSignature) {
      const parts: Record<string, string> = {};
      (xSignature || "").split(",").forEach((part) => {
        const [k, v] = part.trim().split("=");
        if (k && v) parts[k] = v;
      });
      const ts = parts["ts"] || "";
      const hash = parts["v1"] || "";
      const dataId = (body?.data?.id as string) || "";
      const manifest = `id:${dataId};request-id:${xRequestId || ""};ts:${ts};`;
      const expected = createHmac("sha256", webhookSecret).update(manifest).digest("hex");

      if (hash !== expected) {
        logger.warn("Club webhook HMAC signature mismatch");
        return NextResponse.json({ received: true }); // 200 to prevent retries
      }
    } else if (webhookSecret) {
      logger.warn("Club webhook missing x-signature header");
      return NextResponse.json({ received: true }); // 200 to prevent retries
    }

    // MercadoPago subscription events
    const subscriptionId = body?.data?.id || body?.subscription_preapproval_id;
    const action = body?.action || body?.type;

    if (!subscriptionId) {
      return NextResponse.json({ received: true }); // Acknowledge unknown format
    }

    let status: "authorized" | "paused" | "cancelled" = "authorized";
    if (action === "subscription_preapproval.cancelled" || action === "cancelled") {
      status = "cancelled";
    } else if (action === "subscription_preapproval.paused" || action === "paused") {
      status = "paused";
    }

    await club.processSubscriptionWebhook({ subscriptionId, status });

    logger.info({ subscriptionId, status }, "Club webhook processed");
    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error({ err }, "POST /api/club/webhook failed");
    return NextResponse.json({ received: true }); // Always 200 for webhooks
  }
}
