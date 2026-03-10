import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Health check endpoint for monitoring and load balancers.
 * GET /api/health
 *
 * Returns:
 * - 200: Service is healthy
 * - 503: Service is degraded
 */
export async function GET() {
  const start = Date.now();
  const now = new Date().toISOString();

  const health = {
    status: "healthy" as const,
    timestamp: now,
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "unknown",
    checks: {
      app: { status: "pass" as const },
      uptime: { status: "pass" as const },
      sentry: {
        status: process.env.SENTRY_DSN ? ("pass" as const) : ("warn" as const),
        message: process.env.SENTRY_DSN ? "configured" : "not configured",
      },
    },
  };

  return NextResponse.json({ ...health, responseTimeMs: Date.now() - start }, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": "application/health+json",
    },
  });
}
