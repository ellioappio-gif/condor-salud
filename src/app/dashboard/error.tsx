"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/Button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "dashboard" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
        <h2 className="text-xl font-bold text-ink mb-2">Error en el módulo</h2>
        <p className="text-sm text-ink-muted mb-6">
          Ocurrió un error al cargar esta sección. Podés intentar de nuevo o volver al dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="primary" size="sm">
            Reintentar
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")} variant="outline" size="sm">
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
