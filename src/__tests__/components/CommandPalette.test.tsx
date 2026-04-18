import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock i18n
vi.mock("@/lib/i18n/context", () => ({
  useLocale: () => ({
    locale: "es",
    t: (key: string) => key,
  }),
}));

// Must import after mocks
import CommandPalette from "@/components/CommandPalette";

describe("CommandPalette", () => {
  it("does not render when closed", () => {
    const { container } = render(<CommandPalette />);
    expect(container.innerHTML).toBe("");
  });

  it("opens on Cmd+K and renders dialog", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("renders search input with combobox role", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders listbox with items", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("filters results by query", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Facturación" } });
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(1);
  });

  it("closes on Escape", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByRole("dialog")).toBeDefined();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("navigates with arrow keys", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    const input = screen.getByRole("combobox");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const options = screen.getAllByRole("option");
    expect(options[1]!.getAttribute("aria-selected")).toBe("true");
  });
});
