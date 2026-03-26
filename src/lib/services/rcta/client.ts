// ─── RCTA QBI2 API Client ────────────────────────────────────
// Handles authentication, token caching, and all QBI2 HTTP calls.
// Credentials are server-side only — never import this in client components.
//
// TODO: Confirm base URL and auth flow with Innovamed (wa.me/5491121935123)

import { logger } from "@/lib/logger";
import type {
  QBI2PrescriptionRequest,
  QBI2PrescriptionResponse,
  QBI2StatusResponse,
  QBI2TokenResponse,
} from "./types";

// ─── Configuration ───────────────────────────────────────────

/** Base URL for RCTA QBI2 API — TODO: confirm with Innovamed */
const RCTA_BASE_URL = process.env.RCTA_BASE_URL || "https://api.rcta.me/v1";
const RCTA_API_KEY = process.env.RCTA_API_KEY || "";
const RCTA_DOCTOR_ID = process.env.RCTA_DOCTOR_ID || "";
const REQUEST_TIMEOUT_MS = 15_000;

// ─── Token Cache ─────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// ─── Error Class ─────────────────────────────────────────────

export class RCTAError extends Error {
  public readonly code: string;
  public readonly isRetryable: boolean;
  public readonly isAuthError: boolean;
  public readonly statusCode?: number;

  constructor(opts: {
    message: string;
    code: string;
    isRetryable?: boolean;
    isAuthError?: boolean;
    statusCode?: number;
  }) {
    super(opts.message);
    this.name = "RCTAError";
    this.code = opts.code;
    this.isRetryable = opts.isRetryable ?? false;
    this.isAuthError = opts.isAuthError ?? false;
    this.statusCode = opts.statusCode;
  }
}

// ─── Helpers ─────────────────────────────────────────────────

/** Check if RCTA credentials are configured */
export function isRCTAConfigured(): boolean {
  return !!RCTA_API_KEY && RCTA_API_KEY.length > 5 && !!RCTA_DOCTOR_ID;
}

/** Authenticated fetch with timeout and error handling */
async function rctaFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${RCTA_BASE_URL}${path}`, {
      ...opts,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-RCTA-Doctor-Id": RCTA_DOCTOR_ID,
        ...opts.headers,
      },
    });

    // Token expired — refresh once and retry
    if (res.status === 401) {
      cachedToken = null;
      tokenExpiresAt = 0;
      const freshToken = await getAccessToken();
      const retryRes = await fetch(`${RCTA_BASE_URL}${path}`, {
        ...opts,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
          "X-RCTA-Doctor-Id": RCTA_DOCTOR_ID,
          ...opts.headers,
        },
      });
      if (!retryRes.ok) {
        throw new RCTAError({
          message: `RCTA auth failed after token refresh: ${retryRes.status}`,
          code: "AUTH_REFRESH_FAILED",
          isAuthError: true,
          statusCode: retryRes.status,
        });
      }
      return retryRes;
    }

    if (!res.ok) {
      let errorBody: Record<string, unknown> = {};
      try {
        errorBody = await res.json();
      } catch {
        // Non-JSON error response
      }
      const msg =
        (errorBody.message as string) ||
        (errorBody.error as string) ||
        `RCTA API error: ${res.status}`;
      throw new RCTAError({
        message: msg,
        code: (errorBody.code as string) || `HTTP_${res.status}`,
        isRetryable: res.status >= 500 || res.status === 429,
        statusCode: res.status,
      });
    }

    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Authentication ──────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (5-min buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 300_000) {
    return cachedToken;
  }

  if (!isRCTAConfigured()) {
    throw new RCTAError({
      message: "RCTA credentials not configured",
      code: "NO_CREDENTIALS",
      isAuthError: true,
    });
  }

  logger.info({ route: "rcta/auth" }, "Requesting new RCTA access token");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // TODO: Confirm exact auth endpoint with Innovamed
    const res = await fetch(`${RCTA_BASE_URL}/auth/token`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: RCTA_API_KEY,
        doctorId: RCTA_DOCTOR_ID,
        grantType: "api_key",
      }),
    });

    if (!res.ok) {
      throw new RCTAError({
        message: `RCTA auth failed: ${res.status}`,
        code: "AUTH_FAILED",
        isAuthError: true,
        statusCode: res.status,
      });
    }

    const data: QBI2TokenResponse = await res.json();
    cachedToken = data.accessToken;
    tokenExpiresAt = Date.now() + data.expiresIn * 1000;

    return data.accessToken;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Register a prescription in RCTA QBI2.
 * Returns the RCTA prescription ID, PDF URL, and metadata.
 */
export async function registerPrescription(
  payload: QBI2PrescriptionRequest,
): Promise<QBI2PrescriptionResponse> {
  logger.info(
    {
      route: "rcta/register",
      patientDNI: payload.patientDNI,
      medCount: payload.medications.length,
    },
    "Registering prescription in RCTA QBI2",
  );

  const res = await rctaFetch("/prescriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  return {
    prescriptionId: data.prescriptionId || data.id,
    pdfUrl: data.pdfUrl || data.pdf_url || "",
    status: data.status || "registered",
    issuedAt: data.issuedAt || data.issued_at || new Date().toISOString(),
    expiresAt: data.expiresAt || data.expires_at || "",
    rawResponse: data,
  };
}

/**
 * Check the status of a previously registered prescription.
 */
export async function getPrescriptionStatus(prescriptionId: string): Promise<QBI2StatusResponse> {
  logger.info({ route: "rcta/status", prescriptionId }, "Checking RCTA prescription status");

  const res = await rctaFetch(`/prescriptions/${encodeURIComponent(prescriptionId)}/status`);
  const data = await res.json();

  return {
    status: data.status || "pending",
    pdfUrl: data.pdfUrl || data.pdf_url,
    dispensedAt: data.dispensedAt || data.dispensed_at,
    dispensedBy: data.dispensedBy || data.dispensed_by,
  };
}

/**
 * Cancel a previously registered prescription.
 * Throws RCTAError if the prescription cannot be cancelled.
 */
export async function cancelPrescription(prescriptionId: string): Promise<void> {
  logger.info({ route: "rcta/cancel", prescriptionId }, "Cancelling RCTA prescription");

  await rctaFetch(`/prescriptions/${encodeURIComponent(prescriptionId)}/cancel`, {
    method: "POST",
  });
}
