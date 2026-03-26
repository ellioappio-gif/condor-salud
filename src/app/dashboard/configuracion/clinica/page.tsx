"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";
import { isSupabaseConfigured } from "@/lib/env";
import { Building2, Save, Loader2, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface ClinicData {
  id: string;
  name: string;
  cuit: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  plan_tier: string;
  especialidad: string[];
  logo_url: string | null;
}

const inputClass =
  "w-full rounded-[4px] border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-celeste-dark focus:border-celeste-dark transition";

// ─── Page ────────────────────────────────────────────────────

export default function ClinicaConfigPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useLocale();
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [cuit, setCuit] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // ── Fetch clinic data ──────────────────────────────────────
  const fetchClinic = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.clinicId) {
      setLoading(false);
      setError("No se pudo cargar la información de la clínica.");
      return;
    }
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const { data, error: fetchErr } = await (sb as ReturnType<typeof createClient>)
        .from("clinics")
        .select("id, name, cuit, phone, email, address, plan_tier, especialidad, logo_url")
        .eq("id", user.clinicId)
        .single();

      if (fetchErr || !data) {
        setError("Error al cargar datos de la clínica.");
        return;
      }

      const c = data as unknown as ClinicData;
      setClinic(c);
      setName(c.name || "");
      setCuit(c.cuit || "");
      setPhone(c.phone || "");
      setEmail(c.email || "");
      setAddress(c.address || "");
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [user?.clinicId]);

  useEffect(() => {
    fetchClinic();
  }, [fetchClinic]);

  // ── Save clinic data ───────────────────────────────────────
  const handleSave = async () => {
    if (!clinic?.id) return;
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const { error: updateErr } = await (sb as ReturnType<typeof createClient>)
        .from("clinics")
        .update({
          name: name.trim(),
          cuit: cuit.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clinic.id);

      if (updateErr) {
        showToast(t("toast.config.clinicSaveError") + updateErr.message);
        return;
      }

      setClinic((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim(),
              cuit: cuit.trim(),
              phone: phone.trim(),
              email: email.trim(),
              address: address.trim(),
            }
          : prev,
      );
      setEditMode(false);
      showToast(t("toast.config.clinicUpdated"));
    } catch {
      showToast(t("toast.config.clinicConnectionError"));
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error states ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-celeste-dark" />
        <span className="ml-2 text-sm text-ink-muted">Cargando datos de la clínica...</span>
      </div>
    );
  }

  if (error || !clinic) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-ink-muted">{error || "Clínica no encontrada."}</p>
        <Link href="/dashboard" className="text-xs text-celeste-dark hover:underline">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <Link href="/dashboard/configuracion" className="hover:text-celeste-dark transition">
          Configuración
        </Link>
        <span>/</span>
        <span className="text-ink font-medium">Mi Clínica</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Mi Clínica</h1>
          <p className="text-sm text-ink-muted mt-0.5">Datos generales del centro médico</p>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 rounded-[4px] border border-celeste-dark px-4 py-2 text-xs font-bold text-celeste-dark hover:bg-celeste-50 transition"
          >
            Editar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditMode(false);
                setName(clinic.name || "");
                setCuit(clinic.cuit || "");
                setPhone(clinic.phone || "");
                setEmail(clinic.email || "");
                setAddress(clinic.address || "");
              }}
              className="rounded-[4px] border border-gray-300 px-4 py-2 text-xs font-medium text-ink-muted hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 rounded-[4px] bg-celeste-dark px-4 py-2 text-xs font-bold text-white hover:bg-celeste-700 transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Guardar
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* General info */}
        <div className="bg-white border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase">
            Información General
          </h3>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">CUIT</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="30-12345678-9"
                  value={cuit}
                  onChange={(e) => setCuit(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              {[
                { label: "Nombre", value: clinic.name },
                { label: "CUIT", value: clinic.cuit || "No ingresado", mono: true },
                {
                  label: "Plan",
                  value:
                    (clinic.plan_tier || "starter").charAt(0).toUpperCase() +
                    (clinic.plan_tier || "starter").slice(1),
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex justify-between items-center py-2 border-b border-border-light last:border-0"
                >
                  <span className="text-xs text-ink-muted">{f.label}</span>
                  <span className={`text-xs font-semibold text-ink ${f.mono ? "font-mono" : ""}`}>
                    {f.value}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Contact */}
        <div className="bg-white border border-border rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase">
            Contacto y Ubicación
          </h3>
          {editMode ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-ink-muted mb-1">Dirección</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Av. San Martín 1520, CABA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">Teléfono</label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="+54 11 1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-ink-muted mb-1">Email</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="admin@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <>
              {[
                { label: "Dirección", value: clinic.address || "No ingresada" },
                { label: "Teléfono", value: clinic.phone || "No ingresado" },
                { label: "Email", value: clinic.email || "No ingresado" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex justify-between items-center py-2 border-b border-border-light last:border-0"
                >
                  <span className="text-xs text-ink-muted">{f.label}</span>
                  <span className="text-xs font-semibold text-ink text-right">{f.value}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Specialties */}
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-3">
            Especialidades
          </h3>
          {clinic.especialidad && clinic.especialidad.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {clinic.especialidad.map((e: string) => (
                <span
                  key={e}
                  className="px-3 py-1.5 text-xs font-medium bg-celeste-pale text-celeste-dark rounded-[4px]"
                >
                  {e}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted">
              No hay especialidades configuradas. Podés agregarlas desde el wizard de onboarding.
            </p>
          )}
        </div>

        {/* Plan info */}
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-xs font-bold tracking-wider text-ink-muted uppercase mb-3">
            Plan Actual
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-ink">
                {(clinic.plan_tier || "starter").charAt(0).toUpperCase() +
                  (clinic.plan_tier || "starter").slice(1)}
              </span>
              <p className="text-xs text-ink-muted mt-0.5">
                Podés cambiar de plan en cualquier momento.
              </p>
            </div>
            <Link href="/planes" className="text-xs text-celeste-dark font-medium hover:underline">
              Ver planes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
