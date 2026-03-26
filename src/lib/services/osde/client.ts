/**
 * Cóndor Salud — OSDE FHIR API Client
 *
 * Manages OAuth2 token lifecycle and HTTP communication with OSDE's
 * electronic prescription sandbox.
 *
 * Env vars:
 *   OSDE_API_KEY       — Client ID (API key)
 *   OSDE_API_SECRET    — Client secret
 *   OSDE_API_URL       — Base URL (defaults to sandbox)
 *   CONDOR_SALUD_CUIT  — Our organization CUIT
 */

import { logger } from "@/lib/logger";
import type {
  OSDERegisterPrescriptionRequest,
  OSDERegisterPrescriptionResponse,
  OSDETokenResponse,
  OSDERegistrationResult,
} from "./types";

const log = logger.child({ module: "osde-client" });

const OSDE_BASE = process.env.OSDE_API_URL || "https://gateway.apid-osde.com.ar";
const OSDE_TOKEN_PATH = "/os-oauthv2login/oauth2/token";
const OSDE_REGISTER_PATH = "/prescripcionElectronica/v1/$registrarReceta";
const OSDE_API_KEY = process.env.OSDE_API_KEY;
const OSDE_API_SECRET = process.env.OSDE_API_SECRET;

// ─── Token Management ────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isOSDEConfigured(): boolean {
  return !!(OSDE_API_KEY && OSDE_API_SECRET);
}

async function getToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const url = `${OSDE_BASE}${OSDE_TOKEN_PATH}`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: OSDE_API_KEY!,
    client_secret: OSDE_API_SECRET!,
  });

  log.info("Requesting OSDE OAuth2 token");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OSDE token error (${res.status}): ${text}`);
  }

  const data: OSDETokenResponse = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  log.info("OSDE token obtained (expires_in: %d)", data.expires_in);
  return cachedToken.token;
}

// ─── Register Prescription ───────────────────────────────────

export async function registerPrescription(
  payload: OSDERegisterPrescriptionRequest,
): Promise<OSDERegistrationResult> {
  if (!isOSDEConfigured()) {
    log.warn("OSDE not configured, returning mock result");
    return mockRegistrationResult();
  }

  try {
    const token = await getToken();
    const url = `${OSDE_BASE}${OSDE_REGISTER_PATH}`;

    log.info({ paramCount: payload.parameter.length }, "Registering prescription with OSDE");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text();
      log.error({ status: res.status, body: text }, "OSDE registration failed");
      return {
        success: false,
        error: `OSDE error (${res.status}): ${text}`,
      };
    }

    const response: OSDERegisterPrescriptionResponse = await res.json();

    // Extract OSDE prescription ID from response
    const idParam = response.parameter?.find(
      (p) => p.name === "prescripcionId" || p.name === "id" || p.name === "nroPrescripcion",
    );
    const osdeId = idParam?.valueString || undefined;

    log.info({ osdeId }, "OSDE prescription registered successfully");

    return {
      success: true,
      osdeId,
      rawResponse: response,
    };
  } catch (err) {
    log.error({ err }, "OSDE registration request failed");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown OSDE error",
    };
  }
}

// ─── Mock Result (Demo / No Credentials) ─────────────────────

function mockRegistrationResult(): OSDERegistrationResult {
  const mockId = `OSDE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    success: true,
    osdeId: mockId,
  };
}
