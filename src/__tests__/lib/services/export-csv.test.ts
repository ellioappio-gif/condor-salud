import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DOM APIs ───────────────────────────────────────────
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("URL", {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  });
  vi.spyOn(document, "createElement").mockReturnValue({
    href: "",
    download: "",
    click: mockClick,
  } as any);
  vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
  vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);
});

describe("downloadCSV", () => {
  it("generates CSV with correct headers and rows", async () => {
    const { downloadCSV } = await import("@/lib/services/export");
    const rows = [
      { nombre: "PAMI", facturado: 100000, cobrado: 80000 },
      { nombre: "OSDE", facturado: 50000, cobrado: 45000 },
    ];

    downloadCSV(rows, "test-export");

    expect(mockCreateObjectURL).toHaveBeenCalledOnce();
    const blob = (mockCreateObjectURL.mock.calls as unknown[][])[0]![0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/csv;charset=utf-8;");

    const text = await blob.text();
    expect(text).toContain("nombre,facturado,cobrado");
    expect(text).toContain("PAMI,100000,80000");
    expect(text).toContain("OSDE,50000,45000");
    expect(text).toContain("\uFEFF"); // BOM
  });

  it("uses custom column labels when provided", async () => {
    const { downloadCSV } = await import("@/lib/services/export");
    const rows = [{ a: 1, b: 2 }];
    downloadCSV(rows, "custom.csv", [
      { key: "a", label: "Columna A" },
      { key: "b", label: "Columna B" },
    ]);

    const blob = (mockCreateObjectURL.mock.calls as unknown[][])[0]![0] as Blob;
    const text = await blob.text();
    expect(text).toContain("Columna A,Columna B");
  });

  it("escapes fields containing commas and quotes", async () => {
    const { downloadCSV } = await import("@/lib/services/export");
    const rows = [{ name: 'O\'Brien, "Jr."', value: "normal" }];
    downloadCSV(rows, "escape-test");

    const blob = (mockCreateObjectURL.mock.calls as unknown[][])[0]![0] as Blob;
    const text = await blob.text();
    // Field with comma+quotes should be wrapped in quotes with doubled inner quotes
    expect(text).toContain('"O\'Brien, ""Jr."""');
  });

  it("does nothing for empty rows", async () => {
    const { downloadCSV } = await import("@/lib/services/export");
    downloadCSV([], "empty");
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
  });

  it("appends .csv extension if missing", async () => {
    const { downloadCSV } = await import("@/lib/services/export");
    downloadCSV([{ a: 1 }], "no-ext");

    const el = (document.createElement as any).mock.results[0].value;
    expect(el.download).toBe("no-ext.csv");
  });
});
