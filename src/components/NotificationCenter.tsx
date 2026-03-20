"use client";

// ─── Notification Center Dropdown ────────────────────────────
// Replaces the hardcoded bell icon + "5" badge in the dashboard layout.
// Subscribes to real-time alerts from Supabase and shows a dropdown.

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, ExternalLink, X } from "lucide-react";
import { useAlertas } from "@/hooks/use-data";
import type { Alerta } from "@/lib/types";

interface NotifItem {
  id: string;
  tipo: string;
  mensaje: string;
  severidad: "info" | "warning" | "critical";
  leida: boolean;
  fecha: string;
}

function toSeveridad(tipo: Alerta["tipo"]): NotifItem["severidad"] {
  if (tipo === "rechazo" || tipo === "vencimiento") return "warning";
  if (tipo === "inflacion") return "critical";
  return "info";
}

export default function NotificationCenter() {
  const { data: alertas } = useAlertas();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Map alertas to NotifItems
  const items: NotifItem[] = (alertas ?? []).map((a: Alerta) => ({
    id: a.id,
    tipo: a.tipo,
    mensaje: a.detalle || a.titulo,
    severidad: toSeveridad(a.tipo),
    leida: a.read,
    fecha: a.fecha,
  }));

  const unread = items.filter((i) => !i.leida && !dismissed.has(i.id));
  const count = unread.length;

  const markRead = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const markAllRead = useCallback(() => {
    setDismissed(new Set(items.map((i) => i.id)));
  }, [items]);

  const severityColor: Record<string, string> = {
    critical: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={`Notificaciones${count > 0 ? ` (${count} nuevas)` : ""}`}
      >
        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y dark:divide-gray-700">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Bell className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              items.slice(0, 15).map((item) => {
                const isRead = item.leida || dismissed.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      isRead ? "opacity-60" : "bg-blue-50/50 dark:bg-blue-900/10"
                    }`}
                  >
                    <span
                      className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${
                        severityColor[item.severidad] ?? "bg-gray-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                        {item.mensaje}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {item.tipo} · {formatRelative(item.fecha)}
                      </p>
                    </div>
                    {!isRead && (
                      <button
                        onClick={() => markRead(item.id)}
                        className="mt-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Marcar como leída"
                      >
                        <Check className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2.5 dark:border-gray-700">
            <Link
              href="/dashboard/alertas"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Ver todas las alertas
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function formatRelative(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `hace ${days}d`;
    return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}
