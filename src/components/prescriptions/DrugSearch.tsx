"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Loader2, AlertTriangle, Pill, ShieldAlert } from "lucide-react";
import type { VademecumDrug } from "@/lib/types";

interface DrugSearchProps {
  onSelect: (drug: VademecumDrug) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export default function DrugSearch({
  onSelect,
  placeholder = "Buscar por principio activo o nombre comercial...",
  value,
  onChange,
  disabled,
}: DrugSearchProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<VademecumDrug[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/vademecum/search?q=${encodeURIComponent(q)}&limit=10`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.drugs || []);
        setIsOpen(true);
      }
    } catch {
      // Aborted or demo mode — show fallback results
      setResults(getDemoResults(q));
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    onChange?.(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  }

  function handleSelect(drug: VademecumDrug) {
    if (drug.isControlled) return; // Blocked at UI level
    setQuery(drug.commercialName);
    onChange?.(drug.commercialName);
    setIsOpen(false);
    setResults([]);
    onSelect(drug);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40 disabled:opacity-50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-30 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {results.map((drug) => (
            <button
              key={drug.id}
              type="button"
              onClick={() => handleSelect(drug)}
              disabled={drug.isControlled}
              className={`w-full text-left px-4 py-3 border-b border-border/30 last:border-0 transition ${
                drug.isControlled
                  ? "bg-red-50 cursor-not-allowed opacity-80"
                  : "hover:bg-celeste-pale/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Pill className="w-3.5 h-3.5 text-celeste shrink-0" />
                  <span className="text-sm font-semibold text-ink truncate">
                    {drug.commercialName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {drug.isControlled && (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                      <ShieldAlert className="w-3 h-3" />
                      Controlado
                    </span>
                  )}
                  {drug.requiresPrescription && !drug.isControlled && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                      Requiere Rx
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-ink/50 mt-0.5 ml-5.5">
                {drug.genericName} — {drug.lab} — {drug.presentation}
              </div>
              {drug.isControlled && (
                <div className="flex items-center gap-1.5 mt-1.5 ml-5.5">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] text-red-600 font-semibold">
                    Sustancia controlada — no se puede prescribir por este sistema
                  </span>
                </div>
              )}
              {drug.troquel && (
                <div className="text-[10px] text-ink/30 mt-0.5 ml-5.5">
                  Troquel: {drug.troquel}
                  {drug.alfabetaCode && <> · Alfabeta: {drug.alfabetaCode}</>}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Demo fallback results ───────────────────────────────────

function getDemoResults(query: string): VademecumDrug[] {
  const q = query.toLowerCase();
  return DEMO_DRUGS.filter(
    (d) => d.commercialName.toLowerCase().includes(q) || d.genericName.toLowerCase().includes(q),
  ).slice(0, 8);
}

const DEMO_DRUGS: VademecumDrug[] = [
  {
    id: "d-001",
    commercialName: "Amoxidal 500",
    genericName: "Amoxicilina",
    lab: "Roemmers",
    concentration: "500mg",
    presentation: "Comprimidos x 21",
    troquel: "27643",
    alfabetaCode: "AMX500",
    monodrogaCode: "0128",
    isControlled: false,
    requiresPrescription: true,
    category: "Antibiótico",
    atcCode: "J01CA04",
  },
  {
    id: "d-002",
    commercialName: "Ibupirac 400",
    genericName: "Ibuprofeno",
    lab: "Pfizer",
    concentration: "400mg",
    presentation: "Comprimidos x 20",
    troquel: "15872",
    isControlled: false,
    requiresPrescription: false,
    category: "AINE",
    atcCode: "M01AE01",
  },
  {
    id: "d-003",
    commercialName: "Losartan Gador 50",
    genericName: "Losartán",
    lab: "Gador",
    concentration: "50mg",
    presentation: "Comprimidos x 30",
    troquel: "38291",
    isControlled: false,
    requiresPrescription: true,
    category: "Antihipertensivo",
    atcCode: "C09CA01",
  },
  {
    id: "d-004",
    commercialName: "Metformina Craveri 850",
    genericName: "Metformina",
    lab: "Craveri",
    concentration: "850mg",
    presentation: "Comprimidos x 30",
    troquel: "42156",
    isControlled: false,
    requiresPrescription: true,
    category: "Antidiabético",
    atcCode: "A10BA02",
  },
  {
    id: "d-005",
    commercialName: "Omeprazol Bagó 20",
    genericName: "Omeprazol",
    lab: "Bagó",
    concentration: "20mg",
    presentation: "Cápsulas x 28",
    troquel: "29134",
    isControlled: false,
    requiresPrescription: true,
    category: "IBP",
    atcCode: "A02BC01",
  },
  {
    id: "d-006",
    commercialName: "Atenolol Bagó 50",
    genericName: "Atenolol",
    lab: "Bagó",
    concentration: "50mg",
    presentation: "Comprimidos x 30",
    troquel: "18563",
    isControlled: false,
    requiresPrescription: true,
    category: "Betabloqueante",
    atcCode: "C07AB03",
  },
  {
    id: "d-007",
    commercialName: "Clonazepam Gador 0.5",
    genericName: "Clonazepam",
    lab: "Gador",
    concentration: "0.5mg",
    presentation: "Comprimidos x 30",
    troquel: "33721",
    isControlled: true,
    requiresPrescription: true,
    category: "Benzodiazepina",
    atcCode: "N03AE01",
  },
  {
    id: "d-008",
    commercialName: "Levotiroxina Bagó 75",
    genericName: "Levotiroxina",
    lab: "Bagó",
    concentration: "75mcg",
    presentation: "Comprimidos x 50",
    troquel: "44829",
    isControlled: false,
    requiresPrescription: true,
    category: "Hormona tiroidea",
    atcCode: "H03AA01",
  },
  {
    id: "d-009",
    commercialName: "Enalapril Roemmers 10",
    genericName: "Enalapril",
    lab: "Roemmers",
    concentration: "10mg",
    presentation: "Comprimidos x 30",
    troquel: "21456",
    isControlled: false,
    requiresPrescription: true,
    category: "IECA",
    atcCode: "C09AA02",
  },
  {
    id: "d-010",
    commercialName: "Sertralina Gador 50",
    genericName: "Sertralina",
    lab: "Gador",
    concentration: "50mg",
    presentation: "Comprimidos x 30",
    troquel: "39821",
    isControlled: false,
    requiresPrescription: true,
    category: "ISRS",
    atcCode: "N06AB06",
  },
  {
    id: "d-011",
    commercialName: "Alprazolam Gador 0.5",
    genericName: "Alprazolam",
    lab: "Gador",
    concentration: "0.5mg",
    presentation: "Comprimidos x 30",
    troquel: "35621",
    isControlled: true,
    requiresPrescription: true,
    category: "Benzodiazepina",
    atcCode: "N05BA12",
  },
  {
    id: "d-012",
    commercialName: "Aspirina Protect 100",
    genericName: "Ácido acetilsalicílico",
    lab: "Bayer",
    concentration: "100mg",
    presentation: "Comprimidos x 28",
    troquel: "11234",
    isControlled: false,
    requiresPrescription: false,
    category: "Antiagregante",
    atcCode: "B01AC06",
  },
];
