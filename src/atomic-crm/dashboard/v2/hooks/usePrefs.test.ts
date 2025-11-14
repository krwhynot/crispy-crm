import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePrefs } from "./usePrefs";

// Mock react-admin's useStore
vi.mock("react-admin", () => ({
  useStore: vi.fn(),
}));

import { useStore } from "react-admin";

describe("usePrefs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default value when key doesn't exist", () => {
    const mockSetValue = vi.fn();
    vi.mocked(useStore).mockReturnValue([undefined, mockSetValue]);

    const { result } = renderHook(() => usePrefs("colWidths", [40, 30, 30]));

    expect(result.current[0]).toEqual([40, 30, 30]);
  });

  it("persists and retrieves string value", () => {
    const mockSetValue = vi.fn();
    vi.mocked(useStore).mockReturnValue(["test-value", mockSetValue]);

    const { result } = renderHook(() => usePrefs("taskGrouping", "due"));

    expect(result.current[0]).toBe("test-value");

    // Verify we can set a new value
    act(() => {
      result.current[1]("new-value");
    });

    expect(mockSetValue).toHaveBeenCalledWith("new-value");
  });

  it("persists and retrieves array value", () => {
    const mockSetValue = vi.fn();
    const storedArray = [50, 25, 25];
    vi.mocked(useStore).mockReturnValue([storedArray, mockSetValue]);

    const { result } = renderHook(() => usePrefs<number[]>("colWidths", [40, 30, 30]));

    expect(result.current[0]).toEqual([50, 25, 25]);

    // Verify we can update the array
    const newArray = [60, 20, 20];
    act(() => {
      result.current[1](newArray);
    });

    expect(mockSetValue).toHaveBeenCalledWith(newArray);
  });
});
