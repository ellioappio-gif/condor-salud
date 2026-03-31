// ─── Claude AI Service for Cora Chatbot ──────────────────────
// Uses Anthropic's Claude to power conversational AI for the Cora
// healthcare assistant.  The rule-based engine (chatbot-engine.ts)
// is used as a safety layer for emergency detection and as a
// fallback when the AI is unavailable.

import { logger } from "@/lib/logger";
import type { OTCDeliveryItem, OTCDeliveryToolInput } from "@/lib/cora/otc-delivery";
import { otcDeliveryTool, OTC_DELIVERY_SYSTEM_PROMPT_ADDITION } from "@/lib/cora/otc-delivery";

// ─── Types ───────────────────────────────────────────────────

// Anthropic SDK is loaded lazily via dynamic import to prevent
// cold-start failures if the module is missing or can't load.

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
  /** OTC delivery items from suggest_otc_delivery tool-use */
  otcDeliveryItems?: OTCDeliveryItem[];
  /** Reason for the OTC delivery suggestion */
  otcDeliveryReason?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── System Prompt ───────────────────────────────────────────

const SHARED_RULES = `RESPONSE FORMAT:
Respond ONLY with valid JSON. No additional text before or after the JSON.

{
  "text": "Your conversational response here. May include \\n for line breaks.",
  "quickReplies": [
    { "label": "Short button text (max 30 chars)", "value": "Text the patient sends when tapping" }
  ],
  "cards": [
    {
      "title": "Card title",
      "body": "Brief description",
      "icon": "search|video|truck|phone|star|map-pin|pill|siren",
      "action": { "label": "Button text", "url": "/route-or-url" }
    }
  ]
}

AVAILABLE URLS for cards:
- /paciente/medicos — Doctor directory (find doctors)
- /paciente/teleconsulta — Video telemedicine
- /paciente/turnos — Book appointment
- /paciente/medicamentos — Pharmacy / medications
- /paciente/cobertura — Check insurance coverage
- /auth/registro — Sign up
- /planes — View plans and pricing
- tel:107 — SAME Emergency (ambulance) — Argentina
- tel:135 — Suicide Prevention Hotline — Argentina
- https://www.rappi.com.ar/farmacias — Rappi pharmacy delivery
- https://www.pedidosya.com.ar/farmacias — PedidosYa pharmacy delivery

JSON RULES:
- quickReplies: array of 2-5 relevant options
- cards: array of 0-3 cards (only when actionable)
- If no relevant cards, use empty array or omit the field
- Text must be warm and conversational, not robotic`;

const SYSTEM_PROMPT_ES = `Sos Cora, la asistente virtual de Cóndor Salud, una plataforma de salud digital en Argentina.

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

IMPORTANTE: Todos los quickReplies labels y values deben estar en español argentino.

${SHARED_RULES}`;

const SYSTEM_PROMPT_EN = `You are Cora, the virtual health assistant for Cóndor Salud, a digital healthcare platform based in Argentina.

PERSONALITY:
- You speak in clear, friendly English
- You are warm, empathetic, and professional
- You use simple language, avoiding medical jargon
- You are concise — short and clear answers (max 3-4 paragraphs)
- You use emojis sparingly

MEDICAL KNOWLEDGE:
- You can guide users on common symptoms and which specialist to see
- You know Argentine OTC medications: Tafirol (paracetamol/acetaminophen), Ibupirac/Ibuevanol (ibuprofen), Buscapina (antispasmodic), Sertal (cramps), Hepatalgina (digestive), Bayaspirina (aspirin), Dioxaflex Rapid, etc.
- You know Argentine health insurance providers ("obras sociales"): PAMI, OSDE, Swiss Medical, Galeno, Medifé, Accord Salud, OSPRERA, Unión Personal
- You can recommend telemedicine, doctor search, and pharmacy delivery via Rappi or PedidosYa
- You know about appointments, insurance coverage, and Cóndor Salud services
- Cóndor Salud operates in Argentina — prices are in ARS, emergency number is 107

CRITICAL SAFETY RULES:
1. NEVER provide medical diagnoses — always refer to a professional
2. Always include at the end: "This is general guidance and does not replace a medical consultation."
3. For emergencies (severe chest pain, difficulty breathing, loss of consciousness, stroke, heart attack), ALWAYS tell them to call 107 (SAME ambulance) IMMEDIATELY
4. Do NOT prescribe medications — only recommend over-the-counter options
5. If someone mentions suicide or self-harm, provide 135 (Argentina's Suicide Prevention Hotline) and recommend immediate care

IMPORTANT: All quickReplies labels and values MUST be in English.

${SHARED_RULES}`;

/** Get the appropriate system prompt based on language, with OTC tool instructions appended */
function getSystemPrompt(lang?: string): string {
  const base = lang && lang.startsWith("en") ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ES;
  return base + OTC_DELIVERY_SYSTEM_PROMPT_ADDITION;
}

// ─── Client ──────────────────────────────────────────────────

let _client: unknown = null;

async function getClient(): Promise<unknown> {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    _client = new Anthropic({ apiKey });
    return _client;
  } catch (err) {
    logger.error({ err }, "Failed to load @anthropic-ai/sdk");
    return null;
  }
}

/** Check if Claude AI is available (API key is configured) */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ─── Anthropic Response Types ────────────────────────────────

/** Content block from Anthropic API response */
interface AnthropicTextBlock {
  type: "text";
  text: string;
}

interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock;

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  stop_reason: string;
}

// ─── Main Function ───────────────────────────────────────────

/**
 * Send a message to Claude and get a structured response for the chatbot.
 * Returns null if Claude is unavailable or returns an error — caller should
 * fall back to the rule-based engine.
 *
 * Supports tool-use: when Claude calls `suggest_otc_delivery`, the tool
 * input is extracted and returned as `otcDeliveryItems` alongside the
 * conversational text response.
 */
export async function askClaude(
  userMessage: string,
  conversationHistory?: ConversationMessage[],
  coords?: { lat: number; lng: number } | null,
  lang?: string,
): Promise<ClaudeResponse | null> {
  // eslint-disable-next-line -- dynamic import client is untyped
  const client = (await getClient()) as {
    messages: {
      create: (opts: Record<string, unknown>) => Promise<AnthropicResponse>;
    };
  } | null;
  if (!client) return null;

  try {
    // Build context-aware user message
    let enrichedMessage = userMessage;
    if (coords) {
      const locCtx = lang?.startsWith("en")
        ? `[Context: The patient shared their location: lat ${coords.lat}, lng ${coords.lng}. You may suggest nearby services.]`
        : `[Contexto: El paciente compartió su ubicación: lat ${coords.lat}, lng ${coords.lng}. Podés sugerirle servicios cercanos.]`;
      enrichedMessage += `\n\n${locCtx}`;
    }

    const messages = [
      ...(conversationHistory ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: enrichedMessage },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: getSystemPrompt(lang),
      messages,
      tools: [otcDeliveryTool],
    });

    // ── Parse response: handle both text and tool_use blocks ──
    let textBlock: AnthropicTextBlock | null = null;
    let otcToolUse: AnthropicToolUseBlock | null = null;

    for (const block of response.content) {
      if (block.type === "text") {
        textBlock = block;
      } else if (block.type === "tool_use" && block.name === "suggest_otc_delivery") {
        otcToolUse = block;
      }
    }

    // We need at least a text block to produce a response
    if (!textBlock) {
      // If Claude only returned a tool_use (no text), still try to build a response
      if (otcToolUse) {
        const toolInput = otcToolUse.input as unknown as OTCDeliveryToolInput;
        const isEn = lang?.startsWith("en");
        return {
          text: isEn
            ? "Here are some over-the-counter options you can order for delivery:"
            : "Te muestro opciones de medicamentos de venta libre para pedir por delivery:",
          otcDeliveryItems: toolInput.items,
          otcDeliveryReason: toolInput.reason,
          quickReplies: isEn
            ? [
                { label: "Telemedicine", value: "I want a telemedicine consultation" },
                { label: "Find a doctor", value: "I want to find a doctor" },
              ]
            : [
                { label: "Teleconsulta", value: "Quiero una teleconsulta" },
                { label: "Buscar médico", value: "Quiero buscar un médico" },
              ],
        };
      }
      return null;
    }

    // Parse JSON from the text block — Claude sometimes wraps in markdown code blocks
    let jsonText = textBlock.text.trim();
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

    // ── Merge OTC tool-use data if Claude called the tool ──
    if (otcToolUse) {
      const toolInput = otcToolUse.input as unknown as OTCDeliveryToolInput;
      if (toolInput.items?.length) {
        parsed.otcDeliveryItems = toolInput.items;
        parsed.otcDeliveryReason = toolInput.reason;
      }
    }

    return parsed;
  } catch (err) {
    logger.error({ err }, "Claude AI request failed");
    return null;
  }
}
