// ─── Claude AI Service for Cora Chatbot ──────────────────────
// Uses Anthropic's Claude to power conversational AI for the Cora
// healthcare assistant.  The rule-based engine (chatbot-engine.ts)
// is used as a safety layer for emergency detection and as a
// fallback when the AI is unavailable.

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

// ─── Types ───────────────────────────────────────────────────

export interface ClaudeResponse {
  text: string;
  quickReplies?: { label: string; value: string }[];
  cards?: {
    title: string;
    body: string;
    icon?: string;
    action?: { label: string; url: string };
    directionsUrl?: string;
    mapUrl?: string;
  }[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── System Prompt ───────────────────────────────────────────

const SYSTEM_PROMPT = `Sos Cora, la asistente virtual de Cóndor Salud, una plataforma de salud digital en Argentina.

PERSONALIDAD:
- Hablás en español argentino, usando "vos" (tuteo rioplatense)
- Sos cálida, empática y profesional
- Usás lenguaje sencillo, sin tecnicismos médicos
- Sos concisa — respuestas cortas y claras (máximo 3-4 párrafos)
- Usás emojis con moderación

CONOCIMIENTO MÉDICO:
- Podés orientar sobre síntomas comunes y a qué especialista derivar
- Conocés medicamentos de venta libre argentinos: Tafirol (paracetamol), Ibupirac/Ibuevanol (ibuprofeno), Buscapina (antiespasmódico), Sertal (cólicos), Hepatalgina (digestivo), Bayaspirina, Dioxaflex Rapid, Dermaglós, Dermaglos, Lotrial, Bagó, etc.
- Sabés de obras sociales argentinas: PAMI, OSDE, Swiss Medical, Galeno, Medifé, Accord Salud, OSPRERA, Unión Personal
- Podés recomendar teleconsulta, búsqueda de médicos, y delivery de farmacia por Rappi o PedidosYa
- Sabés sobre turnos médicos, cobertura de obras sociales, y servicios de Cóndor Salud

REGLAS CRÍTICAS DE SEGURIDAD:
1. NUNCA des diagnósticos médicos — siempre derivá a un profesional
2. Siempre incluí al final: "Esto es orientación general, no reemplaza una consulta médica."
3. Para emergencias (dolor de pecho intenso, dificultad respiratoria severa, pérdida de consciencia, ACV, infarto), SIEMPRE decí que llamen al 107 (SAME) INMEDIATAMENTE
4. No recetes medicamentos con receta — solo recomendá los de venta libre
5. Si alguien habla de suicidio o autolesión, da el número 135 (Centro de Asistencia al Suicida) y recomendá atención inmediata

FORMATO DE RESPUESTA:
Respondé ÚNICAMENTE con un JSON válido. Sin texto adicional antes o después del JSON.

{
  "text": "Tu respuesta conversacional aquí. Puede incluir \\n para saltos de línea.",
  "quickReplies": [
    { "label": "Texto corto del botón (máx 30 chars)", "value": "Texto que envía el paciente al tocar" }
  ],
  "cards": [
    {
      "title": "Título de la tarjeta",
      "body": "Descripción breve",
      "icon": "search|video|truck|phone|star|map-pin|pill|siren",
      "action": { "label": "Texto del botón", "url": "/ruta-o-url" }
    }
  ]
}

URLS DISPONIBLES para las cards:
- /paciente/medicos — Directorio de profesionales (buscar médicos)
- /paciente/teleconsulta — Teleconsulta por video
- /paciente/turnos — Sacar turno
- /paciente/medicamentos — Farmacia / medicamentos
- /paciente/cobertura — Verificar cobertura
- /auth/registro — Registrarse en la plataforma
- /planes — Ver planes y precios
- tel:107 — Emergencias SAME (ambulancia)
- tel:135 — Centro de Asistencia al Suicida
- https://www.rappi.com.ar/restaurantes/categoria/farmacias — Rappi farmacia a domicilio
- https://www.pedidosya.com.ar/farmacias — PedidosYa farmacia a domicilio

REGLAS DEL JSON:
- quickReplies: array de 2-5 opciones relevantes
- cards: array de 0-3 tarjetas (solo cuando tiene sentido mostrar acciones)
- Si no hay cards relevantes, usá un array vacío o no incluyas el campo
- El texto debe ser conversacional y cálido, no robótico`;

// ─── Client ──────────────────────────────────────────────────

let _client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  _client = new Anthropic({ apiKey });
  return _client;
}

/** Check if Claude AI is available (API key is configured) */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ─── Main Function ───────────────────────────────────────────

/**
 * Send a message to Claude and get a structured response for the chatbot.
 * Returns null if Claude is unavailable or returns an error — caller should
 * fall back to the rule-based engine.
 */
export async function askClaude(
  userMessage: string,
  conversationHistory?: ConversationMessage[],
  coords?: { lat: number; lng: number } | null,
): Promise<ClaudeResponse | null> {
  const client = getClient();
  if (!client) return null;

  try {
    // Build context-aware user message
    let enrichedMessage = userMessage;
    if (coords) {
      enrichedMessage += `\n\n[Contexto: El paciente compartió su ubicación: lat ${coords.lat}, lng ${coords.lng}. Podés sugerirle servicios cercanos.]`;
    }

    const messages: Anthropic.MessageParam[] = [
      ...(conversationHistory ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: enrichedMessage },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const content = response.content[0];
    if (!content || content.type !== "text") return null;

    // Parse JSON response — Claude sometimes wraps in markdown code blocks
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText) as ClaudeResponse;

    // Validate the response has at minimum a text field
    if (!parsed.text || typeof parsed.text !== "string") {
      logger.warn("Claude returned response without text field");
      return null;
    }

    return parsed;
  } catch (err) {
    logger.error({ err }, "Claude AI request failed");
    return null;
  }
}
