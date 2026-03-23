import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import * as club from "@/lib/services/club";

// POST /api/club/webhook — MercadoPago subscription webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
