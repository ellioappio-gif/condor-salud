import type { SupabaseClient, DBRow } from "@/lib/services/db-types";
import type { PlanTier } from "@/lib/types";
import { buildDefaultWhatsAppSetup } from "@/lib/services/whatsapp-defaults";
/**
 * Onboarding service — persists clinic setup to Supabase.
 *
 * MEDICAL INDUSTRY: No demo fallback. Supabase required.
 */

import { isSupabaseConfigured } from "@/lib/env";

// ─── Types ───────────────────────────────────────────────────

export interface ClinicOnboardingInput {
  // Clinic data (step 1)
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  whatsappNumber?: string;
  // Doctor profile (step 2)
  doctorNombre: string;
  doctorMatricula: string;
  doctorEspecialidad?: string;
  // Configuration (step 3)
  especialidades?: string[];
  financiadores?: string[];
  // Plan (step 4)
  planTier: PlanTier;
}

export interface OnboardingResult {
  success: boolean;
  clinicId?: string;
  error?: string;
}

async function seedDefaultWhatsApp(
  clinic: {
    name: string;
    slug?: string | null;
    phone?: string | null;
    address?: string | null;
  },
  input: ClinicOnboardingInput,
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://condorsalud.com";
  const bookingUrl = clinic.slug ? `${baseUrl}/reservar/${clinic.slug}` : undefined;
  const payload = buildDefaultWhatsAppSetup({
    clinicName: clinic.name,
    whatsappNumber: input.whatsappNumber,
    clinicPhone: input.telefono ?? clinic.phone,
    clinicAddress: input.direccion ?? clinic.address,
    bookingUrl,
  });

  const res = await fetch("/api/whatsapp/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "No se pudo configurar WhatsApp");
  }
}

// ─── Service ─────────────────────────────────────────────────

/**
 * Create or update the clinic record, set doctor profile, and mark onboarding completed.
 * MEDICAL INDUSTRY: No demo fallback — Supabase is required.
 */
export async function completeOnboarding(input: ClinicOnboardingInput): Promise<OnboardingResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Sistema de autenticación no configurado. Contactá soporte." };
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();

    // Get current user
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // Check if user already has a clinic via profiles
    const { data: profile } = await (sb as SupabaseClient)
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    let clinicId = profile?.clinic_id as string | null;

    const clinicPayload = {
      name: input.nombre,
      address: input.direccion ?? null,
      phone: input.telefono ?? null,
      email: input.email ?? null,
      especialidad: input.especialidades ?? [],
      plan_tier: input.planTier,
      onboarding_completed: true,
      onboarding_step: -1, // -1 = finished
      updated_at: new Date().toISOString(),
    };

    if (clinicId) {
      // Update existing clinic
      const { error } = await (sb as SupabaseClient)
        .from("clinics")
        .update(clinicPayload)
        .eq("id", clinicId);

      if (error) {
        console.error("[onboarding] clinic update error", error);
        return { success: false, error: error.message };
      }
    } else {
      // Create new clinic
      const { data: clinic, error: insertErr } = await (sb as SupabaseClient)
        .from("clinics")
        .insert(clinicPayload)
        .select("id")
        .single();

      if (insertErr) {
        console.error("[onboarding] clinic insert error", insertErr);
        return { success: false, error: insertErr.message };
      }

      clinicId = clinic?.id as string;
    }

    // Update doctor profile with matrícula and especialidad
    if (clinicId) {
      const profilePayload: Record<string, unknown> = {
        clinic_id: clinicId,
        full_name: input.doctorNombre,
        matricula: input.doctorMatricula,
      };
      if (input.doctorEspecialidad) {
        profilePayload.especialidad = input.doctorEspecialidad;
      }

      const { error: profileErr } = await (sb as SupabaseClient)
        .from("profiles")
        .update(profilePayload)
        .eq("id", user.id);

      if (profileErr) {
        console.error("[onboarding] profile update error", profileErr);
        // Non-fatal — clinic was created, profile update can be retried
      }

      const { data: clinicData } = await (sb as SupabaseClient)
        .from("clinics")
        .select("name, slug, phone, address")
        .eq("id", clinicId)
        .maybeSingle();

      if (clinicData) {
        try {
          await seedDefaultWhatsApp(
            {
              name: (clinicData as DBRow).name as string,
              slug: ((clinicData as DBRow).slug as string | null | undefined) ?? null,
              phone: ((clinicData as DBRow).phone as string | null | undefined) ?? null,
              address: ((clinicData as DBRow).address as string | null | undefined) ?? null,
            },
            input,
          );
        } catch (whatsAppErr) {
          console.error("[onboarding] whatsapp seed error", whatsAppErr);
        }
      }
    }

    return { success: true, clinicId: clinicId ?? undefined };
  } catch (err) {
    console.error("[onboarding] unexpected error", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Save onboarding progress (partial — user hasn't finished yet).
 */
export async function saveOnboardingProgress(step: number): Promise<void> {
  if (!isSupabaseConfigured()) return; // Silently skip if no backend

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const { data: profile } = await (sb as SupabaseClient)
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (profile?.clinic_id) {
      await (sb as SupabaseClient)
        .from("clinics")
        .update({ onboarding_step: step, updated_at: new Date().toISOString() })
        .eq("id", profile.clinic_id);
    }
  } catch {
    // Silently fail — progress saving is non-critical
  }
}

/**
 * Check if user's clinic has completed onboarding.
 */
export async function getOnboardingStatus(): Promise<{
  completed: boolean;
  step: number;
}> {
  if (!isSupabaseConfigured()) {
    return { completed: false, step: 0 };
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { completed: false, step: 0 };

    const { data: profile } = await (sb as SupabaseClient)
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) return { completed: false, step: 0 };

    const { data: clinic } = await (sb as SupabaseClient)
      .from("clinics")
      .select("onboarding_completed, onboarding_step")
      .eq("id", profile.clinic_id)
      .single();

    return {
      completed: clinic?.onboarding_completed ?? false,
      step: clinic?.onboarding_step ?? 0,
    };
  } catch {
    return { completed: false, step: 0 };
  }
}
