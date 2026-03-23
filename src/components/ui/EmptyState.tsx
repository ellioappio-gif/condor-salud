import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Quick link-based CTA (rendered as Link) */
  actionLabel?: string;
  actionHref?: string;
  /** Compact variant for inline cards — less vertical padding */
  compact?: boolean;
  className?: string;
}

const DefaultIcon = () => (
  <svg
    className="w-10 h-10 text-ink-muted"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
    />
  </svg>
);

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 px-4" : "py-16 px-6",
        className,
      )}
      role="status"
    >
      <div className={compact ? "mb-3" : "mb-4"} aria-hidden="true">
        {icon || <DefaultIcon />}
      </div>
      <h3 className={cn("font-bold text-ink", compact ? "text-sm" : "text-lg")}>{title}</h3>
      {description && (
        <p
          className={cn(
            "text-ink-muted mt-1 max-w-md leading-relaxed",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
      {!action && actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
