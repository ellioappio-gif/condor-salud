// ─── dcm4chee Archive 5 — DICOMweb Types ────────────────────
// Type definitions for the dcm4chee Archive 5 REST API.
// See https://web.dcm4che.org/ for documentation.
//
// dcm4chee returns DICOM JSON (application/dicom+json) where
// every attribute is keyed by its 8-character hex tag.

// ─── DICOM JSON Value Representation ─────────────────────────

/** A single attribute in a DICOM JSON response */
export interface DicomAttribute<T = unknown> {
  vr: string;
  Value?: T[];
}

/** Person Name component in DICOM JSON */
export interface DicomPersonName {
  Alphabetic?: string; // e.g. "DOE^JOHN"
  Ideographic?: string;
  Phonetic?: string;
}

/** A full DICOM JSON dataset (one study, series, or instance) */
export type DicomDataset = Record<string, DicomAttribute>;

// ─── Well-Known DICOM Tags ───────────────────────────────────

export const DicomTag = {
  // Patient Level
  PatientName: "00100010",
  PatientID: "00100020",
  PatientBirthDate: "00100030",
  PatientSex: "00100040",
  IssuerOfPatientID: "00100021",

  // Study Level
  StudyInstanceUID: "0020000D",
  StudyDate: "00080020",
  StudyTime: "00080030",
  StudyDescription: "00081030",
  StudyID: "00200010",
  AccessionNumber: "00080050",
  ReferringPhysicianName: "00080090",
  ModalitiesInStudy: "00080061",
  NumberOfStudyRelatedSeries: "00201206",
  NumberOfStudyRelatedInstances: "00201208",
  InstitutionName: "00080080",

  // Series Level
  SeriesInstanceUID: "0020000E",
  Modality: "00080060",
  SeriesDescription: "0008103E",
  SeriesNumber: "00200011",
  BodyPartExamined: "00180015",
  NumberOfSeriesRelatedInstances: "00201209",

  // Instance Level
  SOPInstanceUID: "00080018",
  SOPClassUID: "00080016",
  InstanceNumber: "00200013",

  // MWL (Modality Worklist) / Scheduled Procedure Step
  ScheduledProcedureStepSequence: "00400100",
  ScheduledStationAETitle: "00400001",
  ScheduledProcedureStepStartDate: "00400002",
  ScheduledProcedureStepStartTime: "00400003",
  ScheduledPerformingPhysicianName: "00400006",
  ScheduledProcedureStepDescription: "00400007",
  ScheduledStationName: "00400010",
  RequestedProcedureDescription: "00321060",
  RequestedProcedureID: "00401001",

  // Retrieve URL
  RetrieveURL: "00081190",
} as const;

export type DicomTagKey = keyof typeof DicomTag;

// ─── Client Configuration ────────────────────────────────────

export interface DCM4CHEEConfig {
  /** Base URL, e.g. "http://localhost:8080/dcm4chee-arc" */
  baseUrl: string;
  /** AE Title, e.g. "DCM4CHEE" */
  aet: string;
  /** Optional Bearer token for Keycloak-secured instances */
  authToken?: string;
  /** Optional Basic auth username */
  username?: string;
  /** Optional Basic auth password */
  password?: string;
  /** Request timeout in ms (default: 15000) */
  timeoutMs?: number;
  secure: boolean;
}

// ─── Parsed DICOM Entity Types ───────────────────────────────
// These are "clean" types extracted from DICOM JSON responses.

export interface DICOMStudy {
  studyInstanceUID: string;
  studyDate: string;
  studyTime?: string;
  studyDescription?: string;
  accessionNumber?: string;
  patientName: string;
  patientID: string;
  patientBirthDate?: string;
  patientSex?: string;
  modality: string;
  numberOfStudyRelatedSeries?: number;
  numberOfStudyRelatedInstances?: number;
  referringPhysicianName?: string;
  institutionName?: string;
}

export interface DICOMSeries {
  seriesInstanceUID: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality: string;
  numberOfSeriesRelatedInstances?: number;
  seriesDate?: string;
  seriesTime?: string;
  bodyPartExamined?: string;
}

export interface DICOMInstance {
  sopInstanceUID: string;
  instanceNumber?: number;
  sopClassUID?: string;
  rows?: number;
  cols?: number;
  bitsAllocated?: number;
}

/** Parsed MWL item (appointment / scheduled procedure step) */
export interface DICOMMWLItem {
  accessionNumber?: string;
  patientName: string;
  patientID: string;
  modality: string;
  scheduledDate: string;
  scheduledTime?: string;
  scheduledStation?: string;
  performingPhysician?: string;
  procedureDescription?: string;
  requestedProcedure?: string;
}

// ─── Search Params ───────────────────────────────────────────

export interface PatientSearchParams {
  patientID?: string;
  patientName?: string;
  issuerOfPatientID?: string;
  limit?: number;
  offset?: number;
}

export interface StudySearchParams {
  patientID?: string;
  patientName?: string;
  studyInstanceUID?: string;
  accessionNumber?: string;
  studyDateFrom?: string;
  studyDateTo?: string;
  modality?: string;
  limit?: number;
  offset?: number;
}

export interface MWLSearchParams {
  patientName?: string;
  patientID?: string;
  modality?: string;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  scheduledStation?: string;
  limit?: number;
  offset?: number;
}

// ─── API Response Wrappers ───────────────────────────────────

export interface DCM4CHEEResponse<T> {
  data: T[];
  total?: number;
  offset?: number;
  limit?: number;
}

export interface DICOMMetadata {
  studyInstanceUID: string;
  seriesInstanceUID: string;
  sopInstanceUID: string;
  tags: Record<string, unknown>;
}

export interface ViewerConfig {
  studyUID: string;
  seriesUID?: string;
  instanceUID?: string;
  viewerType?: "ohif" | "weasis" | "cornerstone";
}
