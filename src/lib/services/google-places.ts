/**
 * Google Places API Service — Server-side only.
 *
 * Wraps Google Places Text Search, Nearby Search, and Place Details.
 * Uses in-memory cache to reduce API calls.
 */

// ── Types ────────────────────────────────────────────────────

export interface PlaceResult {
  placeId: string;
  googleMapsUrl: string | null;
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
  types: string[];
  source: "google_places";
}

// ── Specialty mapping (Spanish → query term) ─────────────────

const SPECIALTY_MAP: Record<string, string> = {
  Cardiología: "cardiólogo",
  Dermatología: "dermatólogo",
  Endocrinología: "endocrinólogo",
  Gastroenterología: "gastroenterólogo",
  Ginecología: "ginecólogo",
  Neurología: "neurólogo",
  Oftalmología: "oftalmólogo",
  Oncología: "oncólogo",
  Ortopedia: "ortopedista",
  Pediatría: "pediatra",
  Psicología: "psicólogo",
  Psiquiatría: "psiquiatra",
  Reumatología: "reumatólogo",
  Traumatología: "traumatólogo",
  Urología: "urólogo",
  "Clínica Médica": "médico clínico",
  Nutrición: "nutricionista",
  Kinesiología: "kinesiólogo",
  Odontología: "odontólogo",
};

const DETAIL_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "geometry",
  "international_phone_number",
  "website",
  "rating",
  "user_ratings_total",
  "opening_hours",
  "photos",
  "types",
  "business_status",
  "url",
].join(",");

// ── In-memory cache ──────────────────────────────────────────

const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = parseInt(process.env.CACHE_TTL_PLACES || "3600") * 1000;

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// ── Service ──────────────────────────────────────────────────

export class GooglePlacesService {
  private apiKey: string;
  private base = "https://maps.googleapis.com/maps/api";

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is required");
    this.apiKey = apiKey;
  }

  /** Text search: returns up to maxResults places for a specialty + city/neighborhood */
  async searchDoctors(opts: {
    specialty: string;
    city?: string;
    neighborhood?: string;
    maxResults?: number;
  }): Promise<PlaceResult[]> {
    const { specialty, city = "Buenos Aires", neighborhood, maxResults = 20 } = opts;
    const term = SPECIALTY_MAP[specialty] || specialty;
    const location = neighborhood ? `${neighborhood}, ${city}` : city;
    const query = `${term} ${location} Argentina`;
    const cacheKey = `search:${query}`;

    const cached = cacheGet<PlaceResult[]>(cacheKey);
    if (cached) return cached;

    const url = new URL(`${this.base}/place/textsearch/json`);
    url.searchParams.set("query", query);
    url.searchParams.set("type", "doctor");
    url.searchParams.set("region", "ar");
    url.searchParams.set("key", this.apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Places API: ${data.status} — ${data.error_message || ""}`);
    }

    const placeIds = (data.results || [])
      .filter((p: { business_status?: string }) => p.business_status !== "CLOSED_PERMANENTLY")
      .slice(0, maxResults)
      .map((p: { place_id: string }) => p.place_id);

    const details = await Promise.allSettled(placeIds.map((id: string) => this.getDetails(id)));
    const resolved = details
      .filter((r): r is PromiseFulfilledResult<PlaceResult> => r.status === "fulfilled")
      .map((r) => r.value);

    cacheSet(cacheKey, resolved);
    return resolved;
  }

  /** Fetch full place details for one place_id */
  async getDetails(placeId: string): Promise<PlaceResult> {
    const cacheKey = `detail:${placeId}`;
    const cached = cacheGet<PlaceResult>(cacheKey);
    if (cached) return cached;

    const url = new URL(`${this.base}/place/details/json`);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", DETAIL_FIELDS);
    url.searchParams.set("language", "es");
    url.searchParams.set("key", this.apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error(`Place details: ${data.status} for ${placeId}`);
    }

    const r = data.result;
    const result: PlaceResult = {
      placeId,
      googleMapsUrl: r.url || null,
      name: r.name,
      address: r.formatted_address,
      lat: r.geometry?.location?.lat || null,
      lng: r.geometry?.location?.lng || null,
      phone: r.international_phone_number || null,
      website: r.website || null,
      rating: r.rating || null,
      reviewCount: r.user_ratings_total || 0,
      hours: r.opening_hours?.weekday_text || [],
      isOpenNow: r.opening_hours?.open_now ?? null,
      photoRef: r.photos?.[0]?.photo_reference || null,
      types: r.types || [],
      source: "google_places",
    };

    cacheSet(cacheKey, result);
    return result;
  }

  /** Nearby search: find doctors within radiusMeters of lat/lng */
  async nearbyDoctors(opts: {
    lat: number;
    lng: number;
    radiusMeters?: number;
    specialty?: string;
  }): Promise<PlaceResult[]> {
    const { lat, lng, radiusMeters = 2000, specialty } = opts;
    const url = new URL(`${this.base}/place/nearbysearch/json`);
    url.searchParams.set("location", `${lat},${lng}`);
    url.searchParams.set("radius", radiusMeters.toString());
    url.searchParams.set("type", "doctor");
    url.searchParams.set("language", "es");
    if (specialty) {
      url.searchParams.set("keyword", SPECIALTY_MAP[specialty] || specialty);
    }
    url.searchParams.set("key", this.apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Nearby search: ${data.status}`);
    }

    const ids = (data.results || [])
      .filter((p: { business_status?: string }) => p.business_status !== "CLOSED_PERMANENTLY")
      .slice(0, 20)
      .map((p: { place_id: string }) => p.place_id);

    const details = await Promise.allSettled(ids.map((id: string) => this.getDetails(id)));
    return details
      .filter((r): r is PromiseFulfilledResult<PlaceResult> => r.status === "fulfilled")
      .map((r) => r.value);
  }

  /** Build a proxied photo URL */
  photoUrl(photoRef: string, maxWidth = 400): string {
    return `/api/photos/${photoRef}?maxwidth=${maxWidth}`;
  }

  /** Fetch a photo from Google (for proxying to client) */
  async fetchPhoto(photoRef: string, maxWidth = 400): Promise<Response> {
    const url = new URL(`${this.base}/place/photo`);
    url.searchParams.set("maxwidth", maxWidth.toString());
    url.searchParams.set("photoreference", photoRef);
    url.searchParams.set("key", this.apiKey);
    return fetch(url.toString());
  }
}
