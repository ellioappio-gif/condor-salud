import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock SWR
vi.mock("swr", () => ({
  default: () => ({
    data: {
      alertas: [
        {
          id: "1",
          tipo: "warning",
          titulo: "Alerta 1",
          detalle: "Detalle 1",
          fecha: "2026-04-17",
          acento: "amber",
          read: false,
        },
        {
          id: "2",
          tipo: "info",
          titulo: "Alerta 2",
          detalle: "Detalle 2",
          fecha: "2026-04-16",
          acento: "blue",
          read: true,
        },
      ],
    },
    mutate: vi.fn(),
  }),
}));

// Mock i18n
vi.mock("@/lib/i18n/context", () => ({
  useLocale: () => ({
    locale: "es",
    t: (key: string) => key,
  }),
}));

import NotificationBell from "@/components/NotificationBell";

describe("NotificationBell", () => {
  it("renders bell button with unread count", () => {
    render(<NotificationBell />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-label")).toContain("(1)");
  });

  it("opens dropdown on click", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toBeDefined();
  });

  it("sets aria-expanded when open", () => {
    render(<NotificationBell />);
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("renders alert titles in dropdown", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Alerta 1")).toBeDefined();
    expect(screen.getByText("Alerta 2")).toBeDefined();
  });

  it("shows unread badge for count > 0", () => {
    const { container } = render(<NotificationBell />);
    const badge = container.querySelector("span.bg-red-500");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("1");
  });

  it("closes on Escape key", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toBeDefined();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
