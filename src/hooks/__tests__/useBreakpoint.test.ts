import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBreakpoint } from "../useBreakpoint";

describe("useBreakpoint", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns mobile breakpoint for small screens", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(max-width: 767px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("mobile");
  });

  it("returns tablet-portrait for 768-1023px", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px) and (max-width: 1023px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("tablet-portrait");
  });

  it("returns tablet-landscape for 1024-1279px", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1024px) and (max-width: 1279px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("tablet-landscape");
  });

  it("returns laptop for 1280-1439px", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1280px) and (max-width: 1439px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("laptop");
  });

  it("returns desktop for 1440px+", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 1440px)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("desktop");
  });
});
