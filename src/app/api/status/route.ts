import { NextResponse } from "next/server";

export const runtime = "edge";

interface ServiceCheck {
  name: string;
  status: "operational" | "degraded" | "down";
  latencyMs: number;
  message?: string;
}

async function checkService(name: string, url: string, timeoutMs = 5000): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    return {
      name,
      status: res.ok ? "operational" : "degraded",
      latencyMs,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      name,
      status: "down",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

/**
 * GET /api/status — detailed health checks for all external services.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const posthogHost = "https://us.i.posthog.com";

  const checks = await Promise.all([
    checkService(
      "Cóndor Salud App",
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://condorsalud.com"}/api/health`,
    ),
    supabaseUrl
      ? checkService("Supabase Database", `${supabaseUrl}/rest/v1/`, 5000)
      : Promise.resolve<ServiceCheck>({
          name: "Supabase Database",
          status: "degraded",
          latencyMs: 0,
          message: "Not configured",
        }),
    checkService("PostHog Analytics", posthogHost, 5000),
    checkService("Vercel Edge", "https://condorsalud.com", 5000),
  ]);

  const overallStatus = checks.every((c) => c.status === "operational")
    ? "operational"
    : checks.some((c) => c.status === "down")
      ? "major_outage"
      : "partial_outage";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: checks,
    },
    {
      status: overallStatus === "operational" ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
