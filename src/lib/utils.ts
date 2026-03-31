import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ─── Class name merge utility ────────────────────────────────
// Merges Tailwind CSS classes with clsx + tailwind-merge
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Currency formatter (ARS) ────────────────────────────────
const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const arsFormatterDecimals = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number, decimals = false): string {
  return decimals ? arsFormatterDecimals.format(amount) : arsFormatter.format(amount);
}

// ─── Number formatter ────────────────────────────────────────
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

// ─── Percentage formatter ────────────────────────────────────
export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

// ─── Date formatters ─────────────────────────────────────────
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateLong(date: string | Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelative(date: string | Date, locale: "es" | "en" = "es"): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const labels =
    locale === "en"
      ? {
          now: "Now",
          m: (n: number) => `${n}m ago`,
          h: (n: number) => `${n}h ago`,
          d: (n: number) => `${n}d ago`,
        }
      : {
          now: "Ahora",
          m: (n: number) => `Hace ${n}m`,
          h: (n: number) => `Hace ${n}h`,
          d: (n: number) => `Hace ${n}d`,
        };

  if (diffMins < 1) return labels.now;
  if (diffMins < 60) return labels.m(diffMins);
  if (diffHours < 24) return labels.h(diffHours);
  if (diffDays < 7) return labels.d(diffDays);
  return formatDate(date);
}

// ─── String utilities ────────────────────────────────────────
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function truncate(s: string, length: number): string {
  return s.length > length ? s.slice(0, length) + "…" : s;
}

// ─── CUIT formatter ──────────────────────────────────────────
export function formatCUIT(cuit: string): string {
  const clean = cuit.replace(/\D/g, "");
  if (clean.length !== 11) return cuit;
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`;
}

/**
 * Validate an Argentine CUIT/CUIL using the módulo-11 algorithm.
 * @param cuit — raw or formatted CUIT (e.g. "20-12345678-9" or "20123456789")
 * @returns true if the CUIT passes the check-digit validation
 */
export function validateCUIT(cuit: string): boolean {
  const clean = cuit.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  // Valid type prefixes
  const tipo = parseInt(clean.slice(0, 2), 10);
  if (![20, 23, 24, 25, 27, 30, 33, 34].includes(tipo)) return false;
  // Módulo 11
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights[i]!;
  }
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  return parseInt(clean.charAt(10), 10) === checkDigit;
}

// ─── DNI formatter ───────────────────────────────────────────
export function formatDNI(dni: string): string {
  const clean = dni.replace(/\D/g, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Validate an Argentine DNI (7 or 8 digits, reasonable range).
 */
export function validateDNI(dni: string): boolean {
  const clean = dni.replace(/\D/g, "");
  if (clean.length < 7 || clean.length > 8) return false;
  const num = parseInt(clean, 10);
  return num >= 1_000_000 && num <= 99_999_999;
}

/**
 * Validate an Argentine phone number (10 digits without country code, or 13 with +54).
 * Accepts formats: 1155140371, +5491155140371, 011-5514-0371, etc.
 */
export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-()]/g, "");
  // With country code
  if (/^\+?549?\d{10}$/.test(clean)) return true;
  // Without country code (10 digits)
  if (/^\d{10}$/.test(clean)) return true;
  return false;
}

// ─── Delay (for demo simulations) ───────────────────────────
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Generate demo ID ────────────────────────────────────────
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 11);
}

// ─── WhatsApp contact ────────────────────────────────────────
export const WHATSAPP_NUMBER = "5491155140371";

/** Build a wa.me deep-link with an optional pre-filled message */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
