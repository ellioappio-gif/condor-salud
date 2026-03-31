/**
 * Cora — OTC Delivery Tool for Anthropic Claude Tool-Use
 *
 * Defines the tool schema, system prompt addition, and types for
 * suggesting over-the-counter medication delivery via Rappi & PedidosYa.
 */

// ─── Types ───────────────────────────────────────────────────

/** A single OTC medication item suggested for delivery */
export interface OTCDeliveryItem {
  /** Brand name (e.g. "Tafirol", "Ibupirac") */
  name: string;
  /** Generic / active ingredient (e.g. "Paracetamol 500mg", "Ibuprofeno 400mg") */
  genericName: string;
  /** Optional suggested quantity (e.g. "1 caja", "2 comprimidos") */
  quantity?: string;
}

/** The shape of the tool-use input that Claude sends back */
export interface OTCDeliveryToolInput {
  items: OTCDeliveryItem[];
  reason: string;
}

// ─── Anthropic Tool Definition ───────────────────────────────

/**
 * Tool definition for `messages.create({ tools: [...] })`.
 * When Claude detects the patient needs OTC medication delivery it
 * calls this tool with a list of suggested items.
 */
export const otcDeliveryTool = {
  name: "suggest_otc_delivery" as const,
  description:
    "Suggest over-the-counter (OTC) medications for delivery via Rappi or PedidosYa " +
    "when the patient needs pharmacy delivery of non-prescription medications. " +
    "Returns structured items so the UI can render delivery cards with deep-links.",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array" as const,
        description: "List of OTC medications to suggest for delivery",
        items: {
          type: "object" as const,
          properties: {
            name: {
              type: "string" as const,
              description:
                "Brand name of the OTC medication available in Argentina (e.g. 'Tafirol', 'Ibupirac', 'Buscapina')",
            },
            genericName: {
              type: "string" as const,
              description:
                "Generic / active ingredient with dosage (e.g. 'Paracetamol 500mg', 'Ibuprofeno 400mg')",
            },
            quantity: {
              type: "string" as const,
              description: "Suggested quantity or presentation (e.g. '1 caja', '10 comprimidos')",
            },
          },
          required: ["name", "genericName"],
        },
      },
      reason: {
        type: "string" as const,
        description:
          "Brief explanation of why these medications are being suggested (e.g. 'Para aliviar el dolor de cabeza')",
      },
    },
    required: ["items", "reason"],
  },
};

// ─── System Prompt Addition ──────────────────────────────────

/**
 * Append to the main system prompt when OTC delivery tool is enabled.
 * Tells Claude when and how to use the suggest_otc_delivery tool.
 */
export const OTC_DELIVERY_SYSTEM_PROMPT_ADDITION = `

OTC DELIVERY TOOL:
When the patient asks about over-the-counter medications, pharmacy delivery, or you recommend OTC medicines as part of your guidance, use the suggest_otc_delivery tool to provide structured delivery options via Rappi and PedidosYa.

Use this tool when:
- Patient asks for medication delivery ("delivery", "domicilio", "rappi", "pedidosya", "envío", "pedir medicamentos")
- You recommend specific OTC medicines during a triage / symptom conversation
- Patient asks where to buy or get specific OTC medications
- Patient mentions they need pharmacy items delivered

Do NOT use this tool for:
- Prescription medications (they need a doctor's order)
- Non-medication items
- When the patient hasn't indicated interest in delivery or purchasing
- Emergency situations (use safety rules instead)

When using the tool, ALWAYS also include a conversational text response explaining the recommendation. The tool call supplements your text — it doesn't replace it.
Common Argentine OTC brands to suggest: Tafirol (paracetamol), Ibupirac/Ibuevanol (ibuprofeno), Buscapina (antiespasmódico), Sertal (cólicos), Hepatalgina (digestivo), Bayaspirina (aspirina), Dioxaflex Rapid (diclofenac).`;

// ─── Deep-link Builders ──────────────────────────────────────

const RAPPI_BASE = "https://www.rappi.com.ar/farmacias";
const PEDIDOSYA_BASE = "https://www.pedidosya.com.ar/farmacias";

/** Build a Rappi pharmacy search URL for a medication name */
export function rappiSearchUrl(
  medName: string,
  coords?: { lat: number; lng: number } | null,
): string {
  const params = new URLSearchParams({ q: medName });
  if (coords) {
    params.set("lat", String(coords.lat));
    params.set("lng", String(coords.lng));
  }
  return `${RAPPI_BASE}?${params.toString()}`;
}

/** Build a PedidosYa pharmacy search URL for a medication name */
export function pedidosYaSearchUrl(medName: string): string {
  return `${PEDIDOSYA_BASE}?q=${encodeURIComponent(medName)}`;
}

/** Build a combined Rappi URL for multiple items */
export function rappiSearchAllUrl(
  items: OTCDeliveryItem[],
  coords?: { lat: number; lng: number } | null,
): string {
  const query = items.map((i) => i.name).join(", ");
  return rappiSearchUrl(query, coords);
}

/** Build a combined PedidosYa URL for multiple items */
export function pedidosYaSearchAllUrl(items: OTCDeliveryItem[]): string {
  const query = items.map((i) => i.name).join(", ");
  return pedidosYaSearchUrl(query);
}
