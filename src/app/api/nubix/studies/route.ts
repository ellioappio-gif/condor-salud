import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/security/require-auth";
import { isDcm4cheeConfigured, createDCM4CHEEClient } from "@/lib/dcm4chee/client";
import { mapDicomStudyToNubix } from "@/lib/dcm4chee/service";
import { logger } from "@/lib/logger";

// ─── Mock Argentine patient studies for demo mode ────────────
const MOCK_STUDIES = [
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260115.112340",
    patientName: "García, Juan",
    patientId: "20-31456789-0",
    studyDate: "15/01/2026",
    studyDescription: "TC de Tórax con contraste",
    modality: "CT",
    modalitiesInStudy: ["CT"],
    numberOfSeries: 4,
    numberOfInstances: 248,
    accessionNumber: "ACC-2026-0001",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260116.083010",
    patientName: "López, María",
    patientId: "27-28345678-1",
    studyDate: "16/01/2026",
    studyDescription: "RM Cerebro sin contraste",
    modality: "MR",
    modalitiesInStudy: ["MR"],
    numberOfSeries: 6,
    numberOfInstances: 380,
    accessionNumber: "ACC-2026-0002",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260117.094520",
    patientName: "Rodríguez, Carlos",
    patientId: "20-35678901-2",
    studyDate: "17/01/2026",
    studyDescription: "Ecografía Abdominal",
    modality: "US",
    modalitiesInStudy: ["US"],
    numberOfSeries: 2,
    numberOfInstances: 56,
    accessionNumber: "ACC-2026-0003",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260118.101500",
    patientName: "Fernández, Ana",
    patientId: "27-40123456-3",
    studyDate: "18/01/2026",
    studyDescription: "Rx Tórax Frente y Perfil",
    modality: "CR",
    modalitiesInStudy: ["CR"],
    numberOfSeries: 1,
    numberOfInstances: 2,
    accessionNumber: "ACC-2026-0004",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260119.072030",
    patientName: "González, Pedro",
    patientId: "20-29876543-4",
    studyDate: "19/01/2026",
    studyDescription: "Mamografía bilateral",
    modality: "MG",
    modalitiesInStudy: ["MG"],
    numberOfSeries: 4,
    numberOfInstances: 8,
    accessionNumber: "ACC-2026-0005",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260120.143045",
    patientName: "Martínez, Laura",
    patientId: "27-33456789-5",
    studyDate: "20/01/2026",
    studyDescription: "TC Abdomen y Pelvis",
    modality: "CT",
    modalitiesInStudy: ["CT"],
    numberOfSeries: 3,
    numberOfInstances: 412,
    accessionNumber: "ACC-2026-0006",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260121.110015",
    patientName: "Pérez, Diego",
    patientId: "20-37654321-6",
    studyDate: "21/01/2026",
    studyDescription: "Rx Digital Columna Lumbar",
    modality: "DX",
    modalitiesInStudy: ["DX"],
    numberOfSeries: 1,
    numberOfInstances: 3,
    accessionNumber: "ACC-2026-0007",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260122.155530",
    patientName: "Sánchez, Valentina",
    patientId: "27-42345678-7",
    studyDate: "22/01/2026",
    studyDescription: "PET-CT Oncológico",
    modality: "PT",
    modalitiesInStudy: ["PT", "CT"],
    numberOfSeries: 8,
    numberOfInstances: 620,
    accessionNumber: "ACC-2026-0008",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260123.081200",
    patientName: "Alvarez, Martín",
    patientId: "20-26789012-8",
    studyDate: "23/01/2026",
    studyDescription: "Angiografía Coronaria",
    modality: "XA",
    modalitiesInStudy: ["XA"],
    numberOfSeries: 3,
    numberOfInstances: 145,
    accessionNumber: "ACC-2026-0009",
  },
  {
    studyInstanceUID: "1.2.840.113619.2.55.3.604688.20260124.093045",
    patientName: "Torres, Camila",
    patientId: "27-38901234-9",
    studyDate: "24/01/2026",
    studyDescription: "RM Rodilla Derecha",
    modality: "MR",
    modalitiesInStudy: ["MR"],
    numberOfSeries: 5,
    numberOfInstances: 210,
    accessionNumber: "ACC-2026-0010",
  },
];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const patientName = searchParams.get("patientName") ?? "";
  const patientId = searchParams.get("patientId") ?? "";
  const modality = searchParams.get("modality") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? "25"), 100);
  const offset = Number(searchParams.get("offset") ?? "0");

  // ── Demo mode: return mock data, never call dcm4chee ──
  if (!isDcm4cheeConfigured()) {
    let filtered = [...MOCK_STUDIES];
    if (patientName) {
      const q = patientName.toLowerCase();
      filtered = filtered.filter((s) => s.patientName.toLowerCase().includes(q));
    }
    if (patientId) {
      filtered = filtered.filter((s) => s.patientId.includes(patientId));
    }
    if (modality) {
      filtered = filtered.filter((s) => s.modality === modality);
    }
    const total = filtered.length;
    const studies = filtered.slice(offset, offset + limit);
    return NextResponse.json({ studies, total });
  }

  // ── Live mode: proxy QIDO-RS ──
  try {
    const client = createDCM4CHEEClient();
    if (!client) {
      return NextResponse.json({ error: "PACS not configured" }, { status: 503 });
    }

    const dicomStudies = await client.searchStudies({
      patientName: patientName || undefined,
      patientID: patientId || undefined,
      modality: modality || undefined,
      limit,
      offset,
    });

    const studies = dicomStudies.data.map(mapDicomStudyToNubix);
    return NextResponse.json({ studies, total: studies.length });
  } catch (err) {
    logger.error({ err, route: "nubix/studies" }, "QIDO-RS search failed");
    return NextResponse.json({ error: "PACS search failed" }, { status: 502 });
  }
}
