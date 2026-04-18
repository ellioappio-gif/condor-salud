// ─── Column Visibility Dropdown ───────────────────────────────
"use client";

import { useState, useRef, useEffect } from "react";
import { Columns3 } from "lucide-react";

interface Column {
  key: string;
  label: string;
}

interface ColumnVisibilityProps {
  columns: Column[];
  visible: string[];
  onChange: (visible: string[]) => void;
}

export function ColumnVisibility({ columns, visible, onChange }: ColumnVisibilityProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const toggle = (key: string) => {
    if (visible.includes(key)) {
      if (visible.length <= 2) return; // minimum 2 columns
      onChange(visible.filter((k) => k !== key));
    } else {
      onChange([...visible, key]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-[4px] text-ink-light hover:border-celeste-dark hover:text-celeste-dark transition"
        aria-label="Visibilidad de columnas"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Columns3 className="w-3.5 h-3.5" />
        Columnas
      </button>
      {open && (
        <div
          role="group"
          aria-label="Columnas visibles"
          className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg z-40 py-1"
        >
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-ink hover:bg-surface cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visible.includes(col.key)}
                onChange={() => toggle(col.key)}
                className="rounded border-gray-300 text-celeste-dark focus:ring-celeste-dark/30"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
