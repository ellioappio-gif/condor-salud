"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/context";

export default function NotFound() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold text-celeste-dark mb-2">404</div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("error.notFoundTitle")}</h1>
        <p className="text-sm text-ink-muted mb-8">{t("error.notFoundDesc")}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">{t("action.goHome")}</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">{t("action.goToDashboard")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
