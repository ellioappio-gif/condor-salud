// ─── CRUD /api/services — Clinic service pricing ─────────────
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";

export const runtime = "nodejs";

/* ── GET — list clinic services ───────────────────────── */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ services: [] });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const sb = createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await sb
    .from("profiles")
    .select("clinic_id")
    .eq("id", user.id)
    .single();

  if (!profile?.clinic_id) return NextResponse.json({ error: "No clinic" }, { status: 404 });

  const { data, error } = await sb
    .from("clinic_services")
    .select("*")
    .eq("clinic_id", profile.clinic_id)
    .order("category")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

/* ── POST — create a service ──────────────────────────── */
export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const sb = createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await sb
    .from("profiles")
    .select("clinic_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.clinic_id) return NextResponse.json({ error: "No clinic" }, { status: 404 });

  if (!["admin", "recepcion"].includes(profile.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, category, price, currency, duration_min, active } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data, error } = await sb
    .from("clinic_services")
    .insert({
      clinic_id: profile.clinic_id,
      name: name.trim(),
      description: description?.trim() || null,
      category: category || "consulta",
      price: Number(price) || 0,
      currency: currency || "ARS",
      duration_min: duration_min ? Number(duration_min) : null,
      active: active !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data }, { status: 201 });
}

/* ── PATCH — update a service ─────────────────────────── */
export async function PATCH(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const sb = createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await sb
    .from("profiles")
    .select("clinic_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.clinic_id) return NextResponse.json({ error: "No clinic" }, { status: 404 });

  if (!["admin", "recepcion"].includes(profile.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Service id required" }, { status: 400 });

  // Sanitize allowed fields
  const allowed: Record<string, unknown> = {};
  if (updates.name !== undefined) allowed.name = String(updates.name).trim();
  if (updates.description !== undefined) allowed.description = updates.description?.trim() || null;
  if (updates.category !== undefined) allowed.category = updates.category;
  if (updates.price !== undefined) allowed.price = Number(updates.price) || 0;
  if (updates.currency !== undefined) allowed.currency = updates.currency;
  if (updates.duration_min !== undefined)
    allowed.duration_min = updates.duration_min ? Number(updates.duration_min) : null;
  if (updates.active !== undefined) allowed.active = Boolean(updates.active);

  const { data, error } = await sb
    .from("clinic_services")
    .update(allowed)
    .eq("id", id)
    .eq("clinic_id", profile.clinic_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}

/* ── DELETE — remove a service ────────────────────────── */
export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const sb = createClient();

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await sb
    .from("profiles")
    .select("clinic_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.clinic_id) return NextResponse.json({ error: "No clinic" }, { status: 404 });

  if (!["admin", "recepcion"].includes(profile.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Service id required" }, { status: 400 });

  const { error } = await sb
    .from("clinic_services")
    .delete()
    .eq("id", id)
    .eq("clinic_id", profile.clinic_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
