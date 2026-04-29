"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/Toast";
import {
  bodySystems,
  severityLabels,
  frequencyOptions,
  symptomToSpecialty,
  icd10Codes,
} from "@/lib/services/triage";
import { Loader2, Save, AlertTriangle, CheckSquare, Square } from "lucide-react";

interface PatientTriageTabProps {
  patientId: string;
  patientName: string;
}

type InternalTab = "sintomas" | "detalle" | "clinicas" | "routing";

export default function PatientTriageTab({ patientId, patientName }: PatientTriageTabProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<InternalTab>("sintomas");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(5);
  const [frequency, setFrequency] = useState("Primera vez");
  const [duration, setDuration] = useState("");
  const [triggers, setTriggers] = useState("");
  const [freeNotes, setFreeNotes] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [selectedICD, setSelectedICD] = useState<string[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [selectedReferral, setSelectedReferral] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    severity: string;
    specialty: string;
    icd10Code: string;
    icd10Description: string;
    recommendedAction: string;
    requiresImmediateAttention: boolean;
  } | null>(null);

  const toggleSymptom = (s: string) =>
    setSelectedSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const toggleICD = (code: string) =>
    setSelectedICD((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

  const routedSpecialties = Array.from(
    new Set(selectedSymptoms.map((s) => symptomToSpecialty[s]).filter(Boolean)),
  );

  const getAIAssessment = async () => {
    if (selectedSymptoms.length === 0) {
      showToast("Seleccioná al menos un síntoma para el análisis AI", "error");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai_assessment",
          symptoms: selectedSymptoms,
          severity,
          frequency,
          duration,
          freeNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.assessment) {
          setAiResult(data.assessment);
          setTab("routing");
        }
      }
    } catch (_) {
      showToast("Error al obtener análisis AI", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const saveTriage = useCallback(async () => {
    if (selectedSymptoms.length === 0) {
      showToast("Seleccioná al menos un síntoma", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          patientId,
          symptoms: selectedSymptoms,
          severity,
          frequency,
          duration,
          triggers,
          freeNotes,
          clinicalNotes,
          icdCodes: selectedICD,
          treatmentPlan,
          routedSpecialty: selectedReferral || routedSpecialties[0] || null,
        }),
      });
      if (res.ok) {
        showToast(`Triaje guardado para ${patientName}`, "success");
        // Reset form
        setSelectedSymptoms([]);
        setSeverity(5);
        setFrequency("Primera vez");
        setDuration("");
        setTriggers("");
        setFreeNotes("");
        setClinicalNotes("");
        setSelectedICD([]);
        setTreatmentPlan("");
        setSelectedReferral("");
        setAiResult(null);
        setTab("sintomas");
      } else {
        const d = await res.json();
        showToast(d.error ?? "Error al guardar triaje", "error");
      }
    } catch (_) {
      showToast("Error de conexión", "error");
    } finally {
      setSaving(false);
    }
  }, [
    patientId,
    patientName,
    selectedSymptoms,
    severity,
    frequency,
    duration,
    triggers,
    freeNotes,
    clinicalNotes,
    selectedICD,
    treatmentPlan,
    selectedReferral,
    routedSpecialties,
    showToast,
  ]);

  const tabs: { key: InternalTab; label: string }[] = [
    { key: "sintomas", label: "Síntomas" },
    { key: "detalle", label: "Detalle" },
    { key: "clinicas", label: "Notas Clínicas" },
    { key: "routing", label: "Derivación" },
  ];

  const severityColor =
    severity <= 3 ? "bg-green-500" : severity <= 6 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
              tab === tb.key
                ? "border-celeste-dark text-celeste-dark"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Symptoms tab ── */}
      {tab === "sintomas" && (
        <div className="space-y-4">
          {selectedSymptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((s) => (
                <span
                  key={s}
                  className="text-xs bg-celeste-pale text-celeste-dark px-3 py-1 rounded-full flex items-center gap-1.5 font-medium"
                >
                  {s}
                  <button onClick={() => toggleSymptom(s)} className="hover:text-red-500 font-bold">
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => setSelectedSymptoms([])}
                className="text-xs text-ink/40 hover:text-red-500 transition"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {Object.entries(bodySystems).map(([system, symptoms]) => (
            <div key={system} className="bg-white border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-surface border-b border-border">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">{system}</h4>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {symptoms.map((symptom) => {
                  const active = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition font-medium ${
                        active
                          ? "bg-celeste-dark text-white border-celeste-dark"
                          : "bg-white text-ink border-border hover:border-celeste-dark hover:text-celeste-dark"
                      }`}
                    >
                      {symptom}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail tab ── */}
      {tab === "detalle" && (
        <div className="space-y-5">
          {/* Severity */}
          <div className="bg-white border border-border rounded-lg p-5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-ink uppercase tracking-wider">
                Severidad
              </label>
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold text-white ${severityColor}`}
              >
                {severity} — {severityLabels[severity]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full accent-celeste-dark"
            />
            <div className="flex justify-between text-[10px] text-ink/40">
              <span>Mínimo</span>
              <span>Moderado</span>
              <span>Insoportable</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-lg p-4 space-y-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                Frecuencia
              </label>
              <div className="flex flex-wrap gap-2">
                {frequencyOptions.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                      frequency === f
                        ? "bg-celeste-dark text-white border-celeste-dark"
                        : "bg-white text-ink border-border hover:border-celeste-dark"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-border rounded-lg p-4 space-y-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                Duración
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ej: 3 días, 1 semana…"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
              <label className="text-xs font-bold text-ink uppercase tracking-wider block mt-2">
                Factores desencadenantes
              </label>
              <input
                type="text"
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
                placeholder="Ej: ejercicio, comidas, estrés…"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4 space-y-1.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider block">
              Notas libres del paciente
            </label>
            <textarea
              rows={3}
              value={freeNotes}
              onChange={(e) => setFreeNotes(e.target.value)}
              placeholder="Descripción del paciente en sus propias palabras…"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste/40 resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Clinical notes tab ── */}
      {tab === "clinicas" && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-lg p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                Notas Clínicas del Profesional
              </label>
              <textarea
                rows={5}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Hallazgos del examen físico, observaciones clínicas…"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste/40 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                Códigos CIE-10
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {icd10Codes.map((c) => {
                  const active = selectedICD.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      onClick={() => toggleICD(c.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition ${
                        active
                          ? "bg-celeste-pale border-celeste-dark"
                          : "bg-white border-border hover:border-celeste-dark/40"
                      }`}
                    >
                      {active ? (
                        <CheckSquare className="w-4 h-4 text-celeste-dark shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-ink/30 shrink-0" />
                      )}
                      <span className="font-mono text-xs font-bold text-celeste-dark w-14 shrink-0">
                        {c.code}
                      </span>
                      <span className="text-xs text-ink truncate">{c.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink uppercase tracking-wider block">
                Plan de Tratamiento
              </label>
              <textarea
                rows={3}
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="Indicaciones, medicación, próximos pasos…"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste/40 resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Routing tab ── */}
      {tab === "routing" && (
        <div className="space-y-4">
          {aiResult && (
            <div
              className={`border rounded-xl p-4 ${
                aiResult.requiresImmediateAttention
                  ? "bg-red-50 border-red-300"
                  : "bg-celeste-pale border-celeste/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {aiResult.requiresImmediateAttention && (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Evaluación AI
                </h4>
                <span
                  className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${
                    aiResult.requiresImmediateAttention
                      ? "bg-red-200 text-red-800"
                      : "bg-celeste-pale text-celeste-dark"
                  }`}
                >
                  {aiResult.severity}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-ink/50 text-xs">Especialidad:</span>{" "}
                  <strong>{aiResult.specialty}</strong>
                </p>
                <p>
                  <span className="text-ink/50 text-xs">CIE-10:</span>{" "}
                  <strong>{aiResult.icd10Code}</strong> — {aiResult.icd10Description}
                </p>
                <p className="text-xs text-ink/70 mt-2">{aiResult.recommendedAction}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-border rounded-lg p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-ink uppercase tracking-wider block mb-2">
                Derivar a Especialidad
              </label>
              {routedSpecialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] text-ink/40">Sugerido por síntomas:</span>
                  {routedSpecialties.map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setSelectedReferral(sp ?? "")}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        selectedReferral === sp
                          ? "bg-celeste-dark text-white border-celeste-dark"
                          : "bg-celeste-pale text-celeste-dark border-celeste/30 hover:border-celeste-dark"
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={selectedReferral}
                onChange={(e) => setSelectedReferral(e.target.value)}
                placeholder="Ej: Cardiología, Clínica médica…"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
            </div>

            <button
              onClick={getAIAssessment}
              disabled={aiLoading || selectedSymptoms.length === 0}
              className="w-full py-2.5 text-sm font-semibold border-2 border-celeste-dark text-celeste-dark rounded-lg hover:bg-celeste-pale transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✦"}
              Análisis con IA
            </button>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={saveTriage}
          disabled={saving || selectedSymptoms.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-celeste-dark text-white rounded-xl hover:bg-celeste transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Triaje
        </button>
      </div>
    </div>
  );
}
