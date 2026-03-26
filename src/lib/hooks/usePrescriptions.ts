// ─── Prescription Hooks ──────────────────────────────────────
// Client-side hooks for prescriptions: list, create, detail.
// Demo mode: uses local state. Live mode: calls API routes.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DigitalPrescription } from "@/lib/types";
import type { RCTARegistrationResult } from "@/lib/services/rcta/types";

// ─── Types ───────────────────────────────────────────────────

interface PrescriptionFilters {
  status?: string;
  coverageType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreatePrescriptionPayload {
  patientId: string;
  patientName: string;
  patientDni?: string;
  doctorName: string;
  doctorCuit?: string;
  doctorMatricula?: string;
  matriculaType?: "nacional" | "provincial";
  specialty?: string;
  diagnosis?: string;
  diagnoses?: { code?: string; description: string }[];
  notes?: string;
  coverageName?: string;
  coveragePlan?: string;
  coverageNumber?: string;
  asDraft?: boolean;
  medications: {
    medicationName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration?: string;
    quantity?: number;
    notes?: string;
    drug?: {
      drugId: string;
      alfabetaCode?: string;
      genericName: string;
      commercialName: string;
      lab: string;
      concentration: string;
      presentation: string;
      isControlled: boolean;
    };
  }[];
}

interface CreatePrescriptionResult {
  prescription: DigitalPrescription & {
    registrations?: {
      osde?: { status: string };
      rcta?: { status: string; prescriptionId?: string; pdfUrl?: string; error?: string };
    };
  };
  verificationUrl: string;
  registrations?: {
    osde?: { status: string };
    rcta?: RCTARegistrationResult;
  };
}

// ─── usePrescriptions ────────────────────────────────────────

/**
 * Real-time prescription list with filtering.
 * In demo mode, returns static data. In live mode, fetches from API.
 */
export function usePrescriptions(_doctorId?: string, filters?: PrescriptionFilters) {
  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = JSON.stringify(filters || {});

  useEffect(() => {
    let cancelled = false;

    async function fetchPrescriptions() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters?.status) params.set("status", filters.status);
        if (filters?.coverageType) params.set("coverage", filters.coverageType);
        if (filters?.search) params.set("q", filters.search);
        if (filters?.dateFrom) params.set("from", filters.dateFrom);
        if (filters?.dateTo) params.set("to", filters.dateTo);

        const res = await fetch(`/api/prescriptions?${params.toString()}`);
        if (!res.ok) throw new Error("Error al cargar recetas");

        const data = await res.json();
        if (!cancelled) {
          setPrescriptions(data.prescriptions || []);
        }
      } catch {
        // API not available — prescriptions remain empty (demo pages use local state)
        if (!cancelled) {
          setPrescriptions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPrescriptions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  return { prescriptions, loading, error, setPrescriptions };
}

// ─── useCreatePrescription ───────────────────────────────────

/**
 * Create a prescription via the issue API route.
 * Handles loading state, error capture, and RCTA/OSDE routing result.
 */
export function useCreatePrescription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePrescriptionResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const issue = useCallback(async (payload: CreatePrescriptionPayload) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/prescriptions/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status} al emitir receta`);
      }

      const data: CreatePrescriptionResult = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return null;
      const message = err instanceof Error ? err.message : "Error desconocido al emitir receta";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { issue, loading, error, result, reset };
}

// ─── usePrescriptionDetail ───────────────────────────────────

/**
 * Single prescription detail with real-time registration status.
 */
export function usePrescriptionDetail(prescriptionId: string | null) {
  const [prescription, setPrescription] = useState<
    | (DigitalPrescription & {
        registrations?: {
          osde?: { status: string; registeredAt?: string };
          rcta?: { status: string; prescriptionId?: string; pdfUrl?: string; error?: string };
        };
      })
    | null
  >(null);
  const [loading, setLoading] = useState(!!prescriptionId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prescriptionId) {
      setPrescription(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/prescriptions/${prescriptionId}`);
        if (!res.ok) throw new Error("Error al cargar detalle de receta");

        const data = await res.json();
        if (!cancelled) {
          setPrescription(data.prescription || data);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el detalle de la receta");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [prescriptionId]);

  return { prescription, loading, error };
}
