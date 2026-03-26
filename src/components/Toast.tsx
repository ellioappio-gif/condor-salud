"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastVariant = "success" | "error" | "warning" | "info" | "default";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: "bg-ink text-white",
  success: "bg-green-700 text-white",
  error: "bg-red-700 text-white",
  warning: "bg-amber-600 text-white",
  info: "bg-celeste-dark text-white",
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  default: "text-celeste-light",
  success: "text-green-200",
  error: "text-red-200",
  warning: "text-amber-200",
  info: "text-celeste-200",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "default") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, variant }]);
      const timeout = variant === "error" ? 6000 : 2500;
      setTimeout(() => removeToast(id), timeout);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — A-05: aria-live region */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto ${VARIANT_STYLES[toast.variant]} text-xs font-semibold px-5 py-3 rounded-lg shadow-lg animate-toast flex items-center gap-2`}
          >
            <svg
              className={`w-4 h-4 ${VARIANT_ICON_COLOR[toast.variant]}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
              />
            </svg>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
