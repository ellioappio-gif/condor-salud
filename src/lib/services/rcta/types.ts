// ─── RCTA QBI2 API Types ─────────────────────────────────────
// Reference: RCTA (rcta.me) by Innovamed — QBI2 e-prescription API
// TODO: Confirm exact field names with Innovamed (wa.me/5491121935123)

/** OAuth2 / Bearer token authentication request */
export interface QBI2AuthRequest {
  apiKey: string;
  doctorId: string;
  /** Grant type — "api_key" for machine-to-machine auth */
  grantType: "api_key";
}

/** Token response from QBI2 auth endpoint */
export interface QBI2TokenResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number; // seconds — typically 1800 (30 min)
  issuedAt: string;
}

/** Medication entry within a QBI2 prescription request */
export interface QBI2Medication {
  drugName: string;
  principioActivo: string;
  presentacion: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  generic: boolean;
  /** Alfabeta drug code — improves pharmacy dispensation accuracy */
  alfabetaCode?: string;
}

/** Diagnosis entry (ICD-10 preferred) */
export interface QBI2Diagnosis {
  /** ICD-10 code, e.g. "I10" for hipertensión esencial */
  cie10Code?: string;
  description: string;
}

/** Patient coverage / obra social data */
export interface QBI2PatientCoverage {
  obraSocialName: string;
  affiliateNumber: string;
  plan?: string;
}

/** Full prescription creation request to QBI2 */
export interface QBI2PrescriptionRequest {
  doctorId: string;
  doctorCUIT: string;
  matriculaNumber: string;
  matriculaType: "nacional" | "provincial";

  patientDNI: string;
  patientName: string;
  patientLastName: string;

  patientCoverage?: QBI2PatientCoverage;

  medications: QBI2Medication[];
  diagnoses: QBI2Diagnosis[];

  notes?: string;
  /** Days the prescription remains valid (default: 30) */
  validityDays: number;
}

/** Successful prescription response from QBI2 */
export interface QBI2PrescriptionResponse {
  prescriptionId: string;
  pdfUrl: string;
  status: "registered" | "pending" | "processing";
  issuedAt: string;
  expiresAt: string;
  /** Raw API response for audit logging */
  rawResponse: Record<string, unknown>;
}

/** Error response from QBI2 API */
export interface QBI2ErrorResponse {
  code: string;
  message: string;
  /** Whether the client should retry this request */
  retryable: boolean;
}

/** Result returned by the RCTA orchestrator */
export interface RCTARegistrationResult {
  status: "registered" | "not_needed" | "error" | "pending_credentials";
  prescriptionId?: string;
  pdfUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
  error?: string;
  /** Was this routed to OSDE FHIR instead? */
  routedToOSDE?: boolean;
}

/** Prescription status check response */
export interface QBI2StatusResponse {
  status: "registered" | "pending" | "dispensed" | "cancelled" | "expired";
  pdfUrl?: string;
  dispensedAt?: string;
  dispensedBy?: string;
}
