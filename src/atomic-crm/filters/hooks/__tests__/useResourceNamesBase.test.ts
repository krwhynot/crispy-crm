/**
 * useResourceNamesBase Hook Tests
 *
 * Tests the generic hook for fetching and caching resource display names.
 *
 * Key regression: Verifies that unresolvable IDs (e.g., operator segments
 * passed to segments handler) do NOT cause infinite re-render loops.
 * The bug: empty getMany results trigger setNamesMap with a new reference,
 * which re-triggers the effect, creating an infinite loop.
 *
 * NOTE: React StrictMode (used by @testing-library/react) double-invokes
 * effects, so getMany may be called up to 2x per logical mount. Tests
 * use bounded assertions (≤ N) rather than exact counts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useResourceNamesBase } from "../useResourceNamesBase";

// Track getMany calls
let getManyCallCount = 0;

const mockGetMany = vi.fn(async (_resource: string, params: { ids: unknown[] }) => {
  getManyCallCount++;
  // Default: return matching records for IDs that start with "known-"
  const data = params.ids
    .filter((id) => String(id).startsWith("known-"))
    .map((id) => ({ id: String(id), name: `Name for ${id}` }));
  return { data };
});

vi.mock("ra-core", () => ({
  useDataProvider: () => ({
    getMany: mockGetMany,
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

interface TestResource {
  id: string | number;
  name: string;
}

const testExtractor = (item: TestResource) => item.name;

// StrictMode calls effects twice per mount cycle
const MAX_STRICT_MODE_CALLS = 2;

describe("useResourceNamesBase", () => {
  beforeEach(() => {
    getManyCallCount = 0;
    mockGetMany.mockClear();
  });

  it("fetches names for provided IDs", async () => {
    const { result } = renderHook(() =>
      useResourceNamesBase<TestResource>("test", ["known-1", "known-2"], testExtractor, "Test")
    );

    await waitFor(() => {
      expect(result.current.namesMap["known-1"]).toBe("Name for known-1");
    });

    expect(result.current.namesMap["known-2"]).toBe("Name for known-2");
    expect(getManyCallCount).toBeLessThanOrEqual(MAX_STRICT_MODE_CALLS);
  });

  it("does not fetch when ids are empty", () => {
    renderHook(() => useResourceNamesBase<TestResource>("test", [], testExtractor, "Test"));

    expect(getManyCallCount).toBe(0);
  });

  it("does not fetch when ids are undefined", () => {
    renderHook(() => useResourceNamesBase<TestResource>("test", undefined, testExtractor, "Test"));

    expect(getManyCallCount).toBe(0);
  });

  it("does NOT infinite-loop when IDs cannot be resolved", async () => {
    // This is the critical regression test.
    // "unresolvable-1" won't match the "known-" prefix in our mock,
    // so getMany returns empty data.
    // Before fix: empty result -> new namesMap reference -> effect re-fires -> 1700+ calls
    // After fix: empty result -> skip setNamesMap, track as failed -> bounded calls
    renderHook(() =>
      useResourceNamesBase<TestResource>(
        "test",
        ["unresolvable-1", "unresolvable-2"],
        testExtractor,
        "Test"
      )
    );

    // Wait for fetch to complete
    await waitFor(() => {
      expect(getManyCallCount).toBeGreaterThanOrEqual(1);
    });

    // Give time for potential additional calls (infinite loop would keep calling)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Bounded: at most StrictMode double-fire, NOT infinite (was 1700+ before fix)
    expect(getManyCallCount).toBeLessThanOrEqual(MAX_STRICT_MODE_CALLS);
  });

  it("returns fallback name for unresolved IDs", async () => {
    const { result } = renderHook(() =>
      useResourceNamesBase<TestResource>("test", ["unresolvable-1"], testExtractor, "Test")
    );

    await waitFor(() => {
      expect(getManyCallCount).toBeGreaterThanOrEqual(1);
    });

    // Fallback format: "Prefix #id"
    expect(result.current.getName("unresolvable-1")).toBe("Test #unresolvable-1");
  });

  it("does not refetch already cached IDs", async () => {
    const { result, rerender } = renderHook(
      ({ ids }) => useResourceNamesBase<TestResource>("test", ids, testExtractor, "Test"),
      { initialProps: { ids: ["known-1"] } }
    );

    await waitFor(() => {
      expect(result.current.namesMap["known-1"]).toBe("Name for known-1");
    });

    const callsAfterFirstFetch = getManyCallCount;

    // Re-render with same IDs - should not fetch again
    rerender({ ids: ["known-1"] });

    // Allow any pending effects to settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    // No additional calls after cache hit
    expect(getManyCallCount).toBe(callsAfterFirstFetch);
  });

  it("handles mixed resolvable and unresolvable IDs", async () => {
    const { result } = renderHook(() =>
      useResourceNamesBase<TestResource>(
        "test",
        ["known-1", "unresolvable-1"],
        testExtractor,
        "Test"
      )
    );

    await waitFor(() => {
      expect(result.current.namesMap["known-1"]).toBe("Name for known-1");
    });

    // known-1 resolved, unresolvable-1 uses fallback
    expect(result.current.getName("known-1")).toBe("Name for known-1");
    expect(result.current.getName("unresolvable-1")).toBe("Test #unresolvable-1");

    // Should not keep retrying for the unresolvable one
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(getManyCallCount).toBeLessThanOrEqual(MAX_STRICT_MODE_CALLS);
  });
});
