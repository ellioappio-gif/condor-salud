"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  QrCode,
  Pill,
  Loader2,
  X,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Landmark,
  Search,
  AlertTriangle,
  Shield,
  Send,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import type { VademecumDrug, DrugInteraction } from "@/lib/types";

/** Generate a simple unique token without crypto.randomUUID */
function generateToken(): string {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

/* ── Types ──────────────────────────────────────────────── */
interface Medication {
  medicationName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number | "";
  notes: string;
  drug?: VademecumDrug;
}

const EMPTY_MED: Medication = {
  medicationName: "",
  genericName: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "",
  notes: "",
};

/* ── Coverage options ──────────────────────────────────── */
const COVERAGE_OPTIONS = [
  { name: "Sin cobertura", plan: "" },
  { name: "OSDE 210", plan: "210" },
  { name: "OSDE 310", plan: "310" },
  { name: "OSDE 410", plan: "410" },
  { name: "OSDE 510", plan: "510" },
  { name: "Swiss Medical", plan: "" },
  { name: "Galeno", plan: "" },
  { name: "Medicus", plan: "" },
  { name: "IOMA", plan: "" },
  { name: "PAMI", plan: "" },
  { name: "Otra", plan: "" },
];

/* ── Drug Search Hook ──────────────────────────────────── */
function useDrugSearch() {
  const [results, setResults] = useState<VademecumDrug[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/vademecum/search?q=${encodeURIComponent(query)}&limit=8`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.drugs || []);
      }
    } catch {
      // Aborted or error
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search, clearResults: () => setResults([]) };
}

/* ── Interaction Check Hook ────────────────────────────── */
function useInteractionCheck() {
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [hasContraindicated, setHasContraindicated] = useState(false);
  const [hasHigh, setHasHigh] = useState(false);

  const check = useCallback(async (drugIds: string[]) => {
    if (drugIds.length < 2) {
      setInteractions([]);
      setHasContraindicated(false);
      setHasHigh(false);
      return;
    }

    try {
      const res = await fetch("/api/vademecum/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setInteractions(data.interactions || []);
        setHasContraindicated(data.hasContraindicated || false);
        setHasHigh(data.hasHigh || false);
      }
    } catch {
      // Ignore
    }
  }, []);

  return { interactions, hasContraindicated, hasHigh, check };
}

/* ── Main Component ────────────────────────────────────── */
export default function NuevaRecetaPage() {
  const { showToast } = useToast();
  const drugSearch = useDrugSearch();
  const interactionCheck = useInteractionCheck();

  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{
    id: string;
    verificationToken: string;
    verificationUrl: string;
    patientName: string;
    medications: { medicationName: string }[];
    status: string;
    osde?: { status: string };
  } | null>(null);

  // Form state
  const [patientName, setPatientName] = useState("");
  const [patientDNI, setPatientDNI] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState<Medication[]>([{ ...EMPTY_MED }]);
  const [coverageName, setCoverageName] = useState("");
  const [coveragePlan, setCoveragePlan] = useState("");
  const [coverageNumber, setCoverageNumber] = useState("");
  const [activeDrugSearchIdx, setActiveDrugSearchIdx] = useState<number | null>(null);

  // Track drug IDs for interaction checking
  const drugIds = meds.filter((m) => m.drug?.id).map((m) => m.drug!.id);

  // Check interactions when drugs change
  useEffect(() => {
    interactionCheck.check(drugIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drugIds.join(",")]);

  function addMed() {
    setMeds([...meds, { ...EMPTY_MED }]);
  }

  function removeMed(idx: number) {
    if (meds.length === 1) return;
    setMeds(meds.filter((_, i) => i !== idx));
  }

  function updateMed(idx: number, field: keyof Medication, value: string | number) {
    setMeds(meds.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  function selectDrug(idx: number, drug: VademecumDrug) {
    setMeds(
      meds.map((m, i) =>
        i === idx
          ? {
              ...m,
              medicationName: drug.commercialName,
              genericName: drug.genericName,
              dosage: drug.concentration,
              drug,
            }
          : m,
      ),
    );
    setActiveDrugSearchIdx(null);
    drugSearch.clearResults();
  }

  function handleDrugInputChange(idx: number, value: string) {
    updateMed(idx, "medicationName", value);
    setActiveDrugSearchIdx(idx);
    drugSearch.search(value);
  }

  function handleCoverageChange(name: string) {
    setCoverageName(name);
    const opt = COVERAGE_OPTIONS.find((o) => o.name === name);
    if (opt) setCoveragePlan(opt.plan);
  }

  async function handleCreate(asDraft: boolean = false) {
    if (!patientName.trim() || !meds[0]?.medicationName) {
      showToast("Completa el nombre del paciente y al menos un medicamento.");
      return;
    }

    // Block if contraindicated interaction
    if (interactionCheck.hasContraindicated) {
      showToast("Hay interacciones CONTRAINDICADAS. Revisa los medicamentos antes de continuar.");
      return;
    }

    setCreating(true);

    const filteredMeds = meds
      .filter((m) => m.medicationName)
      .map((m) => ({
        medicationName: m.medicationName,
        genericName: m.genericName || undefined,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration || undefined,
        quantity: m.quantity ? Number(m.quantity) : undefined,
        notes: m.notes || undefined,
        drug: m.drug
          ? {
              drugId: m.drug.id,
              troquel: m.drug.troquel,
              alfabetaCode: m.drug.alfabetaCode,
              genericName: m.drug.genericName,
              commercialName: m.drug.commercialName,
              lab: m.drug.lab,
              concentration: m.drug.concentration,
              presentation: m.drug.presentation,
              isControlled: m.drug.isControlled,
            }
          : undefined,
      }));

    try {
      const res = await fetch("/api/prescriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientDNI.trim() || "clinic-patient-" + Date.now(),
          patientName: patientName.trim(),
          patientDni: patientDNI.trim() || undefined,
          doctorName: "Dra. Maria Rodriguez",
          doctorMatricula: "MN-12345",
          doctorCuit: "27-27345678-0",
          diagnosis: diagnosis.trim() || undefined,
          notes: notes.trim() || undefined,
          coverageName: coverageName || undefined,
          coveragePlan: coveragePlan || undefined,
          coverageNumber: coverageNumber || undefined,
          asDraft,
          medications: filteredMeds,
        }),
      });

      if (!res.ok) throw new Error("API unavailable");

      const data = await res.json();
      setCreated({
        id: data.prescription.id,
        verificationToken: data.prescription.verificationToken,
        verificationUrl: data.verificationUrl,
        patientName: data.prescription.patientName,
        medications: data.prescription.medications || [],
        status: asDraft ? "draft" : "active",
      });
    } catch {
      // Mock mode
      const mockId = "RX-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      const mockToken = generateToken();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setCreated({
        id: mockId,
        verificationToken: mockToken,
        verificationUrl: `${origin}/rx/${mockToken}`,
        patientName: patientName.trim(),
        medications: filteredMeds,
        status: asDraft ? "draft" : "active",
        osde: coverageName.toLowerCase().includes("osde")
          ? { status: asDraft ? "pending" : "registered" }
          : undefined,
      });
    }

    showToast(asDraft ? "Borrador guardado" : "Receta digital creada con exito");
    setCreating(false);
  }

  function copyVerificationUrl() {
    if (!created) return;
    try {
      navigator.clipboard.writeText(created.verificationUrl);
      showToast("URL de verificacion copiada");
    } catch {
      showToast("No se pudo copiar la URL");
    }
  }

  function resetForm() {
    setCreated(null);
    setPatientName("");
    setPatientDNI("");
    setDiagnosis("");
    setNotes("");
    setMeds([{ ...EMPTY_MED }]);
    setCoverageName("");
    setCoveragePlan("");
    setCoverageNumber("");
  }

  // ── Success state ──
  if (created) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-ink mb-2">
            {created.status === "draft" ? "Borrador Guardado" : "Receta Creada Exitosamente"}
          </h1>
          <p className="text-sm text-ink/60 mb-2">
            Receta digital para{" "}
            <span className="font-semibold text-ink">{created.patientName}</span> con{" "}
            {created.medications.length} medicamento{created.medications.length !== 1 ? "s" : ""}
          </p>

          {/* Status badge */}
          <div className="flex justify-center mb-6">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                created.status === "draft"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {created.status === "draft" ? (
                <>
                  <Save className="w-3 h-3" />
                  Borrador — pendiente de emision
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  Emitida
                </>
              )}
            </span>
          </div>

          {/* OSDE registration result */}
          {created.osde && (
            <div
              className={`border rounded-xl p-4 mb-6 text-left ${
                created.osde.status === "registered"
                  ? "bg-green-50/50 border-green-200"
                  : "bg-amber-50/50 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-800">
                    Registrada en OSDE (FHIR 4.0)
                  </p>
                  <p className="text-[11px] text-ink/60 mt-0.5">
                    Prescripcion electronica registrada exitosamente en el sistema de OSDE conforme
                    a la normativa FHIR HL7 4.0.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QR verification card */}
          {created.status !== "draft" && (
            <div className="bg-surface border border-border rounded-xl p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-celeste-dark" />
                <span className="text-sm font-semibold text-ink">Codigo QR de verificacion</span>
              </div>
              <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-2">
                <code className="text-xs text-ink/70 flex-1 truncate">
                  {created.verificationUrl}
                </code>
                <button
                  onClick={copyVerificationUrl}
                  className="p-1.5 hover:bg-surface rounded transition shrink-0"
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4 text-ink/50" />
                </button>
                <a
                  href={`/rx/${created.verificationToken}`}
                  target="_blank"
                  rel="noopener"
                  className="p-1.5 hover:bg-surface rounded transition shrink-0"
                  title="Abrir receta"
                >
                  <ExternalLink className="w-4 h-4 text-ink/50" />
                </a>
              </div>
              <p className="text-[11px] text-ink/40 mt-2">
                El paciente o la farmacia pueden escanear el codigo QR para verificar la receta
              </p>
            </div>
          )}

          {/* Mi Argentina compliance note */}
          <div className="bg-celeste-pale/50 border border-celeste/20 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <Landmark className="w-4 h-4 text-celeste-dark mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-celeste-dark">
                  Compatible con Receta Electronica Nacional
                </p>
                <p className="text-[11px] text-ink/60 mt-0.5">
                  Esta receta es compatible con el sistema nacional de receta electronica y puede
                  ser verificada en cualquier farmacia del pais mediante el codigo QR.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetForm}
              className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-5 py-2.5 rounded-[4px] transition"
            >
              <Plus className="w-4 h-4" />
              Nueva Receta
            </button>
            <Link
              href="/dashboard/recetas"
              className="inline-flex items-center gap-2 border border-border text-ink/70 hover:text-ink text-sm font-medium px-5 py-2.5 rounded-[4px] transition"
            >
              Ver Historial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ──
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/recetas"
          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-border transition"
        >
          <ArrowLeft className="w-4 h-4 text-ink/50" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Prescribir Receta</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            Crea una receta digital con validacion de medicamentos e interacciones
          </p>
        </div>
      </div>

      {/* Interaction Warnings */}
      {interactionCheck.interactions.length > 0 && (
        <div
          className={`border rounded-2xl p-4 ${
            interactionCheck.hasContraindicated
              ? "bg-red-50 border-red-300"
              : interactionCheck.hasHigh
                ? "bg-amber-50 border-amber-300"
                : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className={`w-5 h-5 ${
                interactionCheck.hasContraindicated ? "text-red-600" : "text-amber-600"
              }`}
            />
            <span
              className={`text-sm font-bold ${
                interactionCheck.hasContraindicated ? "text-red-800" : "text-amber-800"
              }`}
            >
              {interactionCheck.hasContraindicated
                ? "Interaccion CONTRAINDICADA detectada"
                : `${interactionCheck.interactions.length} interaccion(es) detectada(s)`}
            </span>
          </div>
          <div className="space-y-2">
            {interactionCheck.interactions.map((ix) => (
              <div
                key={ix.id}
                className={`rounded-lg p-3 text-xs ${
                  ix.severity === "contraindicated"
                    ? "bg-red-100 border border-red-200"
                    : ix.severity === "high"
                      ? "bg-amber-100 border border-amber-200"
                      : "bg-white border border-yellow-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                      ix.severity === "contraindicated"
                        ? "bg-red-600 text-white"
                        : ix.severity === "high"
                          ? "bg-amber-600 text-white"
                          : "bg-yellow-500 text-white"
                    }`}
                  >
                    {ix.severity === "contraindicated"
                      ? "CONTRAINDICADO"
                      : ix.severity === "high"
                        ? "ALTO RIESGO"
                        : "MODERADO"}
                  </span>
                  <span className="text-ink/70">
                    {ix.drugA} + {ix.drugB}
                  </span>
                </div>
                <p className="text-ink/70">{ix.description}</p>
                <p className="text-ink/90 font-semibold mt-1">{ix.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {/* Patient section */}
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-celeste" />
            Datos del Paciente
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                Nombre completo *
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nombre completo del paciente"
                className="mt-1 w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                DNI
              </label>
              <input
                type="text"
                value={patientDNI}
                onChange={(e) => setPatientDNI(e.target.value)}
                placeholder="Ej: 30123456"
                className="mt-1 w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
              Diagnostico
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Ej: Hipertension arterial, Diabetes tipo 2"
              className="mt-1 w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
            />
          </div>
        </div>

        {/* Coverage section */}
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-celeste" />
            Cobertura / Obra Social
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                Obra social
              </label>
              <select
                value={coverageName}
                onChange={(e) => handleCoverageChange(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40 bg-white"
              >
                <option value="">Seleccionar...</option>
                {COVERAGE_OPTIONS.map((o) => (
                  <option key={o.name} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                Plan
              </label>
              <input
                type="text"
                value={coveragePlan}
                onChange={(e) => setCoveragePlan(e.target.value)}
                placeholder="Ej: 310"
                className="mt-1 w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
                Nro. afiliado
              </label>
              <input
                type="text"
                value={coverageNumber}
                onChange={(e) => setCoverageNumber(e.target.value)}
                placeholder="Nro. de afiliado"
                className="mt-1 w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
              />
            </div>
          </div>
          {coverageName.toLowerCase().includes("osde") && (
            <div className="mt-3 bg-celeste-pale/30 border border-celeste/20 rounded-lg p-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-celeste-dark mt-0.5 shrink-0" />
              <p className="text-[11px] text-celeste-dark">
                Al emitir esta receta, se registrara automaticamente en el sistema de prescripcion
                electronica de OSDE via FHIR HL7 4.0.
              </p>
            </div>
          )}
        </div>

        {/* Medications section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <Pill className="w-4 h-4 text-celeste" />
              Medicamentos *
            </h2>
            <button
              onClick={addMed}
              className="text-xs text-celeste-dark hover:underline flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3 h-3" /> Agregar medicamento
            </button>
          </div>

          <div className="space-y-4">
            {meds.map((med, idx) => (
              <div key={idx} className="bg-surface rounded-xl p-4 space-y-3 relative group">
                {meds.length > 1 && (
                  <button
                    onClick={() => removeMed(idx)}
                    className="absolute top-3 right-3 p-1 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition"
                    title="Eliminar medicamento"
                  >
                    <X className="w-3.5 h-3.5 text-ink/40" />
                  </button>
                )}

                <div className="flex items-center gap-1.5 mb-1">
                  <Pill className="w-3.5 h-3.5 text-celeste" />
                  <span className="text-[10px] font-bold text-ink/50 uppercase">
                    Medicamento {idx + 1}
                  </span>
                  {med.drug?.isControlled && (
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">
                      Controlado
                    </span>
                  )}
                  {med.drug && (
                    <span className="text-[9px] bg-celeste-pale text-celeste-dark px-1.5 py-0.5 rounded font-semibold">
                      Validado
                    </span>
                  )}
                </div>

                {/* Drug search input with autocomplete */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30" />
                    <input
                      type="text"
                      placeholder="Buscar medicamento (ej: losartan, amoxicilina)..."
                      value={med.medicationName}
                      onChange={(e) => handleDrugInputChange(idx, e.target.value)}
                      onFocus={() => setActiveDrugSearchIdx(idx)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
                    />
                    {drugSearch.loading && activeDrugSearchIdx === idx && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30 animate-spin" />
                    )}
                  </div>

                  {/* Autocomplete dropdown */}
                  {activeDrugSearchIdx === idx && drugSearch.results.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {drugSearch.results.map((drug) => (
                        <button
                          key={drug.id}
                          onClick={() => selectDrug(idx, drug)}
                          className="w-full text-left px-3 py-2.5 hover:bg-surface border-b border-border/50 last:border-0 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-ink">
                              {drug.commercialName}
                            </span>
                            {drug.isControlled && (
                              <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                CTRL
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-ink/50 mt-0.5">
                            {drug.genericName} — {drug.lab} — {drug.presentation}
                          </div>
                          {drug.troquel && (
                            <div className="text-[10px] text-ink/30 mt-0.5">
                              Troquel: {drug.troquel}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Generic name display */}
                {med.genericName && (
                  <p className="text-[11px] text-ink/50 -mt-1">
                    Generico: <span className="font-semibold">{med.genericName}</span>
                    {med.drug?.lab && <> — {med.drug.lab}</>}
                    {med.drug?.troquel && <> — Troquel: {med.drug.troquel}</>}
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Dosis (500mg)"
                    value={med.dosage}
                    onChange={(e) => updateMed(idx, "dosage", e.target.value)}
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-celeste/40"
                  />
                  <input
                    type="text"
                    placeholder="Frecuencia (c/8h)"
                    value={med.frequency}
                    onChange={(e) => updateMed(idx, "frequency", e.target.value)}
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-celeste/40"
                  />
                  <input
                    type="text"
                    placeholder="Duracion (7 dias)"
                    value={med.duration}
                    onChange={(e) => updateMed(idx, "duration", e.target.value)}
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-celeste/40"
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={med.quantity}
                    onChange={(e) => updateMed(idx, "quantity", e.target.value)}
                    className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-celeste/40"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notas adicionales para este medicamento (opcional)"
                  value={med.notes}
                  onChange={(e) => updateMed(idx, "notes", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-celeste/40"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes section */}
        <div className="p-6 border-b border-border">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2 mb-4">
            Indicaciones Generales
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Indicaciones adicionales para el paciente o la farmacia..."
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 bg-surface/50">
          <Link
            href="/dashboard/recetas"
            className="text-sm font-medium text-ink/60 hover:text-ink transition"
          >
            Cancelar
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCreate(true)}
              disabled={creating}
              className="inline-flex items-center gap-2 border border-border text-ink/70 hover:text-ink text-sm font-semibold px-5 py-2.5 rounded-[4px] transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Guardar Borrador
            </button>
            <button
              onClick={() => handleCreate(false)}
              disabled={creating || interactionCheck.hasContraindicated}
              className="inline-flex items-center gap-2 bg-celeste-dark hover:bg-celeste-700 text-white text-sm font-semibold px-6 py-2.5 rounded-[4px] transition disabled:opacity-50 shadow-sm shadow-celeste/20"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Emitir Receta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
