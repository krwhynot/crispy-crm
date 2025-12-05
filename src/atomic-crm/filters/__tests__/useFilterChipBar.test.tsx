/**
 * useFilterChipBar Hook Tests
 *
 * Tests the core hook that transforms React Admin filter state
 * into displayable chip data with proper label resolution.
 *
 * Covers:
 * - Filter value transformation to chips
 * - Array value flattening
 * - Reference name resolution
 * - Active count calculation
 * - System filter exclusion
 * - Removal group handling for date ranges
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFilterChipBar } from "../useFilterChipBar";
import type { ChipFilterConfig } from "../filterConfigSchema";

// Mock useListContext
const mockSetFilters = vi.fn();
let mockFilterValues: Record<string, unknown> = {};

vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useListContext: () => ({
      filterValues: mockFilterValues,
      setFilters: mockSetFilters,
      displayedFilters: {},
    }),
  };
});

// Mock name resolution hooks
vi.mock("../useOrganizationNames", () => ({
  useOrganizationNames: () => ({
    getOrganizationName: (id: string) => `Org ${id}`,
  }),
}));

vi.mock("../useSalesNames", () => ({
  useSalesNames: () => ({
    getSalesName: (id: string) => `User ${id}`,
  }),
}));

vi.mock("../useTagNames", () => ({
  useTagNames: () => ({
    getTagName: (id: string) => `Tag ${id}`,
  }),
}));

vi.mock("../useSegmentNames", () => ({
  useSegmentNames: () => ({
    getSegmentName: (id: string) => `Playbook ${id}`,
  }),
}));

vi.mock("../useCategoryNames", () => ({
  useCategoryNames: () => ({
    getCategoryName: (id: string) => `Category ${id}`,
  }),
}));

// Test configurations
const BASIC_CONFIG: ChipFilterConfig[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    choices: [
      { id: "active", name: "Active" },
      { id: "inactive", name: "Inactive" },
    ],
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: [
      { id: "high", name: "High" },
      { id: "low", name: "Low" },
    ],
  },
];

const REFERENCE_CONFIG: ChipFilterConfig[] = [
  {
    key: "organization_id",
    label: "Organization",
    type: "reference",
    reference: "organizations",
  },
  {
    key: "sales_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
  {
    key: "segment_id",
    label: "Playbook",
    type: "reference",
    reference: "segments",
  },
];

const DATE_RANGE_CONFIG: ChipFilterConfig[] = [
  {
    key: "created_at@gte",
    label: "Created after",
    type: "date-range",
    formatLabel: (v) => `After ${v}`,
    removalGroup: "created_at_range",
  },
  {
    key: "created_at@lte",
    label: "Created before",
    type: "date-range",
    formatLabel: (v) => `Before ${v}`,
    removalGroup: "created_at_range",
  },
];

// Wrapper for hooks that need React Admin context
const wrapper = ({ children }: { children: React.ReactNode }) => children;

describe("useFilterChipBar", () => {
  beforeEach(() => {
    mockFilterValues = {};
    mockSetFilters.mockClear();
  });

  describe("Chip Generation", () => {
    test("returns empty chips when no filters active", () => {
      mockFilterValues = {};

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      expect(result.current.chips).toHaveLength(0);
      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.activeCount).toBe(0);
    });

    test("transforms single filter value into chip", () => {
      mockFilterValues = { status: "active" };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      expect(result.current.chips).toHaveLength(1);
      expect(result.current.chips[0]).toEqual({
        key: "status",
        value: "active",
        label: "Active", // Resolved from choices
        category: "Status",
      });
    });

    test("flattens array values into individual chips", () => {
      mockFilterValues = { priority: ["high", "low"] };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      expect(result.current.chips).toHaveLength(2);
      expect(result.current.chips.map((c) => c.label)).toEqual(["High", "Low"]);
    });

    test("calculates activeCount correctly", () => {
      mockFilterValues = { status: "active", priority: ["high", "low"] };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      expect(result.current.activeCount).toBe(3); // 1 status + 2 priorities
      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe("Reference Resolution", () => {
    test("resolves organization names", () => {
      mockFilterValues = { organization_id: "org-123" };

      const { result } = renderHook(
        () => useFilterChipBar(REFERENCE_CONFIG),
        { wrapper }
      );

      expect(result.current.chips[0].label).toBe("Org org-123");
    });

    test("resolves sales rep names", () => {
      mockFilterValues = { sales_id: "user-456" };

      const { result } = renderHook(
        () => useFilterChipBar(REFERENCE_CONFIG),
        { wrapper }
      );

      expect(result.current.chips[0].label).toBe("User user-456");
    });

    test("resolves segment names", () => {
      mockFilterValues = { segment_id: "seg-789" };

      const { result } = renderHook(
        () => useFilterChipBar(REFERENCE_CONFIG),
        { wrapper }
      );

      expect(result.current.chips[0].label).toBe("Playbook seg-789");
    });
  });

  describe("System Filter Exclusion", () => {
    test("excludes deleted_at from chips", () => {
      mockFilterValues = {
        status: "active",
        deleted_at: null, // System filter
      };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      expect(result.current.chips).toHaveLength(1);
      expect(result.current.chips[0].key).toBe("status");
    });

    test("excludes deleted_at@is from chips", () => {
      mockFilterValues = {
        status: "active",
        "deleted_at@is": "null",
      };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      expect(result.current.chips).toHaveLength(1);
    });
  });

  describe("Search Filter Handling", () => {
    test("shows search filter with 'Search:' prefix", () => {
      mockFilterValues = { q: "test query" };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      expect(result.current.chips).toHaveLength(1);
      expect(result.current.chips[0].label).toBe('Search: "test query"');
      expect(result.current.chips[0].category).toBe("Search");
    });
  });

  describe("Date Range Grouping (removalGroup)", () => {
    test("combines date range filters into single chip", () => {
      mockFilterValues = {
        "created_at@gte": "2025-01-01",
        "created_at@lte": "2025-12-31",
      };

      const { result } = renderHook(
        () => useFilterChipBar(DATE_RANGE_CONFIG),
        { wrapper }
      );

      // Should be ONE combined chip, not two
      expect(result.current.chips).toHaveLength(1);
      expect(result.current.chips[0].label).toContain("After");
      expect(result.current.chips[0].label).toContain("Before");
    });

    test("removal group chips use group name as key", () => {
      mockFilterValues = {
        "created_at@gte": "2025-01-01",
        "created_at@lte": "2025-12-31",
      };

      const { result } = renderHook(
        () => useFilterChipBar(DATE_RANGE_CONFIG),
        { wrapper }
      );

      expect(result.current.chips[0].key).toBe("created_at_range");
    });
  });

  describe("removeFilter", () => {
    test("removes single filter value", () => {
      mockFilterValues = { status: "active" };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      result.current.removeFilter("status");

      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.not.objectContaining({ status: expect.anything() }),
        expect.anything()
      );
    });

    test("removes single value from array filter", () => {
      mockFilterValues = { priority: ["high", "low"] };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      result.current.removeFilter("priority", "high");

      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({ priority: ["low"] }),
        expect.anything()
      );
    });

    test("removes all filters in removal group", () => {
      mockFilterValues = {
        "created_at@gte": "2025-01-01",
        "created_at@lte": "2025-12-31",
      };

      const { result } = renderHook(
        () => useFilterChipBar(DATE_RANGE_CONFIG),
        { wrapper }
      );

      // Remove using the group key
      result.current.removeFilter("created_at_range");

      // Both date filters should be removed
      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.not.objectContaining({
          "created_at@gte": expect.anything(),
          "created_at@lte": expect.anything(),
        }),
        expect.anything()
      );
    });
  });

  describe("clearAllFilters", () => {
    test("clears all user filters but preserves system filters", () => {
      mockFilterValues = {
        status: "active",
        priority: ["high"],
        deleted_at: null, // System filter - should be preserved
      };

      const { result } = renderHook(
        () => useFilterChipBar(BASIC_CONFIG),
        { wrapper }
      );

      result.current.clearAllFilters();

      // Should only keep system filters
      expect(mockSetFilters).toHaveBeenCalledWith(
        { deleted_at: null },
        expect.anything()
      );
    });
  });
});
