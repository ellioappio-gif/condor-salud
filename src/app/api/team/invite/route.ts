import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";

/**
 * POST /api/team/invite
 * Send a team invitation email.
 * Body: { email, role }
 *
 * Requires authenticated admin user with a clinic.
 */
export async function POST(req: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get profile + clinic
    const { data: profile } = await sb
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) {
      return NextResponse.json({ error: "No tenés una clínica asociada" }, { status: 403 });
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores pueden invitar miembros" },
        { status: 403 },
      );
    }

    const body = (await req.json()) as { email?: string; role?: string };

    if (!body.email || !body.role) {
      return NextResponse.json({ error: "email y role son obligatorios" }, { status: 400 });
    }

    const validRoles = ["admin", "medico", "facturacion", "recepcion"];
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    // Check for existing pending invitation
    const { data: existing } = await sb
      .from("team_invitations")
      .select("id")
      .eq("clinic_id", profile.clinic_id)
      .eq("email", body.email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 409 },
      );
    }

    // Check if user already belongs to this clinic (skip — we can't look up by email without admin API)
    // The accept endpoint will handle this check when they actually accept

    // Generate secure token
    const token = randomBytes(32).toString("hex");

    // Insert invitation
    const { data: invitation, error: insertErr } = await sb
      .from("team_invitations")
      .insert({
        clinic_id: profile.clinic_id,
        invited_by: user.id,
        email: body.email.toLowerCase(),
        role: body.role,
        token,
      })
      .select("id, email, role, expires_at")
      .single();

    if (insertErr) {
      logger.error({ err: insertErr }, "Failed to create team invitation");
      return NextResponse.json({ error: "Error al crear la invitación" }, { status: 500 });
    }

    // Get clinic name for the email
    const { data: clinic } = await sb
      .from("clinics")
      .select("name")
      .eq("id", profile.clinic_id)
      .single();

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://condorsalud.com";
    const acceptUrl = `${appUrl}/api/team/accept?token=${token}`;

    try {
      // Try Resend first, fall back to Supabase invite
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Cóndor Salud <noreply@condorsalud.com>",
          to: body.email,
          subject: `Te invitaron a ${clinic?.name || "una clínica"} en Cóndor Salud`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto;">
              <h2 style="color: #1a1a2e;">Te invitaron a unirte a ${clinic?.name || "una clínica"}</h2>
              <p style="color: #555;">
                Fuiste invitado/a como <strong>${body.role}</strong> en
                <strong>${clinic?.name || "una clínica"}</strong> en la plataforma Cóndor Salud.
              </p>
              <p>
                <a href="${acceptUrl}"
                   style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px;
                          border-radius: 4px; text-decoration: none; font-weight: bold;">
                  Aceptar invitación
                </a>
              </p>
              <p style="color: #888; font-size: 12px;">
                Este enlace expira en 7 días. Si no esperabas esta invitación, ignorá este email.
              </p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      logger.warn({ err: emailErr }, "Failed to send invitation email — invitation still created");
    }

    logger.info(
      { clinicId: profile.clinic_id, email: body.email, role: body.role },
      "Team invitation created",
    );

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation?.id,
        email: invitation?.email,
        role: invitation?.role,
        expiresAt: invitation?.expires_at,
      },
      acceptUrl, // For admin to share manually if email fails
    });
  } catch (err) {
    logger.error({ err }, "Team invite error");
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * GET /api/team/invite
 * List pending invitations for the current clinic.
 */
export async function GET() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id || profile.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { data: invitations } = await sb
      .from("team_invitations")
      .select("id, email, role, status, expires_at, created_at")
      .eq("clinic_id", profile.clinic_id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ invitations: invitations || [] });
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/team/invite
 * Cancel a pending invitation.
 * Body: { invitationId }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: profile } = await sb
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id || profile.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = (await req.json()) as { invitationId?: string };
    if (!body.invitationId) {
      return NextResponse.json({ error: "invitationId requerido" }, { status: 400 });
    }

    const { error } = await sb
      .from("team_invitations")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", body.invitationId)
      .eq("clinic_id", profile.clinic_id)
      .eq("status", "pending");

    if (error) {
      return NextResponse.json({ error: "Error al cancelar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
