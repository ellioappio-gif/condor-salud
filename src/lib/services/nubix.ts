// ─── Nubix Service Layer ─────────────────────────────────────
// Real Nubix API calls with mock fallback when not configured.
// Follows the same pattern as farmacia.ts, telemedicina.ts, etc.

import {
  isNubixConfigured,
  nubixGet,
  nubixPost,
  nubixPut,
  nubixGetPaginated,
} from "@/lib/nubix/client";
import type {
  NubixStudy,
  NubixReport,
  NubixDelivery,
  NubixAppointment,
  NubixViewerConfig,
  NubixKPIs,
  NubixStudyFilters,
  NubixAppointmentFilters,
  NubixPaginatedResponse,
} from "@/lib/nubix/types";

// ─── Empty fallback arrays (no demo data) ───────────────────

const mockStudies: NubixStudy[] = [];
const mockReports: NubixReport[] = [];
const mockDeliveries: NubixDelivery[] = [];
const mockAppointments: NubixAppointment[] = [];

// ─── Service Functions ───────────────────────────────────────

/** Get all studies, optionally filtered */
export async function getNubixStudies(filters?: NubixStudyFilters): Promise<NubixStudy[]> {
  if (!isNubixConfigured()) return applyStudyFilters(mockStudies, filters);

  try {
    const params: Record<string, string | number | undefined> = {
      patient_name: filters?.patientName,
      patient_dni: filters?.patientDni,
      modality: filters?.modality,
      specialty: filters?.specialty,
      status: filters?.status,
      date_from: filters?.dateFrom,
      date_to: filters?.dateTo,
      referring_doctor: filters?.referringDoctor,
      financiador: filters?.financiador,
      page: filters?.page ?? 1,
      page_size: filters?.pageSize ?? 50,
    };

    const res = await nubixGetPaginated<NubixStudy>("/studies", params);
    return res.data;
  } catch {
    return applyStudyFilters(mockStudies, filters);
  }
}

/** Get a single study by ID */
export async function getNubixStudy(id: string): Promise<NubixStudy | null> {
  if (!isNubixConfigured()) return mockStudies.find((s) => s.id === id) ?? null;

  try {
    return await nubixGet<NubixStudy>(`/studies/${id}`);
  } catch {
    return mockStudies.find((s) => s.id === id) ?? null;
  }
}

/** Get report for a study */
export async function getNubixReport(studyId: string): Promise<NubixReport | null> {
  if (!isNubixConfigured()) return mockReports.find((r) => r.studyId === studyId) ?? null;

  try {
    return await nubixGet<NubixReport>(`/studies/${studyId}/report`);
  } catch {
    return mockReports.find((r) => r.studyId === studyId) ?? null;
  }
}

/** Get all reports (pending + signed) */
export async function getNubixReports(): Promise<NubixReport[]> {
  if (!isNubixConfigured()) return mockReports;

  try {
    const res = await nubixGetPaginated<NubixReport>("/reports", { page_size: 100 });
    return res.data;
  } catch {
    return mockReports;
  }
}

/** Get delivery history for a study */
export async function getNubixDeliveries(studyId?: string): Promise<NubixDelivery[]> {
  if (!isNubixConfigured()) {
    return studyId ? mockDeliveries.filter((d) => d.studyId === studyId) : mockDeliveries;
  }

  try {
    const path = studyId ? `/studies/${studyId}/deliveries` : "/deliveries";
    const res = await nubixGetPaginated<NubixDelivery>(path, { page_size: 100 });
    return res.data;
  } catch {
    return studyId ? mockDeliveries.filter((d) => d.studyId === studyId) : mockDeliveries;
  }
}

/** Send study results to a patient via WhatsApp/email/portal */
export async function sendNubixResults(
  studyId: string,
  channel: NubixDelivery["channel"],
  recipientContact: string,
): Promise<NubixDelivery | null> {
  if (!isNubixConfigured()) {
    return null;
  }

  try {
    return await nubixPost<NubixDelivery>(`/studies/${studyId}/deliver`, {
      channel,
      recipient_contact: recipientContact,
    });
  } catch {
    return null;
  }
}

/** Get DICOM viewer embed config (temporary token + URL) */
export async function getNubixViewerConfig(studyId: string): Promise<NubixViewerConfig | null> {
  if (!isNubixConfigured()) {
    return null;
  }

  try {
    return await nubixPost<NubixViewerConfig>(`/studies/${studyId}/viewer-token`, {});
  } catch {
    return null;
  }
}

/** Get appointments, optionally filtered */
export async function getNubixAppointments(
  filters?: NubixAppointmentFilters,
): Promise<NubixAppointment[]> {
  if (!isNubixConfigured()) return mockAppointments;

  try {
    const params: Record<string, string | number | undefined> = {
      date_from: filters?.dateFrom,
      date_to: filters?.dateTo,
      modality: filters?.modality,
      status: filters?.status,
      room: filters?.room,
      page: filters?.page ?? 1,
      page_size: filters?.pageSize ?? 50,
    };

    const res = await nubixGetPaginated<NubixAppointment>("/appointments", params);
    return res.data;
  } catch {
    return mockAppointments;
  }
}

/** Create or update an appointment */
export async function upsertNubixAppointment(
  data: Omit<NubixAppointment, "id">,
  id?: string,
): Promise<NubixAppointment | null> {
  if (!isNubixConfigured()) return null;

  try {
    if (id) {
      return await nubixPut<NubixAppointment>(`/appointments/${id}`, data);
    }
    return await nubixPost<NubixAppointment>("/appointments", data);
  } catch {
    return null;
  }
}

// ─── KPIs ────────────────────────────────────────────────────

export async function getNubixKPIs(): Promise<NubixKPIs> {
  if (!isNubixConfigured()) {
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
    return await nubixGet<NubixKPIs>("/stats/kpis");
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

// ─── Helpers ─────────────────────────────────────────────────

function applyStudyFilters(studies: NubixStudy[], filters?: NubixStudyFilters): NubixStudy[] {
  if (!filters) return studies;

  return studies.filter((s) => {
    if (
      filters.patientName &&
      !s.patientName.toLowerCase().includes(filters.patientName.toLowerCase())
    )
      return false;
    if (filters.patientDni && !s.patientDni.includes(filters.patientDni)) return false;
    if (filters.modality && s.modality !== filters.modality) return false;
    if (filters.specialty && s.specialty !== filters.specialty) return false;
    if (filters.status && s.status !== filters.status) return false;
    if (filters.financiador && s.financiador !== filters.financiador) return false;
    if (
      filters.referringDoctor &&
      !s.referringDoctor.toLowerCase().includes(filters.referringDoctor.toLowerCase())
    )
      return false;
    return true;
  });
}
