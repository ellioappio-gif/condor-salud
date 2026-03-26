"use client";

import { useState } from "react";
import { Shield, Search, User, AlertCircle } from "lucide-react";

export interface CoverageData {
  coverageName: string;
  coveragePlan: string;
  coverageNumber: string;
}

interface PatientCoverageSelectorProps {
  value: CoverageData;
  onChange: (data: CoverageData) => void;
}

// ─── Argentine coverage options ──────────────────────────────

const COVERAGE_OPTIONS = [
  { name: "Sin cobertura", plan: "", isOSDE: false },
  { name: "OSDE 210", plan: "210", isOSDE: true },
  { name: "OSDE 310", plan: "310", isOSDE: true },
  { name: "OSDE 410", plan: "410", isOSDE: true },
  { name: "OSDE 510", plan: "510", isOSDE: true },
  { name: "Swiss Medical", plan: "", isOSDE: false },
  { name: "Galeno", plan: "", isOSDE: false },
  { name: "Medicus", plan: "", isOSDE: false },
  { name: "IOMA", plan: "", isOSDE: false },
  { name: "PAMI", plan: "", isOSDE: false },
  { name: "Medifé", plan: "", isOSDE: false },
  { name: "Hospital Italiano", plan: "", isOSDE: false },
  { name: "OMINT", plan: "", isOSDE: false },
  { name: "Accord Salud", plan: "", isOSDE: false },
  { name: "Unión Personal", plan: "", isOSDE: false },
  { name: "OSECAC", plan: "", isOSDE: false },
  { name: "Otra", plan: "", isOSDE: false },
];

// ─── Demo patient search results ─────────────────────────────

interface PatientResult {
  id: string;
  name: string;
  dni: string;
  coverage: string;
  affiliateNumber: string;
}

const DEMO_PATIENTS: PatientResult[] = [
  {
    id: "p-001",
    name: "María García",
    dni: "30456789",
    coverage: "OSDE 310",
    affiliateNumber: "310-456789-0",
  },
  {
    id: "p-002",
    name: "Carlos López",
    dni: "28345678",
    coverage: "Swiss Medical",
    affiliateNumber: "SM-28345678",
  },
  {
    id: "p-003",
    name: "Ana Martínez",
    dni: "35678901",
    coverage: "OSDE 410",
    affiliateNumber: "410-567890-1",
  },
  {
    id: "p-004",
    name: "Roberto Sánchez",
    dni: "25123456",
    coverage: "PAMI",
    affiliateNumber: "PAMI-2512345",
  },
  {
    id: "p-005",
    name: "Lucía Fernández",
    dni: "32987654",
    coverage: "IOMA",
    affiliateNumber: "IOMA-329876",
  },
  {
    id: "p-006",
    name: "Pedro González",
    dni: "29876543",
    coverage: "Galeno",
    affiliateNumber: "GAL-298765",
  },
  {
    id: "p-007",
    name: "Valentina Pérez",
    dni: "40123456",
    coverage: "OSDE 210",
    affiliateNumber: "210-401234-5",
  },
  {
    id: "p-008",
    name: "Diego Ramírez",
    dni: "33567890",
    coverage: "Medicus",
    affiliateNumber: "MED-335678",
  },
];

// ─── Component ───────────────────────────────────────────────

export default function PatientCoverageSelector({ value, onChange }: PatientCoverageSelectorProps) {
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);

  const isOSDE = value.coverageName.toLowerCase().includes("osde");
  const isRCTA = !isOSDE && value.coverageName && value.coverageName !== "Sin cobertura";

  const patientResults =
    patientSearch.length >= 2
      ? DEMO_PATIENTS.filter(
          (p) =>
            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
            p.dni.includes(patientSearch),
        ).slice(0, 5)
      : [];

  function handlePatientSelect(patient: PatientResult) {
    setSelectedPatient(patient);
    setShowPatientResults(false);
    setPatientSearch(patient.name);

    const opt = COVERAGE_OPTIONS.find((o) => o.name === patient.coverage);
    onChange({
      coverageName: patient.coverage,
      coveragePlan: opt?.plan || "",
      coverageNumber: patient.affiliateNumber,
    });
  }

  function handleCoverageChange(name: string) {
    const opt = COVERAGE_OPTIONS.find((o) => o.name === name);
    onChange({
      ...value,
      coverageName: name,
      coveragePlan: opt?.plan || value.coveragePlan,
    });
  }

  return (
    <div className="space-y-4">
      {/* Patient search */}
      <div>
        <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
          Buscar paciente
        </label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              setShowPatientResults(e.target.value.length >= 2);
            }}
            onFocus={() => patientSearch.length >= 2 && setShowPatientResults(true)}
            onBlur={() => setTimeout(() => setShowPatientResults(false), 200)}
            placeholder="Nombre o DNI del paciente..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
          />

          {showPatientResults && patientResults.length > 0 && (
            <div className="absolute z-30 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {patientResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePatientSelect(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-celeste-pale/30 border-b border-border/30 last:border-0 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-ink/30" />
                      <span className="text-sm font-semibold text-ink">{p.name}</span>
                    </div>
                    <span className="text-[10px] text-ink/40">DNI {p.dni}</span>
                  </div>
                  <div className="text-[11px] text-ink/50 ml-5.5 mt-0.5">
                    {p.coverage} · Nro: {p.affiliateNumber}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPatient && (
          <div className="mt-2 bg-celeste-pale/30 border border-celeste/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-celeste-dark" />
            <span className="text-xs text-ink font-semibold">{selectedPatient.name}</span>
            <span className="text-[10px] text-ink/50">DNI {selectedPatient.dni}</span>
            <span className="ml-auto text-[10px] font-semibold text-celeste-dark">
              {selectedPatient.coverage}
            </span>
          </div>
        )}
      </div>

      {/* Coverage selector */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">
            Obra social / Prepaga
          </label>
          <select
            value={value.coverageName}
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
          <label className="text-xs font-semibold text-ink/70 uppercase tracking-wider">Plan</label>
          <input
            type="text"
            value={value.coveragePlan}
            onChange={(e) => onChange({ ...value, coveragePlan: e.target.value })}
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
            value={value.coverageNumber}
            onChange={(e) => onChange({ ...value, coverageNumber: e.target.value })}
            placeholder="Nro. de afiliado / socio"
            className="mt-1 w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
          />
        </div>
      </div>

      {/* Routing indicator */}
      {isOSDE && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-blue-800 font-semibold">
              Se registrará en OSDE (FHIR 4.0)
            </p>
            <p className="text-[10px] text-blue-700/70">
              La receta se enviará automáticamente al sistema electrónico de OSDE.
              {value.coverageNumber
                ? ""
                : " Complete el número de socio para registración exitosa."}
            </p>
          </div>
        </div>
      )}

      {isRCTA && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-[11px] text-green-800 font-semibold">Se registrará en RCTA (QBI2)</p>
            <p className="text-[10px] text-green-700/70">
              Prescripción válida en farmacias de la red RCTA (Farmalink y principales prepagas).
            </p>
          </div>
        </div>
      )}

      {!isOSDE && !isRCTA && value.coverageName === "Sin cobertura" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-800">
            Sin cobertura seleccionada — la receta se generará como PDF con código QR de
            verificación.
          </p>
        </div>
      )}
    </div>
  );
}
