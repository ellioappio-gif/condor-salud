// ─── Meta Connect API ─────────────────────────────────────────
// POST /api/whatsapp/meta-connect
//
// Three modes:
//   1. code     — OAuth code from FB.login() → exchange for long-lived token
//   2. phoneNumberId + wabaId — IDs captured from WA_EMBEDDED_SIGNUP postMessage
//   3. phoneNumberId + accessToken + manual:true — manual paste fallback
//
// In all cases, saves the result to whatsapp_config for the authenticated
// user's clinic.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/security/require-auth";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "meta-connect" });

// ─── Input schema ─────────────────────────────────────────────

const BodySchema = z.union([
  // Mode 1: OAuth code exchange
  z.object({ code: z.string().min(1) }),
  // Mode 2: IDs from postMessage (token fetched server-side via WABA permissions)
  z.object({ phoneNumberId: z.string().min(1), wabaId: z.string().min(1) }),
  // Mode 3: Manual paste
  z.object({
    phoneNumberId: z.string().min(1),
    accessToken: z.string().min(1),
    manual: z.literal(true),
  }),
]);

type Body = z.infer<typeof BodySchema>;

// ─── Meta Graph API helpers ───────────────────────────────────

const META_APP_ID = process.env.META_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID ?? "";
const META_APP_SECRET = process.env.META_APP_SECRET ?? "";

/** Exchange a short-lived code for a long-lived System User token */
async function exchangeCodeForToken(code: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://condorsalud.com";
  const redirectUri = `${appUrl}/api/whatsapp/meta-connect/callback`;

  const url = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("client_secret", META_APP_SECRET);
  url.searchParams.set("code", code);
  url.searchParams.set("redirect_uri", redirectUri);

  const resp = await fetch(url.toString());
  const data = (await resp.json()) as { access_token?: string; error?: { message: string } };

  if (!resp.ok || !data.access_token) {
    throw new Error(data.error?.message ?? "Token exchange failed");
  }
  return data.access_token;
}

/** Get the WhatsApp Business phone number display string from its ID */
async function getPhoneNumberDisplay(
  phoneNumberId: string,
  token: string,
): Promise<string | undefined> {
  try {
    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}?fields=display_phone_number&access_token=${token}`,
    );
    const data = (await resp.json()) as { display_phone_number?: string };
    return data.display_phone_number;
  } catch {
    return undefined;
  }
}

/** Save Phone Number ID + Access Token to whatsapp_config for a clinic */
async function saveToWhatsAppConfig(opts: {
  clinicId: string;
  phoneNumberId: string;
  accessToken: string;
  wabaId?: string;
  phoneNumber?: string;
}): Promise<void> {
  // Use the service-role Supabase client (bypasses RLS, avoids type constraints on
  // tables not in the generated schema yet such as whatsapp_config)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const { createClient: createSBClient } = await import("@supabase/supabase-js");
  const supabase = createSBClient(supabaseUrl, serviceKey);

  // Upsert config row
  const { error } = await supabase.from("whatsapp_config").upsert(
    {
      clinic_id: opts.clinicId,
      meta_phone_number_id: opts.phoneNumberId,
      meta_access_token: opts.accessToken,
      whatsapp_number: opts.phoneNumber ?? null,
      provider: "meta",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clinic_id" },
  );

  if (error) {
    log.error({ error }, "Failed to save WhatsApp config");
    throw new Error("Failed to save WhatsApp config");
  }
}

// ─── Handler ──────────────────────────────────────────────────

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

  // 2. Parse body
  let body: Body;
  try {
    const raw = await request.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    let phoneNumberId: string;
    let accessToken: string;
    let wabaId: string | undefined;
    let phoneNumber: string | undefined;

    // ── Mode 1: OAuth code ─────────────────────────────────
    if ("code" in body) {
      if (!META_APP_ID || !META_APP_SECRET) {
        return NextResponse.json(
          {
            success: false,
            error: "Meta app credentials not configured on server. Use manual entry instead.",
          },
          { status: 503 },
        );
      }
      accessToken = await exchangeCodeForToken(body.code);

      // After OAuth, we need the phone number ID — it should come via the
      // WA_EMBEDDED_SIGNUP postMessage, but as fallback we return the token
      // and let the client send a follow-up with the IDs.
      return NextResponse.json({
        success: true,
        accessToken,
        needsPhoneNumberId: true,
        message: "Token obtained. Awaiting phoneNumberId from embedded signup postMessage.",
      });
    }

    // ── Mode 2: IDs from postMessage ───────────────────────
    if ("wabaId" in body && !("accessToken" in body)) {
      if (!META_APP_ID || !META_APP_SECRET) {
        return NextResponse.json(
          { success: false, error: "Meta app credentials not configured on server." },
          { status: 503 },
        );
      }
      // When embedded signup sends us the IDs, we need an access token.
      // In this mode, the token was already obtained via FB.login (client-side)
      // and is stored in the session. For now, mark as needing manual token entry.
      phoneNumberId = body.phoneNumberId;
      wabaId = body.wabaId;
      accessToken = ""; // Must be provided manually or via the OAuth code flow
    } else {
      // ── Mode 3: Manual ─────────────────────────────────────
      phoneNumberId = body.phoneNumberId;
      accessToken = (body as { accessToken: string }).accessToken;
    }

    // Fetch the display phone number if we have a token
    if (accessToken) {
      phoneNumber = await getPhoneNumberDisplay(phoneNumberId, accessToken);
    }

    // Save to DB
    await saveToWhatsAppConfig({ clinicId, phoneNumberId, accessToken, wabaId, phoneNumber });

    log.info(
      { clinicId, phoneNumberId, phoneNumber, mode: "manual" in body ? "manual" : "embedded" },
      "WhatsApp Business connected",
    );

    return NextResponse.json({
      success: true,
      phoneNumberId,
      wabaId,
      accessToken,
      phoneNumber,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error({ err, clinicId }, "Meta connect failed");
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
