"use client";

import { useLocale } from "@/lib/i18n/context";

export default function RootLoading() {
  const { t } = useLocale();

  return (
    <div
      className="min-h-screen bg-surface flex items-center justify-center"
      role="status"
      aria-label={t("label.loading")}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-border" />
          <div className="absolute inset-0 rounded-full border-4 border-celeste-dark border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-ink-muted">{t("label.loading")}</p>
      </div>
    </div>
  );
}
