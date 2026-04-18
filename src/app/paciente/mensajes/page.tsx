"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/context";
import { Send, Paperclip, Search } from "lucide-react";

interface Message {
  id: string;
  from: "patient" | "doctor";
  text: string;
  time: string;
  read: boolean;
}

interface Thread {
  id: string;
  doctorName: string;
  specialty: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

const DEMO_THREADS: Thread[] = [
  {
    id: "T1",
    doctorName: "Dr. Francisco Martínez",
    specialty: "Clínica Médica",
    lastMessage: "Los resultados del laboratorio están dentro de los valores normales.",
    lastTime: "14:30",
    unread: 1,
    messages: [
      {
        id: "m1",
        from: "patient",
        text: "Doctor, ya me hice los análisis que me pidió.",
        time: "10:15",
        read: true,
      },
      { id: "m2", from: "patient", text: "Le adjunto los resultados.", time: "10:16", read: true },
      {
        id: "m3",
        from: "doctor",
        text: "Gracias, los estoy revisando.",
        time: "11:30",
        read: true,
      },
      {
        id: "m4",
        from: "doctor",
        text: "Los resultados del laboratorio están dentro de los valores normales.",
        time: "14:30",
        read: false,
      },
    ],
  },
  {
    id: "T2",
    doctorName: "Dra. Carolina López",
    specialty: "Cardiología",
    lastMessage: "Recuerde tomar la medicación todos los días a la misma hora.",
    lastTime: "Ayer",
    unread: 0,
    messages: [
      {
        id: "m5",
        from: "doctor",
        text: "¿Cómo se ha sentido con la nueva medicación?",
        time: "09:00",
        read: true,
      },
      {
        id: "m6",
        from: "patient",
        text: "Mucho mejor, ya no tengo mareos.",
        time: "09:45",
        read: true,
      },
      {
        id: "m7",
        from: "doctor",
        text: "Recuerde tomar la medicación todos los días a la misma hora.",
        time: "10:00",
        read: true,
      },
    ],
  },
  {
    id: "T3",
    doctorName: "Dr. Alejandro Ruiz",
    specialty: "Traumatología",
    lastMessage: "¿Puede enviarme fotos de la radiografía?",
    lastTime: "Mar",
    unread: 0,
    messages: [
      {
        id: "m8",
        from: "doctor",
        text: "¿Puede enviarme fotos de la radiografía?",
        time: "16:00",
        read: true,
      },
    ],
  },
];

export default function PatientMessagesPage() {
  const { t } = useLocale();
  const [threads] = useState<Thread[]>(DEMO_THREADS);
  const [activeThread, setActiveThread] = useState<Thread | null>(DEMO_THREADS[0] ?? null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");

  const filteredThreads = search
    ? threads.filter((t) => t.doctorName.toLowerCase().includes(search.toLowerCase()))
    : threads;

  const handleSend = () => {
    if (!newMessage.trim() || !activeThread) return;
    // Demo: just clear the input
    setNewMessage("");
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-white border border-border rounded-lg overflow-hidden">
      {/* Thread list */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversación…"
              className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-md outline-none focus:border-celeste-dark"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border-light">
          {filteredThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread)}
              className={`w-full text-left px-4 py-3 transition ${
                activeThread?.id === thread.id ? "bg-celeste-pale/40" : "hover:bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">{thread.doctorName}</span>
                <span className="text-[10px] text-ink-muted">{thread.lastTime}</span>
              </div>
              <div className="text-[10px] text-celeste-dark">{thread.specialty}</div>
              <div className="text-[11px] text-ink-muted mt-1 truncate">{thread.lastMessage}</div>
              {thread.unread > 0 && (
                <span className="inline-block mt-1 w-4 h-4 bg-celeste-dark text-white text-[9px] font-bold rounded-full text-center leading-4">
                  {thread.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {activeThread ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-3 border-b border-border">
            <div className="text-sm font-bold text-ink">{activeThread.doctorName}</div>
            <div className="text-[11px] text-ink-muted">{activeThread.specialty}</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {activeThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.from === "patient"
                      ? "bg-celeste-dark text-white rounded-br-sm"
                      : "bg-surface text-ink rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[10px] mt-1 ${msg.from === "patient" ? "text-white/60" : "text-ink-muted"}`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border flex items-center gap-2">
            <button
              className="p-2 text-ink-muted hover:text-ink transition"
              aria-label="Adjuntar archivo"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribir mensaje…"
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md outline-none focus:border-celeste-dark"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="p-2 bg-celeste-dark text-white rounded-md hover:bg-celeste transition disabled:opacity-50"
              aria-label="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">
          Seleccioná una conversación
        </div>
      )}
    </div>
  );
}
