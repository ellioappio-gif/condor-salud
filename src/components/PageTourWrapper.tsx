"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  GuidedTour,
  TourStyles,
  TourWelcomeModal,
  useTourCompleted,
} from "@/components/GuidedTour";
import type { TourConfig } from "@/components/GuidedTour";
import {
  TOUR_ADD_PATIENT,
  TOUR_SCHEDULE_APPOINTMENT,
  TOUR_ONLINE_BOOKINGS,
  TOUR_AVAILABILITY,
} from "@/lib/tours";

// Map routes to their corresponding tour
const ROUTE_TOUR_MAP: Record<string, TourConfig> = {
  "/dashboard/pacientes": TOUR_ADD_PATIENT,
  "/dashboard/agenda": TOUR_SCHEDULE_APPOINTMENT,
  "/dashboard/turnos-online": TOUR_ONLINE_BOOKINGS,
  "/dashboard/disponibilidad": TOUR_AVAILABILITY,
};

const TOUR_DESCRIPTIONS: Record<string, string> = {
  "recepcion-add-patient":
    "Te vamos a mostrar paso a paso como registrar pacientes nuevos y gestionar las consultas que llegan.",
  "recepcion-schedule-appointment":
    "Te vamos a mostrar como agendar turnos, usar la vista semanal y filtrar por profesional.",
  "recepcion-online-bookings":
    "Te vamos a mostrar como gestionar los turnos que los pacientes sacan por internet.",
  "recepcion-availability":
    "Te vamos a mostrar como ver y modificar la disponibilidad horaria de cada profesional.",
};

// Roles that should see the guided tour on first visit
const TOUR_ROLES = ["recepcion"];

export function PageTourWrapper() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const tour = ROUTE_TOUR_MAP[pathname] ?? null;
  const tourDone = useTourCompleted(tour?.id ?? "");
  const [showWelcome, setShowWelcome] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [ready, setReady] = useState(false);

  // Wait for page elements to render before showing tour
  useEffect(() => {
    if (!tour || isLoading || !user) return;
    if (!TOUR_ROLES.includes(user.role ?? "")) return;
    if (tourDone) return;

    // Delay to let page elements mount
    const timer = setTimeout(() => {
      setReady(true);
      setShowWelcome(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [tour, isLoading, user, tourDone]);

  // Listen for manual trigger from sidebar button
  useEffect(() => {
    if (!tour) return;
    const handler = () => {
      // Clear completed flag
      try {
        localStorage.removeItem(`tour_completed_${tour.id}`);
      } catch {
        /* */
      }
      setReady(true);
      setShowWelcome(true);
    };
    window.addEventListener("trigger-tour", handler);
    return () => window.removeEventListener("trigger-tour", handler);
  }, [tour]);

  // Reset state on route change
  useEffect(() => {
    setShowWelcome(false);
    setTourActive(false);
    setReady(false);
  }, [pathname]);

  if (!tour || !ready) return <TourStyles />;

  return (
    <>
      <TourStyles />
      <TourWelcomeModal
        open={showWelcome && !tourActive}
        tourName={tour.name}
        description={TOUR_DESCRIPTIONS[tour.id] ?? "Te vamos a guiar paso a paso."}
        onStart={() => {
          setShowWelcome(false);
          setTourActive(true);
        }}
        onSkip={() => {
          setShowWelcome(false);
          // Mark as done so it doesn't show again
          try {
            localStorage.setItem(`tour_completed_${tour.id}`, "true");
          } catch {
            /* */
          }
        }}
      />
      <GuidedTour
        tour={tour}
        active={tourActive}
        onComplete={() => setTourActive(false)}
        onDismiss={() => setTourActive(false)}
      />
    </>
  );
}

// Hook to programmatically trigger a tour (for sidebar button)
export function useTriggerTour() {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);
  const [active, setActive] = useState(false);

  const trigger = (tourConfig: TourConfig) => {
    // Clear the completed flag so it plays again
    try {
      localStorage.removeItem(`tour_completed_${tourConfig.id}`);
    } catch {
      /* */
    }
    setActiveTour(tourConfig);
    setActive(true);
  };

  const element = activeTour ? (
    <>
      <TourStyles />
      <GuidedTour
        tour={activeTour}
        active={active}
        onComplete={() => {
          setActive(false);
          setActiveTour(null);
        }}
        onDismiss={() => {
          setActive(false);
          setActiveTour(null);
        }}
      />
    </>
  ) : null;

  return { trigger, element };
}
