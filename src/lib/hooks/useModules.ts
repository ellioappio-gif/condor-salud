// ─── SWR Hooks for Modules 11-14 ─────────────────────────────
// Each hook maps to a data-client key or API route.
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
  return useSWR<Medication[]>("medications");
}

export function usePrescriptions() {
  return useSWR<Prescription[]>("prescriptions");
}

export function useDeliveries() {
  return useSWR<Delivery[]>("deliveries");
}

export function useRecurringOrders() {
  return useSWR<RecurringOrder[]>("recurringOrders");
}

export function useFarmaciaKPIs() {
  return useSWR<FarmaciaKPIs>("farmaciaKPIs");
}

// ─── Module 12: Telemedicina ─────────────────────────────────

export function useWaitingRoom() {
  return useSWR<WaitingRoomEntry[]>("waitingRoom");
}

export function useConsultations() {
  return useSWR<Consultation[]>("consultations");
}

export function useScheduledConsultations() {
  return useSWR<Consultation[]>("scheduledConsultations");
}

export function useTelemedicinaKPIs() {
  return useSWR<TelemedicinaKPIs>("telemedicinaKPIs");
}

// ─── Module 13: Directorio ───────────────────────────────────

export function useDoctors() {
  return useSWR<Doctor[]>("doctors");
}

export function useDirectorioKPIs() {
  return useSWR<DirectorioKPIs>("directorioKPIs");
}

// ─── Module 14: Triage ───────────────────────────────────────

export function useTriages() {
  return useSWR<Triage[]>("triages");
}

export function useTriageKPIs() {
  return useSWR<TriageKPIs>("triageKPIs");
}

// ─── Nubix Cloud (RIS/PACS) ─────────────────────────────────

export function useNubixStudies() {
  return useSWR("nubixStudies");
}

export function useNubixReports() {
  return useSWR("nubixReports");
}

export function useNubixDeliveries() {
  return useSWR("nubixDeliveries");
}

export function useNubixAppointments() {
  return useSWR("nubixAppointments");
}

export function useNubixKPIs() {
  return useSWR("nubixKPIs");
}
