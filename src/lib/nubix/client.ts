// ─── PACS Client (dcm4chee DICOMweb) ─────────────────────────
// Thin compatibility layer that delegates to the dcm4chee Archive
// client. The old Nubix Cloud REST API has been replaced by the
// open-source dcm4chee Archive 5 DICOMweb endpoints.
//
// This file preserves the isNubixConfigured() export signature
// so that all mock-data fallback logic in services/nubix.ts and
// the rest of the codebase continues to work without changes.
//
// See https://web.dcm4che.org/ for dcm4chee documentation.

import { logger } from "@/lib/logger";
import { isDcm4cheeConfigured, createDCM4CHEEClient, DCM4CHEEError } from "@/lib/dcm4chee/client";
import type { NubixApiError, NubixPaginatedResponse } from "./types";

// ─── Re-export: Configuration Check ─────────────────────────

/**
 * Check if the PACS integration is configured.
 * Now delegates to dcm4chee — checks DCM4CHEE_BASE_URL env var.
 */
export function isNubixConfigured(): boolean {
  return isDcm4cheeConfigured();
}

// ─── Compatibility: configure function (no-op) ───────────────

interface NubixClientConfig {
  baseUrl: string;
  apiKey: string;
  tenantId: string;
  timeoutMs?: number;
}

/** @deprecated — dcm4chee is configured via env vars. This is a no-op. */
export function configureNubixClient(_config: NubixClientConfig): void {
  logger.warn("configureNubixClient() is deprecated — dcm4chee is configured via env vars.");
}

// ─── Error Re-export ─────────────────────────────────────────

export class NubixError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "NubixError";
  }
}

// ─── Legacy HTTP Helpers (delegating to dcm4chee) ────────────
// These are kept for backward compatibility in case any code
// still calls nubixGet/nubixPost directly. They wrap the
// dcm4chee client's fetch under the hood.

async function dcm4cheeRequest<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  },
): Promise<T> {
  const client = createDCM4CHEEClient();
  if (!client) {
    throw new NubixError(503, "NOT_CONFIGURED", "dcm4chee is not configured");
  }

  // Build URL from dcm4chee base
  const baseUrl = process.env.DCM4CHEE_BASE_URL!;
  const aet = process.env.DCM4CHEE_AET || "DCM4CHEE";
  const url = new URL(`${baseUrl}/aets/${aet}/rs${path}`);

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const timeoutMs = 15_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/dicom+json",
    };

    const authToken = process.env.DCM4CHEE_AUTH_TOKEN;
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    if (options?.body) headers["Content-Type"] = "application/json";

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let apiError: NubixApiError | null = null;
      try {
        apiError = (await response.json()) as NubixApiError;
      } catch {
        // Not JSON
      }

      const errMsg =
        apiError?.message ?? `dcm4chee API error: ${response.status} ${response.statusText}`;
      logger.error({ status: response.status, path, code: apiError?.code }, `dcm4chee: ${errMsg}`);
      throw new NubixError(response.status, apiError?.code ?? "UNKNOWN", errMsg, apiError?.details);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof NubixError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      logger.error({ path, timeoutMs }, "dcm4chee request timed out");
      throw new NubixError(408, "TIMEOUT", `Request to ${path} timed out after ${timeoutMs}ms`);
    }

    logger.error({ err, path }, "dcm4chee network error");
    throw new NubixError(
      0,
      "NETWORK_ERROR",
      `Failed to connect to dcm4chee: ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public Legacy API ───────────────────────────────────────

export async function nubixGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  return dcm4cheeRequest<T>("GET", path, { params });
}

export async function nubixPost<T>(path: string, body: unknown): Promise<T> {
  return dcm4cheeRequest<T>("POST", path, { body });
}

export async function nubixPut<T>(path: string, body: unknown): Promise<T> {
  return dcm4cheeRequest<T>("PUT", path, { body });
}

export async function nubixDelete(path: string): Promise<void> {
  return dcm4cheeRequest<void>("DELETE", path);
}

export async function nubixGetPaginated<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<NubixPaginatedResponse<T>> {
  return dcm4cheeRequest<NubixPaginatedResponse<T>>("GET", path, { params });
}
