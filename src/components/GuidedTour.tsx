"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, MousePointer2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

export interface TourStep {
  /** CSS selector or data-tour value to target */
  target: string;
  /** Main instruction text */
  title: string;
  /** Detailed description */
  description: string;
  /** Where to place the tooltip relative to the target */
  placement?: "top" | "bottom" | "left" | "right";
  /** If true, wait for user to click the target before advancing */
  waitForClick?: boolean;
  /** Optional action text for the button (e.g. "Hacer clic aqui") */
  actionLabel?: string;
}

export interface TourConfig {
  id: string;
  name: string;
  steps: TourStep[];
  /** Show this tour only once per user (persisted in localStorage) */
  showOnce?: boolean;
}

interface GuidedTourProps {
  tour: TourConfig;
  active: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────

function getTargetEl(selector: string): HTMLElement | null {
  // First try data-tour attribute
  const byData = document.querySelector(`[data-tour="${selector}"]`) as HTMLElement | null;
  if (byData) return byData;
  // Fallback to CSS selector
  try {
    return document.querySelector(selector) as HTMLElement | null;
  } catch {
    return null;
  }
}

function getPlacement(
  targetRect: DOMRect,
  placement: TourStep["placement"],
): { top: number; left: number; arrowDir: string } {
  const TOOLTIP_W = 340;
  const TOOLTIP_H_ESTIMATE = 160;
  const GAP = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;
  let arrowDir = "top";

  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;

  switch (placement) {
    case "bottom":
      top = targetRect.bottom + GAP;
      left = centerX - TOOLTIP_W / 2;
      arrowDir = "top";
      break;
    case "top":
      top = targetRect.top - TOOLTIP_H_ESTIMATE - GAP;
      left = centerX - TOOLTIP_W / 2;
      arrowDir = "bottom";
      break;
    case "left":
      top = centerY - TOOLTIP_H_ESTIMATE / 2;
      left = targetRect.left - TOOLTIP_W - GAP;
      arrowDir = "right";
      break;
    case "right":
      top = centerY - TOOLTIP_H_ESTIMATE / 2;
      left = targetRect.right + GAP;
      arrowDir = "left";
      break;
    default: {
      // Auto: prefer bottom, then top, then right
      if (targetRect.bottom + TOOLTIP_H_ESTIMATE + GAP < vh) {
        top = targetRect.bottom + GAP;
        left = centerX - TOOLTIP_W / 2;
        arrowDir = "top";
      } else if (targetRect.top - TOOLTIP_H_ESTIMATE - GAP > 0) {
        top = targetRect.top - TOOLTIP_H_ESTIMATE - GAP;
        left = centerX - TOOLTIP_W / 2;
        arrowDir = "bottom";
      } else {
        top = centerY - TOOLTIP_H_ESTIMATE / 2;
        left = targetRect.right + GAP;
        arrowDir = "left";
      }
    }
  }

  // Clamp to viewport
  left = Math.max(12, Math.min(left, vw - TOOLTIP_W - 12));
  top = Math.max(12, Math.min(top, vh - TOOLTIP_H_ESTIMATE - 12));

  return { top, left, arrowDir };
}

// ─── Spotlight Overlay ───────────────────────────────────────

function SpotlightOverlay({ rect }: { rect: DOMRect | null }) {
  if (!rect) return null;

  const pad = 6;
  const r = 8;
  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;

  return (
    <svg
      className="fixed inset-0 z-[9998] pointer-events-none"
      width="100%"
      height="100%"
      style={{ transition: "opacity 200ms" }}
    >
      <defs>
        <mask id="tour-spotlight-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} ry={r} fill="black" />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(0,0,0,0.55)"
        mask="url(#tour-spotlight-mask)"
      />
      {/* Highlight border */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={r}
        ry={r}
        fill="none"
        stroke="#75AADB"
        strokeWidth="2"
        className="animate-pulse"
      />
    </svg>
  );
}

// ─── Animated Cursor ─────────────────────────────────────────

function AnimatedCursor({ targetRect }: { targetRect: DOMRect | null }) {
  if (!targetRect) return null;

  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;

  return (
    <div
      className="fixed z-[10001] pointer-events-none transition-all duration-700 ease-out"
      style={{ left: cx - 8, top: cy - 2 }}
    >
      <MousePointer2
        className="w-6 h-6 text-celeste-dark drop-shadow-lg"
        style={{
          animation: "tour-cursor-bounce 1.2s ease-in-out infinite",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
        }}
      />
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────

interface TooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  position: { top: number; left: number; arrowDir: string };
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  isLast: boolean;
  isFirst: boolean;
}

function Tooltip({
  step,
  stepIndex,
  totalSteps,
  position,
  onNext,
  onPrev,
  onDismiss,
  isLast,
  isFirst,
}: TooltipProps) {
  return (
    <div
      className="fixed z-[10000] w-[340px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        animation: "tour-tooltip-in 300ms ease-out",
      }}
      role="dialog"
      aria-label={step.title}
    >
      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-celeste-dark transition-all duration-300"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-2">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-celeste-dark">
            Paso {stepIndex + 1} de {totalSteps}
          </span>
          <h3 className="text-sm font-bold text-gray-900 mt-1 leading-snug">{step.title}</h3>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 transition -mt-1 -mr-1"
          aria-label="Cerrar guia"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onDismiss}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition"
        >
          Salir de la guia
        </button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Anterior
            </button>
          )}
          <button
            onClick={onNext}
            className="flex items-center gap-1 px-4 py-1.5 text-[11px] font-semibold text-white bg-celeste-dark hover:bg-celeste rounded-lg transition"
          >
            {step.waitForClick
              ? step.actionLabel || "Haz clic en el elemento"
              : isLast
                ? "Finalizar"
                : "Siguiente"}
            {!isLast && !step.waitForClick && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function GuidedTour({ tour, active, onComplete, onDismiss }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, arrowDir: "top" });
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>(0);

  const step = tour.steps[currentStep];

  // Measure and track the target element position
  const updatePosition = useCallback(() => {
    if (!step || !active) return;
    const el = getTargetEl(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      setTooltipPos(getPlacement(rect, step.placement));

      // Scroll into view if needed
      const inView =
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.left >= 0 &&
        rect.right <= window.innerWidth;
      if (!inView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
    rafRef.current = requestAnimationFrame(updatePosition);
  }, [step, active]);

  useEffect(() => {
    if (!active) return;
    setMounted(true);
    rafRef.current = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, updatePosition]);

  // Listen for clicks on the target when waitForClick is set
  useEffect(() => {
    if (!active || !step?.waitForClick) return;
    const el = getTargetEl(step.target);
    if (!el) return;

    const handler = () => {
      setTimeout(() => {
        if (currentStep < tour.steps.length - 1) {
          setCurrentStep((s) => s + 1);
        } else {
          handleComplete();
        }
      }, 300);
    };

    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, step, currentStep]);

  const handleNext = () => {
    if (currentStep < tour.steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleComplete = () => {
    if (tour.showOnce) {
      try {
        localStorage.setItem(`tour_completed_${tour.id}`, "true");
      } catch {
        /* */
      }
    }
    setCurrentStep(0);
    setMounted(false);
    onComplete();
  };

  const handleDismiss = () => {
    if (tour.showOnce) {
      try {
        localStorage.setItem(`tour_completed_${tour.id}`, "true");
      } catch {
        /* */
      }
    }
    setCurrentStep(0);
    setMounted(false);
    onDismiss();
  };

  if (!active || !mounted || !step) return null;

  return createPortal(
    <>
      {/* Click blocker (except on target) */}
      <div
        className="fixed inset-0 z-[9997] cursor-default"
        onClick={(e) => {
          // Allow clicks on the target element when waitForClick
          if (step.waitForClick) {
            const el = getTargetEl(step.target);
            if (el && el.contains(e.target as Node)) return;
          }
          e.stopPropagation();
        }}
      />
      {/* Spotlight */}
      <SpotlightOverlay rect={targetRect} />
      {/* Make the target clickable above the overlay */}
      {targetRect && (
        <div
          className="fixed z-[9999]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            pointerEvents: step.waitForClick ? "auto" : "none",
          }}
        />
      )}
      {/* Animated cursor */}
      <AnimatedCursor targetRect={targetRect} />
      {/* Tooltip */}
      <Tooltip
        step={step}
        stepIndex={currentStep}
        totalSteps={tour.steps.length}
        position={tooltipPos}
        onNext={handleNext}
        onPrev={handlePrev}
        onDismiss={handleDismiss}
        isFirst={currentStep === 0}
        isLast={currentStep === tour.steps.length - 1}
      />
    </>,
    document.body,
  );
}

// ─── Tour CSS (injected once) ────────────────────────────────

export function TourStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes tour-cursor-bounce {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(3px, 5px); }
      }
      @keyframes tour-tooltip-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
      }}
    />
  );
}

// ─── Hook: check if a tour has been completed ────────────────

export function useTourCompleted(tourId: string): boolean {
  const [done, setDone] = useState(true); // Default true to avoid flash
  useEffect(() => {
    try {
      setDone(localStorage.getItem(`tour_completed_${tourId}`) === "true");
    } catch {
      setDone(false);
    }
  }, [tourId]);
  return done;
}

// ─── Welcome Modal ───────────────────────────────────────────

interface WelcomeModalProps {
  open: boolean;
  tourName: string;
  description: string;
  onStart: () => void;
  onSkip: () => void;
}

export function TourWelcomeModal({
  open,
  tourName,
  description,
  onStart,
  onSkip,
}: WelcomeModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onSkip} />
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-label={tourName}
        style={{ animation: "tour-tooltip-in 300ms ease-out" }}
      >
        {/* Header accent */}
        <div className="h-1.5 bg-gradient-to-r from-celeste-dark to-celeste" />

        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-celeste-50 flex items-center justify-center">
              <MousePointer2 className="w-5 h-5 text-celeste-dark" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Guia interactiva</h2>
              <p className="text-xs text-gray-500">{tourName}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">{description}</p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Saltar
            </button>
            <button
              onClick={onStart}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-celeste-dark hover:bg-celeste rounded-lg transition"
            >
              Comenzar guia
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
