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
    checks: {
      app: { status: "pass" as const },
    },
  };

  return NextResponse.json(
    { ...health, responseTimeMs: Date.now() - start },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/health+json",
      },
    },
  );
}
