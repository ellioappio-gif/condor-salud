// ─── Patient-facing Data Service ─────────────────────────────
// Returns data scoped to the authenticated patient.
// When Supabase is configured, queries are filtered by patient ID from auth.
// Otherwise falls back to realistic demo data.

import { isSupabaseConfigured } from "@/lib/env";
import { delay } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────

export interface PatientAppointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: "presencial" | "teleconsulta";
  location: string;
  status: "confirmado" | "pendiente" | "cancelado" | "completado";
}

export interface PatientMedication {
  id: string;
  name: string;
  generic: string;
  dose: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  remaining: number;
  refillable: boolean;
  coverage: string;
  copay: string;
  status: "activo" | "finalizado";
}

export interface PatientMedOrder {
  id: string;
  date: string;
  items: string[];
  total: string;
  status: "entregado" | "en-camino" | "preparando" | "cancelado";
}

export interface PatientVital {
  label: string;
  value: string;
  unit: string;
  trend: "up" | "down" | "stable";
}

export interface PatientAlert {
  id: string;
  text: string;
  type: "warning" | "info";
}

export interface PatientCoverage {
  plan: {
    name: string;
    memberId: string;
    group: string;
    status: string;
    validUntil: string;
    monthlyFee: string;
    lastPayment: string;
    phone: string;
    web: string;
  };
  items: { category: string; coverage: string; copay: string; icon: string; included: boolean }[];
  claims: {
    id: string;
    date: string;
    description: string;
    amount: string;
    status: "aprobado" | "pendiente";
  }[];
  documents: { name: string; type: string }[];
}

export interface TeleAppointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: "disponible" | "completado";
  rating?: number;
}

export interface PatientDoctor {
  id: string;
  name: string;
  specialty: string;
  subspecialty?: string;
  rating: number;
  reviews: number;
  location: string;
  address: string;
  lat: number;
  lng: number;
  availableToday: boolean;
  teleconsulta: boolean;
  education: string;
  insurance: string[];
  nextSlot: string;
  /** Photo URL from Google Places (proxied via /api/photos/) or database */
  photoUrl?: string;
}

export interface PatientProfile {
  name: string;
  email: string;
  phone: string;
  dni: string;
  birthDate: string;
  gender: string;
  address: string;
  city: string;
  bloodType: string;
  insurance: string;
  memberId: string;
  plan: string;
  emergencyContact: string;
  emergencyPhone: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
}

// ─── Booking Types ───────────────────────────────────────────

export interface CreateBookingPayload {
  specialty: string;
  date: string;
  time: string;
  type: "presencial" | "teleconsulta";
  doctorId?: string;
  notes?: string;
  consultationFee?: number; // ARS — if > 0 triggers MercadoPago checkout
}

export interface BookingResponse extends PatientAppointment {
  paymentUrl?: string | null;
}

export interface CancelBookingPayload {
  appointmentId: string;
  reason?: string;
}

// ─── Demo Data ───────────────────────────────────────────────

const SIM_DELAY = process.env.NODE_ENV === "development" ? 120 : 0;

const DEMO_APPOINTMENTS: PatientAppointment[] = [
  {
    id: "a1",
    doctor: "Dra. Laura Méndez",
    specialty: "Clínica Médica",
    date: "2026-03-24",
    time: "10:30",
    type: "presencial",
    location: "Consultorio 3 - Sede Belgrano",
    status: "confirmado",
  },
  {
    id: "a2",
    doctor: "Dr. Carlos Ruiz",
    specialty: "Cardiología",
    date: "2026-03-26",
    time: "15:00",
    type: "teleconsulta",
    location: "Videollamada",
    status: "pendiente",
  },
  {
    id: "a3",
    doctor: "Dra. Sofía Peralta",
    specialty: "Dermatología",
    date: "2026-03-31",
    time: "09:15",
    type: "presencial",
    location: "Consultorio 7 - Sede Palermo",
    status: "confirmado",
  },
  {
    id: "a4",
    doctor: "Dr. Martín Rodríguez",
    specialty: "Clínica Médica",
    date: "2026-02-10",
    time: "11:00",
    type: "presencial",
    location: "Consultorio 3 - Sede Belgrano",
    status: "completado",
  },
  {
    id: "a5",
    doctor: "Dra. Ana Torres",
    specialty: "Ginecología",
    date: "2026-01-22",
    time: "14:30",
    type: "teleconsulta",
    location: "Videollamada",
    status: "completado",
  },
  {
    id: "a6",
    doctor: "Dr. Luis Herrera",
    specialty: "Traumatología",
    date: "2026-01-08",
    time: "16:00",
    type: "presencial",
    location: "Consultorio 5 - Sede Belgrano",
    status: "cancelado",
  },
];

const DEMO_MEDICATIONS: PatientMedication[] = [
  {
    id: "m1",
    name: "Losartán 50mg",
    generic: "Losartán potásico",
    dose: "1 comprimido",
    frequency: "Cada 24 horas - Mañana",
    prescribedBy: "Dra. Laura Méndez",
    startDate: "15/01/2026",
    remaining: 12,
    refillable: true,
    coverage: "70%",
    copay: "$2.100",
    status: "activo",
  },
  {
    id: "m2",
    name: "Metformina 850mg",
    generic: "Metformina clorhidrato",
    dose: "1 comprimido",
    frequency: "Cada 12 horas - Desayuno y cena",
    prescribedBy: "Dra. Laura Méndez",
    startDate: "15/01/2026",
    remaining: 5,
    refillable: true,
    coverage: "70%",
    copay: "$1.800",
    status: "activo",
  },
  {
    id: "m3",
    name: "Atorvastatina 20mg",
    generic: "Atorvastatina cálcica",
    dose: "1 comprimido",
    frequency: "Cada 24 horas - Noche",
    prescribedBy: "Dr. Carlos Ruiz",
    startDate: "01/02/2026",
    remaining: 28,
    refillable: true,
    coverage: "70%",
    copay: "$3.200",
    status: "activo",
  },
  {
    id: "m4",
    name: "Omeprazol 20mg",
    generic: "Omeprazol",
    dose: "1 cápsula",
    frequency: "Cada 24 horas - Antes del desayuno",
    prescribedBy: "Dra. Laura Méndez",
    startDate: "01/01/2026",
    remaining: 0,
    refillable: false,
    coverage: "70%",
    copay: "$950",
    status: "finalizado",
  },
  {
    id: "m5",
    name: "Amoxicilina 500mg",
    generic: "Amoxicilina",
    dose: "1 cápsula",
    frequency: "Cada 8 horas - 7 días",
    prescribedBy: "Dr. Martín Rodríguez",
    startDate: "10/02/2026",
    remaining: 0,
    refillable: false,
    coverage: "100%",
    copay: "$0",
    status: "finalizado",
  },
];

const DEMO_MED_ORDERS: PatientMedOrder[] = [
  {
    id: "o1001",
    date: "10/03/2026",
    items: ["Losartán 50mg x30", "Metformina 850mg x60"],
    total: "$3.900",
    status: "entregado",
  },
  {
    id: "o1002",
    date: "28/02/2026",
    items: ["Atorvastatina 20mg x30"],
    total: "$3.200",
    status: "entregado",
  },
  {
    id: "o1003",
    date: "15/02/2026",
    items: ["Losartán 50mg x30", "Metformina 850mg x60", "Omeprazol 20mg x30"],
    total: "$4.850",
    status: "entregado",
  },
];

const DEMO_VITALS: PatientVital[] = [
  { label: "Presión arterial", value: "120/80", unit: "mmHg", trend: "stable" },
  { label: "Peso", value: "72.5", unit: "kg", trend: "down" },
  { label: "Glucemia", value: "98", unit: "mg/dL", trend: "stable" },
  { label: "Frecuencia cardíaca", value: "68", unit: "bpm", trend: "stable" },
];

const DEMO_ALERTS: PatientAlert[] = [
  { id: "al1", text: "Tu receta de Metformina vence en 5 días", type: "warning" },
  { id: "al2", text: "Recordatorio: análisis de sangre pendiente", type: "info" },
];

const DEMO_COVERAGE: PatientCoverage = {
  plan: {
    name: "OSDE 310",
    memberId: "08-29384756-3",
    group: "Individual",
    status: "Activo",
    validUntil: "31/12/2026",
    monthlyFee: "$185.400",
    lastPayment: "01/03/2026",
    phone: "0800-555-6733",
    web: "www.osde.com.ar",
  },
  items: [
    {
      category: "Consultas médicas",
      coverage: "100%",
      copay: "$0",
      icon: "Stethoscope",
      included: true,
    },
    { category: "Laboratorio", coverage: "100%", copay: "$0", icon: "FileText", included: true },
    {
      category: "Medicamentos PMO",
      coverage: "70%",
      copay: "30% a cargo",
      icon: "Pill",
      included: true,
    },
    { category: "Internación", coverage: "100%", copay: "$0", icon: "Heart", included: true },
    {
      category: "Oftalmología",
      coverage: "100%",
      copay: "Coseguro $3.500",
      icon: "Eye",
      included: true,
    },
    { category: "Maternidad", coverage: "100%", copay: "$0", icon: "Baby", included: true },
    {
      category: "Salud mental",
      coverage: "100%",
      copay: "Coseguro $5.000",
      icon: "Brain",
      included: true,
    },
    {
      category: "Odontología",
      coverage: "50%",
      copay: "50% a cargo",
      icon: "CheckCircle2",
      included: true,
    },
  ],
  claims: [
    {
      id: "c1",
      date: "12/03/2026",
      description: "Consulta - Clínica Médica",
      amount: "$0",
      status: "aprobado",
    },
    {
      id: "c2",
      date: "05/03/2026",
      description: "Laboratorio - Hemograma completo",
      amount: "$0",
      status: "aprobado",
    },
    {
      id: "c3",
      date: "28/02/2026",
      description: "Farmacia - Losartán 50mg",
      amount: "$4.200",
      status: "aprobado",
    },
    {
      id: "c4",
      date: "20/02/2026",
      description: "Consulta - Cardiología",
      amount: "$0",
      status: "aprobado",
    },
    {
      id: "c5",
      date: "15/02/2026",
      description: "Imagen - Eco Doppler",
      amount: "$0",
      status: "pendiente",
    },
  ],
  documents: [
    { name: "Credencial digital", type: "PDF" },
    { name: "Cartilla médica 2026", type: "PDF" },
    { name: "Programa Materno Infantil", type: "PDF" },
    { name: "Vademécum 2026", type: "PDF" },
  ],
};

const DEMO_TELE_APPOINTMENTS: TeleAppointment[] = [
  {
    id: "t1",
    doctor: "Dr. Carlos Ruiz",
    specialty: "Cardiología",
    date: "Mié 26 Mar",
    time: "15:00",
    status: "disponible",
  },
  {
    id: "t2",
    doctor: "Dra. Ana Torres",
    specialty: "Ginecología",
    date: "Vie 28 Mar",
    time: "10:30",
    status: "disponible",
  },
  {
    id: "t3",
    doctor: "Dra. Laura Méndez",
    specialty: "Clínica Médica",
    date: "Lun 10 Mar",
    time: "11:00",
    status: "completado",
    rating: 5,
  },
  {
    id: "t4",
    doctor: "Dr. Pablo Sánchez",
    specialty: "Dermatología",
    date: "Jue 06 Mar",
    time: "16:00",
    status: "completado",
    rating: 4,
  },
];

const DEMO_DOCTORS: PatientDoctor[] = [
  {
    id: "d1",
    name: "Dra. Laura Méndez",
    specialty: "Clínica Médica",
    rating: 4.9,
    reviews: 234,
    location: "Belgrano",
    address: "Av. Cabildo 2040, CABA",
    lat: -34.5605,
    lng: -58.4563,
    availableToday: true,
    teleconsulta: true,
    education: "UBA - Hospital Italiano",
    insurance: ["OSDE", "Swiss Medical", "Galeno"],
    nextSlot: "Hoy 14:30",
  },
  {
    id: "d2",
    name: "Dr. Carlos Ruiz",
    specialty: "Cardiología",
    subspecialty: "Ecocardiografía",
    rating: 4.8,
    reviews: 189,
    location: "Palermo",
    address: "Av. Santa Fe 3200, CABA",
    lat: -34.5875,
    lng: -58.4096,
    availableToday: false,
    teleconsulta: true,
    education: "UBA - Fundación Favaloro",
    insurance: ["OSDE", "Medifé", "Omint"],
    nextSlot: "Mié 15:00",
  },
  {
    id: "d3",
    name: "Dra. Sofía Peralta",
    specialty: "Dermatología",
    subspecialty: "Dermatología estética",
    rating: 4.7,
    reviews: 156,
    location: "Palermo",
    address: "Gorriti 4800, CABA",
    lat: -34.588,
    lng: -58.428,
    availableToday: true,
    teleconsulta: false,
    education: "Hospital de Clínicas",
    insurance: ["OSDE", "Swiss Medical"],
    nextSlot: "Hoy 16:00",
  },
  {
    id: "d4",
    name: "Dr. Martín Rodríguez",
    specialty: "Clínica Médica",
    rating: 4.6,
    reviews: 312,
    location: "Belgrano",
    address: "Av. del Libertador 5800, CABA",
    lat: -34.556,
    lng: -58.452,
    availableToday: true,
    teleconsulta: true,
    education: "UBA - Hospital Austral",
    insurance: ["OSDE", "Galeno", "Medifé", "Swiss Medical"],
    nextSlot: "Hoy 11:00",
  },
  {
    id: "d5",
    name: "Dra. Ana Torres",
    specialty: "Ginecología",
    subspecialty: "Obstetricia",
    rating: 4.9,
    reviews: 278,
    location: "Recoleta",
    address: "Av. Callao 1234, CABA",
    lat: -34.595,
    lng: -58.396,
    availableToday: false,
    teleconsulta: true,
    education: "UBA - Hospital Británico",
    insurance: ["OSDE", "Swiss Medical", "Omint"],
    nextSlot: "Vie 10:30",
  },
  {
    id: "d6",
    name: "Dr. Luis Herrera",
    specialty: "Traumatología",
    subspecialty: "Medicina deportiva",
    rating: 4.5,
    reviews: 98,
    location: "Belgrano",
    address: "Av. Cabildo 1500, CABA",
    lat: -34.564,
    lng: -58.453,
    availableToday: false,
    teleconsulta: false,
    education: "UBA - Hospital Italiano",
    insurance: ["OSDE", "Galeno"],
    nextSlot: "Lun 09:00",
  },
  {
    id: "d7",
    name: "Dr. Pablo Sánchez",
    specialty: "Dermatología",
    rating: 4.8,
    reviews: 145,
    location: "Microcentro",
    address: "Av. Corrientes 800, CABA",
    lat: -34.6041,
    lng: -58.3816,
    availableToday: true,
    teleconsulta: true,
    education: "Hospital de Clínicas",
    insurance: ["OSDE", "Swiss Medical", "Medifé"],
    nextSlot: "Hoy 17:00",
  },
  {
    id: "d8",
    name: "Dra. Valentina Castro",
    specialty: "Pediatría",
    rating: 4.9,
    reviews: 412,
    location: "Caballito",
    address: "Av. Rivadavia 5200, CABA",
    lat: -34.6186,
    lng: -58.4381,
    availableToday: true,
    teleconsulta: true,
    education: "Hospital Garrahan",
    insurance: ["OSDE", "Swiss Medical", "Galeno", "Omint"],
    nextSlot: "Hoy 15:30",
  },
];

const DEMO_PROFILE: PatientProfile = {
  name: "",
  email: "paciente@email.com",
  phone: "+54 11 5555-1234",
  dni: "29.384.756",
  birthDate: "1985-06-15",
  gender: "Femenino",
  address: "Av. Cabildo 2040, 3°B",
  city: "CABA, Buenos Aires",
  bloodType: "A+",
  insurance: "OSDE",
  memberId: "08-29384756-3",
  plan: "310",
  emergencyContact: "Juan Gómez (esposo)",
  emergencyPhone: "+54 11 5555-5678",
  allergies: ["Penicilina", "Mariscos"],
  chronicConditions: ["Hipertensión arterial", "Diabetes tipo 2", "Dislipidemia"],
  currentMedications: ["Losartán 50mg", "Metformina 850mg", "Atorvastatina 20mg"],
};

// ─── Service Functions ───────────────────────────────────────

export async function getMyAppointments(): Promise<PatientAppointment[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return DEMO_APPOINTMENTS;

      const { data: profile } = await sb
        .from("pacientes")
        .select("id")
        .eq("email", user.email ?? "")
        .maybeSingle();
      if (!profile) return DEMO_APPOINTMENTS;

      const { data } = await sb
        .from("turnos")
        .select("*")
        .eq("paciente_id", profile.id)
        .order("fecha", { ascending: false })
        .limit(20);

      if (!data || data.length === 0) return DEMO_APPOINTMENTS;

      return data.map((r) => ({
        id: r.id,
        doctor: r.profesional,
        specialty: r.tipo,
        date: r.fecha,
        time: r.hora,
        type: (r.tipo === "teleconsulta"
          ? "teleconsulta"
          : "presencial") as PatientAppointment["type"],
        location: "",
        status: r.estado as PatientAppointment["status"],
      }));
    } catch {
      return DEMO_APPOINTMENTS;
    }
  }
  await delay(SIM_DELAY);
  return [...DEMO_APPOINTMENTS];
}

export async function getMyMedications(): Promise<PatientMedication[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return DEMO_MEDICATIONS;

      const { data: profile } = await sb
        .from("pacientes")
        .select("id")
        .eq("email", user.email ?? "")
        .maybeSingle();
      if (!profile) return DEMO_MEDICATIONS;

      const { data } = await sb
        .from("prescriptions")
        .select("*")
        .eq("patient_id", profile.id)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) return DEMO_MEDICATIONS;

      // Each prescription has items JSONB array; flatten into medications
      const meds: PatientMedication[] = [];
      for (const rx of data) {
        const items = Array.isArray(rx.items)
          ? (rx.items as Array<{ name?: string; quantity?: number }>)
          : [];
        for (const item of items) {
          meds.push({
            id: `${rx.id}-${item.name ?? ""}`,
            name: String(item.name ?? ""),
            generic: "",
            dose: "",
            frequency: "",
            prescribedBy: rx.doctor_name,
            startDate: rx.date,
            remaining: 0,
            refillable: rx.status === "Pendiente",
            coverage: rx.financiador,
            copay: "",
            status: (rx.status === "Entregado" || rx.status === "Cancelado"
              ? "finalizado"
              : "activo") as PatientMedication["status"],
          });
        }
      }
      return meds.length > 0 ? meds : DEMO_MEDICATIONS;
    } catch {
      return DEMO_MEDICATIONS;
    }
  }
  await delay(SIM_DELAY);
  return [...DEMO_MEDICATIONS];
}

export async function getMyMedOrders(): Promise<PatientMedOrder[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return DEMO_MED_ORDERS;

      const { data } = await sb
        .from("deliveries")
        .select("*")
        .ilike("patient_name", `%${user.email ?? ""}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data || data.length === 0) return DEMO_MED_ORDERS;

      return data.map((r) => ({
        id: r.id,
        date: r.created_at.slice(0, 10),
        items: [`${r.item_count} item(s) — ${r.code}`],
        total: "",
        status: (r.status === "Entregado"
          ? "entregado"
          : r.status === "En camino"
            ? "en camino"
            : "preparando") as PatientMedOrder["status"],
      }));
    } catch {
      return DEMO_MED_ORDERS;
    }
  }
  await delay(SIM_DELAY);
  return [...DEMO_MED_ORDERS];
}

export async function getMyVitals(): Promise<PatientVital[]> {
  // No dedicated vitals table yet — return demo data
  // Future: query clinical_notes or a dedicated signos_vitales table
  if (!isSupabaseConfigured()) await delay(SIM_DELAY);
  return [...DEMO_VITALS];
}

export async function getMyAlerts(): Promise<PatientAlert[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return DEMO_ALERTS;

      const { data } = await sb
        .from("alertas")
        .select("*")
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!data || data.length === 0) return DEMO_ALERTS;

      return data.map((r) => ({
        id: r.id,
        text: r.titulo,
        type: (r.tipo === "rechazo"
          ? "warning"
          : r.tipo === "pago"
            ? "success"
            : "info") as PatientAlert["type"],
      }));
    } catch {
      return DEMO_ALERTS;
    }
  }
  await delay(SIM_DELAY);
  return [...DEMO_ALERTS];
}

export async function getMyCoverage(): Promise<PatientCoverage> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return DEMO_COVERAGE;

      // pacientes table uses generic columns; coverage data comes from financiadores
      // For now return demo coverage as no patient-facing coverage table exists
      return DEMO_COVERAGE;
    } catch {
      return DEMO_COVERAGE;
    }
  }
  await delay(SIM_DELAY);
  return { ...DEMO_COVERAGE };
}

export async function getMyTeleAppointments(): Promise<TeleAppointment[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return DEMO_TELE_APPOINTMENTS;

      const { data: profile } = await sb
        .from("pacientes")
        .select("id")
        .eq("email", user.email ?? "")
        .maybeSingle();
      if (!profile) return DEMO_TELE_APPOINTMENTS;

      const { data } = await sb
        .from("turnos")
        .select("*")
        .eq("paciente_id", profile.id)
        .eq("tipo", "teleconsulta")
        .order("fecha", { ascending: false })
        .limit(10);

      if (!data || data.length === 0) return DEMO_TELE_APPOINTMENTS;

      return data.map((r) => ({
        id: r.id,
        doctor: r.profesional,
        specialty: r.tipo,
        date: r.fecha,
        time: r.hora,
        status: (r.estado === "completado"
          ? "completado"
          : "disponible") as TeleAppointment["status"],
        rating: undefined,
      }));
    } catch {
      return DEMO_TELE_APPOINTMENTS;
    }
  }
  await delay(SIM_DELAY);
  return [...DEMO_TELE_APPOINTMENTS];
}

export async function getDoctorDirectory(): Promise<PatientDoctor[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();

      const { data } = await sb
        .from("doctors")
        .select("*")
        .eq("active", true)
        .order("rating", { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return DEMO_DOCTORS;

      return data.map((r) => {
        // Cast to access optional columns that may not be in generated types yet
        const row = r as Record<string, unknown>;
        return {
          id: r.id,
          name: r.name,
          specialty: r.specialty,
          subspecialty: undefined,
          rating: r.rating,
          reviews: r.review_count,
          location: r.location,
          address: r.address ?? "",
          lat: typeof row.lat === "number" ? row.lat : -34.6037,
          lng: typeof row.lng === "number" ? row.lng : -58.3816,
          availableToday: r.available,
          teleconsulta: r.teleconsulta,
          education: r.experience ?? "",
          insurance: Array.isArray(r.financiadores) ? (r.financiadores as string[]) : [],
          nextSlot: r.next_slot ?? "",
          photoUrl: typeof row.photo_url === "string" ? row.photo_url : undefined,
        };
      });
    } catch {
      return DEMO_DOCTORS;
    }
  }
  await delay(SIM_DELAY);
  return [...DEMO_DOCTORS];
}

export async function getMyProfile(cookieName?: string): Promise<PatientProfile> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return { ...DEMO_PROFILE, name: cookieName ?? "Paciente" };

      // pacientes table has limited columns — return what we can
      // Future: extend pacientes table with full patient profile fields
      return {
        ...DEMO_PROFILE,
        name: cookieName ?? user.email ?? "Paciente",
        email: user.email ?? "",
      };
    } catch {
      return { ...DEMO_PROFILE, name: cookieName ?? "Paciente" };
    }
  }
  await delay(SIM_DELAY);
  return { ...DEMO_PROFILE, name: cookieName ?? "Paciente" };
}

// ─── Booking CRUD ────────────────────────────────────────────

/**
 * Create a new appointment via POST /api/bookings.
 * Returns the created appointment for optimistic SWR updates.
 */
export async function createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
  const res = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error || "Failed to create booking");
  }
  return res.json() as Promise<BookingResponse>;
}

/**
 * Cancel an existing appointment via DELETE /api/bookings.
 */
export async function cancelBooking(appointmentId: string, reason?: string): Promise<void> {
  const res = await fetch("/api/bookings", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appointmentId, reason }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as Record<string, string>).error || "Failed to cancel booking");
  }
}

/**
 * Fetch available time slots for a specialty + date via GET /api/bookings/slots.
 */
export async function getAvailableSlots(specialty: string, date: string): Promise<string[]> {
  const params = new URLSearchParams({ specialty, date });
  const res = await fetch(`/api/bookings/slots?${params}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { slots: string[] };
  return data.slots;
}
