/**
 * POST /api/whatsapp/360dialog-connect
 *
 * Called by the onboarding page (client-side) after 360dialog's Connect popup
 * sends a postMessage with the channel credentials.
 *
 * Body (from 360dialog postMessage):
 *   {
 *     channels: [{ apiKey: string; waba_id?: string; phone_number?: string }]
 *   }
 *
 * Stores the first channel's apiKey as `meta_access_token` in whatsapp_config
 * with provider = "meta".  This is a drop-in replacement for the Meta Cloud API
 * credentials already used by whatsapp.ts — no send/receive logic changes needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type Channel = {
  apiKey: string;
  waba_id?: string;
  phone_number?: string;
  id?: string;
};

type Body = {
  channels: Channel[];
};

export async function POST(req: NextRequest) {
  /* ── Auth: resolve clinic from session ──────────────────── */
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* read-only in middleware */
          }
        },
      },
    },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "No autenticado." }, { status: 401 });
  }

  /* ── Resolve clinic_id ──────────────────────────────────── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("id", user.id)
    .single();

  const clinicId = profile?.clinic_id as string | undefined;
  if (!clinicId) {
    return NextResponse.json({ success: false, error: "Clínica no encontrada." }, { status: 400 });
  }

  /* ── Parse body ─────────────────────────────────────────── */
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "Cuerpo inválido." }, { status: 400 });
  }

  const channel = body?.channels?.[0];
  if (!channel?.apiKey) {
    return NextResponse.json(
      { success: false, error: "No se recibió la API key de 360dialog." },
      { status: 400 },
    );
  }

  /* ── Optionally fetch phone number from 360dialog ───────── */
  // 360dialog returns phone_number directly in the postMessage channel object.
  // If it's missing we fall back to querying the 360dialog API.
  let phoneNumber = channel.phone_number ?? null;
  let phoneNumberId = channel.id ?? null;

  if (!phoneNumber && channel.apiKey) {
    try {
      const resp = await fetch("https://waba.360dialog.io/v1/configs/webhook", {
        headers: { "D360-API-KEY": channel.apiKey },
      });
      if (resp.ok) {
        const configData = (await resp.json()) as {
          waba_account?: { phone_numbers?: { display_phone_number?: string; id?: string }[] };
        };
        const firstNumber = configData?.waba_account?.phone_numbers?.[0];
        phoneNumber = firstNumber?.display_phone_number ?? null;
        phoneNumberId = firstNumber?.id ?? null;
      }
    } catch {
      /* non-fatal — continue without phone number */
    }
  }

  /* ── Upsert whatsapp_config ─────────────────────────────── */
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: upsertError } = await adminClient.from("whatsapp_config").upsert(
    {
      clinic_id: clinicId,
      provider: "meta",
      meta_access_token: channel.apiKey,
      ...(phoneNumberId ? { meta_phone_number_id: phoneNumberId } : {}),
      ...(phoneNumber ? { whatsapp_number: phoneNumber } : {}),
      ...(channel.waba_id ? { waba_id: channel.waba_id } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clinic_id" },
  );

  if (upsertError) {
    console.error("[360dialog-connect] upsert error:", upsertError);
    return NextResponse.json(
      { success: false, error: "Error guardando la configuración." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, phoneNumber });
}
