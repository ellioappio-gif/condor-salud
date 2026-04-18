// ─── Patient Documents API ───────────────────────────────────
// GET /api/patients/[id]/documents — list documents
// POST /api/patients/[id]/documents — upload document
// DELETE /api/patients/[id]/documents — delete document

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/env";
import { requireAuth } from "@/lib/security/require-auth";
import { checkRateLimit, logger } from "@/lib/security/api-guard";
import { logAuditEvent } from "@/lib/audit/audit-logger";

const DeleteSchema = z.object({
  documentPath: z.string().min(1),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ documents: [] });
  }

  try {
    const { getServiceClient } = await import("@/lib/supabase/service");
    const sb = getServiceClient();
    const prefix = `patient-documents/${auth.user.clinicId}/${params.id}/`;

    const { data, error } = await sb.storage
      .from("clinical-files")
      .list(prefix, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      logger.error({ error }, "List patient documents failed");
      return NextResponse.json({ documents: [] });
    }

    const documents = (data ?? []).map((f) => ({
      name: f.name,
      path: `${prefix}${f.name}`,
      size: f.metadata?.size,
      createdAt: f.created_at,
      mimeType: f.metadata?.mimetype,
    }));

    return NextResponse.json({ documents });
  } catch (err) {
    logger.error({ err }, "GET /api/patients/[id]/documents failed");
    return NextResponse.json({ error: "Error al listar documentos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const limited = checkRateLimit(req, "patient-docs-upload", { limit: 5, windowSec: 60 });
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Las fotos se pueden adjuntar una vez que la clínica esté configurada.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 20MB limit
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo demasiado grande (máx 20MB)" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "application/dicom"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".dcm")) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Aceptados: PDF, JPG, PNG, DICOM" },
        { status: 400 },
      );
    }

    const { getServiceClient } = await import("@/lib/supabase/service");
    const sb = getServiceClient();
    const path = `patient-documents/${auth.user.clinicId}/${params.id}/${file.name}`;

    const { error } = await sb.storage.from("clinical-files").upload(path, file, { upsert: true });

    if (error) throw error;

    const publicUrl = sb.storage.from("clinical-files").getPublicUrl(path).data.publicUrl;

    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "CREATE",
      resourceType: "patient_document",
      resourceId: params.id,
      newValues: { fileName: file.name, size: file.size },
      requestPath: `/api/patients/${params.id}/documents`,
    });

    return NextResponse.json({ url: publicUrl, path }, { status: 201 });
  } catch (err) {
    logger.error({ err }, "POST /api/patients/[id]/documents failed");
    return NextResponse.json({ error: "Error al subir documento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true });
  }

  try {
    const body = await req.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "documentPath required" }, { status: 400 });
    }

    // Ensure path belongs to this patient + clinic
    const expectedPrefix = `patient-documents/${auth.user.clinicId}/${params.id}/`;
    if (!parsed.data.documentPath.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { getServiceClient } = await import("@/lib/supabase/service");
    const sb = getServiceClient();

    const { error } = await sb.storage.from("clinical-files").remove([parsed.data.documentPath]);

    if (error) throw error;

    await logAuditEvent({
      clinicId: auth.user.clinicId,
      userId: auth.user.id,
      userRole: auth.user.role,
      action: "DELETE",
      resourceType: "patient_document",
      resourceId: params.id,
      newValues: { path: parsed.data.documentPath },
      requestPath: `/api/patients/${params.id}/documents`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "DELETE /api/patients/[id]/documents failed");
    return NextResponse.json({ error: "Error al eliminar documento" }, { status: 500 });
  }
}
