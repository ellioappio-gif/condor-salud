"use client";

import { useWizard } from "./WizardData";

export function WizardNavigation() {
  const { currentStep, totalSteps, canPrev, canNext, prev, next } = useWizard();
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Previous */}
        <button
          onClick={prev}
          disabled={!canPrev}
          className={`
            flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all
            ${
              canPrev
                ? "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                : "cursor-not-allowed text-gray-300"
            }
          `}
          aria-label="Paso anterior"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Anterior
        </button>

        {/* Step indicator */}
        <span className="text-xs font-medium text-ink-muted">
          Paso {currentStep + 1} de {totalSteps}
        </span>

        {/* Next (hidden on last step — activation button is in step content) */}
        {!isLast ? (
          <button
            onClick={next}
            disabled={!canNext}
            className="flex items-center gap-2 rounded-[4px] bg-celeste-dark px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-celeste-700 active:bg-celeste-800 disabled:opacity-50"
            aria-label="Siguiente paso"
          >
            Siguiente
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
