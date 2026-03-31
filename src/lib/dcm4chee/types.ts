// ─── DCM4CHEE Types ──────────────────────────────────────────
// Type definitions for DCM4CHEE DICOM Archive integration

export interface DCM4CHEEConfig {
  baseUrl: string;
  aet: string; // Application Entity Title
  username?: string;
  password?: string;
  secure: boolean;
}

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
