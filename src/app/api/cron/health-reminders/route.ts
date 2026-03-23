// CRON: Health reminder notifications
// Called by Vercel Cron or external scheduler
// Requires CRON_SECRET header for authentication

import { NextRequest, NextResponse } from "next/server";
import { getPatientsNeedingReminders } from "@/lib/services/health-tracker";
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

    // TODO: Send push notifications / emails to these patients
    // For now, just log and return the count
    // In production: integrate with SendGrid/Resend/FCM

    return NextResponse.json({
      ok: true,
      remindersNeeded: patients.length,
      patients: patients.slice(0, 10), // Return sample for debugging
    });
  } catch (err) {
    logger.error({ err }, "Health reminder cron failed");
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
