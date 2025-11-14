import { renderHook } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useFeatureFlag } from "./useFeatureFlag";

describe("useFeatureFlag", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("returns true when layout=v2 query parameter is present", () => {
    Object.defineProperty(window, "location", {
      value: { search: "?layout=v2" },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useFeatureFlag());
    expect(result.current).toBe(true);
  });

  it("returns false when no query parameters are present", () => {
    Object.defineProperty(window, "location", {
      value: { search: "" },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useFeatureFlag());
    expect(result.current).toBe(false);
  });

  it("returns false when layout parameter has a different value", () => {
    Object.defineProperty(window, "location", {
      value: { search: "?layout=v1" },
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useFeatureFlag());
    expect(result.current).toBe(false);
  });
});
