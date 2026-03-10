// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // ── Performance ─────────────────────────────────────────
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

    // ── Environment ─────────────────────────────────────────
    environment: process.env.NODE_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || "local",

    // ── Filtering ───────────────────────────────────────────
    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
    ],

    // ── Before Send ─────────────────────────────────────────
    beforeSend(event) {
      // Never send PII/health data to Sentry
      if (event.request?.data) {
        event.request.data = "[REDACTED]";
      }
      // Scrub headers that might contain auth tokens
      if (event.request?.headers) {
        const safeHeaders: Record<string, string> = {};
        const allowedHeaders = [
          "user-agent",
          "content-type",
          "accept",
          "referer",
          "x-forwarded-for",
        ];
        for (const key of allowedHeaders) {
          if (event.request.headers[key]) {
            safeHeaders[key] = event.request.headers[key];
          }
        }
        event.request.headers = safeHeaders;
      }
      return event;
    },
  });
}
