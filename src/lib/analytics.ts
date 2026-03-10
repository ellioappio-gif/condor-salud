// ─── Analytics Skeleton ──────────────────────────────────────
// Replace with PostHog, Plausible, or Vercel Analytics when ready.

type EventName =
  | "page_view"
  | "login"
  | "logout"
  | "register"
  | "factura_created"
  | "paciente_created"
  | "turno_created"
  | "rechazo_reprocesado"
  | "verificacion_checked"
  | "reporte_exported"
  | "config_updated"
  | "search_performed"
  | "filter_applied";

interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
}

class Analytics {
  private enabled: boolean;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    this.enabled = typeof window !== "undefined" && process.env.NODE_ENV === "production";
  }

  track(name: EventName, properties?: Record<string, string | number | boolean>) {
    const event: AnalyticsEvent = { name, properties, timestamp: Date.now() };

    if (!this.enabled) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Analytics]", name, properties);
      }
      return;
    }

    this.queue.push(event);
    this.flush();
  }

  identify(userId: string, traits?: Record<string, string>) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[Analytics] identify", userId, traits);
    }
    // TODO: Wire to PostHog/Plausible
  }

  private flush() {
    // TODO: Send queued events to analytics provider
    this.queue = [];
  }
}

export const analytics = new Analytics();
