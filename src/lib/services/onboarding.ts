/**
 * Onboarding service — persists clinic setup to Supabase.
 *
 * Pattern: isSupabaseConfigured() ? real insert : demo no-op
 */

import { isSupabaseConfigured } from "@/lib/env";

// ─── Types ───────────────────────────────────────────────────

export interface ClinicOnboardingInput {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  especialidades?: string[];
  cantidadProfesionales?: number;
  sistemaAnterior?: string;
  logoUrl?: string;
  plan?: string;
  whatsappNumber?: string;
  enableWhatsapp?: boolean;
  enableTelemedicina?: boolean;
  financiadores?: string[];
}

export interface OnboardingResult {
  success: boolean;
  clinicId?: string;
  error?: string;
}

// ─── Service ─────────────────────────────────────────────────

/**
 * Create or update the clinic record and mark onboarding completed.
 */
export async function completeOnboarding(input: ClinicOnboardingInput): Promise<OnboardingResult> {
  if (!isSupabaseConfigured()) {
    // Demo mode — simulate success
    console.info("[onboarding] Demo mode — skipping Supabase insert");
    return { success: true, clinicId: "demo-clinic-001" };
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
    const { data: profile } = await (sb as any)
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    let clinicId = profile?.clinic_id as string | null;

    if (clinicId) {
      // Update existing clinic
      const { error } = await (sb as any)
        .from("clinics")
        .update({
          name: input.nombre,
          direccion: input.direccion ?? null,
          telefono: input.telefono ?? null,
          email: input.email ?? null,
          especialidades: input.especialidades ?? [],
          cantidad_profesionales: input.cantidadProfesionales ?? 1,
          sistema_anterior: input.sistemaAnterior ?? null,
          logo_url: input.logoUrl ?? null,
          plan: input.plan ?? "esencial",
          onboarding_completed: true,
          onboarding_step: -1, // -1 = finished
          updated_at: new Date().toISOString(),
        })
        .eq("id", clinicId);

      if (error) {
        console.error("[onboarding] update error", error);
        return { success: false, error: error.message };
      }

      return { success: true, clinicId };
    }

    // Create new clinic
    const { data: clinic, error: insertErr } = await (sb as any)
      .from("clinics")
      .insert({
        name: input.nombre,
        direccion: input.direccion ?? null,
        telefono: input.telefono ?? null,
        email: input.email ?? null,
        especialidades: input.especialidades ?? [],
        cantidad_profesionales: input.cantidadProfesionales ?? 1,
        sistema_anterior: input.sistemaAnterior ?? null,
        logo_url: input.logoUrl ?? null,
        plan: input.plan ?? "esencial",
        onboarding_completed: true,
        onboarding_step: -1,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[onboarding] insert error", insertErr);
      return { success: false, error: insertErr.message };
    }

    clinicId = clinic?.id as string;

    // Link profile to clinic
    if (clinicId) {
      await (sb as any).from("profiles").update({ clinic_id: clinicId }).eq("id", user.id);
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
  if (!isSupabaseConfigured()) return;

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    const { data: profile } = await (sb as any)
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (profile?.clinic_id) {
      await (sb as any)
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

    const { data: profile } = await (sb as any)
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) return { completed: false, step: 0 };

    const { data: clinic } = await (sb as any)
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
