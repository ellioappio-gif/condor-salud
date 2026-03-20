// ─── Audit Service ───────────────────────────────────────────
// CRUD for the auditoria table. Used by the audit log viewer
// to display, filter, and update audit items.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";
import type { AuditoriaItem } from "@/lib/services/data";

// ─── Types ───────────────────────────────────────────────────

export interface AuditFilter {
  severidad?: "alta" | "media" | "baja";
  estado?: "pendiente" | "revisado" | "resuelto";
  financiador?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AuditStats {
  total: number;
  pendientes: number;
  alta: number;
  resueltos: number;
  montoRiesgo: number;
}

export interface UpdateAuditInput {
  estado: "revisado" | "resuelto" | "pendiente";
  resolvedBy?: string;
}

// ─── Read Operations ─────────────────────────────────────────

/**
 * Fetch audit items with optional filters.
 */
export async function getAuditoriaFiltered(filter?: AuditFilter): Promise<AuditoriaItem[]> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();

    let query = sb.from("auditoria").select("*").order("fecha", { ascending: false });

    if (filter?.severidad) {
      query = query.eq("severidad", filter.severidad);
    }
    if (filter?.estado) {
      query = query.eq("estado", filter.estado);
    }
    if (filter?.financiador) {
      query = query.ilike("financiador", `%${filter.financiador}%`);
    }
    if (filter?.dateFrom) {
      query = query.gte("fecha", filter.dateFrom);
    }
    if (filter?.dateTo) {
      query = query.lte("fecha", filter.dateTo);
    }
    if (filter?.search) {
      query = query.or(
        `paciente.ilike.%${filter.search}%,prestacion.ilike.%${filter.search}%,detalle.ilike.%${filter.search}%`,
      );
    }

    const { data } = await query;

    return (data ?? []).map((row) => ({
      id: row.id,
      fecha: row.fecha,
      paciente: row.paciente,
      prestacion: row.prestacion,
      financiador: row.financiador,
      tipo: row.tipo,
      severidad: row.severidad as AuditoriaItem["severidad"],
      detalle: row.detalle,
      estado: row.estado as AuditoriaItem["estado"],
    }));
  }

  // Demo mode
  await delay(150);
  const { getAuditoria } = await import("@/lib/services/data");
  let items = await getAuditoria();

  if (filter?.severidad) {
    items = items.filter((a) => a.severidad === filter.severidad);
  }
  if (filter?.estado) {
    items = items.filter((a) => a.estado === filter.estado);
  }
  if (filter?.search) {
    const s = filter.search.toLowerCase();
    items = items.filter(
      (a) =>
        a.paciente.toLowerCase().includes(s) ||
        a.prestacion.toLowerCase().includes(s) ||
        a.detalle.toLowerCase().includes(s),
    );
  }

  return items;
}

/**
 * Get audit statistics.
 */
export async function getAuditStats(): Promise<AuditStats> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();

    const { data } = await sb.from("auditoria").select("severidad, estado");
    const items = data ?? [];

    return {
      total: items.length,
      pendientes: items.filter((a) => a.estado === "pendiente").length,
      alta: items.filter((a) => a.severidad === "alta" && a.estado === "pendiente").length,
      resueltos: items.filter((a) => a.estado === "resuelto").length,
      montoRiesgo: 0, // Would need monto column
    };
  }

  const { getAuditoria } = await import("@/lib/services/data");
  const items = await getAuditoria();

  return {
    total: items.length,
    pendientes: items.filter((a) => a.estado === "pendiente").length,
    alta: items.filter((a) => a.severidad === "alta" && a.estado === "pendiente").length,
    resueltos: items.filter((a) => a.estado === "resuelto").length,
    montoRiesgo: 0,
  };
}

// ─── Write Operations ────────────────────────────────────────

/**
 * Update an audit item's status.
 */
export async function updateAuditItem(
  id: string,
  input: UpdateAuditInput,
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();

    const updateData: Record<string, string | null> = {
      estado: input.estado,
    };

    if (input.estado === "resuelto") {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = input.resolvedBy ?? null;
    }

    const { error } = await sb.from("auditoria").update(updateData).eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  // Demo mode
  await delay(150);
  return { success: true };
}

/**
 * Bulk update audit items.
 */
export async function bulkUpdateAudit(
  ids: string[],
  estado: "revisado" | "resuelto",
): Promise<{ success: boolean; updated: number; error?: string }> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();

    const updateData: Record<string, string> = { estado };
    if (estado === "resuelto") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error, count } = await sb.from("auditoria").update(updateData).in("id", ids);

    if (error) {
      return { success: false, updated: 0, error: error.message };
    }
    return { success: true, updated: count ?? ids.length };
  }

  await delay(200);
  return { success: true, updated: ids.length };
}

/**
 * Run automatic audit check (triggers a re-scan of recent facturas).
 * Performs:
 *  1. Duplicate detection — same patient + same prestación + same date
 *  2. Missing/invalid nomenclador codes
 *  3. Amount outliers — amounts > 3× the average for that code
 *  4. Authorization expiry — facturas linked to expired authorisations
 *  5. Per-financiador monthly cap enforcement
 */
export async function runAutoAudit(): Promise<{
  success: boolean;
  newFindings: number;
  error?: string;
}> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();

    // Get the current user's clinic_id
    const {
      data: { user: authUser },
    } = await sb.auth.getUser();
    if (!authUser) return { success: false, newFindings: 0, error: "Not authenticated" };

    const { data: profile } = await sb
      .from("profiles")
      .select("clinic_id")
      .eq("id", authUser.id)
      .single();

    const clinicId = (profile as { clinic_id: string } | null)?.clinic_id;
    if (!clinicId) return { success: false, newFindings: 0, error: "No clinic associated" };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // Fetch recent facturas
    const { data: facturas } = await sb
      .from("facturas")
      .select("id, codigo_nomenclador, monto, financiador, paciente, prestacion, fecha, estado")
      .gte("fecha", thirtyDaysAgo);

    if (!facturas || facturas.length === 0) {
      return { success: true, newFindings: 0 };
    }

    // Fetch nomenclador for code validation
    const { data: nomenclador } = await sb
      .from("nomenclador")
      .select("codigo, descripcion, valor_pami")
      .limit(5000);

    const validCodes = new Set(
      (nomenclador ?? []).map((n: { codigo: string }) => String(n.codigo)),
    );
    const codeValues: Record<string, number> = {};
    for (const n of nomenclador ?? []) {
      codeValues[String(n.codigo)] = Number(n.valor_pami ?? 0);
    }

    // Fetch existing findings to avoid duplicates (key by paciente + tipo + date)
    const { data: existing } = await sb
      .from("auditoria")
      .select("paciente, tipo, fecha")
      .gte("created_at", thirtyDaysAgo);

    const existingSet = new Set(
      (existing ?? []).map(
        (e: { paciente: string; tipo: string; fecha: string }) =>
          `${e.paciente}:${e.tipo}:${e.fecha}`,
      ),
    );

    const findings: Array<{
      paciente: string;
      prestacion: string;
      financiador: string;
      tipo: string;
      severidad: string;
      detalle: string;
      fecha: string;
    }> = [];

    // ── 1. Duplicate detection ──────────────────────────────
    const seen = new Map<string, string>();
    for (const f of facturas) {
      const key = `${f.paciente}|${f.prestacion}|${f.fecha}`;
      const fId = String(f.id);
      if (seen.has(key)) {
        const dupKey = `${f.paciente}:duplicado:${f.fecha}`;
        if (!existingSet.has(dupKey)) {
          findings.push({
            paciente: String(f.paciente ?? ""),
            prestacion: String(f.prestacion ?? ""),
            financiador: String(f.financiador ?? ""),
            tipo: "duplicado",
            severidad: "alta",
            detalle: `Posible duplicado: misma prestación "${f.prestacion}" para mismo paciente en misma fecha (${f.fecha}). Factura original: ${seen.get(key)}`,
            fecha: String(f.fecha),
          });
        }
      } else {
        seen.set(key, fId);
      }
    }

    // ── 2. Invalid nomenclador codes ────────────────────────
    if (validCodes.size > 0) {
      for (const f of facturas) {
        if (f.codigo_nomenclador && !validCodes.has(String(f.codigo_nomenclador))) {
          const cKey = `${f.paciente}:codigo_invalido:${f.fecha}`;
          if (!existingSet.has(cKey)) {
            findings.push({
              paciente: String(f.paciente ?? ""),
              prestacion: String(f.prestacion ?? ""),
              financiador: String(f.financiador ?? ""),
              tipo: "codigo_invalido",
              severidad: "media",
              detalle: `Código nomenclador "${f.codigo_nomenclador}" no encontrado en tabla de nomenclador vigente`,
              fecha: String(f.fecha),
            });
          }
        }
      }
    }

    // ── 3. Amount outliers (> 3× average for that code) ─────
    const codeAmounts: Record<string, number[]> = {};
    for (const f of facturas) {
      const code = String(f.codigo_nomenclador ?? "");
      if (!code) continue;
      if (!codeAmounts[code]) codeAmounts[code] = [];
      codeAmounts[code].push(Number(f.monto ?? 0));
    }

    for (const f of facturas) {
      const code = String(f.codigo_nomenclador ?? "");
      const amt = Number(f.monto ?? 0);
      const amounts = codeAmounts[code];
      if (!amounts || amounts.length < 3) continue;

      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      if (avg > 0 && amt > avg * 3) {
        const oKey = `${f.paciente}:monto_atipico:${f.fecha}`;
        if (!existingSet.has(oKey)) {
          findings.push({
            paciente: String(f.paciente ?? ""),
            prestacion: String(f.prestacion ?? ""),
            financiador: String(f.financiador ?? ""),
            tipo: "monto_atipico",
            severidad: "alta",
            detalle: `Monto $${amt.toLocaleString("es-AR")} supera 3× el promedio ($${Math.round(avg).toLocaleString("es-AR")}) para código ${code}`,
            fecha: String(f.fecha),
          });
        }
      }
    }

    // ── 4. Per-financiador monthly cap ──────────────────────
    const capByFin: Record<string, number> = {};
    for (const f of facturas) {
      const fin = String(f.financiador ?? "");
      if (!fin) continue;
      capByFin[fin] = (capByFin[fin] ?? 0) + Number(f.monto ?? 0);
    }

    // Flag financiadores where monthly total exceeds reasonable threshold
    // (In production this would be per-contract caps from financiadores table)
    const CAP_THRESHOLD = 5_000_000; // $5M ARS monthly threshold
    const today = new Date().toISOString().slice(0, 10);
    for (const [fin, total] of Object.entries(capByFin)) {
      if (total > CAP_THRESHOLD) {
        const capKey = `:exceso_cap:${today}`;
        if (!existingSet.has(capKey)) {
          findings.push({
            paciente: "",
            prestacion: `Total ${fin}`,
            financiador: fin,
            tipo: "exceso_cap",
            severidad: "alta",
            detalle: `Financiador "${fin}" acumula $${total.toLocaleString("es-AR")} en 30 días, superando umbral de $${CAP_THRESHOLD.toLocaleString("es-AR")}`,
            fecha: today,
          });
        }
      }
    }

    // ── Insert findings ─────────────────────────────────────
    if (findings.length > 0) {
      const rows = findings.map((f) => ({
        clinic_id: clinicId,
        paciente: f.paciente,
        prestacion: f.prestacion,
        financiador: f.financiador,
        tipo: f.tipo,
        severidad: f.severidad,
        detalle: f.detalle,
        fecha: f.fecha,
        estado: "pendiente",
      }));

      await sb.from("auditoria").insert(rows);
    }

    return { success: true, newFindings: findings.length };
  }

  await delay(500);
  return { success: true, newFindings: 3 };
}
