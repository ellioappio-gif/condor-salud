// ─── Patient-facing SWR Hooks ────────────────────────────────
// Parallel to src/hooks/use-data.ts but for patient portal pages.

"use client";

import useSWR from "swr";
import {
  getMyAppointments,
  getMyMedications,
  getMyMedOrders,
  getMyVitals,
  getMyAlerts,
  getMyCoverage,
  getMyTeleAppointments,
  getDoctorDirectory,
  getMyProfile,
} from "@/lib/services/patient-data";

// Shared config: revalidate on focus, retry twice
const opts = { revalidateOnFocus: true, errorRetryCount: 2 } as const;

export function useMyAppointments() {
  return useSWR("patient:appointments", getMyAppointments, opts);
}

export function useMyMedications() {
  return useSWR("patient:medications", getMyMedications, opts);
}

export function useMyMedOrders() {
  return useSWR("patient:medOrders", getMyMedOrders, opts);
}

export function useMyVitals() {
  return useSWR("patient:vitals", getMyVitals, opts);
}

export function useMyAlerts() {
  return useSWR("patient:alerts", getMyAlerts, opts);
}

export function useMyCoverage() {
  return useSWR("patient:coverage", getMyCoverage, opts);
}

export function useMyTeleAppointments() {
  return useSWR("patient:teleAppointments", getMyTeleAppointments, opts);
}

export function useDoctorDirectory() {
  return useSWR("patient:doctors", getDoctorDirectory, opts);
}

export function useMyProfile(cookieName?: string) {
  return useSWR(
    cookieName ? ["patient:profile", cookieName] : "patient:profile",
    () => getMyProfile(cookieName),
    opts,
  );
}
