"use client";

import { useEffect } from "react";

/**
 * Dashboard-level error boundary — catches errors from dashboard page content.
 *
 * IMPORTANT: Keep this self-contained. Do NOT import useLocale, Button, or Sentry
 * at the top level. If this error boundary itself crashes, the error cascades up
 * and the user sees a full-page "Algo salió mal" instead of a recoverable error.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError boundary]", error.message, error.stack);

    // Best-effort Sentry capture via dynamic import
    try {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error, {
          tags: { boundary: "dashboard" },
          extra: { digest: error.digest },
        });
      });
    } catch {
      // Sentry unavailable — swallow
    }
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: "1.5rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "28rem" }}>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
          <svg
            style={{ width: "3rem", height: "3rem", color: "#F6B40E" }}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", marginBottom: "0.5rem" }}>
          Error en el módulo
        </h2>
        <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
          Esta sección no pudo cargarse correctamente. Intentá de nuevo.
        </p>
        {error.digest && (
          <p
            style={{
              color: "#999",
              fontSize: "0.75rem",
              fontFamily: "monospace",
              marginBottom: "1rem",
            }}
          >
            Código: {error.digest}
          </p>
        )}
        {process.env.NODE_ENV !== "production" && (
          <pre
            style={{
              fontSize: "0.75rem",
              textAlign: "left",
              color: "#dc2626",
              background: "#fef2f2",
              borderRadius: "0.375rem",
              padding: "0.75rem",
              marginBottom: "1rem",
              overflow: "auto",
              maxHeight: "10rem",
            }}
          >
            {error.message}
          </pre>
        )}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              background: "#75AADB",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            style={{
              background: "white",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
