// ─── Analytics Skeleton ──────────────────────────────────────
// Replace with PostHog, Plausible, or Vercel Analytics when ready.

import { createClientLogger } from "@/lib/logger";

const log = createClientLogger("analytics");

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
        log.debug({ event: name, ...properties }, "Track event");
      }
      return;
    }

    this.queue.push(event);
    this.flush();
  }

  identify(userId: string, traits?: Record<string, string>) {
    if (process.env.NODE_ENV === "development") {
      log.debug({ userId, ...traits }, "Identify user");
    }
    // TODO: Wire to PostHog/Plausible
  }

  private flush() {
    if (this.queue.length === 0) return;
    // TODO: Wire to PostHog/Plausible — for now, log in dev and clear queue
    if (process.env.NODE_ENV === "development") {
      log.debug({ count: this.queue.length }, "Analytics flush (events pending provider)");
    }
    this.queue = [];
  }
}

export const analytics = new Analytics();
