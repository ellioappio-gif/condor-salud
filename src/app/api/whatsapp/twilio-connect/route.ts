// ─── Twilio Connect API ───────────────────────────────────────
// POST /api/whatsapp/twilio-connect
//
// Called from the receptionist onboarding wizard.
// Validates the supplied Twilio credentials against the Twilio API,
// then saves Account SID, Auth Token, and WhatsApp number to
// whatsapp_config for the authenticated user's clinic.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/security/require-auth";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "twilio-connect" });

const BodySchema = z.object({
  accountSid: z.string().min(34).max(34).regex(/^AC/, "Account SID must start with AC"),
  authToken: z.string().min(32),
  whatsappNumber: z
    .string()
    .min(7)
    .transform((v) => (v.startsWith("+") ? v : `+${v}`)),
});

export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const clinicId = auth.user.clinicId;
  if (!clinicId) {
    return NextResponse.json(
      { success: false, error: "No clinic linked to this account" },
      { status: 400 },
    );
  }

  // 2. Parse + validate body
  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await request.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors
        ? (Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Datos inválidos")
        : "Datos inválidos";
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { accountSid, authToken, whatsappNumber } = body;

  // 3. Verify credentials against Twilio API (lightweight — just fetch the account)
  try {
    const twilioResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
      },
    );

    if (!twilioResp.ok) {
      const err = (await twilioResp.json()) as { message?: string };
      log.warn({ accountSid, status: twilioResp.status }, "Twilio credential verification failed");
      return NextResponse.json(
        {
          success: false,
          error:
            twilioResp.status === 401
              ? "Account SID o Auth Token incorrectos. Revisalos en console.twilio.com."
              : (err.message ?? "Error verificando credenciales de Twilio."),
        },
        { status: 400 },
      );
    }
  } catch {
    // Network error — don't block onboarding, just warn
    log.warn({ accountSid }, "Could not reach Twilio API to verify credentials — saving anyway");
  }

  // 4. Save to whatsapp_config
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase.from("whatsapp_config").upsert(
      {
        clinic_id: clinicId,
        whatsapp_number: whatsappNumber,
        twilio_account_sid: accountSid,
        twilio_auth_token: authToken,
        provider: "twilio",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clinic_id" },
    );

    if (error) {
      log.error({ error, clinicId }, "Failed to save Twilio config");
      return NextResponse.json(
        { success: false, error: "No se pudo guardar la configuración." },
        { status: 500 },
      );
    }

    log.info({ clinicId, whatsappNumber }, "Twilio WhatsApp config saved via onboarding");
    return NextResponse.json({ success: true, whatsappNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error({ err, clinicId }, "Twilio connect exception");
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
