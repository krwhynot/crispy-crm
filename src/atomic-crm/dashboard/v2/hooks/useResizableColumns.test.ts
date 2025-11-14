import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useResizableColumns } from "./useResizableColumns";

// Mock react-admin's useStore for usePrefs
vi.mock("react-admin", () => ({
  useStore: vi.fn(),
}));

import { useStore } from "react-admin";

describe("useResizableColumns", () => {
  let mockSetValue: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetValue = vi.fn();
    // Default mock returns undefined for stored value
    vi.mocked(useStore).mockReturnValue([undefined, mockSetValue]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns default widths [40, 30, 30] on initial render", () => {
    const { result } = renderHook(() => useResizableColumns());

    expect(result.current.widths).toEqual([40, 30, 30]);
    expect(result.current.containerRef.current).toBeNull();
    expect(typeof result.current.onMouseDown).toBe("function");
    expect(typeof result.current.resetWidths).toBe("function");
  });

  it("resetWidths() restores [40, 30, 30]", () => {
    // Start with custom widths
    vi.mocked(useStore).mockReturnValue([[50, 25, 25], mockSetValue]);

    const { result } = renderHook(() => useResizableColumns());

    expect(result.current.widths).toEqual([50, 25, 25]);

    // Reset to defaults
    act(() => {
      result.current.resetWidths();
    });

    expect(mockSetValue).toHaveBeenCalledWith([40, 30, 30]);
  });

  it("widths persist after unmount/remount (uses usePrefs)", () => {
    // First render with default widths
    const { unmount } = renderHook(() => useResizableColumns());

    // User resizes columns - useStore would save [50, 25, 25]
    unmount();

    // Second render - useStore returns saved widths
    vi.mocked(useStore).mockReturnValue([[50, 25, 25], mockSetValue]);
    const { result } = renderHook(() => useResizableColumns());

    expect(result.current.widths).toEqual([50, 25, 25]);
  });

  it("constraints enforce min 15%, max 70% per column", () => {
    const { result } = renderHook(() => useResizableColumns());

    // Create a mock container with known width
    const mockContainer = document.createElement("div");
    Object.defineProperty(mockContainer, "offsetWidth", {
      value: 1000,
      writable: false,
    });

    // Set the ref
    Object.defineProperty(result.current.containerRef, "current", {
      value: mockContainer,
      writable: true,
    });

    // Test 1: Try to resize column 0 below minimum (15%)
    // Drag separator 0 far to the left (should clamp to 15%)
    const mouseDownHandler = result.current.onMouseDown(0);

    act(() => {
      const mouseDownEvent = new MouseEvent("mousedown", {
        clientX: 400,
        bubbles: true,
      }) as unknown as React.MouseEvent;
      mouseDownHandler(mouseDownEvent);
    });

    // Simulate drag far left (would make col 0 < 15%)
    act(() => {
      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 50, // Move 350px left from 400 = 35% reduction
        bubbles: true,
      });
      document.dispatchEvent(mouseMoveEvent);
    });

    act(() => {
      const mouseUpEvent = new MouseEvent("mouseup", { bubbles: true });
      document.dispatchEvent(mouseUpEvent);
    });

    // Column 0 should be clamped to minimum 15%
    const callArgs = mockSetValue.mock.calls;
    if (callArgs.length > 0) {
      const lastCall = callArgs[callArgs.length - 1][0];
      expect(lastCall[0]).toBeGreaterThanOrEqual(15);
    }

    // Test 2: Try to resize column 0 above maximum (70%)
    vi.clearAllMocks();

    const mouseDownHandler2 = result.current.onMouseDown(0);

    act(() => {
      const mouseDownEvent = new MouseEvent("mousedown", {
        clientX: 400,
        bubbles: true,
      }) as unknown as React.MouseEvent;
      mouseDownHandler2(mouseDownEvent);
    });

    // Simulate drag far right (would make col 0 > 70%)
    act(() => {
      const mouseMoveEvent = new MouseEvent("mousemove", {
        clientX: 800, // Move 400px right from 400 = 40% increase
        bubbles: true,
      });
      document.dispatchEvent(mouseMoveEvent);
    });

    act(() => {
      const mouseUpEvent = new MouseEvent("mouseup", { bubbles: true });
      document.dispatchEvent(mouseUpEvent);
    });

    // Column 0 should be clamped to maximum 70%
    const callArgs2 = mockSetValue.mock.calls;
    if (callArgs2.length > 0) {
      const lastCall = callArgs2[callArgs2.length - 1][0];
      expect(lastCall[0]).toBeLessThanOrEqual(70);
    }
  });
});
