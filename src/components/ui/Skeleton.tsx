"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/context";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  const { t } = useLocale();
  return (
    <div
      className={cn("animate-pulse bg-border/60 rounded-[4px]", className)}
      role="status"
      aria-label={t("common.loading")}
    />
  );
}

/* ─── Pre-built skeleton patterns ─────────────────────────── */

export function KPICardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-[4px] border border-border border-l-4 border-l-border space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function KPIGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-border rounded-[4px] overflow-hidden">
      {/* Header */}
      <div className="bg-celeste-pale px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 flex gap-4 border-t border-border">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="bg-white p-4 rounded-[4px] border border-border flex gap-3">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 flex-1" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <KPIGridSkeleton />
      <FilterBarSkeleton />
      <TableSkeleton />
    </div>
  );
}
