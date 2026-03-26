/**
 * Cóndor Salud — OSDE Service (Orchestrator)
 *
 * High-level interface for registering prescriptions with OSDE's
 * electronic prescription system. Handles:
 *  1. Coverage detection (is the patient on OSDE?)
 *  2. Batch splitting (max 3 meds per FHIR request)
 *  3. Registration + retry logic
 *  4. Result aggregation
 *
 * Re-exports types for convenience.
 */

import { logger } from "@/lib/logger";
import type {
  DigitalPrescription,
  OSDEPrescriptionData,
  PrescriptionMedication,
} from "@/lib/types";
import { buildOSDEPayload, buildOSDEAnnotation } from "./builder";
import { isOSDEConfigured, registerPrescription } from "./client";
import type { OSDERegistrationResult } from "./types";

export type { OSDERegistrationResult } from "./types";
export { isOSDEConfigured } from "./client";
export { buildOSDEAnnotation } from "./builder";

const log = logger.child({ module: "osde" });

// Known OSDE plan codes / names
const OSDE_COVERAGE_NAMES = ["osde", "osde 210", "osde 310", "osde 410", "osde 510"];

// ─── Detect OSDE Coverage ────────────────────────────────────

export function isOSDECoverage(coverageName?: string): boolean {
  if (!coverageName) return false;
  return OSDE_COVERAGE_NAMES.some((name) => coverageName.toLowerCase().includes(name));
}

// ─── Register Prescription with OSDE ─────────────────────────

export async function registerWithOSDE(
  rx: DigitalPrescription,
  meds: PrescriptionMedication[],
): Promise<OSDEPrescriptionData> {
  const startedAt = new Date().toISOString();

  // Build FHIR batches
  const batches = buildOSDEPayload(rx, meds);
  log.info(
    { prescriptionId: rx.id, batchCount: batches.length, medCount: meds.length },
    "Registering prescription with OSDE",
  );

  const batchResults: Record<
    string,
    { groupIdentifier?: string; success: boolean; error?: string }
  > = {};
  let allSuccess = true;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    const result: OSDERegistrationResult = await registerPrescription(batch);

    batchResults[`batch_${i + 1}`] = {
      groupIdentifier: result.osdeId,
      success: result.success,
      error: result.error,
    };

    if (!result.success) {
      allSuccess = false;
      log.error({ batchIndex: i, error: result.error }, "OSDE batch registration failed");
    }
  }

  const osdeData: OSDEPrescriptionData = {
    status: allSuccess ? "registered" : "partial",
    registeredAt: allSuccess ? startedAt : undefined,
    batchResults,
  };

  log.info({ status: osdeData.status, batches: batchResults.length }, "OSDE registration complete");

  return osdeData;
}

// ─── Register Posdated Prescription ──────────────────────────

export async function registerPosdatedWithOSDE(
  rx: DigitalPrescription,
  meds: PrescriptionMedication[],
  months: number,
): Promise<OSDEPrescriptionData[]> {
  const results: OSDEPrescriptionData[] = [];

  for (let m = 0; m < months; m++) {
    const date = new Date();
    date.setMonth(date.getMonth() + m);

    const posdatedRx = {
      ...rx,
      issuedAt: date.toISOString(),
    };

    const result = await registerWithOSDE(posdatedRx, meds);
    results.push(result);
  }

  return results;
}

// ─── Build Summary for UI ────────────────────────────────────

export function buildOSDESummary(data: OSDEPrescriptionData): {
  label: string;
  variant: "success" | "warning" | "error" | "default";
} {
  switch (data.status) {
    case "registered":
      return { label: "Registrada en OSDE", variant: "success" };
    case "partial":
      return { label: "Registro parcial OSDE", variant: "warning" };
    case "not_osde":
      return { label: "No OSDE", variant: "default" };
    case "no_credentials":
    case "config_error":
      return { label: "OSDE no configurado", variant: "default" };
    case "validation_error":
    case "server_error":
      return { label: "Error registro OSDE", variant: "error" };
    default:
      return { label: "OSDE", variant: "default" };
  }
}
