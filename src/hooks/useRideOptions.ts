/**
 * useRideOptions — Web hook (ported from Expo/React Native)
 *
 * Uses browser Geolocation API instead of expo-location.
 * Calls the /api/rides/options endpoint.
 */

"use client";

import { useState, useCallback } from "react";

export interface RideOption {
  app: string;
  logo: string;
  color: string;
  textColor?: string;
  deepLink: string;
  webLink: string;
  smartLink: string;
  available: boolean;
  note: string | null;
}

export interface FareEstimate {
  low: number | null;
  high: number | null;
  currency: string;
  duration: number | null;
  distance: number | null;
  display: string | null;
  surge: number | null;
}

export interface RideOptionsResult {
  destination: {
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
  };
  booking: {
    date: string;
    time: string;
    specialty: string;
  };
  fareEstimate: FareEstimate | null;
  options: RideOption[];
}

interface UseRideOptionsReturn {
  rideOptions: RideOptionsResult | null;
  loading: boolean;
  error: string | null;
  fetchOptions: (params: {
    doctorName: string;
    address: string;
    destLat?: number;
    destLng?: number;
    specialty?: string;
    bookingDate?: string;
    bookingTime?: string;
  }) => Promise<void>;
  fetchForBooking: (bookingId: string) => Promise<void>;
}

/** Get patient's current location via browser Geolocation API */
async function getLocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  });
}

export function useRideOptions(): UseRideOptionsReturn {
  const [rideOptions, setRideOptions] = useState<RideOptionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(
    async (params: {
      doctorName: string;
      address: string;
      destLat?: number;
      destLng?: number;
      specialty?: string;
      bookingDate?: string;
      bookingTime?: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const userLoc = await getLocation();

        const query = new URLSearchParams({
          doctorName: params.doctorName,
          address: params.address,
          ...(params.destLat && { destLat: String(params.destLat) }),
          ...(params.destLng && { destLng: String(params.destLng) }),
          ...(userLoc && { pickupLat: String(userLoc.lat), pickupLng: String(userLoc.lng) }),
          ...(params.specialty && { specialty: params.specialty }),
          ...(params.bookingDate && { bookingDate: params.bookingDate }),
          ...(params.bookingTime && { bookingTime: params.bookingTime }),
        });

        const res = await fetch(`/api/rides/options?${query}`);
        if (!res.ok) throw new Error("No se pudieron cargar las opciones de transporte");

        const data = await res.json();
        setRideOptions(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchForBooking = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rides/options/booking/${bookingId}`);
      if (!res.ok) throw new Error("No se pudieron cargar las opciones de transporte");

      const data = await res.json();
      setRideOptions(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  return { rideOptions, loading, error, fetchOptions, fetchForBooking };
}
