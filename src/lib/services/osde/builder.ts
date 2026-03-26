/**
 * Cóndor Salud — OSDE FHIR Payload Builder
 *
 * Transforms internal prescription data into HL7 FHIR 4.0 Parameters
 * resource for OSDE's $registrarReceta operation.
 *
 * OSDE requires: Provenance, Location, Patient, Practitioner,
 * and one MedicationRequest per medication. Max 3 per request (batch).
 */

import type { DigitalPrescription, PrescriptionMedication } from "@/lib/types";
import type {
  FHIRLocation,
  FHIRMedicationRequest,
  FHIRPatient,
  FHIRPractitioner,
  FHIRProvenance,
  OSDEParameterResource,
  OSDERegisterPrescriptionRequest,
} from "./types";

const CONDOR_CUIT = process.env.CONDOR_SALUD_CUIT || "30-71234567-8";
const MAX_MEDS_PER_BATCH = 3;

// ─── Build Full Payload ──────────────────────────────────────

export function buildOSDEPayload(
  rx: DigitalPrescription,
  meds: PrescriptionMedication[],
): OSDERegisterPrescriptionRequest[] {
  // Split into batches of 3
  const batches: PrescriptionMedication[][] = [];
  for (let i = 0; i < meds.length; i += MAX_MEDS_PER_BATCH) {
    batches.push(meds.slice(i, i + MAX_MEDS_PER_BATCH));
  }

  return batches.map((batch, idx) => ({
    resourceType: "Parameters" as const,
    parameter: [
      buildProvenanceParam(rx),
      buildLocationParam(),
      buildPatientParam(rx),
      buildPractitionerParam(rx),
      ...batch.map((med) => buildMedicationRequestParam(rx, med, idx)),
    ],
  }));
}

// ─── Individual Resource Builders ────────────────────────────

function buildProvenanceParam(rx: DigitalPrescription): OSDEParameterResource {
  const provenance: FHIRProvenance = {
    resourceType: "Provenance",
    recorded: rx.issuedAt || new Date().toISOString(),
    agent: [
      {
        who: {
          reference: `Practitioner/${rx.doctorCuit || "unknown"}`,
          display: rx.doctorName,
        },
        onBehalfOf: {
          reference: `Organization/${CONDOR_CUIT}`,
          display: "Cóndor Salud",
        },
      },
    ],
  };
  return { name: "Provenance", resource: provenance };
}

function buildLocationParam(): OSDEParameterResource {
  const location: FHIRLocation = {
    resourceType: "Location",
    identifier: [
      {
        system: "http://www.afip.gob.ar/CUIT",
        value: CONDOR_CUIT,
      },
    ],
    name: "Cóndor Salud — Plataforma Digital",
    address: {
      city: "Buenos Aires",
      state: "Buenos Aires",
      country: "AR",
    },
  };
  return { name: "Location", resource: location };
}

function buildPatientParam(rx: DigitalPrescription): OSDEParameterResource {
  const nameParts = (rx.patientName || "Paciente Desconocido").split(" ");
  const family = nameParts.length > 1 ? nameParts.slice(-1).join(" ") : nameParts[0] || "";
  const given = nameParts.length > 1 ? nameParts.slice(0, -1) : [nameParts[0] || ""];

  const patient: FHIRPatient = {
    resourceType: "Patient",
    identifier: [
      {
        system: "http://www.renaper.gob.ar/dni",
        value: rx.patientDni || "00000000",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "NI",
              display: "National Identifier",
            },
          ],
        },
      },
    ],
    name: [{ family, given }],
  };

  // Add OSDE member number if available
  if (rx.coverageNumber) {
    patient.identifier.push({
      system: "http://www.osde.com.ar/afiliado",
      value: rx.coverageNumber,
    });
  }

  return { name: "Patient", resource: patient };
}

function buildPractitionerParam(rx: DigitalPrescription): OSDEParameterResource {
  const nameParts = (rx.doctorName || "Doctor").split(" ");
  const family = nameParts.length > 1 ? nameParts.slice(-1).join(" ") : nameParts[0] || "";
  const given = nameParts.length > 1 ? nameParts.slice(0, -1) : [nameParts[0] || ""];

  const practitioner: FHIRPractitioner = {
    resourceType: "Practitioner",
    identifier: [
      {
        system: "http://www.afip.gob.ar/CUIT",
        value: rx.doctorCuit || "00-00000000-0",
      },
    ],
    name: [{ family, given, prefix: ["Dr."] }],
    qualification: [
      {
        code: {
          coding: [
            {
              system: "http://www.sisa.msal.gov.ar/refeps",
              code: "MED",
              display: "Médico",
            },
          ],
        },
      },
    ],
  };

  return { name: "Practitioner", resource: practitioner };
}

function buildMedicationRequestParam(
  rx: DigitalPrescription,
  med: PrescriptionMedication,
  _batchIndex: number,
): OSDEParameterResource {
  const medRequest: FHIRMedicationRequest = {
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    medicationCodeableConcept: {
      coding: [
        ...(med.drug?.troquel
          ? [
              {
                system: "http://www.kairos.com.ar/troquel",
                code: med.drug.troquel,
                display: med.drug.commercialName || med.medicationName,
              },
            ]
          : []),
        ...(med.drug?.alfabetaCode
          ? [
              {
                system: "http://www.alfabeta.net/codigo",
                code: med.drug.alfabetaCode,
              },
            ]
          : []),
      ],
      text: med.genericName || med.medicationName,
    },
    subject: {
      reference: `Patient/${rx.patientDni || "unknown"}`,
      display: rx.patientName,
    },
    requester: {
      reference: `Practitioner/${rx.doctorCuit || "unknown"}`,
      display: rx.doctorName,
    },
    dosageInstruction: [
      {
        text: med.dosage,
      },
    ],
    note: med.notes ? [{ text: med.notes }] : undefined,
  };

  // Add diagnosis as reasonCode
  if (rx.diagnoses && rx.diagnoses.length > 0) {
    medRequest.reasonCode = rx.diagnoses.map((dx) => ({
      coding: dx.code
        ? [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: dx.code,
              display: dx.description,
            },
          ]
        : [],
      text: dx.description,
    }));
  }

  return { name: "MedicationRequest", resource: medRequest };
}

// ─── Utility: Build PDF Annotation ───────────────────────────

export function buildOSDEAnnotation(osdeId: string): string {
  return `Receta electrónica registrada en OSDE.\nNro. OSDE: ${osdeId}\nRegistro FHIR 4.0 conforme Res. MSN 1314/2023.`;
}
