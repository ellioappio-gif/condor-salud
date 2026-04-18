"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "@/lib/i18n/context";
import { useDoctors } from "@/lib/hooks/useModules";
import { useIsDemo } from "@/lib/auth/context";
import { useToast } from "@/components/Toast";
import { useDemoAction } from "@/components/DemoModal";
import { formatDoctorSchedule } from "@/lib/services/directorio";
import { Card, CardContent, Select, Toggle, Button, PageHeader, EmptyState } from "@/components/ui";
import { Calendar, Clock, Save, Users, Coffee, Loader2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────

interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
  slotDuration: number;
  lunchStart: string;
  lunchEnd: string;
}

type WeekSchedule = Record<string, DaySchedule>;

type Profesional = {
  id: string;
  nombre: string;
  especialidad: string;
  horario: string;
};

// ── Centro Médico Roca doctors (fallback when API returns empty) ──

const CMR_DOCTORS: Profesional[] = [
  {
    id: "cmr-francisco",
    nombre: "Dr. Francisco Lopez",
    especialidad: "Director Médico",
    horario: "Lun–Vie 10:00–17:00",
  },
  {
    id: "cmr-vargas",
    nombre: "Dr. Vargas Freddy",
    especialidad: "Cirugía Dental",
    horario: "Lun 14:30–15:30",
  },
  {
    id: "cmr-angela",
    nombre: "Dra. Angela María González",
    especialidad: "Gastroenterología",
    horario: "Lun 10:00–12:00",
  },
  {
    id: "cmr-nigro",
    nombre: "Dra. Clara Nigro",
    especialidad: "Neurología",
    horario: "Lun 15:00–16:00",
  },
  {
    id: "cmr-delgadillo",
    nombre: "Dr. Gustavo Delgadillo",
    especialidad: "Ecografía",
    horario: "Mar 10:00–12:00 · Jue 14:00–15:45",
  },
  {
    id: "cmr-taboada",
    nombre: "Dra. Yessica Taboada",
    especialidad: "Odontología",
    horario: "Mar 14:00–17:00",
  },
  {
    id: "cmr-rivero",
    nombre: "Dr. Richard Rivero",
    especialidad: "Traumatología",
    horario: "Mar 17:00–18:00",
  },
  {
    id: "cmr-gibilbank",
    nombre: "Dra. Martha Gibilbank",
    especialidad: "Oftalmología",
    horario: "Mar 15:00–16:00",
  },
  {
    id: "cmr-legal",
    nombre: "Dra. Norma Legal",
    especialidad: "Hematología",
    horario: "Mar 15:00–16:00 · Jue 16:00–17:00",
  },
  {
    id: "cmr-rios",
    nombre: "Dra. Mariana Ríos",
    especialidad: "Terapia Alternativa",
    horario: "1 vez al mes (ella avisa)",
  },
  {
    id: "cmr-acevedo",
    nombre: "Lic. Cristina Acevedo",
    especialidad: "Mamografía / Kinesiología",
    horario: "Mar 09:00–12:00 · Jue 09:00–12:00",
  },
  {
    id: "cmr-vargasl",
    nombre: "Dr. Rogelio Vargas Lopez",
    especialidad: "Urología",
    horario: "Mié 11:30–12:30",
  },
  {
    id: "cmr-urbieta",
    nombre: "Dra. Alicia Urbieta",
    especialidad: "Alergista",
    horario: "Mié 14:00–15:00 (cada 15 días)",
  },
  {
    id: "cmr-espinoza",
    nombre: "Dra. Sikiu Espinoza",
    especialidad: "Odontología",
    horario: "Mié 14:00–17:00 · Vie 14:00–17:00",
  },
  {
    id: "cmr-angelotti",
    nombre: "Dra. Liliana Angelotti",
    especialidad: "Endocrinología",
    horario: "Jue 10:00–12:00 (cada 15 días)",
  },
  {
    id: "cmr-dalpiaz",
    nombre: "Dr. Juan Manuel Dalpiaz",
    especialidad: "Cirugía General",
    horario: "Jue 11:00–12:00",
  },
  {
    id: "cmr-lezcano",
    nombre: "Dr. Adrián Lezcano",
    especialidad: "Infectología",
    horario: "Jue 13:00–14:00",
  },
  {
    id: "cmr-jimenez",
    nombre: "Dra. Susana Jiménez",
    especialidad: "Dermatología",
    horario: "Jue 15:00–16:00 (cada 15 días)",
  },
  {
    id: "cmr-lagos",
    nombre: "Dr. Carlos Lagos",
    especialidad: "Flebología",
    horario: "Jue 17:00–18:00",
  },
  {
    id: "cmr-heit",
    nombre: "Téc. Esteban Heit",
    especialidad: "Radiografía",
    horario: "Lun–Vie 13:30–15:00",
  },
  {
    id: "cmr-baied",
    nombre: "Dra. María del Carmen Baied",
    especialidad: "Reumatología",
    horario: "Vie 09:30–10:30",
  },
  {
    id: "cmr-gutierrez",
    nombre: "Dra. Irene Gutiérrez",
    especialidad: "Diabetología",
    horario: "Vie 09:00–10:00",
  },
  {
    id: "cmr-abdala",
    nombre: "Dra. Alicia Abdala",
    especialidad: "Gastroenterología",
    horario: "Vie 12:30–14:00",
  },
  {
    id: "cmr-asz",
    nombre: "Dr. José Asz",
    especialidad: "Oftalmología",
    horario: "Vie 13:30–14:30 (cada 15 días)",
  },
  {
    id: "cmr-diccea",
    nombre: "Dr. Carlos Diccea",
    especialidad: "Ginecología",
    horario: "Vie 14:00–15:00",
  },
  {
    id: "cmr-molina",
    nombre: "Lic. Oscar Molina",
    especialidad: "Psicología",
    horario: "Confirmar horario",
  },
  {
    id: "cmr-tottereaus",
    nombre: "Dr. Julián Tottereaus",
    especialidad: "Neumonología",
    horario: "Vie 15:00–16:00 (1 vez al mes)",
  },
];

// ── Constants ────────────────────────────────────────────────

const DAY_KEYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

const TIME_OPTIONS: string[] = [];
for (let h = 7; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

const SLOT_OPTIONS = [
  { value: "20", label: "20 min" },
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
];

function defaultWeek(): WeekSchedule {
  const w: WeekSchedule = {};
  for (const key of DAY_KEYS) {
    w[key] = {
      enabled: key !== "sabado" && key !== "domingo",
      start: "09:00",
      end: "18:00",
      slotDuration: 30,
      lunchStart: "13:00",
      lunchEnd: "14:00",
    };
  }
  return w;
}

function countSlots(ds: DaySchedule): number {
  if (!ds.enabled) return 0;
  const [sh, sm] = ds.start.split(":").map(Number);
  const [eh, em] = ds.end.split(":").map(Number);
  const startMin = (sh ?? 9) * 60 + (sm ?? 0);
  const endMin = (eh ?? 18) * 60 + (em ?? 0);
  const [lsh, lsm] = ds.lunchStart.split(":").map(Number);
  const [leh, lem] = ds.lunchEnd.split(":").map(Number);
  const lunchS = (lsh ?? 13) * 60 + (lsm ?? 0);
  const lunchE = (leh ?? 14) * 60 + (lem ?? 0);
  let c = 0;
  for (let m = startMin; m + ds.slotDuration <= endMin; m += ds.slotDuration) {
    if (m >= lunchS && m < lunchE) continue;
    if (m + ds.slotDuration > lunchS && m < lunchE) continue;
    c++;
  }
  return c;
}

// ── Component ────────────────────────────────────────────────

export default function DisponibilidadPage() {
  const { t } = useLocale();
  const { data: apiDoctors = [] } = useDoctors();
  const isDemo = useIsDemo();
  const { showDemo } = useDemoAction();
  const { showToast } = useToast();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultWeek);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "grid">("editor");

  const profesionales = useMemo(() => {
    const fromApi: Profesional[] = apiDoctors.map((d) => ({
      id: d.id,
      nombre: d.name,
      especialidad: d.specialty,
      horario: formatDoctorSchedule(d.schedule),
    }));
    if (fromApi.length > 0) {
      const apiNames = new Set(fromApi.map((p) => p.nombre.toLowerCase()));
      const missing = CMR_DOCTORS.filter((c) => !apiNames.has(c.nombre.toLowerCase()));
      return [...fromApi, ...missing];
    }
    return CMR_DOCTORS;
  }, [apiDoctors]);

  const selectedDoctor = profesionales.find((p) => p.id === selectedDoctorId);

  const dayLabels: Record<string, string> = useMemo(
    () => ({
      lunes: t("days.monday") !== "days.monday" ? t("days.monday") : "Lunes",
      martes: t("days.tuesday") !== "days.tuesday" ? t("days.tuesday") : "Martes",
      miercoles: t("days.wednesday") !== "days.wednesday" ? t("days.wednesday") : "Miércoles",
      jueves: t("days.thursday") !== "days.thursday" ? t("days.thursday") : "Jueves",
      viernes: t("days.friday") !== "days.friday" ? t("days.friday") : "Viernes",
      sabado: t("days.saturday") !== "days.saturday" ? t("days.saturday") : "Sábado",
      domingo: t("days.sunday") !== "days.sunday" ? t("days.sunday") : "Domingo",
    }),
    [t],
  );

  const updateDay = useCallback((day: string, updates: Partial<DaySchedule>) => {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day]!, ...updates } }));
  }, []);

  const handleSave = useCallback(async () => {
    if (isDemo) {
      showDemo(
        t("availability.saveDemo") !== "availability.saveDemo"
          ? t("availability.saveDemo")
          : "Disponible en versión de producción.",
      );
      return;
    }
    if (!selectedDoctorId) {
      showToast(
        t("availability.selectDoctorFirst") !== "availability.selectDoctorFirst"
          ? t("availability.selectDoctorFirst")
          : "Seleccione un profesional primero",
        "error",
      );
      return;
    }
    setSaving(true);
    try {
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      for (let week = 0; week < 4; week++) {
        for (let di = 0; di < 7; di++) {
          const day = DAY_KEYS[di]!;
          const ds = schedule[day]!;
          if (!ds.enabled) continue;

          const date = new Date(monday);
          date.setDate(monday.getDate() + week * 7 + di);
          const dateStr = date.toISOString().split("T")[0]!;

          const slots: string[] = [];
          const [sh, sm] = ds.start.split(":").map(Number);
          const [eh, em] = ds.end.split(":").map(Number);
          const startMin = (sh ?? 9) * 60 + (sm ?? 0);
          const endMin = (eh ?? 18) * 60 + (em ?? 0);
          const [lsh, lsm] = ds.lunchStart.split(":").map(Number);
          const [leh, lem] = ds.lunchEnd.split(":").map(Number);
          const lunchS = (lsh ?? 13) * 60 + (lsm ?? 0);
          const lunchE = (leh ?? 14) * 60 + (lem ?? 0);

          for (let m = startMin; m + ds.slotDuration <= endMin; m += ds.slotDuration) {
            if (m >= lunchS && m < lunchE) continue;
            if (m + ds.slotDuration > lunchS && m < lunchE) continue;
            const hh = String(Math.floor(m / 60)).padStart(2, "0");
            const mm = String(m % 60).padStart(2, "0");
            slots.push(`${hh}:${mm}`);
          }

          if (slots.length > 0) {
            await fetch("/api/availability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ doctorId: selectedDoctorId, date: dateStr, timeSlots: slots }),
            });
          }
        }
      }
      showToast(
        t("availability.saved") !== "availability.saved"
          ? t("availability.saved")
          : "Disponibilidad guardada exitosamente",
        "success",
      );
    } catch {
      showToast(
        t("availability.saveError") !== "availability.saveError"
          ? t("availability.saveError")
          : "Error al guardar",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }, [isDemo, selectedDoctorId, schedule, showDemo, showToast, t]);

  const enabledDays = Object.values(schedule).filter((d) => d.enabled).length;
  const totalSlots = useMemo(
    () => Object.values(schedule).reduce((s, d) => s + countSlots(d), 0),
    [schedule],
  );

  const gridData = useMemo(() => {
    const rows: { time: string; days: (boolean | "lunch")[] }[] = [];
    for (let m = 7 * 60; m < 23 * 60; m += 30) {
      const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const days = DAY_KEYS.map((key) => {
        const ds = schedule[key]!;
        if (!ds.enabled) return false;
        const [sh, sm] = ds.start.split(":").map(Number);
        const [eh, em] = ds.end.split(":").map(Number);
        const startMin = (sh ?? 9) * 60 + (sm ?? 0);
        const endMin = (eh ?? 18) * 60 + (em ?? 0);
        if (m < startMin || m >= endMin) return false;
        const [lsh, lsm] = ds.lunchStart.split(":").map(Number);
        const [leh, lem] = ds.lunchEnd.split(":").map(Number);
        const lunchS = (lsh ?? 13) * 60 + (lsm ?? 0);
        const lunchE = (leh ?? 14) * 60 + (lem ?? 0);
        if (m >= lunchS && m < lunchE) return "lunch" as const;
        return true;
      });
      if (days.some((d) => d !== false)) rows.push({ time, days });
    }
    return rows;
  }, [schedule]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          t("availability.title") !== "availability.title"
            ? t("availability.title")
            : "Disponibilidad"
        }
        description={
          t("availability.editorDescription") !== "availability.editorDescription"
            ? t("availability.editorDescription")
            : "Configure los horarios de atención de cada profesional"
        }
        breadcrumbs={[
          {
            label:
              t("dashboard.mainPanel") !== "dashboard.mainPanel"
                ? t("dashboard.mainPanel")
                : "Panel",
            href: "/dashboard",
          },
          {
            label:
              t("availability.title") !== "availability.title"
                ? t("availability.title")
                : "Disponibilidad",
          },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "editor" ? "grid" : "editor")}
            >
              {viewMode === "editor"
                ? t("availability.viewGrid") !== "availability.viewGrid"
                  ? t("availability.viewGrid")
                  : "Vista grilla"
                : t("availability.viewEditor") !== "availability.viewEditor"
                  ? t("availability.viewEditor")
                  : "Editar horarios"}
            </Button>
            <div className="relative group">
              <Button onClick={handleSave} disabled={saving || !selectedDoctorId}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                {t("common.save") !== "common.save" ? t("common.save") : "Guardar"}
              </Button>
              {isDemo && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-ink text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                  {t("availability.saveDemo") !== "availability.saveDemo"
                    ? t("availability.saveDemo")
                    : "Disponible en versión de producción."}
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-lg p-4 border-l-[3px] border-l-celeste">
          <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
            <Users className="w-3 h-3 inline mr-1" />
            {t("availability.totalProfessionals") !== "availability.totalProfessionals"
              ? t("availability.totalProfessionals")
              : "Total profesionales"}
          </p>
          <p className="text-xl font-bold text-ink mt-1">{profesionales.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4 border-l-[3px] border-l-green-400">
          <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
            <Calendar className="w-3 h-3 inline mr-1" />
            {t("availability.activeDays") !== "availability.activeDays"
              ? t("availability.activeDays")
              : "Días activos"}
          </p>
          <p className="text-xl font-bold text-ink mt-1">{enabledDays}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4 border-l-[3px] border-l-purple-400">
          <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">
            <Clock className="w-3 h-3 inline mr-1" />
            {t("availability.weeklySlots") !== "availability.weeklySlots"
              ? t("availability.weeklySlots")
              : "Turnos semanales"}
          </p>
          <p className="text-xl font-bold text-ink mt-1">{totalSlots}</p>
        </div>
      </div>

      {/* Doctor selector */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-1.5">
                {t("availability.professional") !== "availability.professional"
                  ? t("availability.professional")
                  : "Profesional"}
              </label>
              <Select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                options={[
                  {
                    value: "",
                    label:
                      t("availability.selectDoctor") !== "availability.selectDoctor"
                        ? t("availability.selectDoctor")
                        : "-- Seleccionar profesional --",
                  },
                  ...profesionales.map((p) => ({
                    value: p.id,
                    label: `${p.nombre} — ${p.especialidad}`,
                  })),
                ]}
              />
            </div>
            {selectedDoctor && (
              <div className="text-sm text-ink-light">
                <span className="font-medium">
                  {t("availability.currentSchedule") !== "availability.currentSchedule"
                    ? t("availability.currentSchedule")
                    : "Horario actual"}
                  :
                </span>{" "}
                {selectedDoctor.horario || "—"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedDoctorId && (
        <EmptyState
          icon={<Calendar className="w-12 h-12 text-ink-muted" />}
          title={
            t("availability.selectDoctorPrompt") !== "availability.selectDoctorPrompt"
              ? t("availability.selectDoctorPrompt")
              : "Seleccione un profesional"
          }
          description={
            t("availability.selectDoctorDesc") !== "availability.selectDoctorDesc"
              ? t("availability.selectDoctorDesc")
              : "Elija un profesional del listado para configurar su disponibilidad semanal."
          }
        />
      )}

      {/* Schedule Editor — 7-day grid */}
      {selectedDoctorId && viewMode === "editor" && (
        <div className="space-y-3">
          {DAY_KEYS.map((day) => {
            const ds = schedule[day]!;
            return (
              <Card key={day}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Toggle
                        checked={ds.enabled}
                        onChange={(v) => updateDay(day, { enabled: v })}
                        label={dayLabels[day]}
                      />
                      {ds.enabled && (
                        <span className="text-xs text-ink-muted">
                          {ds.start}–{ds.end} · {ds.slotDuration} min · {countSlots(ds)}{" "}
                          {t("availability.slots") !== "availability.slots"
                            ? t("availability.slots")
                            : "turnos"}
                        </span>
                      )}
                    </div>
                    {ds.enabled && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-border">
                        <div>
                          <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                            {t("availability.startTime") !== "availability.startTime"
                              ? t("availability.startTime")
                              : "Inicio"}
                          </label>
                          <select
                            value={ds.start}
                            onChange={(e) => updateDay(day, { start: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-celeste-dark"
                          >
                            {TIME_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                            {t("availability.endTime") !== "availability.endTime"
                              ? t("availability.endTime")
                              : "Fin"}
                          </label>
                          <select
                            value={ds.end}
                            onChange={(e) => updateDay(day, { end: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-celeste-dark"
                          >
                            {TIME_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                            {t("availability.slotDuration") !== "availability.slotDuration"
                              ? t("availability.slotDuration")
                              : "Duración turno"}
                          </label>
                          <select
                            value={String(ds.slotDuration)}
                            onChange={(e) =>
                              updateDay(day, { slotDuration: Number(e.target.value) })
                            }
                            className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-celeste-dark"
                          >
                            {SLOT_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                            <Coffee className="w-3 h-3 inline mr-0.5" />
                            {t("availability.lunchStart") !== "availability.lunchStart"
                              ? t("availability.lunchStart")
                              : "Almuerzo desde"}
                          </label>
                          <select
                            value={ds.lunchStart}
                            onChange={(e) => updateDay(day, { lunchStart: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-celeste-dark"
                          >
                            {TIME_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
                            <Coffee className="w-3 h-3 inline mr-0.5" />
                            {t("availability.lunchEnd") !== "availability.lunchEnd"
                              ? t("availability.lunchEnd")
                              : "Almuerzo hasta"}
                          </label>
                          <select
                            value={ds.lunchEnd}
                            onChange={(e) => updateDay(day, { lunchEnd: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-celeste-dark"
                          >
                            {TIME_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end pb-2">
                          <span className="text-xs text-ink-muted">
                            {countSlots(ds)}{" "}
                            {t("availability.slots") !== "availability.slots"
                              ? t("availability.slots")
                              : "turnos"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Grid Preview */}
      {selectedDoctorId && viewMode === "grid" && (
        <Card>
          <CardContent className="pt-4 pb-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-left text-ink-muted font-bold uppercase tracking-wider">
                    {t("availability.time") !== "availability.time"
                      ? t("availability.time")
                      : "Hora"}
                  </th>
                  {DAY_KEYS.map((day) => (
                    <th
                      key={day}
                      className={`py-2 px-3 text-center font-bold uppercase tracking-wider ${schedule[day]!.enabled ? "text-ink" : "text-ink-muted/40"}`}
                    >
                      {(dayLabels[day] ?? day).slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gridData.map((row) => (
                  <tr key={row.time} className="border-b border-border/50">
                    <td className="py-1.5 px-3 text-ink-muted font-mono">{row.time}</td>
                    {row.days.map((cell, i) => (
                      <td key={i} className="py-1.5 px-3 text-center">
                        {cell === true && (
                          <div className="w-full h-5 bg-celeste-pale/50 border border-celeste-light rounded-sm" />
                        )}
                        {cell === "lunch" && (
                          <div className="w-full h-5 bg-amber-50 border border-amber-200 rounded-sm flex items-center justify-center">
                            <Coffee className="w-3 h-3 text-amber-500" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {gridData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      {t("availability.noSlots") !== "availability.noSlots"
                        ? t("availability.noSlots")
                        : "No hay turnos configurados"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
