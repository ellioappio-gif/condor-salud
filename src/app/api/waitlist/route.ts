import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitize, logger } from "@/lib/security/api-guard";
import { isSupabaseConfigured } from "@/lib/env";
import { waitlistSchema } from "@/lib/validations/schemas";

// S-10: Persist to Supabase when configured; log as structured fallback.

export async function POST(request: NextRequest) {
  // ── Rate limit: 5 req / 60s per IP ──
  const limited = checkRateLimit(request, "waitlist", { limit: 5, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await request.json();

    // ── I-04: Zod validation ──
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Email inválido", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const email = sanitize(parsed.data.email, 254);

    // ── Persist to Supabase if configured ──
    if (isSupabaseConfigured()) {
      try {
        const { getServiceClient } = await import("@/lib/supabase/service");
        const supabase = getServiceClient();
        const { error: dbError } = await supabase
          .from("waitlist")
          .upsert({ email, source: "landing" }, { onConflict: "email" });

        if (dbError) {
          logger.error({ err: dbError, route: "waitlist" }, "Supabase waitlist insert failed");
        } else {
          logger.info({ route: "waitlist" }, "Waitlist signup persisted to Supabase");
        }
      } catch (err) {
        logger.error({ err, route: "waitlist" }, "Supabase waitlist error");
      }
    } else {
      // Structured log fallback — persists in log aggregator (Vercel, Sentry, etc.)
      logger.info(
        { email, route: "waitlist", action: "signup" },
        "Waitlist signup (logged, no DB configured)",
      );
    }

    // ── Notify admin via email ──
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const ts = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Cóndor Salud <notificaciones@condorsalud.com.ar>",
          to: ["admin@condorsalud.com.ar"],
          subject: `Nueva suscripción waitlist: ${email}`,
          html: `<p><strong>${email}</strong> se anotó en la waitlist el ${ts}.</p>`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ message: "¡Listo! Te contactamos pronto." }, { status: 201 });
  } catch (err) {
    logger.error({ err, route: "waitlist" }, "Waitlist error");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
