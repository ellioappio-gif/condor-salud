"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-ink">Algo salió mal</h2>
        <p className="text-sm text-ink-muted mt-1 max-w-md">
          Ocurrió un error inesperado. Podés intentar nuevamente o contactar soporte si el problema
          persiste.
        </p>
      </div>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition"
      >
        <RefreshCw className="w-4 h-4" />
        Intentar de nuevo
      </button>
    </div>
  );
}
