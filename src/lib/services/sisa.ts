/**
 * Cóndor Salud — SISA Service
 *
 * Validates healthcare professionals against SISA (Sistema Integrado de
 * Información Sanitaria Argentino) — the official national registry of
 * healthcare providers maintained by the Ministerio de Salud de la Nación.
 *
 * API: https://sisa.msal.gov.ar/sisa/services/rest
 * Auth: Basic (SISA_API_USER + SISA_API_PASS)
 *
 * Falls back to mock data when env vars are missing or API is unavailable.
 */

import { logger } from "@/lib/logger";
import type { SISADoctorData, SISAValidationResult } from "@/lib/types";

const log = logger.child({ module: "sisa" });

const SISA_BASE = process.env.SISA_API_URL || "https://sisa.msal.gov.ar/sisa/services/rest";
const SISA_USER = process.env.SISA_API_USER;
const SISA_PASS = process.env.SISA_API_PASS;

// ─── Validate Doctor by DNI ─────────────────────────────────

export async function validateDoctorByDNI(dni: string): Promise<SISAValidationResult> {
  if (SISA_USER && SISA_PASS) {
    try {
      return await callSISA(`/profesional/dni/${encodeURIComponent(dni)}`);
    } catch (err) {
      log.warn({ err, dni }, "SISA API error, using fallback");
    }
  }
  return mockValidation(dni, undefined);
}

// ─── Validate Doctor by Matrícula ────────────────────────────

export async function validateDoctorByMatricula(
  matricula: string,
  province?: string,
): Promise<SISAValidationResult> {
  if (SISA_USER && SISA_PASS) {
    try {
      const endpoint = province
        ? `/profesional/matricula/${encodeURIComponent(matricula)}/provincia/${encodeURIComponent(province)}`
        : `/profesional/matricula/${encodeURIComponent(matricula)}`;
      return await callSISA(endpoint);
    } catch (err) {
      log.warn({ err, matricula }, "SISA API error, using fallback");
    }
  }
  return mockValidation(undefined, matricula);
}

// ─── SISA API Call ───────────────────────────────────────────

async function callSISA(endpoint: string): Promise<SISAValidationResult> {
  const url = `${SISA_BASE}${endpoint}`;
  const auth = Buffer.from(`${SISA_USER}:${SISA_PASS}`).toString("base64");

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (res.status === 404) {
    return {
      valid: false,
      data: null,
      error: "Profesional no encontrado en el Registro Federal de Profesionales de Salud.",
    };
  }

  if (!res.ok) {
    throw new Error(`SISA HTTP ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();

  // SISA returns different shapes — normalize
  const prof = json.profesional || json;

  if (!prof || prof.resultado === "NO_ENCONTRADO") {
    return {
      valid: false,
      data: null,
      error: "Profesional no encontrado en SISA.",
    };
  }

  const doctor: SISADoctorData = {
    nombre: String(prof.nombre || ""),
    apellido: String(prof.apellido || ""),
    dni: String(prof.nroDocumento || prof.dni || ""),
    matricula: String(prof.matriculaNacional || prof.matricula || ""),
    provincia: String(prof.provincia || prof.jurisdiccion || ""),
    profesion: String(prof.profesion || "Medicina"),
    especialidad: String(prof.especialidad || "General"),
    tipoMatricula: prof.tipoMatricula === "provincial" ? "provincial" : "nacional",
    estado: normalizeEstado(prof.estado),
  };

  const isActive = doctor.estado === "habilitado";

  return {
    valid: isActive,
    data: doctor,
    error: isActive
      ? undefined
      : `Profesional con estado: ${doctor.estado}. No habilitado para prescribir.`,
  };
}

function normalizeEstado(raw: unknown): SISADoctorData["estado"] {
  const s = String(raw || "").toLowerCase();
  if (s.includes("inhab")) return "inhabilitado";
  if (s.includes("suspen")) return "suspendido";
  return "habilitado";
}

// ─── Mock Validation (Demo Mode) ────────────────────────────

function mockValidation(dni?: string, matricula?: string): SISAValidationResult {
  log.info({ dni, matricula }, "Using mock SISA validation (demo mode)");

  // Known demo doctors
  const DEMO_DOCTORS: SISADoctorData[] = [
    {
      nombre: "María",
      apellido: "Rodríguez",
      dni: "27345678",
      matricula: "MN-12345",
      provincia: "Buenos Aires",
      profesion: "Medicina",
      especialidad: "Medicina General",
      tipoMatricula: "nacional",
      estado: "habilitado",
    },
    {
      nombre: "Carlos",
      apellido: "Gómez",
      dni: "30456789",
      matricula: "MN-54321",
      provincia: "Buenos Aires",
      profesion: "Medicina",
      especialidad: "Cardiología",
      tipoMatricula: "nacional",
      estado: "habilitado",
    },
    {
      nombre: "Laura",
      apellido: "Fernández",
      dni: "28567890",
      matricula: "MN-67890",
      provincia: "Córdoba",
      profesion: "Medicina",
      especialidad: "Pediatría",
      tipoMatricula: "nacional",
      estado: "habilitado",
    },
  ];

  // Try to match by DNI or matrícula
  const match = DEMO_DOCTORS.find(
    (d) =>
      (dni && d.dni === dni) ||
      (matricula && d.matricula.toLowerCase() === matricula?.toLowerCase()),
  );

  if (match) {
    return { valid: true, data: match };
  }

  // Return first demo doctor for any unrecognized input (demo mode is permissive)
  return {
    valid: true,
    data: {
      ...DEMO_DOCTORS[0]!,
      dni: dni || DEMO_DOCTORS[0]!.dni,
      matricula: matricula || DEMO_DOCTORS[0]!.matricula,
    },
  };
}
