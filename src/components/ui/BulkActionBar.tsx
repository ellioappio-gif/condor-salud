// ─── Bulk Action Bar ──────────────────────────────────────────
// Floating action bar shown when rows are selected in tables
"use client";

import { X } from "lucide-react";

interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  icon?: React.ReactNode;
}

interface BulkActionBarProps {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
}

export function BulkActionBar({ count, actions, onClear }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Acciones en lote"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white rounded-lg shadow-2xl px-5 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4"
    >
      <span className="text-sm font-semibold">
        {count} seleccionado{count !== 1 ? "s" : ""}
      </span>
      <div className="h-5 w-px bg-white/20" />
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
            action.variant === "danger"
              ? "bg-red-500/20 text-red-300 hover:bg-red-500/40"
              : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
      <button
        onClick={onClear}
        className="ml-2 p-1 hover:bg-white/10 rounded transition"
        aria-label="Deseleccionar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
