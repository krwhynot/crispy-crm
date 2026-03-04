/**
 * usePresetFilter Hook Tests
 *
 * Tests the preset toggle hook that manages quick-filter
 * activation/deactivation, $or source tracking, and
 * auto-close behavior for sheet mode.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePresetFilter } from "../usePresetFilter";

// --- Mocks ---

const mockSetFilters = vi.fn();
let mockFilterValues: Record<string, unknown> = {};
const mockDisplayedFilters: Record<string, boolean> = {};

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListFilterContext: () => ({
      filterValues: mockFilterValues,
      displayedFilters: mockDisplayedFilters,
      setFilters: mockSetFilters,
    }),
  };
});

const mockSetOrSource = vi.fn();
const mockSetSheetOpen = vi.fn();
let mockSidebarContext: {
  setOrSource: typeof mockSetOrSource;
  setSheetOpen: typeof mockSetSheetOpen;
} | null = {
  setOrSource: mockSetOrSource,
  setSheetOpen: mockSetSheetOpen,
};

vi.mock("@/components/layouts/FilterSidebarContext", () => ({
  useOptionalFilterSidebarContext: () => mockSidebarContext,
}));

let mockLayoutMode: string = "full";

vi.mock("../FilterLayoutModeContext", () => ({
  useFilterLayoutMode: () => mockLayoutMode,
}));

describe("usePresetFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterValues = {};
    mockLayoutMode = "full";
    mockSidebarContext = {
      setOrSource: mockSetOrSource,
      setSheetOpen: mockSetSheetOpen,
    };
  });

  // --- isPresetActive ---

  describe("isPresetActive", () => {
    test("returns true when all preset keys match", () => {
      mockFilterValues = { stage: "new_lead", priority: "high" };
      const { result } = renderHook(() => usePresetFilter());
      expect(result.current.isPresetActive({ stage: "new_lead", priority: "high" })).toBe(true);
    });

    test("returns false on partial match", () => {
      mockFilterValues = { stage: "new_lead" };
      const { result } = renderHook(() => usePresetFilter());
      expect(result.current.isPresetActive({ stage: "new_lead", priority: "high" })).toBe(false);
    });

    test("compares arrays via JSON.stringify", () => {
      mockFilterValues = { stage: ["new_lead", "closed_won"] };
      const { result } = renderHook(() => usePresetFilter());
      expect(result.current.isPresetActive({ stage: ["new_lead", "closed_won"] })).toBe(true);
    });

    test("returns true for empty preset", () => {
      mockFilterValues = { stage: "new_lead" };
      const { result } = renderHook(() => usePresetFilter());
      expect(result.current.isPresetActive({})).toBe(true);
    });
  });

  // --- handlePresetClick ---

  describe("handlePresetClick ON (merge)", () => {
    test("merges preset into filters", () => {
      mockFilterValues = { priority: "high" };
      const { result } = renderHook(() => usePresetFilter());
      act(() => result.current.handlePresetClick({ stage: "new_lead" }));
      expect(mockSetFilters).toHaveBeenCalledWith(
        { priority: "high", stage: "new_lead" },
        mockDisplayedFilters
      );
    });

    test("sets orSource to 'preset' when preset has $or", () => {
      mockFilterValues = {};
      const { result } = renderHook(() => usePresetFilter());
      act(() => result.current.handlePresetClick({ $or: [{ a: 1 }, { b: 2 }] }));
      expect(mockSetOrSource).toHaveBeenCalledWith("preset");
    });
  });

  describe("handlePresetClick OFF (remove)", () => {
    test("removes preset keys from filters", () => {
      mockFilterValues = { stage: "new_lead", priority: "high" };
      const { result } = renderHook(() => usePresetFilter());
      // stage: "new_lead" matches preset, so it's active → toggle OFF
      act(() => result.current.handlePresetClick({ stage: "new_lead" }));
      expect(mockSetFilters).toHaveBeenCalledWith({ priority: "high" }, mockDisplayedFilters);
    });

    test("sets orSource to null when removing $or preset", () => {
      mockFilterValues = { $or: [{ a: 1 }] };
      const { result } = renderHook(() => usePresetFilter());
      act(() => result.current.handlePresetClick({ $or: [{ a: 1 }] }));
      expect(mockSetOrSource).toHaveBeenCalledWith(null);
    });
  });

  // --- Sheet mode ---

  describe("sheet mode auto-close", () => {
    test("closes sheet when mode is 'sheet'", () => {
      mockLayoutMode = "sheet";
      mockFilterValues = {};
      const { result } = renderHook(() => usePresetFilter());
      act(() => result.current.handlePresetClick({ stage: "new_lead" }));
      expect(mockSetSheetOpen).toHaveBeenCalledWith(false);
    });

    test("does not close when mode is 'full'", () => {
      mockLayoutMode = "full";
      mockFilterValues = {};
      const { result } = renderHook(() => usePresetFilter());
      act(() => result.current.handlePresetClick({ stage: "new_lead" }));
      expect(mockSetSheetOpen).not.toHaveBeenCalled();
    });
  });

  // --- Missing sidebar context ---

  describe("missing sidebar context", () => {
    test("does not throw when sidebar context is null", () => {
      mockSidebarContext = null;
      mockFilterValues = {};
      const { result } = renderHook(() => usePresetFilter());
      expect(() => {
        act(() => result.current.handlePresetClick({ $or: [{ a: 1 }] }));
      }).not.toThrow();
    });
  });
});
