// ─── Health Tracker Service ──────────────────────────────────
// Patient-side health tracking: glucose, weight, blood pressure,
// symptoms, medications adherence, etc. Supports multiple categories
// with value + unit. Optional cron-based reminders.

import { type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";
import type { HealthTrackerCategory, HealthTrackerItem } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────

async function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const { createClient } = await import("@/lib/supabase/server");
  return createClient() as unknown as SupabaseClient;
}

// ─── Categories ──────────────────────────────────────────────

export async function getCategories(): Promise<HealthTrackerCategory[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("health_tracker_categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data.map(mapCategory);
}

// ─── Record a measurement ────────────────────────────────────

export async function recordMeasurement(input: {
  patientId: string;
  categoryId: string;
  value: number;
  unit?: string;
  notes?: string;
  measuredAt?: string;
}): Promise<HealthTrackerItem> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("health_tracker_items")
    .insert({
      patient_id: input.patientId,
      category_id: input.categoryId,
      value: input.value,
      unit: input.unit || null,
      notes: input.notes || null,
      measured_at: input.measuredAt || new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error({ error }, "Failed to record measurement");
    throw new Error("Failed to record measurement");
  }

  return mapItem(data);
}

// ─── Get patient timeline ────────────────────────────────────

export async function getTimeline(
  patientId: string,
  opts?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
): Promise<HealthTrackerItem[]> {
  const supabase = await getSupabase();

  let query = supabase
    .from("health_tracker_items")
    .select("*, health_tracker_categories(name, icon, color, default_unit)")
    .eq("patient_id", patientId)
    .order("measured_at", { ascending: false });

  if (opts?.categoryId) {
    query = query.eq("category_id", opts.categoryId);
  }
  if (opts?.startDate) {
    query = query.gte("measured_at", opts.startDate);
  }
  if (opts?.endDate) {
    query = query.lte("measured_at", opts.endDate);
  }

  query = query.limit(opts?.limit || 50);

  const { data, error } = await query;

  if (error || !data) return [];
  return data.map(mapItemWithCategory);
}

// ─── Get stats for a category ────────────────────────────────

export async function getCategoryStats(
  patientId: string,
  categoryId: string,
  days = 30,
): Promise<{
  avg: number;
  min: number;
  max: number;
  count: number;
  latest?: HealthTrackerItem;
}> {
  const supabase = await getSupabase();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data, error } = await supabase
    .from("health_tracker_items")
    .select("*")
    .eq("patient_id", patientId)
    .eq("category_id", categoryId)
    .gte("measured_at", since)
    .order("measured_at", { ascending: false });

  if (error || !data || data.length === 0) {
    return { avg: 0, min: 0, max: 0, count: 0 };
  }

  const values = data.map((d: Record<string, unknown>) => Number(d.value));
  const sum = values.reduce((a: number, b: number) => a + b, 0);

  return {
    avg: Math.round((sum / values.length) * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
    latest: mapItem(data[0]!),
  };
}

// ─── Delete a measurement ────────────────────────────────────

export async function deleteMeasurement(itemId: string, patientId: string): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("health_tracker_items")
    .delete()
    .eq("id", itemId)
    .eq("patient_id", patientId); // Ensure ownership

  if (error) {
    logger.error({ error }, "Failed to delete measurement");
    throw new Error("Failed to delete measurement");
  }
}

// ─── Cron: Get patients needing reminders ────────────────────

export async function getPatientsNeedingReminders(): Promise<
  { patientId: string; categoryName: string; lastMeasured: string }[]
> {
  const supabase = await getSupabase();

  // Find patients who haven't logged certain categories in 7+ days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("health_tracker_items")
    .select("patient_id, category_id, measured_at, health_tracker_categories(name)")
    .lt("measured_at", sevenDaysAgo)
    .order("measured_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  // Deduplicate by patient+category
  const seen = new Set<string>();
  const results: { patientId: string; categoryName: string; lastMeasured: string }[] = [];

  for (const row of data) {
    const r = row as Record<string, unknown>;
    const key = `${r.patient_id}-${r.category_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      const cat = r.health_tracker_categories as Record<string, string> | null;
      results.push({
        patientId: r.patient_id as string,
        categoryName: cat?.name || "medición",
        lastMeasured: r.measured_at as string,
      });
    }
  }

  return results;
}

// ─── Mappers ─────────────────────────────────────────────────

function mapCategory(row: Record<string, unknown>): HealthTrackerCategory {
  const r = row as Record<string, string | number | boolean | null>;
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    icon: (r.icon as string) || "activity",
    color: (r.color as string) || "#75AADB",
    defaultUnit: (r.default_unit as string) || "",
    minValue: (r.min_value as number) || undefined,
    maxValue: (r.max_value as number) || undefined,
    active: r.active as boolean,
    sortOrder: (r.sort_order as number) || 0,
  };
}

function mapItem(row: Record<string, unknown>): HealthTrackerItem {
  const r = row as Record<string, string | number | null>;
  return {
    id: r.id as string,
    patientId: r.patient_id as string,
    categoryId: r.category_id as string,
    value: r.value as number,
    unit: (r.unit as string) || undefined,
    notes: (r.notes as string) || undefined,
    measuredAt: r.measured_at as string,
    createdAt: r.created_at as string,
  };
}

function mapItemWithCategory(row: Record<string, unknown>): HealthTrackerItem {
  const base = mapItem(row);
  const cat = row.health_tracker_categories as Record<string, string | null> | null;
  if (cat) {
    base.categoryName = cat.name || undefined;
    base.categoryIcon = cat.icon || undefined;
    base.categoryColor = cat.color || undefined;
    base.unit = base.unit || cat.default_unit || undefined;
  }
  return base;
}
