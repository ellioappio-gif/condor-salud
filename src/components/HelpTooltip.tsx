"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X } from "lucide-react";

interface HelpTooltipProps {
  content: string;
  learnMoreHref?: string;
  position?: "top" | "right" | "bottom" | "left";
}

export function HelpTooltip({ content, learnMoreHref, position = "top" }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const positionClasses: Record<string, string> = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    right: "left-full ml-2 top-0",
    left: "right-full mr-2 top-0",
  };

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Ayuda"
        className="text-ink-muted hover:text-ink transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {open && (
        <div
          className={`absolute z-50 w-64 bg-ink text-white text-sm rounded-xl p-3 shadow-xl ${positionClasses[position]}`}
          role="tooltip"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="leading-relaxed text-xs">{content}</p>
            <button onClick={() => setOpen(false)} className="flex-shrink-0 mt-0.5">
              <X className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
          {learnMoreHref && (
            <a
              href={learnMoreHref}
              className="text-celeste text-xs mt-2 block hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Saber más →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
