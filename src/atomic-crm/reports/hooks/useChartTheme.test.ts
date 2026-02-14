/**
 * useChartTheme Hook Tests
 *
 * Tests that the chart theme hook:
 * 1. Resolves CSS custom properties to actual color values
 * 2. Re-resolves when the theme changes (light <-> dark)
 * 3. Includes gridline, axisText, and foreground colors
 * 4. Fails fast when CSS variables are missing
 * 5. Falls back to system-ui for font when --font-sans is empty
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Track the resolved theme for mock control
let mockResolvedTheme = "light";

// Mock next-themes (used by theme-provider re-export)
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}));

vi.mock("@/components/ra-wrappers/theme-provider", () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}));

// CSS variable values for light and dark themes
const lightVars: Record<string, string> = {
  "--primary": "oklch(38% 0.085 142)",
  "--brand-700": "oklch(32% 0.07 142)",
  "--brand-600": "oklch(35% 0.08 142)",
  "--success": "oklch(60% 0.15 145)",
  "--warning": "oklch(75% 0.15 85)",
  "--destructive": "oklch(58% 0.18 27)",
  "--muted": "oklch(90% 0.01 92)",
  "--chart-gridline": "oklch(90% 0.01 92)",
  "--chart-axis-text": "oklch(46% 0.018 85)",
  "--foreground": "oklch(20% 0.012 85)",
  "--chart-1": "oklch(63.7% 0.183 142)",
  "--chart-2": "oklch(60% 0.15 145)",
  "--chart-3": "oklch(75% 0.15 85)",
  "--chart-4": "oklch(58% 0.18 27)",
  "--chart-5": "oklch(55% 0.17 280)",
  "--chart-6": "oklch(70% 0.14 200)",
  "--chart-7": "oklch(65% 0.16 50)",
  "--chart-8": "oklch(50% 0.12 320)",
  "--font-sans": "Inter, system-ui",
};

const darkVars: Record<string, string> = {
  "--primary": "oklch(65% 0.12 142)",
  "--brand-700": "oklch(55% 0.09 142)",
  "--brand-600": "oklch(60% 0.10 142)",
  "--success": "oklch(70% 0.15 145)",
  "--warning": "oklch(80% 0.15 85)",
  "--destructive": "oklch(65% 0.18 27)",
  "--muted": "oklch(30% 0.01 92)",
  "--chart-gridline": "oklch(30% 0.015 85)",
  "--chart-axis-text": "oklch(88.4% 0.005 284.8)",
  "--foreground": "oklch(95% 0.005 85)",
  "--chart-1": "oklch(73.7% 0.183 142)",
  "--chart-2": "oklch(70% 0.15 145)",
  "--chart-3": "oklch(80% 0.15 85)",
  "--chart-4": "oklch(65% 0.18 27)",
  "--chart-5": "oklch(65% 0.17 280)",
  "--chart-6": "oklch(75% 0.14 200)",
  "--chart-7": "oklch(70% 0.16 50)",
  "--chart-8": "oklch(55% 0.12 320)",
  "--font-sans": "Inter, system-ui",
};

// Store original getComputedStyle for cleanup
const originalGetComputedStyle = window.getComputedStyle;

function mockComputedStyle(vars: Record<string, string>) {
  window.getComputedStyle = vi.fn().mockReturnValue({
    getPropertyValue: (prop: string) => vars[prop] ?? "",
  });
}

describe("useChartTheme", () => {
  beforeEach(() => {
    mockResolvedTheme = "light";
    mockComputedStyle(lightVars);
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
    vi.clearAllMocks();
  });

  it("resolves CSS variables to OKLCH values after mount", async () => {
    const { useChartTheme } = await import("./useChartTheme");
    const { result } = renderHook(() => useChartTheme());

    // After effect runs, colors should be resolved OKLCH values
    expect(result.current.colors.primary).toBe("oklch(38% 0.085 142)");
    expect(result.current.colors.success).toBe("oklch(60% 0.15 145)");
    expect(result.current.colors.destructive).toBe("oklch(58% 0.18 27)");
  });

  it("includes gridline, axisText, and foreground in resolved colors", async () => {
    const { useChartTheme } = await import("./useChartTheme");
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.colors.gridline).toBe("oklch(90% 0.01 92)");
    expect(result.current.colors.axisText).toBe("oklch(46% 0.018 85)");
    expect(result.current.colors.foreground).toBe("oklch(20% 0.012 85)");
  });

  it("re-resolves colors when resolvedTheme changes", async () => {
    const { useChartTheme } = await import("./useChartTheme");
    const { result, rerender } = renderHook(() => useChartTheme());

    // Initial light theme values
    expect(result.current.colors.gridline).toBe("oklch(90% 0.01 92)");

    // Switch to dark theme
    act(() => {
      mockResolvedTheme = "dark";
      mockComputedStyle(darkVars);
    });
    rerender();

    // After re-render with dark theme, should have dark values
    expect(result.current.colors.gridline).toBe("oklch(30% 0.015 85)");
    expect(result.current.colors.foreground).toBe("oklch(95% 0.005 85)");
    expect(result.current.colors.primary).toBe("oklch(65% 0.12 142)");
  });

  it("resolves font family from --font-sans", async () => {
    const { useChartTheme } = await import("./useChartTheme");
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.font.family).toBe("Inter, system-ui");
    expect(result.current.font.size).toBe(12);
  });

  it("falls back to system-ui when --font-sans is empty", async () => {
    const emptyFontVars = { ...lightVars, "--font-sans": "" };
    mockComputedStyle(emptyFontVars);

    const { useChartTheme } = await import("./useChartTheme");
    const { result } = renderHook(() => useChartTheme());

    expect(result.current.font.family).toBe("system-ui");
  });

  it("throws when a required CSS variable is missing", async () => {
    const missingVars = { ...lightVars };
    delete (missingVars as Record<string, string | undefined>)["--primary"];
    mockComputedStyle(missingVars);

    const { useChartTheme } = await import("./useChartTheme");

    expect(() => {
      renderHook(() => useChartTheme());
    }).toThrow("[ChartTheme]");
  });
});
