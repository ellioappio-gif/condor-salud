// ─── dcm4chee Archive 5 — DICOMweb Client ───────────────────
// HTTP client for dcm4chee Archive REST API (QIDO-RS, WADO-RS,
// STOW-RS, MWL). Handles auth, timeouts, and DICOM JSON parsing.
// See https://web.dcm4che.org/ for full API reference.

import { logger } from "@/lib/logger";
import type {
  DCM4CHEEConfig,
  DicomDataset,
  DicomAttribute,
  DicomPersonName,
  DICOMStudy,
  DICOMSeries,
  DICOMInstance,
  DICOMMWLItem,
  StudySearchParams,
  MWLSearchParams,
  PatientSearchParams,
  DCM4CHEEResponse,
  DICOMMetadata,
} from "./types";
import { DicomTag } from "./types";

// ─── DICOM JSON Helpers ──────────────────────────────────────

/** Extract a string value from a DICOM attribute */
function getString(ds: DicomDataset, tag: string): string {
  const attr = ds[tag];
  if (!attr?.Value || attr.Value.length === 0) return "";
  return String(attr.Value[0]);
}

/** Extract a number value from a DICOM attribute */
function getNumber(ds: DicomDataset, tag: string): number {
  const attr = ds[tag];
  if (!attr?.Value || attr.Value.length === 0) return 0;
  const val = attr.Value[0];
  return typeof val === "number" ? val : parseInt(String(val), 10) || 0;
}

/** Extract a Person Name (PN VR) from a DICOM attribute */
function getPersonName(ds: DicomDataset, tag: string): string {
  const attr = ds[tag] as DicomAttribute<DicomPersonName> | undefined;
  if (!attr?.Value || attr.Value.length === 0) return "";
  const pn = attr.Value[0];
  if (!pn) return "";
  // PN format: "FAMILY^GIVEN^MIDDLE^PREFIX^SUFFIX"
  const alphabetic = pn.Alphabetic ?? "";
  // Convert DICOM PN to readable name: "MENDEZ^CARLOS" → "Carlos Méndez"
  const parts = alphabetic.split("^").filter(Boolean);
  if (parts.length >= 2) return `${parts[1]} ${parts[0]}`;
  return parts[0] ?? "";
}

/** Extract a multi-valued CS (e.g. ModalitiesInStudy) */
function getStringArray(ds: DicomDataset, tag: string): string[] {
  const attr = ds[tag];
  if (!attr?.Value) return [];
  return attr.Value.map(String);
}

/** Format DICOM date (YYYYMMDD) to ISO (YYYY-MM-DD) */
function formatDicomDate(dicomDate: string): string {
  if (!dicomDate || dicomDate.length < 8) return "";
  return `${dicomDate.slice(0, 4)}-${dicomDate.slice(4, 6)}-${dicomDate.slice(6, 8)}`;
}

/** Format DICOM time (HHMMSS.FFFFFF) to HH:MM:SS */
function formatDicomTime(dicomTime: string): string {
  if (!dicomTime || dicomTime.length < 4) return "";
  return `${dicomTime.slice(0, 2)}:${dicomTime.slice(2, 4)}${dicomTime.length >= 6 ? ":" + dicomTime.slice(4, 6) : ""}`;
}

/** Convert DICOM date + time to ISO 8601 datetime string */
function dicomDateTimeToISO(date: string, time?: string): string {
  const isoDate = formatDicomDate(date);
  if (!isoDate) return new Date().toISOString();
  const isoTime = time ? formatDicomTime(time) : "00:00:00";
  return `${isoDate}T${isoTime}Z`;
}

// ─── DICOM JSON → Typed Entity Parsers ───────────────────────

/** Parse a DICOM JSON dataset into a DICOMStudy */
function parseStudy(ds: DicomDataset): DICOMStudy {
  const modalities = getStringArray(ds, DicomTag.ModalitiesInStudy);
  return {
    studyInstanceUID: getString(ds, DicomTag.StudyInstanceUID),
    studyDate: formatDicomDate(getString(ds, DicomTag.StudyDate)),
    studyTime: formatDicomTime(getString(ds, DicomTag.StudyTime)),
    studyDescription: getString(ds, DicomTag.StudyDescription) || undefined,
    accessionNumber: getString(ds, DicomTag.AccessionNumber) || undefined,
    patientName: getPersonName(ds, DicomTag.PatientName),
    patientID: getString(ds, DicomTag.PatientID),
    patientBirthDate: formatDicomDate(getString(ds, DicomTag.PatientBirthDate)) || undefined,
    patientSex: getString(ds, DicomTag.PatientSex) || undefined,
    modality: modalities[0] ?? getString(ds, DicomTag.Modality) ?? "OT",
    numberOfStudyRelatedSeries: getNumber(ds, DicomTag.NumberOfStudyRelatedSeries) || undefined,
    numberOfStudyRelatedInstances:
      getNumber(ds, DicomTag.NumberOfStudyRelatedInstances) || undefined,
    referringPhysicianName: getPersonName(ds, DicomTag.ReferringPhysicianName) || undefined,
    institutionName: getString(ds, DicomTag.InstitutionName) || undefined,
  };
}

/** Parse a DICOM JSON dataset into a DICOMSeries */
function parseSeries(ds: DicomDataset): DICOMSeries {
  return {
    seriesInstanceUID: getString(ds, DicomTag.SeriesInstanceUID),
    seriesNumber: getNumber(ds, DicomTag.SeriesNumber) || undefined,
    seriesDescription: getString(ds, DicomTag.SeriesDescription) || undefined,
    modality: getString(ds, DicomTag.Modality) || "OT",
    numberOfSeriesRelatedInstances:
      getNumber(ds, DicomTag.NumberOfSeriesRelatedInstances) || undefined,
    bodyPartExamined: getString(ds, DicomTag.BodyPartExamined) || undefined,
  };
}

/** Parse a DICOM JSON MWL item (Scheduled Procedure Step) */
function parseMWLItem(ds: DicomDataset): DICOMMWLItem {
  // SPS attributes may be nested in ScheduledProcedureStepSequence
  const spsSeq = ds[DicomTag.ScheduledProcedureStepSequence];
  const spsItem =
    spsSeq?.Value && (spsSeq.Value as DicomDataset[])[0]
      ? (spsSeq.Value as DicomDataset[])[0]
      : undefined;
  const sps: DicomDataset = spsItem ?? ds;

  return {
    accessionNumber: getString(ds, DicomTag.AccessionNumber) || undefined,
    patientName: getPersonName(ds, DicomTag.PatientName),
    patientID: getString(ds, DicomTag.PatientID),
    modality: getString(sps, DicomTag.Modality) || "OT",
    scheduledDate: formatDicomDate(getString(sps, DicomTag.ScheduledProcedureStepStartDate)),
    scheduledTime:
      formatDicomTime(getString(sps, DicomTag.ScheduledProcedureStepStartTime)) || undefined,
    scheduledStation: getString(sps, DicomTag.ScheduledStationName) || undefined,
    performingPhysician: getPersonName(sps, DicomTag.ScheduledPerformingPhysicianName) || undefined,
    procedureDescription: getString(sps, DicomTag.ScheduledProcedureStepDescription) || undefined,
    requestedProcedure: getString(ds, DicomTag.RequestedProcedureDescription) || undefined,
  };
}

// ─── Error Class ─────────────────────────────────────────────

export class DCM4CHEEError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "DCM4CHEEError";
  }
}

// ─── Client Class ────────────────────────────────────────────

const DEFAULT_CONFIG: Partial<DCM4CHEEConfig> = {
  aet: "DCM4CHEE",
  secure: true,
  timeoutMs: 15_000,
};

export class DCM4CHEEClient {
  private config: DCM4CHEEConfig;
  private baseHeaders: HeadersInit;

  constructor(config: DCM4CHEEConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as DCM4CHEEConfig;
    this.baseHeaders = {
      Accept: "application/dicom+json",
    };

    // Auth: Bearer token (Keycloak) or Basic auth
    if (config.authToken) {
      this.baseHeaders["Authorization"] = `Bearer ${config.authToken}`;
    } else if (config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
      this.baseHeaders["Authorization"] = `Basic ${auth}`;
    }
  }

  /** Base path for DICOMweb RS endpoints */
  private get rsBase(): string {
    return `/aets/${this.config.aet}/rs`;
  }

  /** Execute an HTTP request with timeout and error handling */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const timeoutMs = this.config.timeoutMs ?? 15_000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.baseHeaders,
          ...options?.headers,
        },
        signal: options?.signal ?? controller.signal,
      });

      if (!response.ok) {
        const errMsg = `dcm4chee API error: ${response.status} ${response.statusText}`;
        logger.error({ status: response.status, endpoint }, errMsg);
        throw new DCM4CHEEError(response.status, "API_ERROR", errMsg);
      }

      // 204 No Content
      if (response.status === 204) return undefined as T;

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof DCM4CHEEError) throw err;

      if (err instanceof DOMException && err.name === "AbortError") {
        logger.error({ endpoint, timeoutMs }, "dcm4chee request timed out");
        throw new DCM4CHEEError(
          408,
          "TIMEOUT",
          `Request to ${endpoint} timed out after ${timeoutMs}ms`,
        );
      }

      logger.error({ err, endpoint }, "dcm4chee network error");
      throw new DCM4CHEEError(
        0,
        "NETWORK_ERROR",
        `Failed to connect to dcm4chee: ${(err as Error).message}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── QIDO-RS: Search ────────────────────────────────────────

  /** Search for patients (QIDO-RS) */
  async searchPatients(params: PatientSearchParams): Promise<DCM4CHEEResponse<DICOMStudy>> {
    const query = new URLSearchParams();
    if (params.patientID) query.set("PatientID", params.patientID);
    if (params.patientName) query.set("PatientName", `*${params.patientName}*`);
    if (params.issuerOfPatientID) query.set("IssuerOfPatientID", params.issuerOfPatientID);
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.offset) query.set("offset", params.offset.toString());
    query.set("includefield", "all");

    const datasets = await this.request<DicomDataset[]>(`${this.rsBase}/patients?${query}`);
    return { data: (datasets ?? []).map(parseStudy) };
  }

  /** Search for studies (QIDO-RS) */
  async searchStudies(params: StudySearchParams): Promise<DCM4CHEEResponse<DICOMStudy>> {
    const query = new URLSearchParams();
    if (params.patientID) query.set("PatientID", params.patientID);
    if (params.patientName) query.set("PatientName", `*${params.patientName}*`);
    if (params.studyInstanceUID) query.set("StudyInstanceUID", params.studyInstanceUID);
    if (params.accessionNumber) query.set("AccessionNumber", params.accessionNumber);
    if (params.modality) query.set("ModalitiesInStudy", params.modality);
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.offset) query.set("offset", params.offset.toString());
    query.set("includefield", "all");

    // QIDO-RS date range: YYYYMMDD-YYYYMMDD
    if (params.studyDateFrom && params.studyDateTo) {
      query.set("StudyDate", `${params.studyDateFrom}-${params.studyDateTo}`);
    } else if (params.studyDateFrom) {
      query.set("StudyDate", `${params.studyDateFrom}-`);
    } else if (params.studyDateTo) {
      query.set("StudyDate", `-${params.studyDateTo}`);
    }

    const datasets = await this.request<DicomDataset[]>(`${this.rsBase}/studies?${query}`);
    return { data: (datasets ?? []).map(parseStudy) };
  }

  /** Get a single study by UID (QIDO-RS) */
  async getStudy(studyUID: string): Promise<DICOMStudy | null> {
    try {
      const datasets = await this.request<DicomDataset[]>(
        `${this.rsBase}/studies?StudyInstanceUID=${studyUID}&includefield=all`,
      );
      if (!datasets || datasets.length === 0) return null;
      const ds = datasets[0];
      if (!ds) return null;
      return parseStudy(ds);
    } catch {
      return null;
    }
  }

  /** Get study count (QIDO-COUNT) */
  async getStudyCount(params?: { studyDate?: string; modality?: string }): Promise<number> {
    const query = new URLSearchParams();
    if (params?.studyDate) query.set("StudyDate", params.studyDate);
    if (params?.modality) query.set("ModalitiesInStudy", params.modality);
    const qs = query.toString();

    try {
      const result = await this.request<{ count: number }>(
        `${this.rsBase}/studies/count${qs ? "?" + qs : ""}`,
      );
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  // ─── QIDO-RS: Series & Instances ───────────────────────────

  /** Get series for a study */
  async getStudySeries(studyUID: string): Promise<DCM4CHEEResponse<DICOMSeries>> {
    const datasets = await this.request<DicomDataset[]>(
      `${this.rsBase}/studies/${studyUID}/series?includefield=all`,
    );
    return { data: (datasets ?? []).map(parseSeries) };
  }

  /** Get instances for a series */
  async getSeriesInstances(
    studyUID: string,
    seriesUID: string,
  ): Promise<DCM4CHEEResponse<DICOMInstance>> {
    const datasets = await this.request<DicomDataset[]>(
      `${this.rsBase}/studies/${studyUID}/series/${seriesUID}/instances?includefield=all`,
    );
    const instances: DICOMInstance[] = (datasets ?? []).map((ds) => ({
      sopInstanceUID: getString(ds, DicomTag.SOPInstanceUID),
      instanceNumber: getNumber(ds, DicomTag.InstanceNumber) || undefined,
      sopClassUID: getString(ds, DicomTag.SOPClassUID) || undefined,
    }));
    return { data: instances };
  }

  // ─── WADO-RS: Retrieve ─────────────────────────────────────

  /** Get metadata for a study */
  async getStudyMetadata(studyUID: string): Promise<DICOMMetadata[]> {
    return this.request<DICOMMetadata[]>(`${this.rsBase}/studies/${studyUID}/metadata`);
  }

  /** Get thumbnail URL for a study */
  getStudyThumbnailUrl(studyUID: string): string {
    return `${this.config.baseUrl}${this.rsBase}/studies/${studyUID}/thumbnail`;
  }

  /** Get rendered instance URL (JPEG/PNG) */
  getInstanceRenderedUrl(studyUID: string, seriesUID: string, instanceUID: string): string {
    return `${this.config.baseUrl}${this.rsBase}/studies/${studyUID}/series/${seriesUID}/instances/${instanceUID}/rendered`;
  }

  /** Get thumbnail URL for an instance */
  getThumbnailUrl(studyUID: string, seriesUID: string, instanceUID: string): string {
    return `${this.config.baseUrl}${this.rsBase}/studies/${studyUID}/series/${seriesUID}/instances/${instanceUID}/thumbnail`;
  }

  /** Get WADO-URI for downloading a DICOM object */
  getWADOUrl(studyUID: string, seriesUID: string, instanceUID: string): string {
    return `${this.config.baseUrl}/aets/${this.config.aet}/wado?requestType=WADO&studyUID=${studyUID}&seriesUID=${seriesUID}&objectUID=${instanceUID}&contentType=application/dicom`;
  }

  // ─── STOW-RS: Store ────────────────────────────────────────

  /** Store DICOM instances via STOW-RS */
  async storeInstances(dicomData: ArrayBuffer): Promise<DicomDataset> {
    return this.request<DicomDataset>(`${this.rsBase}/studies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/dicom",
      },
      body: dicomData,
    });
  }

  // ─── MWL_RS: Modality Worklist ─────────────────────────────

  /** Search MWL items / scheduled procedures (appointments) */
  async searchMWLItems(params?: MWLSearchParams): Promise<DCM4CHEEResponse<DICOMMWLItem>> {
    const query = new URLSearchParams();
    if (params?.patientName) query.set("PatientName", `*${params.patientName}*`);
    if (params?.patientID) query.set("PatientID", params.patientID);
    if (params?.modality) query.set("Modality", params.modality);
    if (params?.scheduledStation) query.set("ScheduledStationName", params.scheduledStation);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset) query.set("offset", params.offset.toString());
    query.set("includefield", "all");

    // Date range
    if (params?.scheduledDateFrom && params?.scheduledDateTo) {
      query.set(
        "ScheduledProcedureStepStartDate",
        `${params.scheduledDateFrom}-${params.scheduledDateTo}`,
      );
    } else if (params?.scheduledDateFrom) {
      query.set("ScheduledProcedureStepStartDate", `${params.scheduledDateFrom}-`);
    } else if (params?.scheduledDateTo) {
      query.set("ScheduledProcedureStepStartDate", `-${params.scheduledDateTo}`);
    }

    const datasets = await this.request<DicomDataset[]>(`${this.rsBase}/mwlitems?${query}`);
    return { data: (datasets ?? []).map(parseMWLItem) };
  }

  /** Get MWL item count */
  async getMWLItemCount(params?: { scheduledDate?: string }): Promise<number> {
    const query = new URLSearchParams();
    if (params?.scheduledDate) query.set("ScheduledProcedureStepStartDate", params.scheduledDate);
    const qs = query.toString();

    try {
      const result = await this.request<{ count: number }>(
        `${this.rsBase}/mwlitems/count${qs ? "?" + qs : ""}`,
      );
      return result?.count ?? 0;
    } catch {
      return 0;
    }
  }

  // ─── Study Management ──────────────────────────────────────

  /** Delete a study */
  async deleteStudy(studyUID: string): Promise<void> {
    await this.request(`${this.rsBase}/studies/${studyUID}`, { method: "DELETE" });
  }

  // ─── Viewer URLs ───────────────────────────────────────────

  /** Get OHIF viewer URL */
  getOHIFViewerUrl(studyUID: string): string {
    return `${this.config.baseUrl}/viewer/viewer/${studyUID}`;
  }

  /** Get Weasis viewer launch URL */
  getWeasisViewerUrl(studyUID: string): string {
    return `${this.config.baseUrl}/weasis?studyUID=${studyUID}`;
  }
}

// ─── Factory ─────────────────────────────────────────────────

let _clientInstance: DCM4CHEEClient | null = null;

/** Check if dcm4chee integration is configured via env vars */
export function isDcm4cheeConfigured(): boolean {
  return !!process.env.DCM4CHEE_BASE_URL;
}

/** Create or return a singleton DCM4CHEE client from env vars */
export function createDCM4CHEEClient(): DCM4CHEEClient | null {
  if (_clientInstance) return _clientInstance;

  const baseUrl = process.env.DCM4CHEE_BASE_URL;
  if (!baseUrl) return null;

  _clientInstance = new DCM4CHEEClient({
    baseUrl,
    aet: process.env.DCM4CHEE_AET || "DCM4CHEE",
    authToken: process.env.DCM4CHEE_AUTH_TOKEN,
    username: process.env.DCM4CHEE_USERNAME,
    password: process.env.DCM4CHEE_PASSWORD,
    secure: process.env.DCM4CHEE_SECURE !== "false",
  });

  return _clientInstance;
}

// ─── Exported DICOM Helpers ──────────────────────────────────

export { formatDicomDate, formatDicomTime, dicomDateTimeToISO };
