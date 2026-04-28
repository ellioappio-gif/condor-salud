// POST /api/auth/complete-setup
// Called when a staff user finishes first-run onboarding.
// Sets user_metadata.wa_setup_complete = true so middleware
// stops redirecting them to /dashboard/bienvenida-recepcion.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  void request; // no body needed

  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({
    data: { wa_setup_complete: true },
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
