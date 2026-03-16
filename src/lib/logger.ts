// ─── Structured Logger ───────────────────────────────────────
// Enterprise-grade structured JSON logging with pino.
// Outputs structured JSON in production, pretty-prints in development.
//
// Usage:
//   import { logger } from "@/lib/logger";
//   logger.info({ userId: "u123" }, "User logged in");
//   logger.error({ err }, "Failed to process invoice");
//
// Log levels: fatal > error > warn > info > debug > trace

import pino from "pino";

const LOG_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

// ─── Base logger (server-side, Node.js) ──────────────────────
const baseLogger = pino({
  level: LOG_LEVEL,

  // ── Redact sensitive fields ────────────────────────────────
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.dni",
      "*.cuil",
      "*.cuit",
      "email",
      "*.email",
      "phone",
      "*.phone",
      "address",
      "*.address",
      "name",
      "*.name",
      "firstName",
      "*.firstName",
      "lastName",
      "*.lastName",
      "dateOfBirth",
      "*.dateOfBirth",
      "dob",
      "*.dob",
      "ip",
      "*.ip",
    ],
    censor: "[REDACTED]",
  },

  // ── Serializers ────────────────────────────────────────────
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // ── Formatting ─────────────────────────────────────────────
  formatters: {
    level(label: string) {
      return { level: label };
    },
    bindings(bindings: Record<string, unknown>) {
      return {
        service: "condor-salud",
        env: process.env.NODE_ENV || "development",
        ...bindings,
      };
    },
  },

  // ── Timestamp ──────────────────────────────────────────────
  timestamp: pino.stdTimeFunctions.isoTime,

  // ── Pretty print in dev (via transport) ────────────────────
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname,service,env",
      },
    },
  }),
});

// ─── Child loggers for domain modules ────────────────────────
// Create scoped loggers with module context automatically attached.

export const logger = baseLogger;

export const authLogger = baseLogger.child({ module: "auth" });
export const apiLogger = baseLogger.child({ module: "api" });
export const dbLogger = baseLogger.child({ module: "database" });
export const billingLogger = baseLogger.child({ module: "billing" });
export const securityLogger = baseLogger.child({ module: "security" });
export const middlewareLogger = baseLogger.child({ module: "middleware" });

// ─── Client-safe logger ──────────────────────────────────────
// In the browser, pino can't use Node streams. Use a minimal wrapper
// that falls back to console methods but maintains the same interface.
//
// The actual pino logger is tree-shaken out of client bundles because
// it's only imported in server-only files (middleware, API routes, etc.)

export type LogFn = (obj: Record<string, unknown>, msg?: string) => void;

/**
 * Creates a console-based logger for client components.
 * Maintains same API shape as pino for easy migration.
 */
export function createClientLogger(module: string) {
  const prefix = `[${module}]`;

  /** SM-05: Strip PII patterns from logged objects */
  function redactPII(obj: Record<string, unknown>): Record<string, unknown> {
    const redacted = { ...obj };
    const sensitiveKeys = [
      "password",
      "token",
      "email",
      "phone",
      "dni",
      "cuil",
      "cuit",
      "name",
      "address",
      "dateOfBirth",
      "dob",
    ];
    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        redacted[key] = "[REDACTED]";
      }
    }
    return redacted;
  }

  return {
    info: (obj: Record<string, unknown>, msg?: string) => {
      if (process.env.NODE_ENV === "development") {
        console.info(prefix, msg || "", redactPII(obj));
      }
    },
    warn: (obj: Record<string, unknown>, msg?: string) => {
      console.warn(prefix, msg || "", redactPII(obj));
    },
    error: (obj: Record<string, unknown>, msg?: string) => {
      console.error(prefix, msg || "", redactPII(obj));
    },
    debug: (obj: Record<string, unknown>, msg?: string) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(prefix, msg || "", redactPII(obj));
      }
    },
  };
}
