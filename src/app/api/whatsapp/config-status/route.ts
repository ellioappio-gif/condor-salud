/**
 * GET /api/whatsapp/config-status
 *
 * Returns whether the current user's clinic already has WhatsApp configured.
 * Used by the onboarding wizard to skip step 2 when a number is pre-configured
 * (e.g. Centro Médico Roca — set up at the system level).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
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
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ configured: false });

  const { data: profile } = await supabase
    .from("profiles")
    .select("clinic_id")
    .eq("id", user.id)
    .single();

  if (!profile?.clinic_id) return NextResponse.json({ configured: false });

  const { data: config } = await supabase
    .from("whatsapp_config")
    .select("whatsapp_number, provider")
    .eq("clinic_id", profile.clinic_id)
    .single();

  return NextResponse.json({
    configured: !!config?.whatsapp_number,
    number: config?.whatsapp_number ?? null,
    provider: config?.provider ?? null,
  });
}
