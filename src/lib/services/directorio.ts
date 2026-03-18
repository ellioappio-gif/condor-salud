// ─── Directorio Médico Service Layer ─────────────────────────
// Real Supabase queries with mock fallback when not configured.
// When DOCTORALIAR_CLIENT_ID is set, enriches results with
// Doctoraliar profile URLs and available slots.

import { isSupabaseConfigured } from "@/lib/env";
import {
  isDoctoraliarConfigured,
  getFacilities,
  getDoctors as getDoctoraliarDoctors,
  getDoctoraliarSearchUrl,
  type DoctoraliarDoctor,
} from "@/lib/doctoraliar";
import type { Doctor, DoctorReview } from "@/lib/types";

// ─── Static Data ─────────────────────────────────────────────

export const specialties = [
  "Todas",
  "Cardiología",
  "Clínica médica",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Ginecología",
  "Neurología",
  "Oftalmología",
  "Pediatría",
  "Traumatología",
  "Urología",
];

export const financiadoresOptions = [
  "Todos",
  "PAMI",
  "OSDE",
  "Swiss Medical",
  "IOMA",
  "Galeno",
  "Medifé",
];
export const locationOptions = ["Todas", "CABA", "La Plata", "Rosario", "Córdoba", "Mendoza"];

export const symptomToSpecialty: Record<string, string[]> = {
  "Dolor de espalda": ["Traumatología", "Clínica médica"],
  "Dolor de cabeza": ["Neurología", "Clínica médica"],
  "Problemas de piel": ["Dermatología"],
  "Dolor de pecho": ["Cardiología", "Clínica médica"],
  "Problemas digestivos": ["Gastroenterología", "Clínica médica"],
  "Problemas hormonales": ["Endocrinología"],
  "Control pediátrico": ["Pediatría"],
  "Problemas de visión": ["Oftalmología"],
  "Problemas urinarios": ["Urología"],
  "Control ginecológico": ["Ginecología"],
};

// ─── Mock Data ───────────────────────────────────────────────

const mockDoctors: Doctor[] = [];

const mockReviews: DoctorReview[] = [];

// ─── Service Functions ───────────────────────────────────────

async function getSupabase() {
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

export async function getDoctors(filters?: {
  specialty?: string;
  location?: string;
  financiador?: string;
  search?: string;
}): Promise<Doctor[]> {
  if (!isSupabaseConfigured()) {
    let result = mockDoctors;
    if (filters?.specialty && filters.specialty !== "Todas") {
      result = result.filter((d) => d.specialty === filters.specialty);
    }
    if (filters?.location && filters.location !== "Todas") {
      result = result.filter((d) => d.location === filters.location);
    }
    if (filters?.financiador && filters.financiador !== "Todos") {
      result = result.filter((d) => d.financiadores.includes(filters.financiador!));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (d) => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q),
      );
    }
    return enrichWithDoctoraliar(result);
  }
  try {
    const sb = await getSupabase();
    let query = sb
      .from("doctors")
      .select("*")
      .eq("active", true)
      .order("rating", { ascending: false });
    if (filters?.specialty && filters.specialty !== "Todas") {
      query = query.eq("specialty", filters.specialty);
    }
    if (filters?.location && filters.location !== "Todas") {
      query = query.eq("location", filters.location);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,specialty.ilike.%${filters.search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    let doctors = (data || []).map(mapDoctor);
    if (filters?.financiador && filters.financiador !== "Todos") {
      doctors = doctors.filter((d) => d.financiadores.includes(filters.financiador!));
    }
    return enrichWithDoctoraliar(doctors);
  } catch {
    return enrichWithDoctoraliar(mockDoctors);
  }
}

function mapDoctor(r: Record<string, unknown>): Doctor {
  return {
    id: r.id as string,
    name: r.name as string,
    specialty: r.specialty as string,
    location: r.location as string,
    address: (r.address as string) || "",
    financiadores: (r.financiadores as string[]) || [],
    rating: Number(r.rating) || 0,
    reviews: (r.review_count as number) || 0,
    nextSlot: (r.next_slot as string) || "",
    available: r.available as boolean,
    teleconsulta: r.teleconsulta as boolean,
    experience: (r.experience as string) || "",
    languages: (r.languages as string[]) || ["Español"],
    source: "local",
  };
}

// ─── Doctoraliar Enrichment ──────────────────────────────────

let cachedFacilityId: string | null = null;

/**
 * Resolve the Doctoraliar facility ID.
 * Uses DOCTORALIAR_FACILITY_ID env var when set,
 * otherwise fetches from the API and caches the first result.
 */
async function resolveFacilityId(): Promise<string | null> {
  if (cachedFacilityId) return cachedFacilityId;

  const envId = process.env.DOCTORALIAR_FACILITY_ID;
  if (envId) {
    cachedFacilityId = envId;
    return envId;
  }

  try {
    const facilities = await getFacilities();
    if (facilities.length > 0) {
      cachedFacilityId = facilities[0]!.id;
      return cachedFacilityId;
    }
  } catch {
    // Facility fetch failed — skip enrichment
  }
  return null;
}

/**
 * Map a Doctoraliar API doctor into our Doctor shape.
 */
function mapDoctoraliarDoctor(d: DoctoraliarDoctor): Doctor {
  const fullName = `${d.name} ${d.surname}`.trim();
  const spec = d.specializations?._items?.[0]?.name || "Clínica médica";
  const addr = d.addresses?._items?.[0];

  return {
    id: `da-${d.id}`,
    name: fullName,
    specialty: spec,
    location: addr?.city_name || "",
    address: addr ? `${addr.street}` : "",
    financiadores:
      addr?.insurance_support === "insurance" || addr?.insurance_support === "private_and_insurance"
        ? ["Obra social"]
        : [],
    rating: 0,
    reviews: 0,
    nextSlot: "",
    available: true,
    teleconsulta: addr?.online_only ?? false,
    experience: "",
    languages: ["Español"],
    profileUrl: d.profile_url || getDoctoraliarSearchUrl(fullName),
    source: "doctoraliar",
  };
}

/**
 * Enrich local doctors with Doctoraliar profile URLs.
 * If a local doctor's name fuzzy-matches a Doctoraliar doctor,
 * we attach the profileUrl. Unmatched Doctoraliar doctors are
 * appended at the end.
 */
async function enrichWithDoctoraliar(doctors: Doctor[]): Promise<Doctor[]> {
  if (!isDoctoraliarConfigured()) return doctors;

  try {
    const facilityId = await resolveFacilityId();
    if (!facilityId) return doctors;

    const apiDoctors = await getDoctoraliarDoctors(facilityId, {
      withProfileUrl: true,
      withSpecializations: true,
    });

    // Build a lookup by normalized last name for fuzzy matching
    const normalize = (n: string) =>
      n
        .toLowerCase()
        .replace(/^(dr\.?|dra\.?)\s+/i, "")
        .trim();

    const apiMap = new Map<string, DoctoraliarDoctor>();
    for (const ad of apiDoctors) {
      const key = normalize(`${ad.name} ${ad.surname}`);
      apiMap.set(key, ad);
    }

    const matchedApiIds = new Set<string>();

    // Enrich existing local doctors
    const enriched: Doctor[] = doctors.map((doc) => {
      const key = normalize(doc.name);
      const match = apiMap.get(key);
      if (match) {
        matchedApiIds.add(match.id);
        return {
          ...doc,
          profileUrl: match.profile_url || getDoctoraliarSearchUrl(doc.name),
          source: "doctoraliar" as const,
        };
      }
      // No match — still generate a search URL
      return {
        ...doc,
        profileUrl: getDoctoraliarSearchUrl(doc.name),
        source: "local" as const,
      };
    });

    // Append Doctoraliar-only doctors that have no local match
    for (const ad of apiDoctors) {
      if (!matchedApiIds.has(ad.id)) {
        enriched.push(mapDoctoraliarDoctor(ad));
      }
    }

    return enriched;
  } catch {
    // Enrichment failed — return local doctors with search URLs as fallback
    return doctors.map((d) => ({
      ...d,
      profileUrl: d.profileUrl || getDoctoraliarSearchUrl(d.name),
    }));
  }
}

export async function getDoctorReviews(doctorId: string): Promise<DoctorReview[]> {
  if (!isSupabaseConfigured()) return mockReviews.filter((r) => r.doctorId === doctorId);
  try {
    const sb = await getSupabase();
    const { data, error } = await sb
      .from("doctor_reviews")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("date", { ascending: false })
      .limit(10);
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      doctorId: r.doctor_id,
      patientName: r.patient_name,
      rating: r.rating,
      text: r.text || "",
      date: r.date,
    }));
  } catch {
    return mockReviews.filter((r) => r.doctorId === doctorId);
  }
}

export async function verifyPatientCoverage(
  patientFinanciador: string,
  doctorId: string,
): Promise<{
  covered: boolean;
  coveragePercent: number;
  estimatedCopago: number;
}> {
  // In production, call financiador API
  const doctor = (await getDoctors()).find((d) => d.id === doctorId);
  const covered = doctor?.financiadores.includes(patientFinanciador) ?? false;
  return {
    covered,
    coveragePercent: 0,
    estimatedCopago: 0,
  };
}

export async function getDirectorioKPIs() {
  const doctors = await getDoctors();
  const availableToday = doctors.filter(
    (d) => d.available && d.nextSlot.toLowerCase().startsWith("hoy"),
  ).length;
  return {
    totalDoctors: doctors.length,
    totalSpecialties: new Set(doctors.map((d) => d.specialty)).size,
    availableToday,
    avgRating: (doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length).toFixed(1),
    totalReviews: doctors.reduce((sum, d) => sum + d.reviews, 0),
  };
}
