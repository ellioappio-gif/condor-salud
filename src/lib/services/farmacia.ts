// ─── Farmacia Service Layer ──────────────────────────────────
// Real Supabase queries with mock fallback when not configured.

import { isSupabaseConfigured } from "@/lib/env";
import type { Medication, Prescription, Delivery, RecurringOrder } from "@/lib/types";

// ─── Empty fallback arrays (no demo data) ────────────────────

const mockMedications: Medication[] = [];
const mockPrescriptions: Prescription[] = [];
const mockDeliveries: Delivery[] = [];
const mockRecurringOrders: RecurringOrder[] = [];

// ─── Service Functions ───────────────────────────────────────

async function getSupabase() {
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

export async function getMedications(): Promise<Medication[]> {
  if (!isSupabaseConfigured()) return mockMedications;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("medications")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      name: r.name,
      lab: r.lab,
      category: r.category,
      price: r.price,
      pamiCoverage: r.pami_coverage,
      osCoverage: r.os_coverage,
      prepagaCoverage: r.prepaga_coverage,
      stock: r.stock as Medication["stock"],
      requiresPrescription: r.requires_prescription,
    })) as Medication[];
  } catch {
    return mockMedications;
  }
}

export async function getPrescriptions(): Promise<Prescription[]> {
  if (!isSupabaseConfigured()) return mockPrescriptions;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("prescriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      patientName: r.patient_name,
      doctorName: r.doctor_name,
      date: r.date,
      items: (r.items || []) as string[],
      status: r.status as Prescription["status"],
      financiador: r.financiador,
    })) as Prescription[];
  } catch {
    return mockPrescriptions;
  }
}

export async function getDeliveries(): Promise<Delivery[]> {
  if (!isSupabaseConfigured()) return mockDeliveries;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("deliveries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      patientName: r.patient_name,
      address: r.address,
      itemCount: r.item_count,
      status: r.status as Delivery["status"],
      eta: r.eta || "-",
      courier: r.courier,
      progress: r.progress,
    }));
  } catch {
    return mockDeliveries;
  }
}

export async function getRecurringOrders(): Promise<RecurringOrder[]> {
  if (!isSupabaseConfigured()) return mockRecurringOrders;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.from("recurring_orders").select("*").order("next_delivery");
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      code: r.code,
      patientName: r.patient_name,
      medications: (r.medications || []) as string[],
      frequency: r.frequency,
      nextDelivery: r.next_delivery,
      financiador: r.financiador,
      status: r.status as RecurringOrder["status"],
    }));
  } catch {
    return mockRecurringOrders;
  }
}

export async function createPrescription(data: {
  patientName: string;
  doctorName: string;
  items: string[];
  financiador: string;
}): Promise<Prescription | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = await getSupabase();
  // Q-01: Use crypto for unique ID instead of Math.random()
  const code = `RX-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data: row, error } = await sb
    .from("prescriptions")
    .insert({
      code,
      patient_name: data.patientName,
      doctor_name: data.doctorName,
      items: data.items,
      financiador: data.financiador,
      status: "Pendiente",
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: row.id,
    code: row.code,
    patientName: row.patient_name,
    doctorName: row.doctor_name,
    date: row.date,
    items: (row.items || []) as string[],
    status: row.status as Prescription["status"],
    financiador: row.financiador,
  };
}

export async function updateDeliveryStatus(
  id: string,
  status: string,
  progress: number,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const sb = await getSupabase();
  await sb
    .from("deliveries")
    .update({ status, progress, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// ─── KPI Helpers ─────────────────────────────────────────────

export async function getFarmaciaKPIs() {
  const [prescriptions, deliveries, recurring] = await Promise.all([
    getPrescriptions(),
    getDeliveries(),
    getRecurringOrders(),
  ]);
  return {
    ordersToday: deliveries.length + prescriptions.filter((p) => p.status === "Entregado").length,
    inTransit: deliveries.filter((d) => d.status === "En camino").length,
    pendingRx: prescriptions.filter((p) => p.status === "Pendiente").length,
    activeRecurring: recurring.filter((r) => r.status === "Activo").length,
  };
}
