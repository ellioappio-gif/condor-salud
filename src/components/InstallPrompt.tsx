"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA install prompt — shows a bottom banner on mobile when the app is installable.
 * Also registers the service worker on mount.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.info("[SW] registered", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] registration failed", err);
        });
    }
  }, []);

  // Listen for install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setDeferredPrompt(null);
  }, []);

  // Don't show if already installed, dismissed, or no prompt
  if (isInstalled || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96 animate-in slide-in-from-bottom-4">
      <div className="bg-white border border-[#D4E4F0] rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#75AADB]/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-[#75AADB]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A1A]">Instalá Cóndor Salud</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Accedé más rápido desde tu pantalla de inicio. Funciona sin conexión.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 text-xs font-semibold bg-[#75AADB] text-white rounded-lg hover:bg-[#5a8fc0] transition"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-gray-400 hover:text-gray-600 transition"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
