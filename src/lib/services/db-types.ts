// ─── Supabase DB Row Types ───────────────────────────────────
// Lightweight row types for mapper functions. Avoids `any` without
// requiring generated types from a live Supabase instance.
// When supabase gen types is available, replace these with Database["public"]["Tables"].

import type { SupabaseClient as BaseClient } from "@supabase/supabase-js";

/** Supabase client type for query building. Use instead of `sb as any`. */
export type SupabaseClient = BaseClient;

/**
 * Generic DB row — use for mapper functions instead of `any`.
 * Kept as Record<string, any> because Supabase returns untyped rows
 * when generated types (supabase gen types) are not available.
 * When Supabase CLI is connected, run `npx supabase gen types typescript`
 * and replace this with Database["public"]["Tables"][T]["Row"].
 */
export type DBRow = Record<string, any>; // single centralized any
