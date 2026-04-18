"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { Shield, Download, Trash2, FileText, AlertTriangle } from "lucide-react";

export default function PrivacidadPage() {
  const { t } = useLocale();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading("export");
    try {
      const res = await fetch("/api/patients/me/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al descargar los datos. Intentá nuevamente.");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading("delete");
    try {
      const res = await fetch("/api/patients/me/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/";
    } catch {
      alert("Error al eliminar la cuenta. Intentá nuevamente.");
    } finally {
      setLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-celeste-dark" />
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {t("privacy.title") !== "privacy.title" ? t("privacy.title") : "Privacidad y Datos"}
          </h1>
          <p className="text-ink-light text-sm">Ley 25.326 — Protección de Datos Personales</p>
        </div>
      </div>

      {/* What data we store */}
      <section className="bg-white border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-celeste-dark" />
          <h2 className="text-lg font-semibold text-ink">Mis datos almacenados</h2>
        </div>
        <ul className="text-sm text-ink-light space-y-2 list-disc list-inside">
          <li>Datos personales: nombre, DNI, fecha de nacimiento, email, teléfono</li>
          <li>Datos de cobertura médica: financiador, plan, número de afiliado</li>
          <li>Historial de turnos y consultas</li>
          <li>Recetas electrónicas emitidas</li>
          <li>Resultados de triage</li>
          <li>Notas clínicas vinculadas a tus consultas</li>
        </ul>
      </section>

      {/* Download data */}
      <section className="bg-white border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-celeste-dark" />
          <h2 className="text-lg font-semibold text-ink">Descargar mis datos</h2>
        </div>
        <p className="text-sm text-ink-light">
          Podés descargar una copia completa de todos tus datos almacenados en formato JSON.
        </p>
        <button
          onClick={handleExport}
          disabled={loading === "export"}
          className="px-4 py-2 bg-celeste-dark text-white rounded-lg text-sm font-medium hover:bg-celeste transition disabled:opacity-50"
        >
          {loading === "export" ? "Descargando..." : "Descargar mis datos"}
        </button>
      </section>

      {/* Delete account */}
      <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-700">Eliminar mi cuenta</h2>
        </div>
        <p className="text-sm text-ink-light">
          Al eliminar tu cuenta, tus datos personales serán marcados para eliminación. Según la
          normativa vigente (Ley 25.326 y Ley 26.529), los registros clínicos se conservarán por el
          período legal obligatorio (10 años).
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">
                ¿Estás seguro? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading === "delete"}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading === "delete" ? "Eliminando..." : "Sí, eliminar mi cuenta"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-border text-ink-light rounded-lg text-sm font-medium hover:bg-surface transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Privacy policy link */}
      <section className="text-center text-sm text-ink-light">
        <a href="/privacidad" className="text-celeste-dark hover:underline">
          Política de Privacidad completa
        </a>
      </section>
    </div>
  );
}
