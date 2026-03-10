"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PagosRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/configuracion/pagos");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-ink-muted">Redirigiendo a Pagos y Cobros...</p>
    </div>
  );
}
