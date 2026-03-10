import { describe, it, expect } from "vitest";
import { createClientLogger } from "@/lib/logger";

describe("createClientLogger", () => {
  it("creates a logger with all methods", () => {
    const log = createClientLogger("test-module");
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.debug).toBe("function");
  });

  it("does not throw when calling log methods", () => {
    const log = createClientLogger("test");
    expect(() => log.info({ key: "val" }, "test message")).not.toThrow();
    expect(() => log.warn({ key: "val" }, "warn message")).not.toThrow();
    expect(() => log.error({ key: "val" }, "error message")).not.toThrow();
    expect(() => log.debug({ key: "val" }, "debug message")).not.toThrow();
  });

  it("works without a message parameter", () => {
    const log = createClientLogger("test");
    expect(() => log.info({ action: "click" })).not.toThrow();
  });
});
