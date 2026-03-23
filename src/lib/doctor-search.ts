/**
 * Doctor Search — Google Places + Web Scraping
 *
 * Uses Google Places API for doctor discovery and website scraping for
 * enrichment (WhatsApp, booking links, insurance, telehealth, etc.).
 *
 * Backend API routes handle Google API calls to keep the API key server-side.
 */

// ── Types ────────────────────────────────────────────────────

export interface SearchDoctor {
  placeId: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number;
  hours: string[];
  isOpenNow: boolean | null;
  photoRef: string | null;
  photoUrl: string | null;
  googleMapsUrl: string | null;
  source: "google_places";

  // From enrichment scraper
  enriched: boolean;
  enrichmentSource: "scrape" | "cache" | "failed" | null;
  whatsapp: string | null;
  whatsappUrl: string | null;
  bookingUrl: string | null;
  bookingType: string | null;
  englishSpeaking: boolean;
  insurances: string[];
  telehealth: boolean;
}

export interface DoctorSearchParams {
  specialty?: string;
  city?: string;
  neighborhood?: string;
  insurance?: string;
  english?: boolean;
  whatsapp?: boolean;
  booking?: boolean;
  telehealth?: boolean;
  nearby?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
}

export interface DoctorSearchResponse {
  doctors: SearchDoctor[];
  total: number;
  query: { specialty: string; city: string; neighborhood?: string };
}

// ── Specialties & Neighborhoods ──────────────────────────────

export const DOCTOR_SPECIALTIES = [
  "Cardiología",
  "Clínica Médica",
  "Dermatología",
  "Endocrinología",
  "Gastroenterología",
  "Ginecología",
  "Kinesiología",
  "Neurología",
  "Nutrición",
  "Odontología",
  "Oftalmología",
  "Oncología",
  "Ortopedia",
  "Pediatría",
  "Psicología",
  "Psiquiatría",
  "Reumatología",
  "Traumatología",
  "Urología",
] as const;

export type DoctorSpecialty = (typeof DOCTOR_SPECIALTIES)[number];

export const BUENOS_AIRES_NEIGHBORHOODS = [
  "Almagro",
  "Balvanera",
  "Barracas",
  "Belgrano",
  "Boedo",
  "Caballito",
  "Chacarita",
  "Coghlan",
  "Colegiales",
  "Constitución",
  "Flores",
  "Floresta",
  "La Boca",
  "La Paternal",
  "Liniers",
  "Microcentro",
  "Montserrat",
  "Nueva Pompeya",
  "Núñez",
  "Palermo",
  "Parque Avellaneda",
  "Parque Chacabuco",
  "Parque Patricios",
  "Puerto Madero",
  "Recoleta",
  "Retiro",
  "Saavedra",
  "San Cristóbal",
  "San Nicolás",
  "San Telmo",
  "Tribunales",
  "Versalles",
  "Villa Crespo",
  "Villa del Parque",
  "Villa Devoto",
  "Villa Lugano",
  "Villa Luro",
  "Villa Ortúzar",
  "Villa Pueyrredón",
  "Villa Real",
  "Villa Riachuelo",
  "Villa Santa Rita",
  "Villa Soldati",
  "Villa Urquiza",
  "Vélez Sársfield",
] as const;

// ── URL Builders ─────────────────────────────────────────────

export function getGoogleMapsSearchUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " Buenos Aires Argentina")}`;
}

export function getGoogleMapsSpecialtyUrl(specialty: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specialty + " Buenos Aires Argentina")}`;
}

export function getGoogleMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

// ── API Client ───────────────────────────────────────────────

export async function searchDoctors(params: DoctorSearchParams): Promise<DoctorSearchResponse> {
  const url = new URL("/api/doctors/search", window.location.origin);

  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => [k, String(v)] as [string, string]);

  entries.forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Búsqueda fallida: ${res.status}`);
  }

  return res.json();
}

export async function getDoctorDetail(placeId: string, specialty?: string): Promise<SearchDoctor> {
  const url = new URL(`/api/doctors/${placeId}`, window.location.origin);
  if (specialty) url.searchParams.set("specialty", specialty);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `Detalle fallido: ${res.status}`);
  }

  return res.json();
}

// ── Configuration check ──────────────────────────────────────

export function isGooglePlacesConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}
