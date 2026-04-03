"use client";
import { useState, useCallback } from "react";
import { useLocale } from "@/lib/i18n/context";

type Result = {
  status: "activo" | "inactivo" | null;
  nombre?: string;
  financiador?: string;
  plan?: string;
  vigencia?: string;
  grupo?: string;
};

type HistoryEntry = {
  nombre: string;
  dni: string;
  financiador: string;
  status: "activo" | "inactivo";
  hora: string;
};

export default function VerificacionPage() {
  const { t } = useLocale();
  const [dni, setDni] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const clean = dni.replace(/[.\-\s]/g, "");
      if (!clean || clean.length < 6) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/verificacion?dni=${encodeURIComponent(clean)}`);
        if (!res.ok) throw new Error(t("verification.errorQuery"));
        const data = await res.json();
        const r = data.result ?? data;
        setResult(r);

        // Prepend to local history
        const now = new Date();
        const hora =
          now.getHours().toString().padStart(2, "0") +
          ":" +
          now.getMinutes().toString().padStart(2, "0");
        setHistory((prev) => [
          {
            nombre: r.nombre ?? "—",
            dni: clean.replace(/(\d{2})(\d{3})(\d{3})/, "$1.$2.$3"),
            financiador: r.financiador ?? "—",
            status: r.status ?? "inactivo",
            hora,
          },
          ...prev.slice(0, 9),
        ]);
      } catch {
        setError(t("verification.errorRetry"));
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [dni, t],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("verification.title")}</h1>
        <p className="text-sm text-ink-muted mt-1">{t("verification.subtitle")}</p>
      </div>

      {/* Search */}
      <div className="bg-white border border-border rounded-lg p-6">
        <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
          <input
            type="text"
            placeholder={t("verification.placeholder")}
            aria-label={t("verification.placeholder")}
            value={dni}
            onChange={(e) => setDni(e.target.value.replace(/[^\d.-]/g, ""))}
            className="flex-1 px-4 py-3 border border-border rounded-[4px] text-sm focus:outline-none focus:border-celeste-dark"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-celeste-dark text-white text-sm font-semibold rounded-[4px] hover:bg-celeste transition disabled:opacity-50"
          >
            {loading ? t("verification.checking") : t("verification.verify")}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`border rounded-lg p-6 ${
            result.status === "activo" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                result.status === "activo" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {result.status === "activo" ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <div className="font-bold text-ink">{result.nombre}</div>
              <div
                className={`text-sm font-semibold ${
                  result.status === "activo" ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.status === "activo"
                  ? t("verification.activeCoverage")
                  : t("verification.noCoverage")}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-xs text-ink-muted">{t("verification.financiador")}</div>
              <div className="text-sm font-semibold text-ink">{result.financiador}</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">{t("verification.plan")}</div>
              <div className="text-sm font-semibold text-ink">{result.plan}</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">{t("verification.validity")}</div>
              <div className="text-sm font-semibold text-ink">{result.vigencia}</div>
            </div>
            <div>
              <div className="text-xs text-ink-muted">{t("verification.familyGroup")}</div>
              <div className="text-sm font-semibold text-ink">{result.grupo}</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent verifications */}
      {history.length > 0 && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="text-xs text-ink-muted">{t("verification.recentChecks")}</div>
          </div>
          <table className="w-full text-sm" aria-label="Verificaciones recientes">
            <thead>
              <tr className="bg-surface text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                <th scope="col" className="text-left px-5 py-2.5">
                  {t("verification.patient")}
                </th>
                <th scope="col" className="text-left px-5 py-2.5">
                  {t("verification.dni")}
                </th>
                <th scope="col" className="text-left px-5 py-2.5">
                  {t("verification.financiador")}
                </th>
                <th scope="col" className="text-left px-5 py-2.5">
                  {t("verification.status")}
                </th>
                <th scope="col" className="text-right px-5 py-2.5">
                  {t("verification.time")}
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((v, i) => (
                <tr key={`${v.dni}-${i}`} className="border-t border-border-light">
                  <td className="px-5 py-3 font-semibold text-ink">{v.nombre}</td>
                  <td className="px-5 py-3 text-ink-light">{v.dni}</td>
                  <td className="px-5 py-3 text-ink-light">{v.financiador}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        v.status === "activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-ink-muted">{v.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
