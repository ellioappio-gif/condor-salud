// ── CRUD /api/receipts — Billing receipts with line items ─────
// Service-role client (RLS bypass) + requireAuth for authentication.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/service";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit } from "@/lib/security/api-guard";

export const runtime = "nodejs";

const ReceiptItemSchema = z.object({
  service_id: z.string().optional().nullable(),
  service_name: z.string().min(1).default("Servicio"),
  category: z.string().optional().nullable(),
  unit_price: z.number().min(0),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().max(500).optional().nullable(),
});

const CreateReceiptSchema = z.object({
  patient_id: z.string().min(1, "patient_id is required"),
  items: z.array(ReceiptItemSchema).min(1, "At least one item required"),
  payment_method: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  discount: z.number().min(0).default(0),
  status: z.string().optional(),
});

/* ── Auth helper ──────────────────────────────────────── */
async function authorize(req: NextRequest, roles?: string[]) {
  const auth = await requireAuth(req);
  if (!auth.error) {
    if (roles && !roles.includes(auth.user.role)) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { clinicId: auth.user.clinicId, userId: auth.user.id };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const anonSb = createClient();
    const {
      data: { user },
    } = await anonSb.auth.getUser();
    if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

    const sb = getServiceClient();
    const { data: profile } = await sb
      .from("profiles")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) {
      return { error: NextResponse.json({ error: "No clinic" }, { status: 404 }) };
    }
    if (roles && !roles.includes(profile.role)) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { clinicId: profile.clinic_id, userId: user.id };
  } catch {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

/* ── GET — list receipts (optionally filtered by patient) ── */
export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ receipts: [] });
  }

  const auth = await authorize(req);
  if ("error" in auth) return auth.error;

  const patientId = req.nextUrl.searchParams.get("patient_id");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "100"), 500);

  const sb = getServiceClient();
  let query = sb
    .from("receipts")
    .select(
      `*, receipt_items(id, service_id, service_name, category, unit_price, quantity, subtotal, notes)`,
    )
    .eq("clinic_id", auth.clinicId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach patient name for display
  const patientIds = Array.from(new Set((data ?? []).map((r: any) => r.patient_id)));
  let patientNames: Record<string, string> = {};
  if (patientIds.length > 0) {
    const { data: patients } = await sb
      .from("pacientes")
      .select("id, nombre, dni")
      .in("id", patientIds);
    if (patients) {
      patientNames = Object.fromEntries(patients.map((p: any) => [p.id, `${p.nombre} (${p.dni})`]));
    }
  }

  const enriched = (data ?? []).map((r: any) => ({
    ...r,
    patient_display: patientNames[r.patient_id] ?? r.patient_id,
  }));

  return NextResponse.json({ receipts: enriched });
}

/* ── POST — create a receipt with line items ──────────── */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const limited = checkRateLimit(req, "receipts-write", { limit: 20, windowSec: 60 });
  if (limited) return limited;

  const auth = await authorize(req, ["admin", "recepcion", "medico"]);
  if ("error" in auth) return auth.error;

  const rawBody = await req.json();
  const parsed = CreateReceiptSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { patient_id, items, payment_method, notes, discount, status } = parsed.data;

  // Calculate totals
  const lineItems = items.map((item: any) => ({
    service_id: item.service_id || null,
    service_name: item.service_name || "Servicio",
    category: item.category || null,
    unit_price: Number(item.unit_price) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1),
    subtotal: (Number(item.unit_price) || 0) * Math.max(1, Number(item.quantity) || 1),
    notes: item.notes?.trim() || null,
  }));

  const subtotal = lineItems.reduce((sum: number, li: any) => sum + li.subtotal, 0);
  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const sb = getServiceClient();

  // Create receipt
  const { data: receipt, error: receiptErr } = await sb
    .from("receipts")
    .insert({
      clinic_id: auth.clinicId,
      patient_id,
      status: status || "completed",
      subtotal,
      discount: discountAmount,
      total,
      currency: "ARS",
      payment_method: payment_method || null,
      notes: notes?.trim() || null,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (receiptErr) {
    return NextResponse.json({ error: receiptErr.message }, { status: 500 });
  }

  // Insert line items
  const itemRows = lineItems.map((li: any) => ({
    receipt_id: receipt.id,
    ...li,
  }));

  const { error: itemsErr } = await sb.from("receipt_items").insert(itemRows);

  if (itemsErr) {
    // Rollback receipt if items fail
    await sb.from("receipts").delete().eq("id", receipt.id);
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // Fetch full receipt with items
  const { data: full } = await sb
    .from("receipts")
    .select(
      `*, receipt_items(id, service_id, service_name, category, unit_price, quantity, subtotal, notes)`,
    )
    .eq("id", receipt.id)
    .single();

  return NextResponse.json({ receipt: full }, { status: 201 });
}

/* ── PATCH — update receipt status or notes ───────────── */
export async function PATCH(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = await authorize(req, ["admin", "recepcion"]);
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Receipt id required" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  if (updates.status !== undefined) allowed.status = updates.status;
  if (updates.notes !== undefined) allowed.notes = updates.notes?.trim() || null;
  if (updates.payment_method !== undefined) allowed.payment_method = updates.payment_method;

  const sb = getServiceClient();
  const { data, error } = await sb
    .from("receipts")
    .update(allowed)
    .eq("id", id)
    .eq("clinic_id", auth.clinicId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipt: data });
}
