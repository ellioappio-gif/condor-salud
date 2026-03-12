"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { ModuleId, PresetId } from "./plan-config";
import { getBaseModules, resolveDeps, getPreset, calcTotal, PRESETS } from "./plan-config";

// ─── Types ───────────────────────────────────────────────────

interface PlanState {
  selectedModules: ModuleId[];
  activePreset: PresetId | null;
  discount: number;
}

interface PlanContextValue extends PlanState {
  toggleModule: (id: ModuleId) => void;
  selectModule: (id: ModuleId) => void;
  deselectModule: (id: ModuleId) => void;
  applyPreset: (id: PresetId) => void;
  clearPreset: () => void;
  isModuleSelected: (id: ModuleId) => boolean;
  total: number;
}

const STORAGE_KEY = "condor-plan";

const defaultState: PlanState = {
  selectedModules: getBaseModules(),
  activePreset: null,
  discount: 0,
};

// ─── Context ─────────────────────────────────────────────────

const PlanContext = createContext<PlanContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlanState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PlanState;
        if (parsed.selectedModules?.length) {
          setState(parsed);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  const toggleModule = useCallback((id: ModuleId) => {
    setState((prev) => {
      const baseIds = getBaseModules();
      if (baseIds.includes(id)) return prev; // Can't toggle base

      const isSelected = prev.selectedModules.includes(id);
      let next: ModuleId[];
      if (isSelected) {
        next = prev.selectedModules.filter((m) => m !== id);
      } else {
        next = resolveDeps([...prev.selectedModules, id]);
      }
      // Check if selection still matches any preset
      const matchedPreset = PRESETS.find(
        (p) => p.modules.length === next.length && p.modules.every((m) => next.includes(m)),
      );
      return {
        selectedModules: next,
        activePreset: matchedPreset?.id ?? null,
        discount: matchedPreset?.discount ?? 0,
      };
    });
  }, []);

  const selectModule = useCallback((id: ModuleId) => {
    setState((prev) => {
      if (prev.selectedModules.includes(id)) return prev;
      const next = resolveDeps([...prev.selectedModules, id]);
      const matchedPreset = PRESETS.find(
        (p) => p.modules.length === next.length && p.modules.every((m) => next.includes(m)),
      );
      return {
        selectedModules: next,
        activePreset: matchedPreset?.id ?? null,
        discount: matchedPreset?.discount ?? 0,
      };
    });
  }, []);

  const deselectModule = useCallback((id: ModuleId) => {
    setState((prev) => {
      const baseIds = getBaseModules();
      if (baseIds.includes(id)) return prev;
      const next = prev.selectedModules.filter((m) => m !== id);
      const matchedPreset = PRESETS.find(
        (p) => p.modules.length === next.length && p.modules.every((m) => next.includes(m)),
      );
      return {
        selectedModules: next,
        activePreset: matchedPreset?.id ?? null,
        discount: matchedPreset?.discount ?? 0,
      };
    });
  }, []);

  const applyPreset = useCallback((id: PresetId) => {
    const preset = getPreset(id);
    setState({
      selectedModules: [...preset.modules],
      activePreset: id,
      discount: preset.discount,
    });
  }, []);

  const clearPreset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      activePreset: null,
      discount: 0,
    }));
  }, []);

  const isModuleSelected = useCallback(
    (id: ModuleId) => state.selectedModules.includes(id),
    [state.selectedModules],
  );

  const total = calcTotal(state.selectedModules, state.discount);

  const value: PlanContextValue = {
    ...state,
    toggleModule,
    selectModule,
    deselectModule,
    applyPreset,
    clearPreset,
    isModuleSelected,
    total,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

// ─── Hooks ───────────────────────────────────────────────────

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}

/** Safe version that returns defaults when outside provider (e.g. tests, SSR) */
export function usePlanSafe(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    return {
      selectedModules: getBaseModules(),
      activePreset: null,
      discount: 0,
      toggleModule: () => {},
      selectModule: () => {},
      deselectModule: () => {},
      applyPreset: () => {},
      clearPreset: () => {},
      isModuleSelected: () => true, // show everything if no provider
      total: 0,
    };
  }
  return ctx;
}
