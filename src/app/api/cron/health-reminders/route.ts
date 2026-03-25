// CRON: Health reminder notifications
// Called by Vercel Cron or external scheduler
// Requires CRON_SECRET header for authentication

import { NextRequest, NextResponse } from "next/server";
import { getPatientsNeedingReminders } from "@/lib/services/health-tracker";
import { sendEmail } from "@/lib/services/email";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const patients = await getPatientsNeedingReminders();

    logger.info(
      { count: patients.length },
      "Health reminder cron: found patients needing reminders",
    );

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send reminder emails to each patient
    for (const patient of patients) {
      try {
        // Build bilingual reminder email
        const subject = `Cóndor Salud — Recordatorio: ${patient.categoryName}`;
        const html = `
          <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto;">
            <div style="background: #75AADB; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-family: Georgia, serif;">Cóndor Salud</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #1A1A1A; margin-top: 0;">Recordatorio de salud</h2>
              <p style="color: #6B7280;">
                Hace más de 7 días que no registrás <strong>${patient.categoryName}</strong>
                en tu Health Tracker.
              </p>
              <p style="color: #6B7280;">
                Última medición: ${new Date(patient.lastMeasured).toLocaleDateString("es-AR")}
              </p>
              <a href="https://condorsalud.com/paciente/health-tracker"
                 style="display: inline-block; background: #75AADB; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                Registrar ahora
              </a>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
                Este es un recordatorio automático de Cóndor Salud.
                Podés desactivar recordatorios desde tu perfil.
              </p>
            </div>
          </div>
        `;

        // Note: In production, patient email would come from the patient profile
        // For now we log the intent and send if we have the patient's email
        const patientEmail = (patient as Record<string, unknown>).email as string | undefined;
        if (patientEmail) {
          const result = await sendEmail({
            to: patientEmail,
            subject,
            html,
            tags: [
              { name: "category", value: "health-reminder" },
              { name: "patient_id", value: patient.patientId },
            ],
          });
          if (result.success) {
            emailsSent++;
          } else {
            emailsFailed++;
          }
        } else {
          logger.debug(
            { patientId: patient.patientId },
            "Health reminder: no email on file, skipping",
          );
        }
      } catch (err) {
        emailsFailed++;
        logger.error({ err, patientId: patient.patientId }, "Failed to send health reminder");
      }
    }

    return NextResponse.json({
      ok: true,
      remindersNeeded: patients.length,
      emailsSent,
      emailsFailed,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Health reminder cron failed");
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
