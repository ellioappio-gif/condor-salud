"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** CRM merged into /dashboard/pacientes — redirect for backward compat */
export default function CRMRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/pacientes?tab=leads");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-64 text-ink-muted text-sm">
      Redirigiendo a Pacientes…
    </div>
  );
}
