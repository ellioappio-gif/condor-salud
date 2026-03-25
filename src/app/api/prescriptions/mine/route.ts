import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { isSupabaseConfigured } from "@/lib/env";
import type { DigitalPrescription, PrescriptionMedication } from "@/lib/types";

// GET /api/prescriptions/mine?patientId=xxx — List patient's prescriptions
export async function GET(request: NextRequest) {
  try {
    const patientId = request.nextUrl.searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId is required" }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      // Return demo data for development
      return NextResponse.json({ prescriptions: getDemoPrescriptions(patientId) });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient() as unknown as import("@supabase/supabase-js").SupabaseClient;

    const { data: rxRows, error } = await supabase
      .from("digital_prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("issued_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error({ error }, "Failed to fetch patient prescriptions");
      return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
    }

    // Fetch medications for each prescription
    const prescriptions: DigitalPrescription[] = [];
    for (const row of rxRows || []) {
      const { data: medsData } = await supabase
        .from("prescription_medications")
        .select("*")
        .eq("prescription_id", row.id)
        .order("sort_order");

      prescriptions.push({
        id: row.id,
        clinicId: row.clinic_id || undefined,
        doctorProfileId: row.doctor_profile_id || undefined,
        patientId: row.patient_id,
        patientName: row.patient_name,
        doctorName: row.doctor_name,
        doctorMatricula: row.doctor_matricula || undefined,
        specialty: row.specialty || undefined,
        diagnosis: row.diagnosis || undefined,
        notes: row.notes || undefined,
        verificationToken: row.verification_token,
        status: row.status,
        issuedAt: row.issued_at,
        expiresAt: row.expires_at,
        dispensedAt: row.dispensed_at || undefined,
        dispensedBy: row.dispensed_by || undefined,
        pdfPath: row.pdf_path || undefined,
        createdAt: row.created_at,
        medications: (medsData || []).map(
          (m: Record<string, unknown>): PrescriptionMedication => ({
            id: m.id as string,
            prescriptionId: m.prescription_id as string,
            medicationName: m.medication_name as string,
            dosage: m.dosage as string,
            frequency: m.frequency as string,
            duration: (m.duration as string) || undefined,
            quantity: m.quantity != null ? Number(m.quantity) : undefined,
            notes: (m.notes as string) || undefined,
            sortOrder: (m.sort_order as number) || 0,
          }),
        ),
      });
    }

    return NextResponse.json({ prescriptions });
  } catch (err) {
    logger.error({ err }, "GET /api/prescriptions/mine failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Demo data ───────────────────────────────────────────────
function getDemoPrescriptions(patientId: string): DigitalPrescription[] {
  return [
    {
      id: "rx-demo-1",
      patientId,
      patientName: "Paciente Demo",
      doctorName: "Dr. Martín Rodríguez",
      doctorMatricula: "MN 45821",
      specialty: "Medicina General",
      diagnosis: "Infección respiratoria alta",
      verificationToken: "demo-token-abc123",
      status: "active",
      issuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      medications: [
        {
          id: "med-1",
          prescriptionId: "rx-demo-1",
          medicationName: "Amoxicilina 500mg",
          dosage: "500mg",
          frequency: "Cada 8 horas",
          duration: "7 días",
          quantity: 21,
          sortOrder: 0,
        },
        {
          id: "med-2",
          prescriptionId: "rx-demo-1",
          medicationName: "Ibuprofeno 400mg",
          dosage: "400mg",
          frequency: "Cada 8 horas si hay dolor",
          duration: "5 días",
          quantity: 15,
          sortOrder: 1,
        },
      ],
    },
    {
      id: "rx-demo-2",
      patientId,
      patientName: "Paciente Demo",
      doctorName: "Dra. Laura Fernández",
      doctorMatricula: "MN 67432",
      specialty: "Cardiología",
      diagnosis: "Hipertensión leve",
      verificationToken: "demo-token-def456",
      status: "dispensed",
      issuedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      dispensedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      dispensedBy: "Farmacia del Pueblo",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      medications: [
        {
          id: "med-3",
          prescriptionId: "rx-demo-2",
          medicationName: "Enalapril 10mg",
          dosage: "10mg",
          frequency: "Una vez al día",
          duration: "30 días",
          quantity: 30,
          sortOrder: 0,
        },
      ],
    },
    {
      id: "rx-demo-3",
      patientId,
      patientName: "Paciente Demo",
      doctorName: "Dr. Pablo Giménez",
      specialty: "Traumatología",
      diagnosis: "Contractura cervical",
      verificationToken: "demo-token-ghi789",
      status: "expired",
      issuedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      medications: [
        {
          id: "med-4",
          prescriptionId: "rx-demo-3",
          medicationName: "Diclofenac 75mg",
          dosage: "75mg",
          frequency: "Cada 12 horas",
          duration: "10 días",
          quantity: 20,
          sortOrder: 0,
        },
        {
          id: "med-5",
          prescriptionId: "rx-demo-3",
          medicationName: "Ciclobenzaprina 10mg",
          dosage: "10mg",
          frequency: "Antes de dormir",
          duration: "7 días",
          quantity: 7,
          sortOrder: 1,
        },
      ],
    },
  ];
}
