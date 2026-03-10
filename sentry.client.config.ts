// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // ── Performance ─────────────────────────────────────────
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // ── Session Replay ──────────────────────────────────────
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // ── Environment ─────────────────────────────────────────
    environment: process.env.NODE_ENV || "development",
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "local",

    // ── Filtering ───────────────────────────────────────────
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "ResizeObserver loop",
      // Network errors (handled by error boundaries)
      "Failed to fetch",
      "Load failed",
      "NetworkError",
      // Next.js hydration (benign)
      "Hydration failed",
      "Text content does not match",
    ],

    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // ── Integrations ────────────────────────────────────────
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
    ],

    // ── Before Send ─────────────────────────────────────────
    beforeSend(event) {
      // Scrub sensitive health data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.url?.includes("/api/")) {
            breadcrumb.data = { ...breadcrumb.data, body: "[REDACTED]" };
          }
          return breadcrumb;
        });
      }
      return event;
    },
  });
}
