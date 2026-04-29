"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/context";

interface ChatMessage {
  id: string;
  patient_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  body: string;
  created_at: string;
  patient_name?: string;
}

interface ChatPreview {
  patientId: string;
  patientName: string;
  lastMessage: ChatMessage;
  unread: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Track which messages the current session has already seen
const seenMessages = new Set<string>();

export default function MessagesButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data } = useSWR<{ messages: ChatMessage[] }>("/api/messages/recent", fetcher, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
  });

  const messages = useMemo(() => data?.messages ?? [], [data]);

  // Group by patient, pick latest per patient
  const previews: ChatPreview[] = [];
  const seen = new Set<string>();
  for (const msg of messages) {
    if (!seen.has(msg.patient_id)) {
      seen.add(msg.patient_id);
      const isUnread = !seenMessages.has(msg.id) && msg.sender_id !== user?.id;
      previews.push({
        patientId: msg.patient_id,
        patientName: msg.patient_name ?? "Paciente",
        lastMessage: msg,
        unread: isUnread,
      });
    }
  }

  const unreadCount = previews.filter((p) => p.unread).length;

  const markAllSeen = useCallback(() => {
    messages.forEach((m) => seenMessages.add(m.id));
  }, [messages]);

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

  function handleOpen() {
    setOpen(!open);
    if (!open) markAllSeen();
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  const roleColor: Record<string, string> = {
    medico: "text-celeste-dark",
    recepcion: "text-violet-600",
    admin: "text-amber-500",
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-1.5 text-ink-muted hover:text-ink transition rounded-md hover:bg-surface"
        aria-label={`Mensajes (${unreadCount} sin leer)`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <MessageSquare className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Mensajes"
          className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-ink">Chat Interno</span>
            <span className="text-[10px] text-ink-muted">Médicos & Recepción</span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border-light">
            {previews.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-ink-muted">
                Sin mensajes recientes
              </div>
            )}
            {previews.map((p) => (
              <Link
                key={p.patientId}
                href={`/dashboard/pacientes/${p.patientId}?tab=chat`}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-surface transition ${p.unread ? "bg-violet-50/40" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-ink truncate">{p.patientName}</span>
                    <span className="text-[10px] text-ink-muted shrink-0">
                      {timeAgo(p.lastMessage.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-1">
                    <span
                      className={`font-semibold ${roleColor[p.lastMessage.sender_role] ?? "text-ink"}`}
                    >
                      {p.lastMessage.sender_name.split(" ")[0]}:
                    </span>{" "}
                    {p.lastMessage.body}
                  </p>
                </div>
                {p.unread && (
                  <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                )}
              </Link>
            ))}
          </div>

          <Link
            href="/dashboard/pacientes"
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-xs font-semibold text-violet-600 border-t border-border hover:bg-surface transition"
          >
            Ver todos los pacientes →
          </Link>
        </div>
      )}
    </div>
  );
}
