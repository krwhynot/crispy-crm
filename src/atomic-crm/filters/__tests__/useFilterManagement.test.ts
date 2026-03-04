/**
 * useFilterManagement Hook Tests
 *
 * Tests the core filter state management hook that provides
 * add/remove/toggle/clear operations on React Admin filterValues.
 *
 * Covers:
 * - addFilterValue: single, array accumulation, duplicate prevention
 * - removeFilterValue: from array, last item removal, single value
 * - toggleFilterValue: add/remove toggle behavior
 * - clearFilter / clearAllFilters
 * - isFilterActive: truthy/falsy edge cases
 * - activeFilterCount: skips @-prefixed and deleted_at keys
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterManagement } from "../useFilterManagement";

// Mock useListContext from ra-core (useFilterManagement imports from ra-core)
const mockSetFilters = vi.fn();
let mockFilterValues: Record<string, unknown> = {};

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: () => ({
      filterValues: mockFilterValues,
      setFilters: mockSetFilters,
      displayedFilters: {},
    }),
  };
});

describe("useFilterManagement", () => {
  beforeEach(() => {
    mockSetFilters.mockClear();
    mockFilterValues = {};
  });

  // --- addFilterValue ---

  describe("addFilterValue", () => {
    test("adds value to empty filter as single value", () => {
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.addFilterValue("stage", "new_lead"));
      expect(mockSetFilters).toHaveBeenCalledWith({ stage: "new_lead" });
    });

    test("converts single value to array when adding second value", () => {
      mockFilterValues = { stage: "new_lead" };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.addFilterValue("stage", "closed_won"));
      expect(mockSetFilters).toHaveBeenCalledWith({
        stage: ["new_lead", "closed_won"],
      });
    });

    test("appends to existing array", () => {
      mockFilterValues = { stage: ["new_lead", "closed_won"] };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.addFilterValue("stage", "demo_scheduled"));
      expect(mockSetFilters).toHaveBeenCalledWith({
        stage: ["new_lead", "closed_won", "demo_scheduled"],
      });
    });

    test("prevents duplicate in array", () => {
      mockFilterValues = { stage: ["new_lead", "closed_won"] };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.addFilterValue("stage", "new_lead"));
      expect(mockSetFilters).not.toHaveBeenCalled();
    });
  });

  // --- removeFilterValue ---

  describe("removeFilterValue", () => {
    test("removes value from array keeping remaining items", () => {
      mockFilterValues = { stage: ["new_lead", "closed_won", "demo_scheduled"] };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.removeFilterValue("stage", "closed_won"));
      expect(mockSetFilters).toHaveBeenCalledWith({
        stage: ["new_lead", "demo_scheduled"],
      });
    });

    test("removes filter key when last array item is removed", () => {
      mockFilterValues = { stage: ["new_lead"], priority: "high" };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.removeFilterValue("stage", "new_lead"));
      expect(mockSetFilters).toHaveBeenCalledWith({ priority: "high" });
    });

    test("removes filter key for matching single value", () => {
      mockFilterValues = { stage: "new_lead", priority: "high" };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.removeFilterValue("stage", "new_lead"));
      expect(mockSetFilters).toHaveBeenCalledWith({ priority: "high" });
    });
  });

  // --- toggleFilterValue ---

  describe("toggleFilterValue", () => {
    test("adds value when absent", () => {
      mockFilterValues = {};
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.toggleFilterValue("stage", "new_lead"));
      expect(mockSetFilters).toHaveBeenCalledWith({ stage: "new_lead" });
    });

    test("removes value when present in array", () => {
      mockFilterValues = { stage: ["new_lead", "closed_won"] };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.toggleFilterValue("stage", "new_lead"));
      expect(mockSetFilters).toHaveBeenCalledWith({
        stage: ["closed_won"],
      });
    });

    test("removes filter when matching single value", () => {
      mockFilterValues = { stage: "new_lead", priority: "high" };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.toggleFilterValue("stage", "new_lead"));
      expect(mockSetFilters).toHaveBeenCalledWith({ priority: "high" });
    });
  });

  // --- clearFilter / clearAllFilters ---

  describe("clearFilter", () => {
    test("removes specific filter key", () => {
      mockFilterValues = { stage: ["new_lead"], priority: "high" };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.clearFilter("stage"));
      expect(mockSetFilters).toHaveBeenCalledWith({ priority: "high" });
    });

    test("no-ops when key does not exist", () => {
      mockFilterValues = { priority: "high" };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.clearFilter("stage"));
      expect(mockSetFilters).not.toHaveBeenCalled();
    });
  });

  describe("clearAllFilters", () => {
    test("empties all filters", () => {
      mockFilterValues = { stage: ["new_lead"], priority: "high" };
      const { result } = renderHook(() => useFilterManagement());
      act(() => result.current.clearAllFilters());
      expect(mockSetFilters).toHaveBeenCalledWith({});
    });
  });

  // --- isFilterActive ---

  describe("isFilterActive", () => {
    test("returns true for array with items", () => {
      mockFilterValues = { stage: ["new_lead"] };
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.isFilterActive("stage")).toBe(true);
    });

    test("returns false for empty array", () => {
      mockFilterValues = { stage: [] };
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.isFilterActive("stage")).toBe(false);
    });

    test("returns false for undefined key", () => {
      mockFilterValues = {};
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.isFilterActive("stage")).toBe(false);
    });

    test("returns false for null value", () => {
      mockFilterValues = { stage: null };
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.isFilterActive("stage")).toBe(false);
    });

    test("returns false for empty string", () => {
      mockFilterValues = { stage: "" };
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.isFilterActive("stage")).toBe(false);
    });
  });

  // --- activeFilterCount ---

  describe("activeFilterCount", () => {
    test("counts active filters", () => {
      mockFilterValues = { stage: ["new_lead"], priority: "high" };
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.activeFilterCount).toBe(2);
    });

    test("skips @-prefixed keys", () => {
      mockFilterValues = { stage: "new_lead", "@version": 1 };
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.activeFilterCount).toBe(1);
    });

    test("skips deleted_at key", () => {
      mockFilterValues = { stage: "new_lead", deleted_at: null };
      const { result } = renderHook(() => useFilterManagement());
      // deleted_at is skipped, and null value wouldn't count anyway
      expect(result.current.activeFilterCount).toBe(1);
    });

    test("returns 0 for empty filterValues", () => {
      mockFilterValues = {};
      const { result } = renderHook(() => useFilterManagement());
      expect(result.current.activeFilterCount).toBe(0);
    });
  });
});
