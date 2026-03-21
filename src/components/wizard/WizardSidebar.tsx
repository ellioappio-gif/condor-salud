"use client";

import { useWizard, WIZARD_STEPS, WIZARD_ICON_MAP } from "./WizardData";

export function WizardSidebar() {
  const { currentStep, goTo, completedSteps } = useWizard();

  return (
    <nav
      className="w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-5"
      aria-label="Pasos del asistente"
    >
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">
        Configuración inicial
      </h2>

      <ul className="space-y-1">
        {WIZARD_STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = completedSteps.has(idx);
          const Icon = WIZARD_ICON_MAP[step.icon];

          return (
            <li key={step.id}>
              <button
                onClick={() => goTo(idx)}
                className={`
                  group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all
                  ${
                    isActive
                      ? "bg-celeste-50 font-semibold text-celeste-700 ring-1 ring-celeste-200"
                      : isCompleted
                        ? "text-gray-600 hover:bg-gray-50"
                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }
                `}
                aria-current={isActive ? "step" : undefined}
              >
                {/* Step number / check */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {isCompleted && !isActive ? (
                    <svg
                      className="h-4 w-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span
                      className={`text-xs font-bold ${isActive ? "text-celeste-700" : "text-gray-400"}`}
                    >
                      {idx + 1}
                    </span>
                  )}
                </span>

                {/* Label */}
                <div className="min-w-0">
                  <span className="block truncate">{step.title}</span>
                </div>

                {/* Icon */}
                {Icon && (
                  <Icon
                    className={`ml-auto h-4 w-4 shrink-0 ${isActive ? "text-celeste-500" : "text-gray-300"}`}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
