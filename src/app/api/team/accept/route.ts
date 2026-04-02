import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/team/accept?token=xxx
 * Accept a team invitation — links the current user to the clinic.
 * Uses service-role client for all DB writes (RLS bypass).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://condorsalud.com";

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid_token", appUrl));
  }

  try {
    // Check if user is authenticated via Supabase session
    const { createClient } = await import("@/lib/supabase/server");
    const anonSb = createClient();

    const {
      data: { user },
    } = await anonSb.auth.getUser();

    if (!user) {
      // Redirect to login with return URL
      const returnUrl = `/api/team/accept?token=${token}`;
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${encodeURIComponent(returnUrl)}`, appUrl),
      );
    }

    // Use service-role client for all DB operations
    const sb = getServiceClient();

    // Look up the invitation
    const { data: invitation, error: lookupErr } = await sb
      .from("team_invitations")
      .select("id, clinic_id, email, role, status, expires_at")
      .eq("token", token)
      .single();

    if (lookupErr || !invitation) {
      logger.warn({ token: token.substring(0, 8) }, "Invalid team invitation token");
      return NextResponse.redirect(new URL("/dashboard?error=invitacion_invalida", appUrl));
    }

    // Validate status
    if (invitation.status !== "pending") {
      return NextResponse.redirect(
        new URL(`/dashboard?error=invitacion_${invitation.status}`, appUrl),
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await sb
        .from("team_invitations")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", invitation.id);

      return NextResponse.redirect(new URL("/dashboard?error=invitacion_expirada", appUrl));
    }

    // Verify email matches (case-insensitive)
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=email_no_coincide&expected=${encodeURIComponent(invitation.email)}`,
          appUrl,
        ),
      );
    }

    // Check if user already belongs to this clinic
    const { data: existingProfile } = await sb
      .from("profiles")
      .select("id, clinic_id")
      .eq("id", user.id)
      .single();

    if (existingProfile?.clinic_id === invitation.clinic_id) {
      // Already a member — just mark the invitation as accepted
      await sb
        .from("team_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return NextResponse.redirect(new URL("/dashboard?team=already_member", appUrl));
    }

    // Link user to clinic with the invited role
    const { error: updateErr } = await sb
      .from("profiles")
      .update({
        clinic_id: invitation.clinic_id,
        role: invitation.role,
      })
      .eq("id", user.id);

    if (updateErr) {
      logger.error({ err: updateErr, userId: user.id }, "Failed to link user to clinic");
      return NextResponse.redirect(new URL("/dashboard?error=error_interno", appUrl));
    }

    // Mark invitation as accepted
    await sb
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    logger.info(
      {
        userId: user.id,
        clinicId: invitation.clinic_id,
        role: invitation.role,
      },
      "Team invitation accepted",
    );

    return NextResponse.redirect(new URL("/dashboard?team=joined", appUrl));
  } catch (err) {
    logger.error({ err }, "Team accept error");
    return NextResponse.redirect(new URL("/dashboard?error=error_interno", appUrl));
  }
}
