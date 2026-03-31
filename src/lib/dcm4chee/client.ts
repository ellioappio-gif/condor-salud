// ─── DCM4CHEE Client ─────────────────────────────────────────
// Client for interacting with DCM4CHEE Archive via REST API

import type {
  DCM4CHEEConfig,
  DICOMStudy,
  DICOMSeries,
  DICOMInstance,
  StudySearchParams,
  PatientSearchParams,
  DCM4CHEEResponse,
  DICOMMetadata,
} from "./types";

const DEFAULT_CONFIG: Partial<DCM4CHEEConfig> = {
  aet: "DCM4CHEE",
  secure: true,
};

export class DCM4CHEEClient {
  private config: DCM4CHEEConfig;
  private baseHeaders: HeadersInit;

  constructor(config: DCM4CHEEConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as DCM4CHEEConfig;
    this.baseHeaders = {
      "Content-Type": "application/json",
      Accept: "application/dicom+json",
    };

    if (config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
      this.baseHeaders["Authorization"] = `Basic ${auth}`;
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.baseHeaders,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`DCM4CHEE API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search for patients
   */
  async searchPatients(params: PatientSearchParams): Promise<DCM4CHEEResponse<DICOMStudy>> {
    const query = new URLSearchParams();
    if (params.patientID) query.set("PatientID", params.patientID);
    if (params.patientName) query.set("PatientName", params.patientName);
    if (params.issuerOfPatientID) query.set("IssuerOfPatientID", params.issuerOfPatientID);
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.offset) query.set("offset", params.offset.toString());

    const data = await this.request<DICOMStudy[]>(`/aets/${this.config.aet}/rs/patients?${query}`);
    return { data };
  }

  /**
   * Search for studies
   */
  async searchStudies(params: StudySearchParams): Promise<DCM4CHEEResponse<DICOMStudy>> {
    const query = new URLSearchParams();
    if (params.patientID) query.set("PatientID", params.patientID);
    if (params.patientName) query.set("PatientName", params.patientName);
    if (params.studyInstanceUID) query.set("StudyInstanceUID", params.studyInstanceUID);
    if (params.accessionNumber) query.set("AccessionNumber", params.accessionNumber);
    if (params.studyDateFrom) query.set("StudyDate", `${params.studyDateFrom}-`);
    if (params.studyDateTo) query.set("StudyDate", `-${params.studyDateTo}`);
    if (params.modality) query.set("ModalitiesInStudy", params.modality);
    if (params.limit) query.set("limit", params.limit.toString());
    if (params.offset) query.set("offset", params.offset.toString());

    const data = await this.request<DICOMStudy[]>(`/aets/${this.config.aet}/rs/studies?${query}`);
    return { data };
  }

  /**
   * Get study by UID
   */
  async getStudy(studyUID: string): Promise<DICOMStudy> {
    const data = await this.request<DICOMStudy[]>(
      `/aets/${this.config.aet}/rs/studies/${studyUID}`,
    );
    return data[0];
  }

  /**
   * Get series for a study
   */
  async getStudySeries(studyUID: string): Promise<DCM4CHEEResponse<DICOMSeries>> {
    const data = await this.request<DICOMSeries[]>(
      `/aets/${this.config.aet}/rs/studies/${studyUID}/series`,
    );
    return { data };
  }

  /**
   * Get instances for a series
   */
  async getSeriesInstances(
    studyUID: string,
    seriesUID: string,
  ): Promise<DCM4CHEEResponse<DICOMInstance>> {
    const data = await this.request<DICOMInstance[]>(
      `/aets/${this.config.aet}/rs/studies/${studyUID}/series/${seriesUID}/instances`,
    );
    return { data };
  }

  /**
   * Get metadata for a study
   */
  async getStudyMetadata(studyUID: string): Promise<DICOMMetadata[]> {
    return this.request<DICOMMetadata[]>(
      `/aets/${this.config.aet}/rs/studies/${studyUID}/metadata`,
    );
  }

  /**
   * Get rendered instance (JPEG/PNG)
   */
  getInstanceRenderedUrl(studyUID: string, seriesUID: string, instanceUID: string): string {
    return `${this.config.baseUrl}/aets/${this.config.aet}/rs/studies/${studyUID}/series/${seriesUID}/instances/${instanceUID}/rendered`;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(studyUID: string, seriesUID: string, instanceUID: string): string {
    return `${this.config.baseUrl}/aets/${this.config.aet}/rs/studies/${studyUID}/series/${seriesUID}/instances/${instanceUID}/thumbnail`;
  }

  /**
   * Get WADO URI for downloading
   */
  getWADOUrl(studyUID: string, seriesUID: string, instanceUID: string): string {
    return `${this.config.baseUrl}/wado?requestType=WADO&studyUID=${studyUID}&seriesUID=${seriesUID}&objectUID=${instanceUID}&contentType=application/dicom`;
  }

  /**
   * Delete a study
   */
  async deleteStudy(studyUID: string): Promise<void> {
    await this.request(`/aets/${this.config.aet}/rs/studies/${studyUID}`, {
      method: "DELETE",
    });
  }

  /**
   * Get viewer URL (OHIF)
   */
  getOHIFViewerUrl(studyUID: string): string {
    return `${this.config.baseUrl}/viewer/viewer/${studyUID}`;
  }

  /**
   * Get Weasis viewer launch URL
   */
  getWeasisViewerUrl(studyUID: string): string {
    return `${this.config.baseUrl}/weasis?studyUID=${studyUID}`;
  }
}

/**
 * Create a DCM4CHEE client from environment variables
 */
export function createDCM4CHEEClient(): DCM4CHEEClient | null {
  const baseUrl = process.env.DCM4CHEE_BASE_URL;
  if (!baseUrl) return null;

  return new DCM4CHEEClient({
    baseUrl,
    aet: process.env.DCM4CHEE_AET || "DCM4CHEE",
    username: process.env.DCM4CHEE_USERNAME,
    password: process.env.DCM4CHEE_PASSWORD,
    secure: process.env.DCM4CHEE_SECURE !== "false",
  });
}
