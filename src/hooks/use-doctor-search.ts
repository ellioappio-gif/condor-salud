"use client";

import { useState, useCallback, useRef } from "react";
import type { SearchDoctor, DoctorSearchParams, DoctorSearchResponse } from "@/lib/doctor-search";
import { searchDoctors } from "@/lib/doctor-search";

interface UseDoctorSearchState {
  doctors: SearchDoctor[];
  loading: boolean;
  error: string | null;
  total: number;
  searched: boolean;
}

interface UseDoctorSearchReturn extends UseDoctorSearchState {
  search: (params: DoctorSearchParams) => Promise<void>;
  clearResults: () => void;
}

export function useDoctorSearch(): UseDoctorSearchReturn {
  const [state, setState] = useState<UseDoctorSearchState>({
    doctors: [],
    loading: false,
    error: null,
    total: 0,
    searched: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (params: DoctorSearchParams) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const res: DoctorSearchResponse = await searchDoctors(params);
      setState({
        doctors: res.doctors,
        total: res.total,
        loading: false,
        error: null,
        searched: true,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Error al buscar médicos",
        searched: true,
      }));
    }
  }, []);

  const clearResults = useCallback(() => {
    abortRef.current?.abort();
    setState({ doctors: [], loading: false, error: null, total: 0, searched: false });
  }, []);

  return { ...state, search, clearResults };
}
