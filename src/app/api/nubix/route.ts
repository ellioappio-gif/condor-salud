import { NextRequest, NextResponse } from "next/server";
import {
  getNubixStudies,
  getNubixStudy,
  getNubixReport,
  getNubixReports,
  getNubixDeliveries,
  sendNubixResults,
  getNubixViewerConfig,
  getNubixAppointments,
  upsertNubixAppointment,
  getNubixKPIs,
} from "@/lib/services/nubix";
import { checkRateLimit, sanitizeBody, logger } from "@/lib/security/api-guard";
import { requireAuth } from "@/lib/security/require-auth";
import { nubixActionSchema } from "@/lib/validations/schemas";
import type { NubixStudyFilters, NubixAppointmentFilters } from "@/lib/nubix/types";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "studies";

  try {
    switch (resource) {
      case "studies": {
        const filters: NubixStudyFilters = {
          patientName: searchParams.get("patientName") ?? undefined,
          patientDni: searchParams.get("patientDni") ?? undefined,
          modality: (searchParams.get("modality") as NubixStudyFilters["modality"]) ?? undefined,
          specialty: (searchParams.get("specialty") as NubixStudyFilters["specialty"]) ?? undefined,
          status: (searchParams.get("status") as NubixStudyFilters["status"]) ?? undefined,
          financiador: searchParams.get("financiador") ?? undefined,
          dateFrom: searchParams.get("dateFrom") ?? undefined,
          dateTo: searchParams.get("dateTo") ?? undefined,
        };
        return NextResponse.json(await getNubixStudies(filters));
      }

      case "study": {
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing study ID" }, { status: 400 });
        const study = await getNubixStudy(id);
        if (!study) return NextResponse.json({ error: "Study not found" }, { status: 404 });
        return NextResponse.json(study);
      }

      case "report": {
        const studyId = searchParams.get("studyId");
        if (!studyId) return NextResponse.json({ error: "Missing studyId" }, { status: 400 });
        const report = await getNubixReport(studyId);
        if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
        return NextResponse.json(report);
      }

      case "reports":
        return NextResponse.json(await getNubixReports());

      case "deliveries": {
        const studyId = searchParams.get("studyId") ?? undefined;
        return NextResponse.json(await getNubixDeliveries(studyId));
      }

      case "viewer": {
        const studyId = searchParams.get("studyId");
        if (!studyId) return NextResponse.json({ error: "Missing studyId" }, { status: 400 });
        const config = await getNubixViewerConfig(studyId);
        if (!config) return NextResponse.json({ error: "Viewer unavailable" }, { status: 503 });
        return NextResponse.json(config);
      }

      case "appointments": {
        const filters: NubixAppointmentFilters = {
          dateFrom: searchParams.get("dateFrom") ?? undefined,
          dateTo: searchParams.get("dateTo") ?? undefined,
          modality:
            (searchParams.get("modality") as NubixAppointmentFilters["modality"]) ?? undefined,
          status: (searchParams.get("status") as NubixAppointmentFilters["status"]) ?? undefined,
          room: searchParams.get("room") ?? undefined,
        };
        return NextResponse.json(await getNubixAppointments(filters));
      }

      case "kpis":
        return NextResponse.json(await getNubixKPIs());

      default:
        return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "nubix", resource }, "Nubix GET error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  // ── Rate limit: 10 req / 60s per IP ──
  const limited = checkRateLimit(req, "nubix", { limit: 10, windowSec: 60 });
  if (limited) return limited;

  try {
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);

    // ── I-04: Zod validation ──
    const parsed = nubixActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { action } = parsed.data;

    switch (action) {
      case "send-results": {
        const { studyId, channel, recipientContact } = parsed.data;
        const delivery = await sendNubixResults(studyId, channel, recipientContact);
        return NextResponse.json(delivery);
      }

      case "upsert-appointment": {
        const { appointmentId, data } = parsed.data;
        const appointment = await upsertNubixAppointment(data, appointmentId);
        return NextResponse.json(appointment);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    logger.error({ err, route: "nubix" }, "Nubix POST error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
