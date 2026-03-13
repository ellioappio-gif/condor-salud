// ─── API Guard ───────────────────────────────────────────────
// Reusable middleware helpers for API route protection.
// Combines rate limiting, input sanitization, and structured logging.

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitHeaders, type RateLimitConfig } from "./rate-limit";
import { sanitize, sanitizeObject } from "./sanitize";
import { logger } from "@/lib/logger";

/** Extract a stable client identifier from the request */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.ip ||
    "unknown"
  );
}

/** Check rate limit and return 429 response if exceeded */
export function checkRateLimit(
  req: NextRequest,
  route: string,
  config?: RateLimitConfig,
): NextResponse | null {
  const ip = getClientIp(req);
  const key = `${route}:${ip}`;
  const result = rateLimit(key, config);

  if (!result.allowed) {
    logger.warn({ route, ip, resetAt: result.resetAt }, "Rate limit exceeded");
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intentá de nuevo en unos minutos." },
      { status: 429, headers: rateLimitHeaders(result) },
    );
  }
  return null;
}

/** Sanitize all string values in a request body */
export function sanitizeBody<T extends Record<string, unknown>>(body: T): T {
  return sanitizeObject(body);
}

/** Sanitize a single string input */
export { sanitize, logger };
