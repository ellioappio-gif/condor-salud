// ─── Command Palette ──────────────────────────────────────────
// Cmd+K (Mac) / Ctrl+K (Win) global search overlay
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/context";
import { Search, X } from "lucide-react";

interface PaletteItem {
  id: string;
  label: string;
  href: string;
  section: string;
  keywords?: string;
}

const ITEMS: PaletteItem[] = [
  {
    id: "dash",
    label: "Panel principal",
    href: "/dashboard",
    section: "Navegación",
    keywords: "home inicio",
  },
  {
    id: "fact",
    label: "Facturación",
    href: "/dashboard/facturacion",
    section: "Navegación",
    keywords: "billing invoices",
  },
  {
    id: "rech",
    label: "Rechazos",
    href: "/dashboard/rechazos",
    section: "Navegación",
    keywords: "claims rejected",
  },
  {
    id: "fin",
    label: "Financiadores",
    href: "/dashboard/financiadores",
    section: "Navegación",
    keywords: "insurers payers",
  },
  {
    id: "infl",
    label: "Inflación",
    href: "/dashboard/inflacion",
    section: "Navegación",
    keywords: "inflation tracker",
  },
  {
    id: "pac",
    label: "Pacientes",
    href: "/dashboard/pacientes",
    section: "Navegación",
    keywords: "patients",
  },
  {
    id: "agen",
    label: "Agenda",
    href: "/dashboard/agenda",
    section: "Navegación",
    keywords: "schedule calendar turnos",
  },
  {
    id: "inv",
    label: "Inventario",
    href: "/dashboard/inventario",
    section: "Navegación",
    keywords: "stock supplies",
  },
  {
    id: "rep",
    label: "Reportes",
    href: "/dashboard/reportes",
    section: "Navegación",
    keywords: "reports analytics",
  },
  {
    id: "aud",
    label: "Auditoría",
    href: "/dashboard/auditoria",
    section: "Navegación",
    keywords: "audit log",
  },
  {
    id: "conf",
    label: "Configuración",
    href: "/dashboard/configuracion",
    section: "Navegación",
    keywords: "settings config",
  },
  {
    id: "alrt",
    label: "Alertas",
    href: "/dashboard/alertas",
    section: "Navegación",
    keywords: "notifications",
  },
  {
    id: "crm",
    label: "CRM WhatsApp",
    href: "/dashboard/crm",
    section: "Navegación",
    keywords: "whatsapp crm messages",
  },
  {
    id: "team",
    label: "Equipo",
    href: "/dashboard/equipo",
    section: "Navegación",
    keywords: "team staff",
  },
  {
    id: "triage",
    label: "Triage IA",
    href: "/dashboard/triage",
    section: "Navegación",
    keywords: "ai triage claude",
  },
  {
    id: "nf",
    label: "Nueva factura",
    href: "/dashboard/facturacion",
    section: "Acciones",
    keywords: "create invoice",
  },
  {
    id: "nt",
    label: "Nuevo turno",
    href: "/dashboard/agenda",
    section: "Acciones",
    keywords: "new appointment",
  },
  {
    id: "np",
    label: "Nuevo paciente",
    href: "/dashboard/pacientes",
    section: "Acciones",
    keywords: "add patient",
  },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useLocale();

  // ⌘K / Ctrl+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return ITEMS;
    const q = query.toLowerCase();
    return ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        (item.keywords && item.keywords.includes(q)),
    );
  }, [query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [results]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => {
        const next = Math.min(i + 1, results.length - 1);
        document.getElementById(`cp-item-${next}`)?.scrollIntoView?.({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => {
        const next = Math.max(i - 1, 0);
        document.getElementById(`cp-item-${next}`)?.scrollIntoView?.({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter" && results[activeIdx]) {
      go(results[activeIdx].href);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-ink-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              t("commandPalette.placeholder") !== "commandPalette.placeholder"
                ? t("commandPalette.placeholder")
                : "Buscar página o acción…"
            }
            className="flex-1 text-sm outline-none bg-transparent text-ink placeholder:text-ink-muted"
            role="combobox"
            aria-expanded={true}
            aria-controls="cp-results"
            aria-activedescendant={results[activeIdx] ? `cp-item-${activeIdx}` : undefined}
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-surface rounded border border-border text-ink-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="cp-results"
          role="listbox"
          aria-label="Resultados"
          className="max-h-72 overflow-y-auto py-2"
        >
          {results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-muted">
              Sin resultados para &quot;{query}&quot;
            </div>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              id={`cp-item-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => go(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                i === activeIdx ? "bg-celeste-pale text-celeste-dark" : "text-ink hover:bg-surface"
              }`}
            >
              <span className="flex-1 font-medium">{item.label}</span>
              <span className="text-[10px] text-ink-muted">{item.section}</span>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border text-[10px] text-ink-muted flex gap-4">
          <span>↑↓ navegar</span>
          <span>↵ seleccionar</span>
          <span>esc cerrar</span>
        </div>
      </div>
    </div>
  );
}
