"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, description, disabled, className }: ToggleProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-celeste-dark focus-visible:ring-offset-2",
          checked ? "bg-celeste-dark" : "bg-border",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform duration-200",
            checked ? "translate-x-4 mt-0.5 ml-0.5" : "translate-x-0 mt-0.5 ml-0.5",
          )}
          aria-hidden="true"
        />
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <span className="text-sm font-medium text-ink">{label}</span>}
          {description && <p className="text-xs text-ink-muted">{description}</p>}
        </div>
      )}
    </label>
  );
}
