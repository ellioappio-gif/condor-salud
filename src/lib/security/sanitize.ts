// ─── Input Sanitization ──────────────────────────────────────

/** Strip HTML tags from a string */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Escape HTML entities */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return input.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/** Sanitize user input: trim, strip HTML, limit length */
export function sanitize(input: string, maxLength = 1000): string {
  return stripHtml(input).trim().slice(0, maxLength);
}

/** Sanitize an entire object's string values */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, maxLength = 1000): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === "string") {
      (result as Record<string, unknown>)[key] = sanitize(result[key] as string, maxLength);
    }
  }
  return result;
}
