// ─── Notification Center (Bell Dropdown) ─────────────────────
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useLocale } from "@/lib/i18n/context";

interface Alert {
  id: string;
  tipo: string;
  titulo: string;
  detalle: string;
  fecha: string;
  acento: string;
  read: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const { data } = useSWR<{ alertas: Alert[] }>("/api/alertas", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const alertas = data?.alertas ?? [];
  const unreadCount = alertas.filter((a) => !a.read).length;
  const recent = alertas.slice(0, 5);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-ink-muted hover:text-ink transition rounded-md hover:bg-surface"
        aria-label={`${t("aria.notifications") !== "aria.notifications" ? t("aria.notifications") : "Notificaciones"} (${unreadCount})`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notificaciones"
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-ink">
              {t("notifications.title") !== "notifications.title"
                ? t("notifications.title")
                : "Notificaciones"}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-celeste-dark font-medium hover:underline"
              >
                {t("notifications.markAllRead") !== "notifications.markAllRead"
                  ? t("notifications.markAllRead")
                  : "Marcar todo leído"}
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border-light">
            {recent.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-ink-muted">Sin notificaciones</div>
            )}
            {recent.map((a) => (
              <div
                key={a.id}
                className={`px-4 py-3 text-left ${!a.read ? "bg-celeste-pale/30" : ""}`}
              >
                <div className="text-xs font-semibold text-ink leading-snug">{a.titulo}</div>
                <div className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">{a.detalle}</div>
                <div className="text-[10px] text-ink-muted mt-1">{a.fecha}</div>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/alertas"
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-xs font-semibold text-celeste-dark border-t border-border hover:bg-surface transition"
          >
            {t("action.viewAll") !== "action.viewAll" ? t("action.viewAll") : "Ver todas"} →
          </Link>
        </div>
      )}
    </div>
  );
}
