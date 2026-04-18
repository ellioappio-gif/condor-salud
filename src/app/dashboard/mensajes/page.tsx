"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n/context";
import { Send, Search, MessageSquare, ArrowLeft } from "lucide-react";
import useSWR from "swr";

// ─── Types ───────────────────────────────────────────────────
interface Thread {
  id: string;
  patientName: string;
  patientId: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

interface Message {
  id: string;
  from: "doctor" | "patient";
  content: string;
  createdAt: string;
  read: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Component ───────────────────────────────────────────────
export default function DashboardMensajesPage() {
  const { t } = useLocale();
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threadsData } = useSWR("/api/doctors/messages", fetcher, {
    refreshInterval: 30000,
  });
  const threads: Thread[] = threadsData?.threads ?? [];

  const { data: messagesData } = useSWR(
    selectedThread ? `/api/doctors/messages?threadId=${selectedThread.id}` : null,
    fetcher,
  );

  useEffect(() => {
    if (messagesData?.messages) {
      setLocalMessages(messagesData.messages);
    }
  }, [messagesData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const filteredThreads = threads.filter(
    (th) => !search || th.patientName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      from: "doctor",
      content,
      createdAt: new Date().toISOString(),
      read: true,
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    try {
      await fetch("/api/doctors/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: selectedThread.id,
          patientId: selectedThread.patientId,
          content,
        }),
      });
    } catch {
      // Message already shown optimistically
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white border border-border rounded-lg overflow-hidden">
      {/* ─── Thread List ────────────────────────────────── */}
      <div
        className={`w-80 border-r border-border flex flex-col ${
          selectedThread ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-celeste" />
            Mensajes
          </h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Buscar paciente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar paciente"
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-border rounded-[4px] outline-none focus:border-celeste-dark focus:ring-2 focus:ring-celeste-dark/30 bg-white text-ink"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto" role="list" aria-label="Conversaciones">
          {filteredThreads.length === 0 && (
            <div className="p-6 text-center text-sm text-ink-muted">No hay conversaciones</div>
          )}
          {filteredThreads.map((th) => (
            <button
              key={th.id}
              role="listitem"
              onClick={() => setSelectedThread(th)}
              className={`w-full text-left px-4 py-3 border-b border-border-light hover:bg-celeste-pale/30 transition ${
                selectedThread?.id === th.id ? "bg-celeste-pale/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink truncate">{th.patientName}</span>
                <span className="text-[10px] text-ink-muted whitespace-nowrap ml-2">
                  {formatTime(th.lastTime)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-ink-muted truncate pr-2">{th.lastMessage}</span>
                {th.unread > 0 && (
                  <span className="flex-shrink-0 bg-celeste text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {th.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Chat Area ──────────────────────────────────── */}
      <div className={`flex-1 flex flex-col ${!selectedThread ? "hidden md:flex" : "flex"}`}>
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center text-ink-muted">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-border" />
              <p className="text-sm">Seleccione una conversación</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-3">
              <button
                onClick={() => setSelectedThread(null)}
                className="md:hidden text-ink-muted hover:text-ink"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-ink">{selectedThread.patientName}</h3>
                <p className="text-[10px] text-ink-muted">Paciente</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-label="Mensajes">
              {localMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "doctor" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                      msg.from === "doctor"
                        ? "bg-celeste text-white rounded-br-none"
                        : "bg-surface text-ink rounded-bl-none"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.from === "doctor" ? "text-white/70" : "text-ink-muted"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribir mensaje…"
                  aria-label="Escribir mensaje"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded-[4px] outline-none focus:border-celeste-dark focus:ring-2 focus:ring-celeste-dark/30 bg-white text-ink"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-celeste-dark text-white rounded-[4px] hover:bg-celeste transition disabled:opacity-50"
                  aria-label="Enviar mensaje"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
