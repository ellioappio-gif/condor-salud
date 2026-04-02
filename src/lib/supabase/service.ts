// ─── Service Role Supabase Client ────────────────────────────
// Bypasses RLS for server-side write operations in API routes.
// Our custom auth (condor_session / Google OAuth) does NOT create
// Supabase sessions, so the anon-key client is blocked by RLS
// on any INSERT / UPDATE / DELETE.
//
// Usage:
//   import { getServiceClient } from "@/lib/supabase/service";
//   const sb = getServiceClient();
//   await sb.from("table").insert({ ... });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";

let _client: SupabaseClient | null = null;

/**
 * Returns a Supabase client authenticated with the service role key.
 * Caches the client in module scope (safe for serverless — one per cold start).
 * Throws if Supabase is not configured.
 */
export function getServiceClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase not configured (missing URL or SERVICE_ROLE_KEY)");
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}

/**
 * Returns a service-role client only if Supabase is configured; null otherwise.
 * Useful for optional-DB paths (demo mode fallback).
 */
export function getServiceClientSafe(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  try {
    return getServiceClient();
  } catch {
    return null;
  }
}
