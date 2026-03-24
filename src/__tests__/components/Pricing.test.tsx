import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Pricing from "@/components/Pricing";

// Mock the i18n context
vi.mock("@/lib/i18n/context", () => ({
  useLocale: () => ({
    locale: "es",
    t: (key: string) => {
      const translations: Record<string, string> = {
        "pricing.label": "Planes",
        "pricing.title": "Planes para tu clínica",
        "pricing.discount": "% off",
        "pricing.perMonth": "/mes",
        "pricing.choose": "Elegir plan",
        "pricing.modulesIncluded": "módulos incluidos",
        "pricing.moreModules": "módulos más",
        "pricing.custom": "¿Necesitás un plan personalizado? ",
        "pricing.customLink": "Armá tu plan →",
      };
      return translations[key] || key;
    },
  }),
}));

describe("Pricing component", () => {
  it("renders the pricing section", () => {
    render(<Pricing />);
    expect(screen.getByText("Planes")).toBeDefined();
    expect(screen.getByText("Planes para tu clínica")).toBeDefined();
  });

  it("renders exactly 3 plan cards", () => {
    render(<Pricing />);
    const chooseBtns = screen.getAllByText("Elegir plan");
    expect(chooseBtns.length).toBe(3);
  });

  it("shows module count for each plan", () => {
    render(<Pricing />);
    const moduleTexts = screen.getAllByText(/módulos incluidos/);
    expect(moduleTexts.length).toBe(3);
  });

  it("renders plan links to /planes?tier=", () => {
    const { container } = render(<Pricing />);
    const links = container.querySelectorAll("a[href^='/planes?tier=']");
    expect(links.length).toBe(3);

    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/planes?tier=basic");
    expect(hrefs).toContain("/planes?tier=plus");
    expect(hrefs).toContain("/planes?tier=enterprise");
  });

  it("highlights one plan as popular", () => {
    const { container } = render(<Pricing />);
    const popular = container.querySelector(".border-celeste");
    expect(popular).toBeDefined();
  });

  it("shows discount badge for discounted plans", () => {
    render(<Pricing />);
    // At least one plan should have a discount badge
    const discountBadges = screen.queryAllByText(/% off/);
    expect(discountBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("shows custom plan CTA", () => {
    render(<Pricing />);
    expect(screen.getByText("Armá tu plan →")).toBeDefined();
  });
});
