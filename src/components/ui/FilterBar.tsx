"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";
import { Input } from "./Input";
import { Select, type SelectOption } from "./Select";

interface FilterDef {
  key: string;
  type: "select" | "search";
  label?: string;
  placeholder?: string;
  options?: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  filters: FilterDef[];
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({ filters, actions, className }: FilterBarProps) {
  const { t } = useLocale();
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3 bg-white p-4 rounded-[4px] border border-border",
        className,
      )}
      role="search"
      aria-label={t("common.filters")}
    >
      {filters.map((f) =>
        f.type === "select" ? (
          <div key={f.key} className="min-w-[160px]">
            <Select
              label={f.label}
              options={f.options || []}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder={f.placeholder}
            />
          </div>
        ) : (
          <div key={f.key} className="flex-1 min-w-[200px]">
            <Input
              label={f.label}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder={f.placeholder || t("common.search")}
              type="search"
              aria-label={f.label || t("common.search")}
            />
          </div>
        ),
      )}
      {actions && <div className="ml-auto flex items-end gap-2">{actions}</div>}
    </div>
  );
}
