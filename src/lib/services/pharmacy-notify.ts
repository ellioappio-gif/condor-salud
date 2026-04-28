// ─── Pharmacy Partner Notification Service ────────────────────
// Routes newly issued digital prescriptions to Farmacia Rosmar,
// Condor Salud's partner pharmacy for fulfillment and delivery.
//
// Channels:
//   • Email  → fciarosmar@gmail.com
//   • WhatsApp → +5491155750524  (11 5575-0524)
//
// Called automatically from issuePrescription() so the pharmacy
// receives every prescription the moment a doctor issues it,
// without any manual intervention required.

import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/services/email";
import type { DigitalPrescription, PrescriptionMedication } from "@/lib/types";

const log = logger.child({ module: "pharmacy-notify" });

// ─── Rosmar Contact Details ───────────────────────────────────

export const FARMACIA_ROSMAR = {
  name: "Farmacia Rosmar",
  email: "fciarosmar@gmail.com",
  whatsapp: "+5491155750524", // 11 5575-0524 Argentine mobile
} as const;

// ─── Brand colours (reused from email.ts) ─────────────────────
const BRAND_CELESTE = "#75AADB";
const BRAND_GOLD = "#F6B40E";

// ─── Helpers ─────────────────────────────────────────────────

function medList(meds: PrescriptionMedication[]): string {
  return meds
    .map((m, i) => {
      const generic = m.genericName ? ` (${m.genericName})` : "";
      const qty = m.quantity ? ` — Cant: ${m.quantity}` : "";
      const duration = m.duration ? ` · Duración: ${m.duration}` : "";
      return `<tr style="background:${i % 2 === 0 ? "#f8fafb" : "white"}">
        <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#1a1a1a;">${m.medicationName}${generic}</td>
        <td style="padding:8px 12px;font-size:13px;color:#555;">${m.dosage} · ${m.frequency}${duration}${qty}</td>
      </tr>`;
    })
    .join("\n");
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:40px auto;background:white;border-radius:8px;border:1px solid #d4e4f0;overflow:hidden;">
    <tr>
      <td style="background:${BRAND_CELESTE};padding:24px 32px;">
        <h1 style="margin:0;color:white;font-size:20px;font-weight:700;">Cóndor Salud</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Sistema de Recetas Digitales</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        ${body}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px;background:#f8fafb;border-top:1px solid #d4e4f0;">
        <p style="margin:0;font-size:11px;color:#999;">© ${new Date().getFullYear()} Cóndor Salud · Este mensaje es confidencial y de uso médico-farmacéutico.</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─── Email notification ───────────────────────────────────────

async function notifyByEmail(rx: DigitalPrescription): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://condorsalud.com";
  const verifyUrl = `${appUrl}/rx/${rx.verificationToken}`;
  const coverage =
    [rx.coverageName, rx.coveragePlan, rx.coverageNumber].filter(Boolean).join(" · ") ||
    "Sin cobertura / Particular";

  const html = wrapHtml(
    "Nueva Receta Digital — Farmacia Rosmar",
    `
    <h2 style="margin:0 0 4px;font-size:18px;color:#1a1a1a;">Nueva receta digital emitida</h2>
    <p style="margin:0 0 20px;font-size:13px;color:#999;">ID: ${rx.id}</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
      <tr>
        <td style="padding:6px 0;color:#999;font-weight:600;width:140px;">Paciente</td>
        <td style="padding:6px 0;color:#1a1a1a;font-weight:700;">${rx.patientName}${rx.patientDni ? ` · DNI ${rx.patientDni}` : ""}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#999;font-weight:600;">Médico</td>
        <td style="padding:6px 0;color:#1a1a1a;">${rx.doctorName}${rx.doctorMatricula ? ` (Mat. ${rx.doctorMatricula})` : ""}</td>
      </tr>
      ${rx.diagnosis ? `<tr><td style="padding:6px 0;color:#999;font-weight:600;">Diagnóstico</td><td style="padding:6px 0;color:#1a1a1a;">${rx.diagnosis}</td></tr>` : ""}
      <tr>
        <td style="padding:6px 0;color:#999;font-weight:600;">Cobertura</td>
        <td style="padding:6px 0;color:#1a1a1a;">${coverage}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#999;font-weight:600;">Emitida</td>
        <td style="padding:6px 0;color:#1a1a1a;">${new Date(rx.issuedAt ?? rx.createdAt).toLocaleString("es-AR")}</td>
      </tr>
    </table>

    <h3 style="margin:0 0 12px;font-size:14px;color:#1a1a1a;border-bottom:1px solid #eee;padding-bottom:8px;">Medicamentos</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      ${medList(rx.medications ?? [])}
    </table>

    ${rx.notes ? `<div style="background:#fffbea;border:1px solid ${BRAND_GOLD};border-radius:6px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#555;"><strong>Notas del médico:</strong> ${rx.notes}</div>` : ""}

    <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:${BRAND_CELESTE};color:white;font-weight:700;font-size:14px;border-radius:6px;text-decoration:none;">
      Ver receta completa y QR →
    </a>
    <p style="margin:12px 0 0;font-size:11px;color:#aaa;">O copiá este enlace: ${verifyUrl}</p>
    `,
  );

  const result = await sendEmail({
    to: FARMACIA_ROSMAR.email,
    subject: `🩺 Nueva receta — ${rx.patientName} — ${(rx.medications ?? []).map((m) => m.medicationName).join(", ")}`,
    html,
    text: [
      `Nueva receta digital emitida — Cóndor Salud`,
      `Paciente: ${rx.patientName}${rx.patientDni ? ` (DNI ${rx.patientDni})` : ""}`,
      `Médico: ${rx.doctorName}`,
      `Cobertura: ${coverage}`,
      `Medicamentos: ${(rx.medications ?? []).map((m) => `${m.medicationName} ${m.dosage} ${m.frequency}`).join("; ")}`,
      ``,
      `Verificar receta: ${verifyUrl}`,
    ].join("\n"),
    replyTo: "no-reply@condorsalud.com",
    tags: [{ name: "type", value: "pharmacy_prescription" }],
  });

  if (result.success) {
    log.info({ prescriptionId: rx.id, emailId: result.id }, "Pharmacy email sent to Rosmar");
  } else {
    log.warn({ prescriptionId: rx.id, error: result.error }, "Pharmacy email failed");
  }
}

// ─── WhatsApp notification ────────────────────────────────────

async function notifyByWhatsApp(rx: DigitalPrescription): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://condorsalud.com";
  const verifyUrl = `${appUrl}/rx/${rx.verificationToken}`;

  const medLines = (rx.medications ?? [])
    .map((m) => {
      const qty = m.quantity ? ` (x${m.quantity})` : "";
      return `• ${m.medicationName} — ${m.dosage}, ${m.frequency}${qty}`;
    })
    .join("\n");

  const coverage =
    [rx.coverageName, rx.coveragePlan, rx.coverageNumber].filter(Boolean).join(" / ") ||
    "Particular";

  const body = [
    `🩺 *Nueva receta digital — Cóndor Salud*`,
    ``,
    `👤 *Paciente:* ${rx.patientName}${rx.patientDni ? ` · DNI ${rx.patientDni}` : ""}`,
    `👨‍⚕️ *Médico:* ${rx.doctorName}${rx.doctorMatricula ? ` (Mat. ${rx.doctorMatricula})` : ""}`,
    `🏥 *Cobertura:* ${coverage}`,
    ``,
    `💊 *Medicamentos:*`,
    medLines,
    ``,
    rx.notes ? `📋 *Nota:* ${rx.notes}\n` : "",
    `🔗 *Ver receta / QR:*`,
    verifyUrl,
  ]
    .filter((l) => l !== "")
    .join("\n");

  // Use Twilio directly to send to the pharmacy's WhatsApp number.
  // This is a server-side fire-and-forget — no clinic conversation context.
  try {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. +14155238886 (sandbox) or production sender

    if (!twilioSid || !twilioAuth || !twilioFrom) {
      log.warn({ prescriptionId: rx.id }, "Twilio not configured — skipping WhatsApp to pharmacy");
      return;
    }

    const fromWa = twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`;
    const toWa = `whatsapp:${FARMACIA_ROSMAR.whatsapp}`;

    const formBody = new URLSearchParams({
      From: fromWa,
      To: toWa,
      Body: body,
    });

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      },
    );

    const data = (await resp.json()) as { sid?: string; status?: string; message?: string };

    if (resp.ok && data.sid) {
      log.info(
        { prescriptionId: rx.id, sid: data.sid, status: data.status },
        "Pharmacy WhatsApp sent to Rosmar",
      );
    } else {
      log.warn(
        { prescriptionId: rx.id, status: resp.status, error: data.message },
        "Pharmacy WhatsApp failed",
      );
    }
  } catch (err) {
    log.error({ err, prescriptionId: rx.id }, "Pharmacy WhatsApp exception");
  }
}

// ─── Main export ──────────────────────────────────────────────

/**
 * Notify Farmacia Rosmar of a newly issued prescription.
 * Sends both email and WhatsApp in parallel; failures are
 * logged but never throw — they must not block prescription issuance.
 */
export async function notifyPharmacyRosmar(rx: DigitalPrescription): Promise<void> {
  await Promise.allSettled([notifyByEmail(rx), notifyByWhatsApp(rx)]);
}
