"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

// Triage has been moved into individual patient profiles.
// This page redirects to /dashboard/pacientes so staff selects a patient first.
export default function TriageRedirect() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/dashboard/pacientes"), 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-celeste-pale flex items-center justify-center">
        <Activity className="w-7 h-7 text-celeste-dark" />
      </div>
      <h2 className="text-lg font-bold text-ink">Triaje movido al perfil del paciente</h2>
      <p className="text-sm text-ink/50 max-w-sm">
        El módulo de triaje ahora se encuentra dentro de cada paciente. Buscá el paciente y abrí la
        pestaña <strong>Triaje</strong>.
      </p>
      <p className="text-xs text-ink/30">Redirigiendo a Pacientes…</p>
    </div>
  );
}
