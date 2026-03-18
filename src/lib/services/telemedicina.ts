// ─── Telemedicina Service Layer ──────────────────────────────
// Real Supabase queries with mock fallback when not configured.

import { isSupabaseConfigured } from "@/lib/env";
import type { WaitingRoomEntry, Consultation } from "@/lib/types";

// ─── Empty fallback arrays (no demo data) ───────────────────

const mockWaitingRoom: WaitingRoomEntry[] = [];
const mockConsultations: Consultation[] = [];
const mockScheduled: Consultation[] = [];

// ─── Service Functions ───────────────────────────────────────

async function getSupabase() {
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

export async function getWaitingRoom(): Promise<WaitingRoomEntry[]> {
  if (!isSupabaseConfigured()) return mockWaitingRoom;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.from("waiting_room").select("*").order("queue_position");
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      patientName: r.patient_name,
      age: r.age ?? 0,
      reason: r.reason,
      queuePosition: r.queue_position,
      waitTime: r.wait_time || "",
      intakeComplete: r.intake_complete,
      financiador: r.financiador || "",
      joinedAt: new Date(r.joined_at).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
  } catch {
    return mockWaitingRoom;
  }
}

export async function getConsultations(): Promise<Consultation[]> {
  if (!isSupabaseConfigured()) return mockConsultations;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("consultations")
      .select("*")
      .in("status", ["Completada", "No show"])
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []).map(mapConsultation);
  } catch {
    return mockConsultations;
  }
}

export async function getScheduledConsultations(): Promise<Consultation[]> {
  if (!isSupabaseConfigured()) return mockScheduled;
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("consultations")
      .select("*")
      .eq("status", "Programada")
      .order("date")
      .order("time");
    if (error) throw error;
    return (data || []).map(mapConsultation);
  } catch {
    return mockScheduled;
  }
}

function mapConsultation(r: Record<string, unknown>): Consultation {
  return {
    id: r.id as string,
    code: r.code as string,
    patientName: r.patient_name as string,
    doctorName: r.doctor_name as string,
    specialty: r.specialty as string,
    date: r.date as string,
    time: r.time as string,
    duration: (r.duration as string) || "",
    status: r.status as Consultation["status"],
    billed: r.billed as boolean,
    billCode: r.bill_code as string | null,
    prescriptionSent: r.prescription_sent as boolean,
    summarySent: r.summary_sent as boolean,
    financiador: r.financiador as string,
    videoRoomUrl: r.video_room_url as string | undefined,
  };
}

export async function createVideoRoom(consultationId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/telemedicina/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultationId }),
    });
    if (!res.ok) return null;
    const { url } = await res.json();
    return url;
  } catch {
    return null;
  }
}

export async function sendWhatsAppSummary(consultationId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/telemedicina/whatsapp-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consultationId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getTelemedicinaKPIs() {
  const [waiting, consultations] = await Promise.all([getWaitingRoom(), getConsultations()]);
  const completed = consultations.filter((c) => c.status === "Completada");
  return {
    inWaiting: waiting.length,
    todayCount: consultations.length,
    billed: completed.filter((c) => c.billed).length,
    prescriptionsSent: completed.filter((c) => c.prescriptionSent).length,
  };
}
