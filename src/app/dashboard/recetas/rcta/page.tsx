"use client";

import { useState } from "react";
import { ExternalLink, Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";

const PROXY = "/api/rcta-proxy?url=";
const rctaUrl = (slug: string) => `${PROXY}${encodeURIComponent(`https://app.rcta.me/p/${slug}`)}`;

export default function RctaPortalPage() {
  const { t } = useLocale();
  const [rctaDoctorSlug, setRctaDoctorSlug] = useState("francisco-azael-lopez-10");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-celeste-dark" />
        <div>
          <h1 className="text-xl font-bold text-ink">
            {t("prescriptions.rctaPortalTitle") || "Receta Digital — RCTA"}
          </h1>
          <p className="text-sm text-ink/60">
            {t("prescriptions.rctaPortalDesc") ||
              "Emitir recetas digitales a través del portal oficial de RCTA (app.rcta.me)"}
          </p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink/50 whitespace-nowrap">
              {t("prescriptions.rctaDoctorSlug") || "Perfil del médico:"}
            </label>
            <input
              type="text"
              value={rctaDoctorSlug}
              onChange={(e) => setRctaDoctorSlug(e.target.value)}
              className="text-sm border border-border rounded-md px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-celeste/50"
              placeholder="francisco-azael-lopez-10"
            />
          </div>
          <a
            href={`https://app.rcta.me/p/${rctaDoctorSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-celeste-dark hover:underline font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            {t("prescriptions.rctaOpenExternal") || "Abrir en nueva pestaña"}
          </a>
        </div>
        <div className="rounded-lg overflow-hidden border border-border bg-gray-50">
          <iframe
            src={rctaUrl(rctaDoctorSlug)}
            title="Portal RCTA — Receta Digital"
            className="w-full border-0"
            style={{ height: "calc(100vh - 260px)", minHeight: "600px" }}
            allow="clipboard-write; clipboard-read"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
          />
        </div>
      </div>
    </div>
  );
}
