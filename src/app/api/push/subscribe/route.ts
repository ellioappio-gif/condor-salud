import { NextRequest, NextResponse } from "next/server";
import { logger, checkRateLimit } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { z } from "zod";

// ── Zod schema for push subscription ─────────────────────────
const pushSubscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url("Endpoint must be a valid URL"),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
    expirationTime: z.number().nullable().optional(),
  }),
});

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
  // ── S-01: Require auth to store subscriptions ──
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Rate limit: 10 req / 60s per IP ──
  const limited = checkRateLimit(req, "push-subscribe", { limit: 10, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await req.json();

    // ── I-04: Zod validation ──
    const parsed = pushSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid subscription payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { subscription } = parsed.data;

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
