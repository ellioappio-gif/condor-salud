import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the initial value when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", "hello"));
    expect(result.current[0]).toBe("hello");
  });

  it("reads existing value from localStorage", () => {
    localStorage.setItem("test-key", JSON.stringify("saved-value"));
    const { result } = renderHook(() => useLocalStorage("test-key", "default"));
    expect(result.current[0]).toBe("saved-value");
  });

  it("writes to localStorage on setValue", () => {
    const { result } = renderHook(() => useLocalStorage("test-key", 42));
    act(() => {
      result.current[1](100);
    });
    expect(result.current[0]).toBe(100);
    expect(JSON.parse(localStorage.getItem("test-key")!)).toBe(100);
  });

  it("works with arrays", () => {
    const { result } = renderHook(() => useLocalStorage<string[]>("cols", ["a", "b"]));
    expect(result.current[0]).toEqual(["a", "b"]);
    act(() => {
      result.current[1](["a"]);
    });
    expect(result.current[0]).toEqual(["a"]);
  });

  it("falls back to initial value when localStorage has invalid JSON", () => {
    localStorage.setItem("bad-key", "not-json{{{");
    const { result } = renderHook(() => useLocalStorage("bad-key", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });
});
