import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientPhone, patientName, doctorName, diagnosis, instructions, nextAppointment } =
      body;

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

    return NextResponse.json({
      success: true,
      mock: false,
      sid: result.sid,
    });
  } catch (error) {
    console.error("WhatsApp summary error:", error);
    return NextResponse.json({ error: "Failed to send WhatsApp summary" }, { status: 500 });
  }
}
