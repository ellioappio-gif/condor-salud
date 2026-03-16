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

/** SM-06: Recursively sanitize all string values in an object (deep) */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, maxLength = 1000): T {
  const result = { ...obj };
  for (const key in result) {
    const val = result[key];
    if (typeof val === "string") {
      (result as Record<string, unknown>)[key] = sanitize(val, maxLength);
    } else if (Array.isArray(val)) {
      (result as Record<string, unknown>)[key] = val.map((item) =>
        typeof item === "string"
          ? sanitize(item, maxLength)
          : item && typeof item === "object"
            ? sanitizeObject(item as Record<string, unknown>, maxLength)
            : item,
      );
    } else if (val && typeof val === "object") {
      (result as Record<string, unknown>)[key] = sanitizeObject(
        val as Record<string, unknown>,
        maxLength,
      );
    }
  }
  return result;
}
