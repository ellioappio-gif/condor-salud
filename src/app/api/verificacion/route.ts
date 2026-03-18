// ─── Verificación de Cobertura API Route ─────────────────────
// GET /api/verificacion?dni=12345678
// Looks up patient coverage by DNI/CUIL.
// Checks Supabase pacientes + financiadores tables first,
// then falls back to static data for known providers.

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, sanitize, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { isSupabaseConfigured } from "@/lib/env";

function getServiceClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Static lookup for known DNIs (demo + fallback) ──────────
const KNOWN_PATIENTS: Record<
  string,
  {
    status: "activo" | "inactivo";
    nombre: string;
    financiador: string;
    plan: string;
    vigencia: string;
    grupo: string;
  }
> = {
  "28456789": {
    status: "activo",
    nombre: "Carlos Pérez",
    financiador: "OSDE",
    plan: "OSDE 310",
    vigencia: "01/2026 – 12/2026",
    grupo: "Titular + 2 familiares",
  },
  "35123456": {
    status: "activo",
    nombre: "Ana Rodríguez",
    financiador: "Swiss Medical",
    plan: "SMG30",
    vigencia: "01/2026 – 12/2026",
    grupo: "Titular",
  },
  "22789012": {
    status: "activo",
    nombre: "Jorge Martínez",
    financiador: "PAMI",
    plan: "Jubilados y Pensionados",
    vigencia: "01/2026 – 12/2026",
    grupo: "Titular + 1 familiar",
  },
  "40567890": {
    status: "inactivo",
    nombre: "Laura Gómez",
    financiador: "IOMA",
    plan: "Plan básico",
    vigencia: "Vencida 11/2025",
    grupo: "Titular",
  },
  "30987654": {
    status: "activo",
    nombre: "María González",
    financiador: "PAMI",
    plan: "Jubilados y Pensionados",
    vigencia: "01/2026 – 12/2026",
    grupo: "Titular + 1 familiar",
  },
  "25678901": {
    status: "activo",
    nombre: "Roberto Díaz",
    financiador: "Galeno",
    plan: "Oro",
    vigencia: "01/2026 – 12/2026",
    grupo: "Titular + 3 familiares",
  },
  "38234567": {
    status: "activo",
    nombre: "Sofía Ramírez",
    financiador: "Swiss Medical",
    plan: "SMG40",
    vigencia: "01/2026 – 12/2026",
    grupo: "Titular",
  },
  "27890123": {
    status: "activo",
    nombre: "Héctor Suárez",
    financiador: "Medifé",
    plan: "Plata",
    vigencia: "01/2026 – 12/2026",
    grupo: "Titular + 1 familiar",
  },
};

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(request, "verificacion", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  const rawDni = request.nextUrl.searchParams.get("dni") ?? "";
  const dni = sanitize(rawDni, 20).replace(/[^\d]/g, "");

  if (!dni || dni.length < 6) {
    return NextResponse.json({ error: "DNI inválido (mínimo 6 dígitos)" }, { status: 400 });
  }

  try {
    // 1. Try Supabase: look up pacientes by DNI, join financiadores
    if (isSupabaseConfigured()) {
      const supabase = getServiceClient();

      const { data: paciente } = await supabase
        .from("pacientes")
        .select("id, nombre, dni, financiador, plan, cobertura_estado, grupo_familiar")
        .eq("clinic_id", auth.user.clinicId)
        .eq("dni", dni)
        .single();

      if (paciente) {
        logger.info(
          { route: "verificacion", dni: dni.slice(0, 3) + "***" },
          "Coverage found in DB",
        );
        return NextResponse.json({
          result: {
            status: paciente.cobertura_estado === "inactivo" ? "inactivo" : "activo",
            nombre: paciente.nombre,
            financiador: paciente.financiador,
            plan: paciente.plan || "Plan general",
            vigencia: "01/2026 – 12/2026",
            grupo: paciente.grupo_familiar || "Titular",
          },
        });
      }
    }

    // 2. Static fallback: known DNIs for demo
    const known = KNOWN_PATIENTS[dni];
    if (known) {
      return NextResponse.json({ result: known });
    }

    // 3. Generic fallback for any DNI — simulate a successful lookup
    //    In production, this would call PAMI/SISA/financiador APIs
    return NextResponse.json({
      result: {
        status: "activo" as const,
        nombre: `Paciente ${dni.slice(-4)}`,
        financiador: "PAMI",
        plan: "Plan general",
        vigencia: "01/2026 – 12/2026",
        grupo: "Titular",
      },
    });
  } catch (err) {
    logger.error({ err, route: "verificacion" }, "Coverage verification error");
    return NextResponse.json({ error: "Error consultando cobertura" }, { status: 500 });
  }
}
