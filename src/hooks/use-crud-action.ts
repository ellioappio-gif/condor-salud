// ─── useCrudAction — Dual-mode CRUD helper ──────────────────
// Provides a unified pattern for all dashboard actions:
//   - Real Supabase mutation when configured
//   - Graceful demo fallback via DemoModal
//   - Toast feedback for success/error
//   - SWR cache invalidation after mutations
//
// Usage:
//   const { execute } = useCrudAction();
//   await execute({
//     action: () => createFactura(input),
//     successMessage: "Factura creada",
//     errorMessage: "Error al crear factura",
//     demoLabel: "Nueva factura",
//     mutateKeys: ["facturas"],
//   });

"use client";

import { useCallback, useState } from "react";
import { useSWRConfig } from "swr";
import { isSupabaseConfigured } from "@/lib/env";
import { useDemoAction } from "@/components/DemoModal";
import { useToast } from "@/components/Toast";

export interface CrudActionOptions<T = unknown> {
  /** The real async mutation to run when Supabase is configured */
  action: () => Promise<T>;
  /** Toast message on success */
  successMessage: string;
  /** Toast message on error (generic fallback) */
  errorMessage?: string;
  /** Label shown in the DemoModal when in demo mode */
  demoLabel: string;
  /** SWR cache keys to revalidate after success */
  mutateKeys?: string[];
  /** Callback on success (receives the mutation result) */
  onSuccess?: (result: T) => void;
  /** Callback on error */
  onError?: (error: unknown) => void;
}

export function useCrudAction() {
  const { showDemo } = useDemoAction();
  const { showToast } = useToast();
  const { mutate } = useSWRConfig();
  const [isExecuting, setIsExecuting] = useState(false);

  const execute = useCallback(
    async <T = unknown>(opts: CrudActionOptions<T>): Promise<T | null> => {
      if (!isSupabaseConfigured()) {
        showDemo(opts.demoLabel);
        return null;
      }

      setIsExecuting(true);
      try {
        const result = await opts.action();
        showToast(`✅ ${opts.successMessage}`);

        // Revalidate SWR caches
        if (opts.mutateKeys?.length) {
          await Promise.all(opts.mutateKeys.map((key) => mutate(key)));
        }

        opts.onSuccess?.(result);
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : (opts.errorMessage ?? "Error inesperado");
        showToast(`❌ ${msg}`);
        opts.onError?.(err);
        return null;
      } finally {
        setIsExecuting(false);
      }
    },
    [showDemo, showToast, mutate],
  );

  return { execute, isExecuting };
}
