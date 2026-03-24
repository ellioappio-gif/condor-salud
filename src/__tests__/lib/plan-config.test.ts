import { describe, it, expect } from "vitest";
import {
  PRESETS,
  MODULES,
  getModule,
  getPreset,
  calcPresetPrice,
  calcPresetSubtotal,
  calcSubtotal,
  calcTotal,
  formatARS,
  resolveDeps,
  type PresetId,
  type ModuleId,
} from "@/lib/plan-config";

describe("plan-config — modules", () => {
  it("has at least 19 modules defined", () => {
    expect(MODULES.length).toBeGreaterThanOrEqual(19);
  });

  it("every module has required fields", () => {
    for (const m of MODULES) {
      expect(m.id).toBeDefined();
      expect(m.label).toBeDefined();
      expect(m.price).toBeGreaterThanOrEqual(0);
      expect(m.category).toBeDefined();
    }
  });

  it("getModule returns correct module by ID", () => {
    const m = getModule("agenda" as ModuleId);
    expect(m).toBeDefined();
    expect(m.label).toBeDefined();
  });

  it("resolveDeps adds dependencies", () => {
    // Facturacion depends on nomenclador
    const selected: ModuleId[] = ["facturacion" as ModuleId];
    const resolved = resolveDeps(selected);
    expect(resolved.length).toBeGreaterThanOrEqual(selected.length);
  });
});

describe("plan-config — presets", () => {
  it("has 3 presets (basic, plus, enterprise)", () => {
    expect(PRESETS.length).toBe(3);
  });

  it("preset IDs are basic, plus, enterprise", () => {
    const ids = PRESETS.map((p) => p.id);
    expect(ids).toContain("basic");
    expect(ids).toContain("plus");
    expect(ids).toContain("enterprise");
  });

  it("getPreset returns correct preset", () => {
    const p = getPreset("basic");
    expect(p).toBeDefined();
    expect(p!.id).toBe("basic");
  });

  it("getPreset throws for invalid ID", () => {
    expect(() => getPreset("nonexistent" as PresetId)).toThrow("Unknown preset: nonexistent");
  });

  it("basic preset has $50 USD price", () => {
    const p = getPreset("basic");
    expect(p).toBeDefined();
    expect(p!.priceUsd).toBe(50);
  });

  it("plus preset has $120 USD price", () => {
    const p = getPreset("plus");
    expect(p).toBeDefined();
    expect(p!.priceUsd).toBe(120);
  });

  it("enterprise preset has $180 USD price", () => {
    const p = getPreset("enterprise");
    expect(p).toBeDefined();
    expect(p!.priceUsd).toBe(180);
  });

  it("plus preset has a discount", () => {
    const p = getPreset("plus");
    expect(p).toBeDefined();
    expect(p!.discount).toBeGreaterThan(0);
  });

  it("enterprise preset has the largest discount", () => {
    const plus = getPreset("plus");
    const ent = getPreset("enterprise");
    expect(ent!.discount).toBeGreaterThan(plus!.discount);
  });

  it("one preset is marked as popular", () => {
    const popular = PRESETS.filter((p) => p.popular);
    expect(popular.length).toBe(1);
  });

  it("every preset has at least 1 module", () => {
    for (const p of PRESETS) {
      expect(p.modules.length).toBeGreaterThan(0);
    }
  });

  it("enterprise has the most modules", () => {
    const basic = getPreset("basic")!;
    const ent = getPreset("enterprise")!;
    expect(ent.modules.length).toBeGreaterThan(basic.modules.length);
  });
});

describe("plan-config — price calculations", () => {
  it("calcPresetSubtotal returns sum of module prices", () => {
    const preset = getPreset("basic")!;
    const subtotal = calcPresetSubtotal(preset);
    expect(subtotal).toBeGreaterThan(0);
  });

  it("calcPresetPrice applies discount", () => {
    const preset = getPreset("plus")!;
    const subtotal = calcPresetSubtotal(preset);
    const price = calcPresetPrice(preset);
    expect(price).toBeLessThan(subtotal);
  });

  it("formatARS formats correctly with period separator", () => {
    const formatted = formatARS(60000);
    expect(formatted).toContain("$");
    expect(formatted).toContain("60");
  });

  it("calcSubtotal sums selected modules", () => {
    const preset = PRESETS[0];
    expect(preset).toBeDefined();
    const mods: ModuleId[] = preset!.modules;
    const total = calcSubtotal(mods);
    expect(total).toBeGreaterThan(0);
  });

  it("calcTotal applies discount to selected modules", () => {
    const preset = PRESETS[0];
    expect(preset).toBeDefined();
    const mods: ModuleId[] = preset!.modules;
    const subtotal = calcSubtotal(mods);
    const total = calcTotal(mods, 0.1);
    expect(total).toBeLessThan(subtotal);
  });
});
