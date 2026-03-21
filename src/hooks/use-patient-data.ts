// ─── Patient-facing SWR Hooks ────────────────────────────────
// Parallel to src/hooks/use-data.ts but for patient portal pages.

"use client";

import useSWR, { useSWRConfig } from "swr";
import { useCallback } from "react";
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
  createBooking,
  cancelBooking,
  getAvailableSlots,
} from "@/lib/services/patient-data";
import type { CreateBookingPayload, PatientAppointment } from "@/lib/services/patient-data";

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

// ─── Booking mutations ───────────────────────────────────────

/** SWR-aware hook to fetch available time slots */
export function useAvailableSlots(specialty: string, date: string) {
  return useSWR(
    specialty && date ? ["patient:slots", specialty, date] : null,
    () => getAvailableSlots(specialty, date),
    { ...opts, revalidateOnFocus: false },
  );
}

/** Mutation hook: create a booking + optimistically update the appointment list */
export function useCreateBooking() {
  const { mutate } = useSWRConfig();

  const trigger = useCallback(
    async (payload: CreateBookingPayload) => {
      const newApt = await createBooking(payload);

      // Optimistically prepend the new appointment
      await mutate(
        "patient:appointments",
        (prev: PatientAppointment[] | undefined) => (prev ? [newApt, ...prev] : [newApt]),
        { revalidate: true },
      );

      return newApt;
    },
    [mutate],
  );

  return { trigger };
}

/** Mutation hook: cancel a booking + optimistically update the appointment list */
export function useCancelBooking() {
  const { mutate } = useSWRConfig();

  const trigger = useCallback(
    async (appointmentId: string, reason?: string) => {
      await cancelBooking(appointmentId, reason);

      // Optimistically set status to cancelado
      await mutate(
        "patient:appointments",
        (prev: PatientAppointment[] | undefined) =>
          prev
            ? prev.map((a) => (a.id === appointmentId ? { ...a, status: "cancelado" as const } : a))
            : prev,
        { revalidate: true },
      );
    },
    [mutate],
  );

  return { trigger };
}
