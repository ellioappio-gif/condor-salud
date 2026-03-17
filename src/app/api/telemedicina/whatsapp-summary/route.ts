import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Rate limit: 5 req / 60s per IP ──
  const limited = checkRateLimit(req, "whatsapp-summary", { limit: 5, windowSec: 60 });
  if (limited) return limited;

  try {
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);
    const { patientPhone, patientName, doctorName, diagnosis, instructions, nextAppointment } =
      body as Record<string, string>;

    // Validate phone format (Argentine mobile)
    if (!patientPhone || !/^\+?[\d\s()-]{7,20}$/.test(patientPhone)) {
      return NextResponse.json({ error: "Número de teléfono inválido" }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      // Return mock response when Twilio is not configured
      return NextResponse.json({
        success: true,
        mock: true,
        message: `WhatsApp summary would be sent to ${patientPhone}`,
      });
    }

    const message = [
      `*Cóndor Salud — Resumen de consulta*`,
      ``,
      `Paciente: ${patientName}`,
      `Médico: ${doctorName}`,
      `Fecha: ${new Date().toLocaleDateString("es-AR")}`,
      ``,
      `*Diagnóstico:* ${diagnosis}`,
      `*Indicaciones:* ${instructions}`,
      nextAppointment ? `*Próximo turno:* ${nextAppointment}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);

    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${patientPhone}`,
    });

    logger.info({ sid: result.sid, route: "whatsapp-summary" }, "WhatsApp summary sent");

    return NextResponse.json({
      success: true,
      mock: false,
      sid: result.sid,
    });
  } catch (err) {
    logger.error({ err, route: "whatsapp-summary" }, "WhatsApp summary error");
    return NextResponse.json({ error: "Failed to send WhatsApp summary" }, { status: 500 });
  }
}
