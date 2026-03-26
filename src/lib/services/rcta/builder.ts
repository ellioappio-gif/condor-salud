// ─── RCTA QBI2 Prescription Builder ──────────────────────────
// Maps internal Cóndor Salud types → QBI2PrescriptionRequest
// Handles drug name formatting, coverage normalization, CIE-10 passthrough.

import type {
  QBI2PrescriptionRequest,
  QBI2Medication,
  QBI2Diagnosis,
  QBI2PatientCoverage,
} from "./types";
import type {
  DigitalPrescription,
  PrescriptionMedication,
  PrescriptionDiagnosis,
} from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────

/** Maximum medications per QBI2 prescription (OSDE spec + RCTA standard) */
const MAX_MEDICATIONS = 3;

/** Default validity in days */
const DEFAULT_VALIDITY_DAYS = 30;

/** Coverage name normalization map */
const COVERAGE_ALIASES: Record<string, string> = {
  "osde 210": "OSDE",
  "osde 310": "OSDE",
  "osde 410": "OSDE",
  "osde 510": "OSDE",
  osde: "OSDE",
  "swiss medical": "Swiss Medical",
  swiss: "Swiss Medical",
  galeno: "Galeno",
  medicus: "Medicus",
  ioma: "IOMA",
  pami: "PAMI",
  "obra social": "Obra Social",
  particular: "Particular",
  "hospital italiano": "Hospital Italiano",
  medife: "Medifé",
  "union personal": "Unión Personal",
  omint: "OMINT",
  "accord salud": "Accord Salud",
};

// ─── Builder ─────────────────────────────────────────────────

interface BuildQBI2Params {
  prescription: DigitalPrescription;
  doctorCUIT: string;
  matriculaNumber: string;
  matriculaType: "nacional" | "provincial";
  validityDays?: number;
}

/**
 * Build a QBI2PrescriptionRequest from internal Cóndor Salud types.
 * Enforces max 3 medications (server-side guard).
 */
export function buildQBI2Request(params: BuildQBI2Params): QBI2PrescriptionRequest {
  const { prescription, doctorCUIT, matriculaNumber, matriculaType, validityDays } = params;

  // Parse patient name into first + last
  const { firstName, lastName } = splitPatientName(prescription.patientName);

  // Build medications (capped at MAX_MEDICATIONS)
  const medications: QBI2Medication[] = prescription.medications
    .slice(0, MAX_MEDICATIONS)
    .map(mapMedication);

  // Build diagnoses
  const diagnoses: QBI2Diagnosis[] = buildDiagnoses(prescription.diagnoses, prescription.diagnosis);

  // Build coverage
  const patientCoverage = buildCoverage(
    prescription.coverageName,
    prescription.coveragePlan,
    prescription.coverageNumber,
  );

  return {
    doctorId: prescription.doctorProfileId || "",
    doctorCUIT,
    matriculaNumber,
    matriculaType,
    patientDNI: prescription.patientDni || "",
    patientName: firstName,
    patientLastName: lastName,
    patientCoverage: patientCoverage || undefined,
    medications,
    diagnoses,
    notes: prescription.notes || undefined,
    validityDays: validityDays ?? DEFAULT_VALIDITY_DAYS,
  };
}

// ─── Helpers ─────────────────────────────────────────────────

/** Split "García, Juan" or "Juan García" into first + last */
function splitPatientName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();

  // Format: "Apellido, Nombre"
  if (trimmed.includes(",")) {
    const [last, ...first] = trimmed.split(",").map((s) => s.trim());
    return {
      firstName: first.join(" ") || "",
      lastName: last || "",
    };
  }

  // Format: "Nombre Apellido"
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] || "", lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1] || "",
  };
}

/** Map internal PrescriptionMedication → QBI2Medication */
function mapMedication(med: PrescriptionMedication): QBI2Medication {
  return {
    drugName: formatDrugName(med.medicationName, med.drug?.commercialName),
    principioActivo:
      med.genericName || med.drug?.genericName || extractGenericName(med.medicationName),
    presentacion: med.drug?.presentation || extractPresentation(med.medicationName),
    quantity: med.quantity ?? 1,
    dosage: med.dosage || med.drug?.concentration || "",
    frequency: med.frequency || "",
    duration: med.duration || "30 días",
    generic: !med.drug?.commercialName || med.medicationName === med.genericName,
    alfabetaCode: med.drug?.alfabetaCode || undefined,
  };
}

/** Normalize drug name: ensure proper casing and lab suffix */
function formatDrugName(medicationName: string, commercialName?: string): string {
  const name = commercialName || medicationName;
  // Capitalize first letter of each word
  return name
    .split(" ")
    .map((w) => {
      if (w.match(/^\d/)) return w; // Preserve dosage numbers
      if (w.match(/^(mg|mcg|ml|g|ui|cap|comp)$/i)) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Extract generic name from compound medication name, e.g. "Losartan Gador 50mg" → "Losartan" */
function extractGenericName(medicationName: string): string {
  const parts = medicationName.trim().split(/\s+/);
  return parts[0] || medicationName;
}

/** Extract presentation from name, e.g. "Amoxicilina 500mg comp x 21" → "500mg comp x 21" */
function extractPresentation(medicationName: string): string {
  const match = medicationName.match(/\d+\s*(mg|mcg|ml|g|ui).*/i);
  return match ? match[0] : "";
}

/** Build QBI2 diagnosis array from structured diagnoses or fallback text */
function buildDiagnoses(structured?: PrescriptionDiagnosis[], freeText?: string): QBI2Diagnosis[] {
  if (structured && structured.length > 0) {
    return structured.map((d) => ({
      cie10Code: d.code || undefined,
      description: d.description,
    }));
  }

  if (freeText) {
    return [{ description: freeText }];
  }

  return [{ description: "Consulta médica" }];
}

/** Build patient coverage from Cóndor Salud fields */
function buildCoverage(
  coverageName?: string,
  plan?: string,
  affiliateNumber?: string,
): QBI2PatientCoverage | null {
  if (
    !coverageName ||
    coverageName.toLowerCase() === "sin cobertura" ||
    coverageName.toLowerCase() === "particular"
  ) {
    return null;
  }

  const normalized = COVERAGE_ALIASES[coverageName.toLowerCase()] || coverageName;

  return {
    obraSocialName: normalized,
    affiliateNumber: affiliateNumber || "",
    plan: plan || undefined,
  };
}

/** Check if patient coverage is OSDE (should be routed to OSDE FHIR, not QBI2) */
export function isOSDECoverage(coverageName?: string): boolean {
  if (!coverageName) return false;
  const lower = coverageName.toLowerCase();
  return lower.includes("osde") || lower.startsWith("osde");
}
