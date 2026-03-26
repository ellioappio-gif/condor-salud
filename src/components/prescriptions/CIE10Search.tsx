"use client";

import { useState, useCallback, useRef } from "react";
import { Search, Loader2, AlertTriangle } from "lucide-react";

export interface CIE10Entry {
  code: string;
  description: string;
}

interface CIE10SearchProps {
  onSelect: (entry: CIE10Entry) => void;
  value?: string;
  onChange?: (value: string) => void;
  showFreeTextWarning?: boolean;
}

// ─── Common Argentine CIE-10 codes for demo/fallback ─────────
const CIE10_DATABASE: CIE10Entry[] = [
  { code: "I10", description: "Hipertensión esencial (primaria)" },
  { code: "E11", description: "Diabetes mellitus tipo 2" },
  { code: "E11.9", description: "Diabetes mellitus tipo 2, sin complicaciones" },
  { code: "J00", description: "Rinofaringitis aguda (resfrío común)" },
  { code: "J06.9", description: "Infección aguda de las vías respiratorias superiores" },
  { code: "J20.9", description: "Bronquitis aguda, no especificada" },
  { code: "J45", description: "Asma" },
  { code: "K21", description: "Enfermedad por reflujo gastroesofágico" },
  { code: "K29.7", description: "Gastritis, no especificada" },
  { code: "M54.5", description: "Lumbago no especificado (dolor lumbar)" },
  { code: "M79.3", description: "Paniculitis no especificada" },
  { code: "N39.0", description: "Infección de vías urinarias, sitio no especificado" },
  { code: "E03.9", description: "Hipotiroidismo, no especificado" },
  { code: "E78.0", description: "Hipercolesterolemia pura" },
  { code: "F32.0", description: "Episodio depresivo leve" },
  { code: "F32.1", description: "Episodio depresivo moderado" },
  { code: "F41.1", description: "Trastorno de ansiedad generalizada" },
  { code: "G43.9", description: "Migraña, no especificada" },
  { code: "R51", description: "Cefalea" },
  { code: "R10.4", description: "Otros dolores abdominales y los no especificados" },
  { code: "R50.9", description: "Fiebre, no especificada" },
  { code: "L30.9", description: "Dermatitis, no especificada" },
  { code: "H10.9", description: "Conjuntivitis, no especificada" },
  { code: "B34.9", description: "Infección viral, no especificada" },
  { code: "E66.9", description: "Obesidad, no especificada" },
  { code: "I25.9", description: "Enfermedad isquémica crónica del corazón" },
  { code: "N40", description: "Hiperplasia de la próstata" },
  { code: "E04.9", description: "Bocio no tóxico, no especificado" },
  { code: "K59.0", description: "Constipación" },
  { code: "R42", description: "Mareo y desvanecimiento" },
];

export default function CIE10Search({
  onSelect,
  value,
  onChange,
  showFreeTextWarning = true,
}: CIE10SearchProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<CIE10Entry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFreeText, setIsFreeText] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const lower = q.toLowerCase();

    // Try API first, fall back to local database
    try {
      const res = await fetch(`/api/cie10/search?q=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0) {
          setResults(data.results);
          setIsOpen(true);
          setIsFreeText(false);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to local search
    }

    // Local CIE-10 database search
    const localResults = CIE10_DATABASE.filter(
      (e) => e.code.toLowerCase().includes(lower) || e.description.toLowerCase().includes(lower),
    ).slice(0, 10);

    setResults(localResults);
    setIsOpen(localResults.length > 0);
    setIsFreeText(localResults.length === 0 && q.length >= 3);
    setLoading(false);
  }, []);

  function handleInputChange(val: string) {
    setQuery(val);
    onChange?.(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  }

  function handleSelect(entry: CIE10Entry) {
    const formatted = `${entry.code} — ${entry.description}`;
    setQuery(formatted);
    onChange?.(formatted);
    setIsOpen(false);
    setResults([]);
    setIsFreeText(false);
    onSelect(entry);
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
          placeholder="Buscar por código CIE-10 o descripción (ej: I10, hipertensión)..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-celeste/40"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30 animate-spin" />
        )}
      </div>

      {/* Free text warning */}
      {showFreeTextWarning && isFreeText && (
        <div className="flex items-start gap-2 mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-700">
            <span className="font-semibold">
              Usar CIE-10 mejora la tasa de aprobación en farmacias.
            </span>{" "}
            Si no encuentra el código exacto, puede escribir el diagnóstico en texto libre.
          </p>
        </div>
      )}

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-30 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {results.map((entry) => (
            <button
              key={entry.code}
              type="button"
              onClick={() => handleSelect(entry)}
              className="w-full text-left px-4 py-2.5 hover:bg-celeste-pale/30 border-b border-border/30 last:border-0 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-celeste-dark bg-celeste-pale/50 px-1.5 py-0.5 rounded">
                  {entry.code}
                </span>
                <span className="text-sm text-ink">{entry.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
