// ─── RCTA Orchestrator ───────────────────────────────────────
// Entry point for prescription registration.
// Routes: OSDE patients → OSDE FHIR | All others → QBI2
// If RCTA_API_KEY is missing, returns "pending_credentials" gracefully.

import { logger } from "@/lib/logger";
import { isRCTAConfigured, registerPrescription, RCTAError } from "./client";
import { buildQBI2Request, isOSDECoverage } from "./builder";
import type { RCTARegistrationResult } from "./types";
import type { DigitalPrescription } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────

interface RegisterParams {
  prescription: DigitalPrescription;
  doctorCUIT: string;
  matriculaNumber: string;
  matriculaType: "nacional" | "provincial";
  validityDays?: number;
}

// ─── Main Orchestrator ───────────────────────────────────────

/**
 * Register a prescription with the appropriate external system.
 *
 * Routing logic:
 * 1. If patient has OSDE coverage → skip RCTA, return "not_needed" (OSDE FHIR handles it)
 * 2. If RCTA_API_KEY is not set → return "pending_credentials" (PDF-only fallback)
 * 3. Otherwise → call QBI2 to register
 *
 * NEVER throws — always returns a result. Errors are captured in the result object.
 */
export async function registerWithRCTA(params: RegisterParams): Promise<RCTARegistrationResult> {
  const { prescription } = params;

  // ── Route 1: OSDE patient → skip, use OSDE FHIR instead
  if (isOSDECoverage(prescription.coverageName)) {
    logger.info(
      { prescriptionId: prescription.id, coverage: prescription.coverageName },
      "OSDE coverage detected — skipping RCTA, routing to OSDE FHIR",
    );
    return {
      status: "not_needed",
      routedToOSDE: true,
    };
  }

  // ── Route 2: No RCTA credentials → graceful fallback
  if (!isRCTAConfigured()) {
    logger.warn(
      { prescriptionId: prescription.id },
      "RCTA API key not configured — prescription will be PDF-only. Contact Innovamed: wa.me/5491121935123",
    );
    return {
      status: "pending_credentials",
      error:
        "Integración RCTA pendiente de configuración. La receta se generará como PDF. Contactar soporte.",
    };
  }

  // ── Route 3: Register via QBI2
  try {
    const qbi2Request = buildQBI2Request(params);

    const result = await registerPrescription(qbi2Request);

    logger.info(
      {
        prescriptionId: prescription.id,
        rctaId: result.prescriptionId,
        status: result.status,
      },
      "Prescription registered in RCTA QBI2 successfully",
    );

    return {
      status: "registered",
      prescriptionId: result.prescriptionId,
      pdfUrl: result.pdfUrl,
      issuedAt: result.issuedAt,
      expiresAt: result.expiresAt,
    };
  } catch (err) {
    const message =
      err instanceof RCTAError ? err.message : "Error desconocido al registrar en RCTA";
    const code = err instanceof RCTAError ? err.code : "UNKNOWN";

    logger.error(
      { err, prescriptionId: prescription.id, code },
      "Failed to register prescription in RCTA",
    );

    return {
      status: "error",
      error: message,
    };
  }
}

// ─── Re-exports ──────────────────────────────────────────────

export { isRCTAConfigured, getPrescriptionStatus, cancelPrescription, RCTAError } from "./client";
export { buildQBI2Request, isOSDECoverage } from "./builder";
export type {
  QBI2PrescriptionRequest,
  QBI2PrescriptionResponse,
  QBI2StatusResponse,
  RCTARegistrationResult,
} from "./types";
