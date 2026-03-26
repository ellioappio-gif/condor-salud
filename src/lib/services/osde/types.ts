/**
 * Cóndor Salud — OSDE FHIR Types
 *
 * HL7 FHIR 4.0 types for OSDE's electronic prescription API ($registrarReceta).
 * Based on OSDE's sandbox specification at:
 *   https://gateway.apid-osde.com.ar/prescripcionElectronica/v1/$registrarReceta
 */

// ─── FHIR Resource Types ─────────────────────────────────────

export interface FHIRCoding {
  system: string;
  code: string;
  display?: string;
}

export interface FHIRCodeableConcept {
  coding: FHIRCoding[];
  text?: string;
}

export interface FHIRIdentifier {
  system: string;
  value: string;
  type?: FHIRCodeableConcept;
}

export interface FHIRReference {
  reference: string;
  display?: string;
}

export interface FHIRPeriod {
  start: string;
  end?: string;
}

export interface FHIRAddress {
  city?: string;
  state?: string;
  country?: string;
}

export interface FHIRHumanName {
  family: string;
  given: string[];
  prefix?: string[];
}

// ─── FHIR Resources for Prescription Registration ────────────

export interface FHIRProvenance {
  resourceType: "Provenance";
  recorded: string;
  agent: {
    who: FHIRReference;
    onBehalfOf?: FHIRReference;
  }[];
  signature?: {
    type: FHIRCoding[];
    when: string;
    who: FHIRReference;
    data: string;
  }[];
}

export interface FHIRLocation {
  resourceType: "Location";
  identifier: FHIRIdentifier[];
  name?: string;
  address?: FHIRAddress;
}

export interface FHIRPatient {
  resourceType: "Patient";
  identifier: FHIRIdentifier[];
  name: FHIRHumanName[];
  birthDate?: string;
  gender?: "male" | "female" | "other" | "unknown";
}

export interface FHIRPractitioner {
  resourceType: "Practitioner";
  identifier: FHIRIdentifier[];
  name: FHIRHumanName[];
  qualification?: {
    code: FHIRCodeableConcept;
    period?: FHIRPeriod;
  }[];
}

export interface FHIRMedicationRequestDosageInstruction {
  text: string;
  timing?: {
    repeat?: {
      frequency?: number;
      period?: number;
      periodUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
    };
  };
  doseAndRate?: {
    doseQuantity?: {
      value: number;
      unit: string;
    };
  }[];
}

export interface FHIRMedicationRequest {
  resourceType: "MedicationRequest";
  identifier?: FHIRIdentifier[];
  status: "active" | "cancelled" | "completed" | "draft";
  intent: "order" | "plan" | "proposal";
  medicationCodeableConcept: FHIRCodeableConcept;
  subject: FHIRReference;
  requester: FHIRReference;
  reasonCode?: FHIRCodeableConcept[];
  dosageInstruction?: FHIRMedicationRequestDosageInstruction[];
  dispenseRequest?: {
    validityPeriod?: FHIRPeriod;
    numberOfRepeatsAllowed?: number;
    quantity?: {
      value: number;
      unit: string;
    };
  };
  note?: { text: string }[];
}

// ─── OSDE API Payloads ───────────────────────────────────────

export interface OSDEParameterResource {
  name: string;
  resource: FHIRProvenance | FHIRLocation | FHIRPatient | FHIRPractitioner | FHIRMedicationRequest;
}

export interface OSDERegisterPrescriptionRequest {
  resourceType: "Parameters";
  parameter: OSDEParameterResource[];
}

export interface OSDERegisterPrescriptionResponse {
  resourceType: "Parameters";
  parameter: {
    name: string;
    valueString?: string;
    valueBoolean?: boolean;
    resource?: Record<string, unknown>;
  }[];
}

// ─── OSDE Token ──────────────────────────────────────────────

export interface OSDETokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// ─── Internal Result ─────────────────────────────────────────

export interface OSDERegistrationResult {
  success: boolean;
  osdeId?: string;
  batchIndex?: number;
  error?: string;
  rawResponse?: OSDERegisterPrescriptionResponse;
}
