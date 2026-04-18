import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// ─── Schema ──────────────────────────────────────────────────
const sendMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

// ─── Demo data ───────────────────────────────────────────────
const DEMO_THREADS = [
  {
    id: "dt-1",
    patientName: "María García",
    patientId: "p-1",
    lastMessage: "Doctor, ya me hice los análisis que me pidió.",
    lastTime: "2025-01-15T14:30:00Z",
    unread: 2,
  },
  {
    id: "dt-2",
    patientName: "Juan Pérez",
    patientId: "p-2",
    lastMessage: "Gracias por la receta, doctor.",
    lastTime: "2025-01-14T10:00:00Z",
    unread: 0,
  },
  {
    id: "dt-3",
    patientName: "Ana Rodríguez",
    patientId: "p-3",
    lastMessage: "¿Puedo tomar ibuprofeno con la medicación actual?",
    lastTime: "2025-01-13T16:45:00Z",
    unread: 1,
  },
];

const DEMO_MESSAGES: Record<
  string,
  Array<{
    id: string;
    from: "doctor" | "patient";
    content: string;
    createdAt: string;
    read: boolean;
  }>
> = {
  "dt-1": [
    {
      id: "dm-1",
      from: "patient",
      content: "Doctor, ya me hice los análisis que me pidió.",
      createdAt: "2025-01-15T10:15:00Z",
      read: true,
    },
    {
      id: "dm-2",
      from: "patient",
      content: "Le adjunto los resultados.",
      createdAt: "2025-01-15T10:16:00Z",
      read: false,
    },
  ],
  "dt-2": [
    {
      id: "dm-3",
      from: "doctor",
      content: "Aquí tiene la receta electrónica.",
      createdAt: "2025-01-14T09:00:00Z",
      read: true,
    },
    {
      id: "dm-4",
      from: "patient",
      content: "Gracias por la receta, doctor.",
      createdAt: "2025-01-14T10:00:00Z",
      read: true,
    },
  ],
  "dt-3": [
    {
      id: "dm-5",
      from: "patient",
      content: "¿Puedo tomar ibuprofeno con la medicación actual?",
      createdAt: "2025-01-13T16:45:00Z",
      read: false,
    },
  ],
};

// ─── GET: List threads or messages for a thread ──────────────
export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.searchParams.get("threadId");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Return demo data for unauthenticated / demo mode
      if (threadId) {
        return NextResponse.json({ messages: DEMO_MESSAGES[threadId] || [] });
      }
      return NextResponse.json({ threads: DEMO_THREADS });
    }

    // Real DB queries
    if (threadId) {
      const { data: messages } = await (supabase as any)
        .from("patient_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      return NextResponse.json({ messages: messages || [] });
    }

    const { data: threads } = await (supabase as any)
      .from("message_threads")
      .select("*")
      .eq("doctor_id", user.id)
      .order("updated_at", { ascending: false });
    return NextResponse.json({ threads: threads || DEMO_THREADS });
  } catch {
    // Fallback to demo
    if (threadId) {
      return NextResponse.json({ messages: DEMO_MESSAGES[threadId] || [] });
    }
    return NextResponse.json({ threads: DEMO_THREADS });
  }
}

// ─── POST: Send a message ────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Demo mode — return fake success
      return NextResponse.json({
        message: {
          id: `demo-${Date.now()}`,
          from: "doctor",
          content: parsed.data.content,
          createdAt: new Date().toISOString(),
          read: true,
        },
      });
    }

    const { data, error } = await (supabase as any)
      .from("patient_messages")
      .insert({
        thread_id: parsed.data.threadId,
        sender_id: user.id,
        sender_type: "doctor",
        content: parsed.data.content,
        patient_id: parsed.data.patientId,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: data });
  } catch {
    return NextResponse.json({ error: "No se pudo enviar el mensaje" }, { status: 500 });
  }
}
