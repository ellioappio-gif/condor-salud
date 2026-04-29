import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit } from "@/lib/security/api-guard";

// GET  /api/patients/[id]/chat  — fetch internal staff messages for this patient
// POST /api/patients/[id]/chat  — post a new message

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const patientId = params.id;
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "100"), 500);

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const sb = supabase as any; // table added in migration 035, types not regenerated yet
    const { data, error } = await sb
      .from("patient_internal_chat")
      .select("id, sender_id, sender_name, sender_role, body, created_at")
      .eq("clinic_id", auth.user.clinicId)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ messages: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "patients_chat");
  if (limited) return limited;

  const patientId = params.id;
  const rawBody = (await req.json().catch(() => ({}))) as { body?: string };
  const text = (rawBody.body ?? "").trim();

  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("patient_internal_chat")
      .insert({
        clinic_id: auth.user.clinicId,
        patient_id: patientId,
        sender_id: auth.user.id,
        sender_name: auth.user.name,
        sender_role: auth.user.role,
        body: text,
      })
      .select("id, sender_id, sender_name, sender_role, body, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ message: data });
  } catch {
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}
