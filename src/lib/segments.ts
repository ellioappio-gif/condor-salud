/**
 * Visitor Segment Detection
 *
 * Classifies visitors into segments based on their email domain:
 * - "provider"  → Healthcare clinics, hospitals, medical institutions (business emails)
 * - "tourist"   → Individuals needing medical assistance (personal emails)
 * - "default"   → Unknown / first-time visitors (no email detected yet)
 *
 * Uses a cookie (`condor_segment`) to persist the segment across visits.
 */

// ─── Types ───────────────────────────────────────────────────

export type Segment = "default" | "provider" | "tourist";

export const SEGMENT_COOKIE = "condor_segment";
export const SEGMENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// ─── Personal Email Domains ──────────────────────────────────
// If the email domain is in this set → tourist (personal account)
// Otherwise → provider (business account)

const PERSONAL_DOMAINS = new Set([
  // Google
  "gmail.com",
  "googlemail.com",
  // Microsoft
  "hotmail.com",
  "hotmail.com.ar",
  "outlook.com",
  "outlook.com.ar",
  "live.com",
  "live.com.ar",
  "msn.com",
  // Yahoo
  "yahoo.com",
  "yahoo.com.ar",
  "ymail.com",
  "rocketmail.com",
  // Apple
  "icloud.com",
  "me.com",
  "mac.com",
  // Proton
  "protonmail.com",
  "proton.me",
  "pm.me",
  // Argentina-specific free providers
  "fibertel.com.ar",
  "speedy.com.ar",
  "arnet.com.ar",
  "ciudad.com.ar",
  "sinectis.com.ar",
  "uolsinectis.com.ar",
  "uol.com.ar",
  "tutopia.com",
  "infovia.com.ar",
  // Latin America
  "terra.com.ar",
  "terra.com",
  // Other international free providers
  "aol.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "fastmail.com",
  "tutanota.com",
  "tuta.io",
]);

// ─── Healthcare Keywords ─────────────────────────────────────
// Domains containing these words are very likely healthcare providers

const HEALTHCARE_KEYWORDS = [
  "hospital",
  "clinic",
  "clinica",
  "clínica",
  "salud",
  "health",
  "medical",
  "medic",
  "sanatorio",
  "sanidad",
  "farma",
  "pharma",
  "odonto",
  "dental",
  "laboratorio",
  "lab",
  "cardio",
  "neuro",
  "pediatr",
  "gine",
  "trauma",
  "dermato",
  "oftalm",
  "kinesi",
  "fisio",
  "nutri",
  "psico",
  "psiq",
  "oncol",
  "hemato",
  "radio",
  "patolog",
  "ciruj",
  "anest",
  "guardia",
  "emergencia",
  "ambulancia",
  "diagnostico",
  "diagnóstico",
  "imagen",
  "ecografia",
  "ecografía",
  "tomografia",
  "resonancia",
  "reumat",
  "endocrin",
  "neumol",
  "urolog",
  "nefrol",
  "hepato",
  "gastro",
  "otorrino",
  "geriat",
  "paliat",
  "rehabilit",
  "cuidados",
  "consultor",
  "maternidad",
  "obstetr",
  "neonato",
  "intensiv",
  // Argentine specific
  "obra-social",
  "prepaga",
  "osde",
  "swiss-medical",
  "galeno",
  "medife",
  "pami",
];

// ─── Detection Logic ─────────────────────────────────────────

/**
 * Detect visitor segment from an email address.
 *
 * 1. Extract the domain from the email
 * 2. If it matches a known personal/free email provider → "tourist"
 * 3. If it contains healthcare keywords → "provider"
 * 4. Otherwise → "provider" (business email = likely clinic staff)
 */
export function detectSegmentFromEmail(email: string): Segment {
  const at = email.lastIndexOf("@");
  if (at < 0) return "default";

  const domain = email
    .slice(at + 1)
    .toLowerCase()
    .trim();
  if (!domain || !domain.includes(".")) return "default";

  // Personal / free email domain → tourist (individual)
  if (PERSONAL_DOMAINS.has(domain)) return "tourist";

  // Business/custom domain: check for healthcare keywords
  const domainLower = domain.toLowerCase();
  const isHealthcare = HEALTHCARE_KEYWORDS.some((kw) => domainLower.includes(kw));
  if (isHealthcare) return "provider";

  // Any other custom domain → likely a business (provider)
  return "provider";
}

// ─── Cookie Helpers (client-side) ────────────────────────────

export function getSegmentFromCookie(): Segment {
  if (typeof document === "undefined") return "default";
  const match = document.cookie.match(new RegExp(`(?:^|; )${SEGMENT_COOKIE}=([^;]*)`));
  const val = match?.[1];
  if (val === "provider" || val === "tourist") return val;
  return "default";
}

export function setSegmentCookie(segment: Segment): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SEGMENT_COOKIE}=${segment}; path=/; max-age=${SEGMENT_MAX_AGE}; SameSite=Lax`;
}

// ─── Segment Labels (for UI) ─────────────────────────────────

export const SEGMENT_LABELS: Record<Segment, { es: string; en: string }> = {
  default: { es: "General", en: "General" },
  provider: { es: "Profesionales", en: "Providers" },
  tourist: { es: "Pacientes", en: "Patients" },
};
