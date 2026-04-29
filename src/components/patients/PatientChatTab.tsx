"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { useToast } from "@/components/Toast";
import { Send, Loader2, MessageSquare, Stethoscope, UserCheck } from "lucide-react";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  body: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  medico: "Médico",
  recepcion: "Recepción",
  enfermero: "Enfermero",
  staff: "Staff",
};

const ROLE_COLORS: Record<string, string> = {
  medico: "bg-celeste-dark text-white",
  recepcion: "bg-violet-600 text-white",
  admin: "bg-amber-500 text-white",
  enfermero: "bg-emerald-600 text-white",
  staff: "bg-slate-500 text-white",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return isToday
    ? d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) +
        " " +
        d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function PatientChatTab({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}/chat?limit=200`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch (_) {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 15s for new messages
    const interval = setInterval(fetchMessages, 15_000);
    return () => clearInterval(interval);
  }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      sender_id: user?.id ?? "",
      sender_name: user?.name ?? "Yo",
      sender_role: user?.role ?? "staff",
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    try {
      const res = await fetch(`/api/patients/${patientId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Replace optimistic with real message
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
    } catch (_) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      showToast("Error al enviar mensaje", "error");
      setText(body);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className="bg-white border border-border rounded-xl overflow-hidden flex flex-col"
      style={{ height: "520px" }}
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border bg-surface/40 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-celeste-dark" />
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
          Chat Interno del Equipo
        </h3>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-ink/50">Actualiza cada 15s</span>
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-celeste-dark" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-7 h-7 text-ink/20" />
              <UserCheck className="w-7 h-7 text-ink/20" />
            </div>
            <p className="text-sm font-medium text-ink/40">Sin mensajes aún</p>
            <p className="text-xs text-ink/30 mt-1">
              Médicos y recepción pueden comunicarse aquí sobre este paciente.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div
                  className={`flex items-center gap-1.5 mb-0.5 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLORS[msg.sender_role] ?? "bg-slate-500 text-white"}`}
                  >
                    {ROLE_LABELS[msg.sender_role] ?? msg.sender_role}
                  </span>
                  <span className="text-[10px] font-semibold text-ink/60">{msg.sender_name}</span>
                  <span className="text-[9px] text-ink/30">{formatTime(msg.created_at)}</span>
                </div>
                <div
                  className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    isMe
                      ? "bg-celeste-dark text-white rounded-tr-sm"
                      : "bg-surface text-ink rounded-tl-sm border border-border"
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-border bg-surface/30">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
            className="flex-1 px-3 py-2 text-sm border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-celeste/40 max-h-32"
            style={{ minHeight: "38px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-9 h-9 flex items-center justify-center bg-celeste-dark text-white rounded-xl hover:bg-celeste transition disabled:opacity-40 shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
