"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";

/** CRM merged into /dashboard/pacientes — redirect for backward compat */
export default function CRMRedirect() {
  const router = useRouter();
  const { t } = useLocale();
  useEffect(() => {
    router.replace("/dashboard/pacientes?tab=leads");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-64 text-ink-muted text-sm">
      {t("crm.redirecting")}
    </div>
  );
}
