import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/security/api-guard";

/**
 * POST /api/push/subscribe
 * Stores a push subscription for the current user.
 *
 * Body: { subscription: PushSubscription (from navigator.serviceWorker) }
 *
 * The VAPID public key should be exposed via GET so the client
 * can call pushManager.subscribe({ applicationServerKey }).
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription } = body;

    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Missing subscription endpoint" }, { status: 400 });
    }

    // Store in Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(supabaseUrl, supabaseKey);

      const { error } = await sb.from("push_subscriptions").upsert(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          user_agent: req.headers.get("user-agent") ?? "",
          created_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

      if (error) {
        logger.error({ error, route: "push/subscribe" }, "Failed to store push subscription");
        return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 });
      }
    }

    logger.info({ endpoint: subscription.endpoint.slice(0, 50) }, "Push subscription registered");

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err, route: "push/subscribe" }, "Push subscribe error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/push/subscribe
 * Returns the VAPID public key so the client can subscribe.
 */
export async function GET() {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

  if (!vapidKey) {
    return NextResponse.json(
      { error: "VAPID key not configured", vapidPublicKey: "" },
      { status: 200 },
    );
  }

  return NextResponse.json({ vapidPublicKey: vapidKey });
}
