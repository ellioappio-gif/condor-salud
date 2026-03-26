// ─── dcm4chee → Nubix Entity Mapper ─────────────────────────
// Maps dcm4chee DICOMweb responses to the existing NubixStudy /
// NubixAppointment / NubixKPI shapes consumed by the UI.
// Also provides high-level service functions used by Historia.
//
// IMPORTANT: The UI types (NubixStudy, NubixAppointment, etc.)
// and all mock/demo data remain 100% intact. This mapper only
// bridges the "real" dcm4chee data path.

import { createDCM4CHEEClient, isDcm4cheeConfigured, dicomDateTimeToISO } from "./client";
import type { DICOMStudy, DICOMMWLItem, StudySearchParams, MWLSearchParams } from "./types";
import type {
  NubixStudy,
  NubixAppointment,
  NubixViewerConfig,
  NubixKPIs,
  NubixStudyFilters,
  NubixAppointmentFilters,
  NubixModality,
  NubixStudyStatus,
  NubixSpecialty,
} from "@/lib/nubix/types";
import type { HistoriaEvent } from "@/lib/services/historia";

// ─── Modality Mapping ────────────────────────────────────────
// dcm4chee returns standard DICOM modality codes which mostly
// match NubixModality. This set validates known values.

const KNOWN_MODALITIES = new Set<string>([
  "CR",
  "CT",
  "MR",
  "US",
  "DX",
  "MG",
  "OT",
  "XA",
  "PT",
  "NM",
  "IO",
  "PX",
  "ES",
  "ECG",
  "AU",
  "OPT",
]);

function toNubixModality(mod: string): NubixModality {
  return KNOWN_MODALITIES.has(mod) ? (mod as NubixModality) : "OT";
}

// ─── Status Inference ────────────────────────────────────────
// dcm4chee doesn't natively track study workflow status the way
// a RIS does. We infer a reasonable status from available data.

function inferStudyStatus(study: DICOMStudy): NubixStudyStatus {
  const instances = study.numberOfStudyRelatedInstances ?? 0;
  if (instances === 0) return "scheduled";
  return "completed";
}

// ─── Specialty Inference ─────────────────────────────────────
// Infer specialty from modality when not available.

function inferSpecialty(mod: NubixModality): NubixSpecialty {
  switch (mod) {
    case "IO":
    case "PX":
      return "dental";
    case "ECG":
      return "cardiologia";
    case "AU":
      return "audiometria";
    case "OPT":
      return "oftalmologia";
    case "ES":
      return "colposcopia";
    default:
      return "radiologia";
  }
}

// ─── DICOMStudy → NubixStudy ─────────────────────────────────

export function mapDicomStudyToNubix(study: DICOMStudy): NubixStudy {
  const client = createDCM4CHEEClient();
  const modality = toNubixModality(study.modality);
  const studyDateTime = study.studyDate
    ? dicomDateTimeToISO(study.studyDate.replace(/-/g, ""), study.studyTime?.replace(/:/g, ""))
    : new Date().toISOString();

  return {
    id: study.studyInstanceUID,
    accessionNumber: study.accessionNumber ?? study.studyInstanceUID.slice(-12),
    patientId: study.patientID,
    patientName: study.patientName || "Paciente desconocido",
    patientDni: study.patientID, // dcm4chee PatientID maps to DNI
    modality,
    specialty: inferSpecialty(modality),
    description: study.studyDescription ?? `Estudio ${study.modality}`,
    bodyPart: "", // Not available at study level in QIDO-RS
    studyDate: studyDateTime,
    status: inferStudyStatus(study),
    instanceCount: study.numberOfStudyRelatedInstances ?? 0,
    seriesCount: study.numberOfStudyRelatedSeries ?? 0,
    referringDoctor: study.referringPhysicianName ?? "",
    reportingDoctor: null, // Reports are not a DICOM concept
    reportStatus: "pending",
    financiador: "", // Not a DICOM attribute
    viewerUrl: client ? client.getOHIFViewerUrl(study.studyInstanceUID) : "",
    thumbnailUrl: client ? client.getStudyThumbnailUrl(study.studyInstanceUID) : null,
    createdAt: studyDateTime,
    updatedAt: studyDateTime,
  };
}

// ─── DICOMMWLItem → NubixAppointment ─────────────────────────

export function mapMWLItemToNubixAppointment(item: DICOMMWLItem): NubixAppointment {
  const modality = toNubixModality(item.modality);
  const scheduledAt = item.scheduledDate
    ? dicomDateTimeToISO(
        item.scheduledDate.replace(/-/g, ""),
        item.scheduledTime?.replace(/:/g, ""),
      )
    : new Date().toISOString();

  return {
    id: `mwl-${item.accessionNumber ?? item.patientID}-${item.scheduledDate}`,
    patientName: item.patientName || "Paciente desconocido",
    patientDni: item.patientID,
    modality,
    specialty: inferSpecialty(modality),
    description: item.procedureDescription ?? item.requestedProcedure ?? `Turno ${item.modality}`,
    scheduledAt,
    duration: 30, // Default — MWL doesn't carry duration
    room: item.scheduledStation ?? "",
    referringDoctor: item.performingPhysician ?? "",
    financiador: "", // Not a DICOM attribute
    status: "confirmed",
    reminderSent: false,
    notes: "",
  };
}

// ─── High-level dcm4chee Service Functions ───────────────────
// These replace the Nubix REST calls in services/nubix.ts when
// dcm4chee is configured.

/** Fetch studies from dcm4chee, applying Nubix-compatible filters */
export async function fetchDcm4cheeStudies(filters?: NubixStudyFilters): Promise<NubixStudy[]> {
  const client = createDCM4CHEEClient();
  if (!client) return [];

  try {
    const params: StudySearchParams = {
      patientName: filters?.patientName,
      patientID: filters?.patientDni,
      modality: filters?.modality,
      limit: filters?.pageSize ?? 50,
      offset: filters?.page ? (filters.page - 1) * (filters?.pageSize ?? 50) : 0,
    };

    // Date filters → DICOM date format (YYYYMMDD)
    if (filters?.dateFrom) params.studyDateFrom = filters.dateFrom.replace(/-/g, "");
    if (filters?.dateTo) params.studyDateTo = filters.dateTo.replace(/-/g, "");

    const response = await client.searchStudies(params);
    let studies = response.data.map(mapDicomStudyToNubix);

    // Apply post-filters not supported by QIDO-RS query
    if (filters?.status) studies = studies.filter((s) => s.status === filters.status);
    if (filters?.specialty) studies = studies.filter((s) => s.specialty === filters.specialty);
    if (filters?.financiador)
      studies = studies.filter((s) => s.financiador === filters.financiador);
    if (filters?.referringDoctor) {
      const q = filters.referringDoctor.toLowerCase();
      studies = studies.filter((s) => s.referringDoctor.toLowerCase().includes(q));
    }

    return studies;
  } catch {
    return [];
  }
}

/** Fetch a single study from dcm4chee by StudyInstanceUID */
export async function fetchDcm4cheeStudy(id: string): Promise<NubixStudy | null> {
  const client = createDCM4CHEEClient();
  if (!client) return null;

  try {
    const study = await client.getStudy(id);
    if (!study) return null;
    return mapDicomStudyToNubix(study);
  } catch {
    return null;
  }
}

/** Fetch appointments from dcm4chee MWL */
export async function fetchDcm4cheeAppointments(
  filters?: NubixAppointmentFilters,
): Promise<NubixAppointment[]> {
  const client = createDCM4CHEEClient();
  if (!client) return [];

  try {
    const params: MWLSearchParams = {
      modality: filters?.modality,
      scheduledStation: filters?.room,
      limit: filters?.pageSize ?? 50,
      offset: filters?.page ? (filters.page - 1) * (filters?.pageSize ?? 50) : 0,
    };

    if (filters?.dateFrom) params.scheduledDateFrom = filters.dateFrom.replace(/-/g, "");
    if (filters?.dateTo) params.scheduledDateTo = filters.dateTo.replace(/-/g, "");

    const response = await client.searchMWLItems(params);
    return response.data.map(mapMWLItemToNubixAppointment);
  } catch {
    return [];
  }
}

/** Build OHIF/Weasis viewer config for a study */
export function getDcm4cheeViewerConfig(studyId: string): NubixViewerConfig | null {
  const client = createDCM4CHEEClient();
  if (!client) return null;

  return {
    studyId,
    embedUrl: client.getOHIFViewerUrl(studyId),
    token: "dcm4chee-no-token", // dcm4chee uses session-based auth
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    tools: ["zoom", "pan", "window_level", "measure", "annotate", "rotate", "invert"],
  };
}

/** Compute KPIs from dcm4chee study/MWL counts */
export async function fetchDcm4cheeKPIs(): Promise<NubixKPIs> {
  const client = createDCM4CHEEClient();
  if (!client) {
    return {
      totalStudies: 0,
      todayStudies: 0,
      pendingReports: 0,
      deliveredToday: 0,
      avgReportTime: "—",
      appointmentsToday: 0,
      noShowRate: 0,
      storageUsedGB: 0,
    };
  }

  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const [totalStudies, todayStudies, appointmentsToday] = await Promise.all([
      client.getStudyCount(),
      client.getStudyCount({ studyDate: today }),
      client.getMWLItemCount({ scheduledDate: today }),
    ]);

    return {
      totalStudies,
      todayStudies,
      pendingReports: 0, // Reports managed externally
      deliveredToday: 0, // Deliveries managed externally
      avgReportTime: "—",
      appointmentsToday,
      noShowRate: 0,
      storageUsedGB: 0, // Could be fetched via /storage endpoint
    };
  } catch {
    return {
      totalStudies: 0,
      todayStudies: 0,
      pendingReports: 0,
      deliveredToday: 0,
      avgReportTime: "—",
      appointmentsToday: 0,
      noShowRate: 0,
      storageUsedGB: 0,
    };
  }
}

// ─── Historia Integration ────────────────────────────────────
// Convert DICOM studies to HistoriaEvent format for clinical records.

export function dicomStudyToHistoriaEvent(study: DICOMStudy): HistoriaEvent {
  const isoDate = study.studyDate
    ? dicomDateTimeToISO(study.studyDate.replace(/-/g, ""), study.studyTime?.replace(/:/g, ""))
    : new Date().toISOString();

  return {
    id: `dicom-${study.studyInstanceUID}`,
    type: "imagen",
    title: study.studyDescription || `Estudio ${study.modality}`,
    description: `${study.modality} - ${study.numberOfStudyRelatedInstances || 0} imágenes`,
    doctor: study.referringPhysicianName || "Sin especificar",
    date: isoDate.slice(0, 10),
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

/** Search patient DICOM studies for historia clínica */
export async function searchPatientDICOMStudies(
  patientID: string,
  patientName?: string,
): Promise<HistoriaEvent[]> {
  const client = createDCM4CHEEClient();
  if (!client) return [];

  try {
    const params: StudySearchParams = { patientID, limit: 100 };
    if (patientName) params.patientName = patientName;
    const response = await client.searchStudies(params);
    return response.data.map(dicomStudyToHistoriaEvent);
  } catch (error) {
    console.error("Error fetching DICOM studies:", error);
    return [];
  }
}

/** Get DICOM studies by date range */
export async function getDICOMStudiesByDateRange(
  patientID: string,
  dateFrom: string,
  dateTo: string,
): Promise<DICOMStudy[]> {
  const client = createDCM4CHEEClient();
  if (!client) return [];

  try {
    const response = await client.searchStudies({
      patientID,
      studyDateFrom: dateFrom.replace(/-/g, ""),
      studyDateTo: dateTo.replace(/-/g, ""),
      limit: 100,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching DICOM studies by date range:", error);
    return [];
  }
}

/** Get viewer configuration for a study */
export function getViewerConfig(
  studyUID: string,
  viewerType = "ohif",
): { studyUID: string; viewerType: string } {
  return { studyUID, viewerType };
}

/** Get viewer URL for a study */
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

/** Re-export for backward compatibility */
export { isDcm4cheeConfigured as isDCM4CHEEConfigured } from "./client";
