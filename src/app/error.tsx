"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "app-root" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
        <h1 className="text-2xl font-bold text-ink mb-2">Algo salió mal</h1>
        <p className="text-sm text-ink-muted mb-2">
          Ocurrió un error inesperado. Si el problema persiste, contactá a soporte.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-muted mb-6 font-mono">
            Código: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="primary">
            Reintentar
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")} variant="outline">
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
