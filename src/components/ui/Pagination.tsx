"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build visible page numbers: first, last, current ± 1
  const pages: (number | "…")[] = [];
  const addPage = (p: number) => {
    if (p >= 1 && p <= totalPages && !pages.includes(p)) pages.push(p);
  };

  addPage(1);
  if (currentPage > 3) pages.push("…");
  for (let i = currentPage - 1; i <= currentPage + 1; i++) addPage(i);
  if (currentPage < totalPages - 2) pages.push("…");
  addPage(totalPages);

  return (
    <nav
      className={cn("flex items-center justify-center gap-1 pt-4", className)}
      aria-label="Paginación"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface transition disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-ink-muted select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              "min-w-[28px] h-7 text-xs font-medium rounded transition",
              p === currentPage
                ? "bg-celeste-dark text-white"
                : "text-ink-muted hover:text-ink hover:bg-surface",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-surface transition disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
