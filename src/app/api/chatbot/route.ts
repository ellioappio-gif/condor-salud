import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/lib/chatbot-engine";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Simulate a brief thinking delay (200-600ms) for natural feel
    const delay = 200 + Math.random() * 400;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const response = processMessage(message.trim());

    return NextResponse.json({
      id: `bot-${Date.now()}`,
      role: "bot",
      timestamp: Date.now(),
      ...response,
    });
  } catch {
    return NextResponse.json(
      {
        id: `bot-${Date.now()}`,
        role: "bot",
        timestamp: Date.now(),
        text: "Disculpá, ocurrió un error procesando tu consulta. ¿Podrías intentar de nuevo?",
        quickReplies: [
          { label: "Reintentar", value: "Hola" },
          { label: "Hablar con alguien", value: "Quiero hablar con un agente" },
        ],
      },
      { status: 200 },
    );
  }
}
