import { NextRequest, NextResponse } from "next/server";
import { getTriages, createTriage, saveClinicalNote, getTriageKPIs } from "@/lib/services/triage";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { triageActionSchema } from "@/lib/validations/schemas";
import { isClaudeConfigured } from "@/lib/ai/claude";

// ── AI triage assessment via Claude Haiku ────────────────────

interface AITriageResult {
  severity: "leve" | "moderado" | "urgente" | "emergencia";
  specialty: string;
  icd10Code: string;
  icd10Description: string;
  recommendedAction: string;
  requiresImmediateAttention: boolean;
}

async function getAITriageAssessment(data: {
  symptoms: string[];
  severity: number;
  frequency: string;
  duration: string;
  freeNotes: string;
}): Promise<AITriageResult | null> {
  if (!isClaudeConfigured()) return null;

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    const prompt = `Eres un sistema de triage clínico. Analiza estos síntomas y devuelve SOLO un JSON válido sin texto adicional.

Síntomas: ${data.symptoms.join(", ")}
Severidad reportada: ${data.severity}/10
Frecuencia: ${data.frequency}
Duración: ${data.duration}
Notas: ${data.freeNotes || "ninguna"}

Responde con este formato JSON exacto:
{
  "severity": "leve|moderado|urgente|emergencia",
  "specialty": "especialidad médica recomendada en español",
  "icd10Code": "código ICD-10 más probable (ej: R51)",
  "icd10Description": "descripción del código ICD-10 en español",
  "recommendedAction": "acción recomendada breve en español",
  "requiresImmediateAttention": false
}

REGLAS:
- Si severidad >= 8 o síntomas cardíacos/respiratorios graves → "emergencia" + requiresImmediateAttention: true
- Si severidad >= 6 → "urgente"
- Si severidad >= 4 → "moderado"
- Caso contrario → "leve"
- SIEMPRE incluir disclaimer: esto no reemplaza una consulta médica`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content.find((b: { type: string }) => b.type === "text") as
      | { text: string }
      | undefined;
    if (!text) return null;

    const json = text.text
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(json) as AITriageResult;
  } catch (err) {
    logger.error({ err }, "AI triage assessment failed");
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "triages";

  try {
    switch (resource) {
      case "triages":
        return NextResponse.json(await getTriages());
      case "kpis":
        return NextResponse.json(await getTriageKPIs());
      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "triage", resource }, "Triage GET error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Rate limit: 15 req / 60s per IP ──
  const limited = checkRateLimit(req, "triage", { limit: 15, windowSec: 60 });
  if (limited) return limited;

  try {
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);

    // Validate request body shape
    const parsed = triageActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { action } = parsed.data;

    switch (action) {
      case "create-triage": {
        const triageData = parsed.data.data as Parameters<typeof createTriage>[0];
        const triage = await createTriage(triageData);

        // AI-powered assessment (non-blocking — graceful fallback if unavailable)
        let aiAssessment: AITriageResult | null = null;
        if (isClaudeConfigured()) {
          aiAssessment = await getAITriageAssessment({
            symptoms: triageData.symptoms ?? [],
            severity: triageData.severity ?? 5,
            frequency: triageData.frequency ?? "",
            duration: triageData.duration ?? "",
            freeNotes: triageData.freeNotes ?? "",
          });
        }

        return NextResponse.json({ ...triage, aiAssessment });
      }
      case "save-clinical-note": {
        const note = await saveClinicalNote(
          parsed.data.data as Parameters<typeof saveClinicalNote>[0],
        );
        return NextResponse.json(note);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "triage" }, "Triage POST error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
