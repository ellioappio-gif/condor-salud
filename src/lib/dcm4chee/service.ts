// ─── DCM4CHEE Service ────────────────────────────────────────
// High-level service for DICOM imaging integration with historia clínica

import { createDCM4CHEEClient } from "./client";
import type { DICOMStudy, StudySearchParams, ViewerConfig } from "./types";
import type { HistoriaEvent } from "@/lib/services/historia";

/**
 * Convert DICOM study to HistoriaEvent format
 */
export function dicomStudyToHistoriaEvent(study: DICOMStudy): HistoriaEvent {
  return {
    id: `dicom-${study.studyInstanceUID}`,
    type: "imagen",
    title: study.studyDescription || `Estudio ${study.modality}`,
    description: `${study.modality} - ${study.numberOfStudyRelatedInstances || 0} imágenes`,
    doctor: study.referringPhysicianName || "Sin especificar",
    date: formatDICOMDate(study.studyDate),
    details: [
      `Modalidad: ${study.modality}`,
      `Número de acceso: ${study.accessionNumber || "N/A"}`,
      `Series: ${study.numberOfStudyRelatedSeries || 0}`,
      `Imágenes: ${study.numberOfStudyRelatedInstances || 0}`,
      study.institutionName ? `Institución: ${study.institutionName}` : "",
    ].filter(Boolean),
    metadata: {
      studyUID: study.studyInstanceUID,
      modality: study.modality,
      accessionNumber: study.accessionNumber || "",
    },
    attachments: [
      {
        name: "Ver estudio DICOM",
        type: "DICOM",
        url: `/api/dicom/viewer?studyUID=${study.studyInstanceUID}`,
      },
    ],
  };
}

/**
 * Format DICOM date (YYYYMMDD) to ISO (YYYY-MM-DD)
 */
function formatDICOMDate(dicomDate: string): string {
  if (!dicomDate || dicomDate.length !== 8) return new Date().toISOString().slice(0, 10);
  return `${dicomDate.slice(0, 4)}-${dicomDate.slice(4, 6)}-${dicomDate.slice(6, 8)}`;
}

/**
 * Search for patient DICOM studies
 */
export async function searchPatientDICOMStudies(
  patientID: string,
  patientName?: string,
): Promise<HistoriaEvent[]> {
  const client = createDCM4CHEEClient();
  if (!client) return [];

  try {
    const params: StudySearchParams = {
      patientID,
      limit: 100,
    };
    if (patientName) params.patientName = patientName;

    const response = await client.searchStudies(params);
    return response.data.map(dicomStudyToHistoriaEvent);
  } catch (error) {
    console.error("Error fetching DICOM studies:", error);
    return [];
  }
}

/**
 * Get DICOM studies for date range
 */
export async function getDICOMStudiesByDateRange(
  patientID: string,
  dateFrom: string,
  dateTo: string,
): Promise<DICOMStudy[]> {
  const client = createDCM4CHEEClient();
  if (!client) return [];

  try {
    const fromFormatted = dateFrom.replace(/-/g, "");
    const toFormatted = dateTo.replace(/-/g, "");

    const response = await client.searchStudies({
      patientID,
      studyDateFrom: fromFormatted,
      studyDateTo: toFormatted,
      limit: 100,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching DICOM studies by date range:", error);
    return [];
  }
}

/**
 * Get viewer configuration for a study
 */
export function getViewerConfig(studyUID: string, viewerType = "ohif"): ViewerConfig {
  return {
    studyUID,
    viewerType: viewerType as ViewerConfig["viewerType"],
  };
}

/**
 * Get viewer URL for a study
 */
export function getStudyViewerUrl(studyUID: string, viewerType = "ohif"): string {
  const client = createDCM4CHEEClient();
  if (!client) return "";

  switch (viewerType) {
    case "weasis":
      return client.getWeasisViewerUrl(studyUID);
    case "ohif":
    default:
      return client.getOHIFViewerUrl(studyUID);
  }
}

/**
 * Check if DCM4CHEE is configured
 */
export function isDCM4CHEEConfigured(): boolean {
  return !!process.env.DCM4CHEE_BASE_URL;
}
