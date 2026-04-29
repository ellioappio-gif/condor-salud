import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit } from "@/lib/security/api-guard";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "messages-recent");
  if (limited) return limited;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const db = supabase as unknown as {
      from: (table: string) => { select: (...a: unknown[]) => unknown };
    };

    // Get the 30 most recent chat messages for this clinic,
    // joining patient name from pacientes table
    const { data, error } = await (
      db.from("patient_internal_chat") as ReturnType<typeof supabase.from>
    )
      .from("patient_internal_chat")
      .select(
        `
        id,
        patient_id,
        sender_id,
        sender_name,
        sender_role,
        body,
        created_at,
        pacientes!patient_id ( nombre )
      `,
      )
      .eq("clinic_id", auth.user.clinicId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    const messages = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      patient_id: row.patient_id,
      sender_id: row.sender_id,
      sender_name: row.sender_name,
      sender_role: row.sender_role,
      body: row.body,
      created_at: row.created_at,
      patient_name: (row.pacientes as { nombre?: string } | null)?.nombre ?? "Paciente",
    }));

    return NextResponse.json({ messages });
  } catch (_) {
    return NextResponse.json({ messages: [] });
  }
}
