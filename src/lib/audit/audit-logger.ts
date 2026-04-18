// ─── Audit Logger ────────────────────────────────────────────
// Fire-and-forget audit trail for Ley 25.326 compliance.
// Never throws — audit logging must not break business operations.

import { logger } from "@/lib/logger";

export interface AuditLogEntry {
  clinicId?: string;
  userId?: string;
  userRole?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "LOGIN";
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  requestPath?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const { isSupabaseConfigured } = await import("@/lib/env");
    if (!isSupabaseConfigured()) {
      logger.debug({ ...entry }, "Audit event (demo mode — not persisted)");
      return;
    }

    const { getServiceClient } = await import("@/lib/supabase/service");
    const sb = getServiceClient();
    const { error } = await sb.from("audit_log").insert({
      clinic_id: entry.clinicId || null,
      user_id: entry.userId || null,
      user_role: entry.userRole || null,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId || null,
      old_values: entry.oldValues || null,
      new_values: entry.newValues || null,
      request_path: entry.requestPath || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    });

    if (error) {
      logger.warn({ error, entry }, "Failed to write audit log");
    }
  } catch (err) {
    // Fire and forget — never throw from audit logging
    logger.warn({ err, entry }, "Audit logger error");
  }
}
