"use client";

import { useEffect } from "react";
import Link from "next/link";

// D-03: Patient portal error boundary (mirrors dashboard/error.tsx)
export default function PatientError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Paciente Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Algo salió mal</h1>
        <p className="text-sm text-ink-muted mb-6">
          Hubo un error al cargar esta sección. Si el problema persiste, contactá soporte.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-celeste-dark hover:bg-celeste rounded transition"
          >
            Reintentar
          </button>
          <Link
            href="/paciente"
            className="px-6 py-2.5 text-sm font-semibold text-ink border border-border hover:border-celeste-dark rounded transition"
          >
            Volver al portal
          </Link>
        </div>
        {error.digest && <p className="text-[10px] text-ink-muted mt-4">Código: {error.digest}</p>}
      </div>
    </div>
  );
}
