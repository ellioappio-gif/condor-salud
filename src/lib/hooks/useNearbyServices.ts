// ─── Nearby Services Hook ────────────────────────────────────
// Combines geolocation with service/provider data to return
// results sorted by proximity. Provides distance calculations
// and "near me" filtering for the patient webapp.
//
// Usage:
//   const { services, loading, locationName } = useNearbyServices();

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useGeolocation, type GeoCoords } from "./useGeolocation";

// ─── Types ───────────────────────────────────────────────────

export interface NearbyProvider {
  id: string;
  name: string;
  specialty: string;
  address: string;
  /** Known lat/lng for this provider (null = no geo data) */
  lat: number;
  lng: number;
  /** Distance from user in km (computed at query time) */
  distanceKm: number;
  phone?: string;
  teleconsulta: boolean;
  rating: number;
  availableToday: boolean;
  nextSlot?: string;
}

export interface NearbyPharmacy {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  open24h: boolean;
  hasDelivery: boolean;
}

export interface NearbyCenter {
  id: string;
  name: string;
  type: "hospital" | "clinica" | "laboratorio" | "guardia" | "centro_salud";
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  emergency: boolean;
}

export type NearbyServiceType = "providers" | "pharmacies" | "centers";

export interface NearbyResult {
  providers: NearbyProvider[];
  pharmacies: NearbyPharmacy[];
  centers: NearbyCenter[];
}

export interface UseNearbyServicesReturn {
  /** Nearby results grouped by type */
  results: NearbyResult;
  /** Whether geolocation or data is loading */
  loading: boolean;
  /** Error message (geo or data) */
  error: string | null;
  /** User's resolved neighbourhood/locality */
  locationName: string | null;
  /** Current coordinates */
  coords: GeoCoords | null;
  /** Refresh geolocation and re-sort */
  refresh: () => void;
  /** Max radius in km (default 10) */
  radiusKm: number;
  /** Update search radius */
  setRadiusKm: (km: number) => void;
}

// ─── Haversine distance ──────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Empty fallback arrays (no demo data) ───────────────────
// In production these come from the API / Supabase.

const DEMO_PROVIDERS: Omit<NearbyProvider, "distanceKm">[] = [];

const DEMO_PHARMACIES: Omit<NearbyPharmacy, "distanceKm">[] = [];

const DEMO_CENTERS: Omit<NearbyCenter, "distanceKm">[] = [];

// ─── Reverse geocode (simple) ────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    // Use our API proxy so we don't expose the Google API key
    const res = await fetch(`/api/geolocation?action=reverse-geocode&lat=${lat}&lng=${lng}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.locality ?? null;
  } catch {
    return null;
  }
}

// ─── Fetch nearby places from API (Google Places) ───────────

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  open_now: boolean | null;
}

async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  type: string,
  radiusM: number,
): Promise<PlaceResult[]> {
  try {
    const res = await fetch(
      `/api/geolocation?action=nearby&lat=${lat}&lng=${lng}&type=${type}&radius=${radiusM}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.places ?? [];
  } catch {
    return [];
  }
}

// ─── Hook ────────────────────────────────────────────────────

export function useNearbyServices(): UseNearbyServicesReturn {
  const geo = useGeolocation({ lazy: true });
  const [radiusKm, setRadiusKm] = useState(10);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [apiProviders, setApiProviders] = useState<NearbyProvider[] | null>(null);
  const [apiPharmacies, setApiPharmacies] = useState<NearbyPharmacy[] | null>(null);
  const [apiCenters, setApiCenters] = useState<NearbyCenter[] | null>(null);

  // Resolve locality name when coords change
  const coordLat = geo.coords?.latitude;
  const coordLng = geo.coords?.longitude;

  useEffect(() => {
    if (coordLat == null || coordLng == null) return;
    let cancelled = false;

    reverseGeocode(coordLat, coordLng).then((name) => {
      if (!cancelled && name) setLocationName(name);
    });

    return () => {
      cancelled = true;
    };
  }, [coordLat, coordLng]);

  // Fetch real nearby places from /api/geolocation (Google Places)
  // Falls back to demo data if the API returns empty results
  useEffect(() => {
    if (coordLat == null || coordLng == null) return;
    let cancelled = false;
    const radiusM = Math.min(radiusKm * 1000, 50000);

    Promise.all([
      fetchNearbyPlaces(coordLat, coordLng, "doctor", radiusM),
      fetchNearbyPlaces(coordLat, coordLng, "pharmacy", radiusM),
      fetchNearbyPlaces(coordLat, coordLng, "hospital", radiusM),
    ]).then(([docs, pharms, hosp]) => {
      if (cancelled) return;

      if (docs.length > 0) {
        setApiProviders(
          docs
            .map((p, i) => ({
              id: `api-doc-${i}`,
              name: p.name,
              specialty: "Medicina General",
              address: p.address,
              lat: p.lat,
              lng: p.lng,
              distanceKm: Math.round(haversineKm(coordLat, coordLng, p.lat, p.lng) * 10) / 10,
              teleconsulta: false,
              rating: p.rating ?? 4.0,
              availableToday: p.open_now ?? false,
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm),
        );
      }

      if (pharms.length > 0) {
        setApiPharmacies(
          pharms
            .map((p, i) => ({
              id: `api-pharm-${i}`,
              name: p.name,
              address: p.address,
              lat: p.lat,
              lng: p.lng,
              distanceKm: Math.round(haversineKm(coordLat, coordLng, p.lat, p.lng) * 10) / 10,
              open24h: false,
              hasDelivery: false,
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm),
        );
      }

      if (hosp.length > 0) {
        setApiCenters(
          hosp
            .map((p, i) => ({
              id: `api-ctr-${i}`,
              name: p.name,
              type: (p.types.includes("hospital") ? "hospital" : "clinica") as NearbyCenter["type"],
              address: p.address,
              lat: p.lat,
              lng: p.lng,
              distanceKm: Math.round(haversineKm(coordLat, coordLng, p.lat, p.lng) * 10) / 10,
              emergency: p.types.includes("hospital"),
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [coordLat, coordLng, radiusKm]);

  // Merge API results with demo fallback, sorted by distance
  const results = useMemo<NearbyResult>(() => {
    if (!geo.coords) {
      return { providers: [], pharmacies: [], centers: [] };
    }

    const { latitude: uLat, longitude: uLng } = geo.coords;

    function withDistance<T extends { lat: number; lng: number }>(
      items: Omit<T & { distanceKm: number }, "distanceKm">[],
    ): (T & { distanceKm: number })[] {
      return (items as (T & { distanceKm?: number })[])
        .map((item) => ({
          ...item,
          distanceKm: Math.round(haversineKm(uLat, uLng, item.lat, item.lng) * 10) / 10,
        }))
        .filter((item) => item.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm) as (T & { distanceKm: number })[];
    }

    return {
      providers: apiProviders ?? withDistance<NearbyProvider>(DEMO_PROVIDERS as NearbyProvider[]),
      pharmacies:
        apiPharmacies ?? withDistance<NearbyPharmacy>(DEMO_PHARMACIES as NearbyPharmacy[]),
      centers: apiCenters ?? withDistance<NearbyCenter>(DEMO_CENTERS as NearbyCenter[]),
    };
  }, [geo.coords, radiusKm, apiProviders, apiPharmacies, apiCenters]);

  return {
    results,
    loading: geo.loading,
    error: geo.error,
    locationName,
    coords: geo.coords,
    refresh: geo.refresh,
    radiusKm,
    setRadiusKm,
  };
}

// ─── Distance formatting helper ──────────────────────────────

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
