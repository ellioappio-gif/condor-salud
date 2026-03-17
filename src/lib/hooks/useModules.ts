// ─── SWR Hooks for Modules 11-14 ─────────────────────────────
// Each hook fetches from the corresponding /api/ route, ensuring
// requests go through authentication + rate-limiting middleware.
// Works with mock data fallback when Supabase is not configured.
// Q-02: All hooks are typed with explicit SWR generics.

"use client";

import useSWR from "swr";
import type {
  Medication,
  Prescription,
  Delivery,
  RecurringOrder,
  KPI,
  WaitingRoomEntry,
  Consultation,
  Doctor,
  Triage,
  FarmaciaKPIs,
  TelemedicinaKPIs,
  DirectorioKPIs,
  TriageKPIs,
} from "@/lib/types";

// ─── Module 11: Farmacia ─────────────────────────────────────

export function useMedications() {
  return useSWR<Medication[]>("/api/farmacia?resource=medications");
}

export function usePrescriptions() {
  return useSWR<Prescription[]>("/api/farmacia?resource=prescriptions");
}

export function useDeliveries() {
  return useSWR<Delivery[]>("/api/farmacia?resource=deliveries");
}

export function useRecurringOrders() {
  return useSWR<RecurringOrder[]>("/api/farmacia?resource=recurring");
}

export function useFarmaciaKPIs() {
  return useSWR<FarmaciaKPIs>("/api/farmacia?resource=kpis");
}

// ─── Module 12: Telemedicina ─────────────────────────────────

export function useWaitingRoom() {
  return useSWR<WaitingRoomEntry[]>("/api/telemedicina?resource=waitingRoom");
}

export function useConsultations() {
  return useSWR<Consultation[]>("/api/telemedicina?resource=consultations");
}

export function useScheduledConsultations() {
  return useSWR<Consultation[]>("/api/telemedicina?resource=scheduled");
}

export function useTelemedicinaKPIs() {
  return useSWR<TelemedicinaKPIs>("/api/telemedicina?resource=kpis");
}

// ─── Module 13: Directorio ───────────────────────────────────

export function useDoctors() {
  return useSWR<Doctor[]>("/api/directorio?resource=doctors");
}

export function useDirectorioKPIs() {
  return useSWR<DirectorioKPIs>("/api/directorio?resource=kpis");
}

// ─── Module 14: Triage ───────────────────────────────────────

export function useTriages() {
  return useSWR<Triage[]>("/api/triage?resource=triages");
}

export function useTriageKPIs() {
  return useSWR<TriageKPIs>("/api/triage?resource=kpis");
}

// ─── Nubix Cloud (RIS/PACS) ─────────────────────────────────

export function useNubixStudies() {
  return useSWR("/api/nubix?resource=studies");
}

export function useNubixReports() {
  return useSWR("/api/nubix?resource=reports");
}

export function useNubixDeliveries() {
  return useSWR("/api/nubix?resource=deliveries");
}

export function useNubixAppointments() {
  return useSWR("/api/nubix?resource=appointments");
}

export function useNubixKPIs() {
  return useSWR("/api/nubix?resource=kpis");
}
