// ─── Rate Limiter ────────────────────────────────────────────
// Uses Upstash Redis in production, falls back to in-memory Map in dev/test.
// S-09: Replaced naive in-memory store with Upstash-backed limiter.

import { logger } from "@/lib/logger";

// ─── Types ───────────────────────────────────────────────────
export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── In-Memory Fallback (dev / test / missing env) ──────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of Array.from(memoryStore.entries())) {
        if (entry.resetAt < now) memoryStore.delete(key);
      }
    },
    5 * 60 * 1000,
  );
}

function memoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, newEntry);
    return { allowed: true, remaining: config.limit - 1, resetAt: newEntry.resetAt };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

// ─── Upstash Redis Limiter (production) ─────────────────────
let upstashLimiter: ((key: string, config: RateLimitConfig) => Promise<RateLimitResult>) | null =
  null;

async function initUpstash(): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) return false;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({ url, token });

    // Cache limiter instances per (limit, window) pair
    const limiters = new Map<string, InstanceType<typeof Ratelimit>>();

    upstashLimiter = async (key: string, config: RateLimitConfig): Promise<RateLimitResult> => {
      const cacheKey = `${config.limit}:${config.windowSec}`;
      let limiter = limiters.get(cacheKey);
      if (!limiter) {
        limiter = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSec} s`),
          analytics: false,
          prefix: "condor_rl",
        });
        limiters.set(cacheKey, limiter);
      }

      const result = await limiter.limit(key);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    };

    logger.info("Rate limiter: Upstash Redis connected");
    return true;
  } catch (err) {
    logger.warn({ err }, "Rate limiter: Upstash init failed, using memory fallback");
    return false;
  }
}

// Eagerly attempt Upstash init (non-blocking)
const upstashReady = initUpstash();

// ─── Public API ──────────────────────────────────────────────

/**
 * Synchronous rate limiter — uses in-memory store.
 * Suitable for middleware and simple route guards.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig = { limit: 10, windowSec: 60 },
): RateLimitResult {
  return memoryRateLimit(key, config);
}

/**
 * Async rate limiter — uses Upstash Redis when available, memory fallback otherwise.
 * Preferred for API route handlers.
 */
export async function rateLimitAsync(
  key: string,
  config: RateLimitConfig = { limit: 10, windowSec: 60 },
): Promise<RateLimitResult> {
  await upstashReady;
  if (upstashLimiter) {
    try {
      return await upstashLimiter(key, config);
    } catch (err) {
      logger.error({ err }, "Upstash rate limit error, falling back to memory");
    }
  }
  return memoryRateLimit(key, config);
}

/** Build standard rate-limit response headers */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
  };
}
