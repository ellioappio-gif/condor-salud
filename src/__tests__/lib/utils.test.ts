import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  capitalize,
  slugify,
  truncate,
  formatCUIT,
  formatDNI,
  generateId,
} from "@/lib/utils";

describe("cn (class name merge)", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "text-sm")).toBe("base text-sm");
  });

  it("merges conflicting tailwind classes", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("formatCurrency", () => {
  it("formats positive amounts", () => {
    const result = formatCurrency(18500);
    expect(result).toContain("18.500");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("formats large amounts", () => {
    const result = formatCurrency(1250000);
    expect(result).toContain("1.250.000");
  });
});

describe("formatNumber", () => {
  it("formats numbers with locale separators", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("formats small numbers", () => {
    expect(formatNumber(42)).toBe("42");
  });
});

describe("formatPercent", () => {
  it("formats with default decimals", () => {
    expect(formatPercent(12.345)).toBe("12.3%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercent(12.345, 2)).toBe("12.35%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-03-08");
    // Date parsing may shift by timezone; just verify it returns a date-like string
    expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
  });
});

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(capitalize("")).toBe("");
  });

  it("handles already capitalized", () => {
    expect(capitalize("Hello")).toBe("Hello");
  });
});

describe("slugify", () => {
  it("converts to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("handles accented characters", () => {
    expect(slugify("Cóndor Salud")).toBe("condor-salud");
  });

  it("removes special characters", () => {
    expect(slugify("Test!@#$%^&*()")).toBe("test");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("This is a very long string", 10)).toBe("This is a …");
  });

  it("does not truncate short strings", () => {
    expect(truncate("Short", 10)).toBe("Short");
  });
});

describe("formatCUIT", () => {
  it("formats 11-digit CUIT", () => {
    expect(formatCUIT("20345678901")).toBe("20-34567890-1");
  });

  it("returns input for invalid CUIT", () => {
    expect(formatCUIT("123")).toBe("123");
  });
});

describe("formatDNI", () => {
  it("formats 8-digit DNI", () => {
    expect(formatDNI("28456789")).toBe("28.456.789");
  });

  it("returns input for short DNI", () => {
    expect(formatDNI("123")).toBe("123");
  });
});

describe("generateId", () => {
  it("generates a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("generates unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
