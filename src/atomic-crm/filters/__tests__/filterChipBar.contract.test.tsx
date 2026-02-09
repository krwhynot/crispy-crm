/**
 * Contract Tests for FilterChipBar
 *
 * PURPOSE: Define invariants that must hold after fixes.
 * These tests WILL FAIL until the fixes are implemented.
 *
 * INVARIANTS:
 * 1. Every filter chip has a human-readable category (no technical keys)
 * 2. Reference types resolve to display names (never numeric IDs)
 * 3. Date values show formatted dates (never raw ISO strings)
 * 4. Boolean filters show semantic labels (not "true"/"false")
 * 5. @ilike filters show humanized source + stripped wildcards
 *
 * Run with: npm test -- filterChipBar.contract
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
    getOrganizationName: (id: string) => `Acme Corp #${id}`,
  }),
}));

vi.mock("../useSalesNames", () => ({
  useSalesNames: () => ({
    getSalesName: (id: string) => `John Smith #${id}`,
  }),
}));

vi.mock("../useTagNames", () => ({
  useTagNames: () => ({
    getTagName: (id: string) => `Important #${id}`,
  }),
}));

vi.mock("../useSegmentNames", () => ({
  useSegmentNames: () => ({
    getSegmentName: (id: string) => `Enterprise #${id}`,
  }),
}));

vi.mock("../useCategoryNames", () => ({
  useCategoryNames: () => ({
    getCategoryName: (id: string) => `Products #${id}`,
  }),
}));

// Mock useTaskNames (will be added in Task 1)
vi.mock("../useTaskNames", () => ({
  useTaskNames: () => ({
    getTaskName: (id: string) => `Follow up with client #${id}`,
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => children;

/**
 * Helper to check if a string looks like a technical key
 * Technical keys contain: @, _, numbers only, or lowercase_underscore format
 */
function looksLikeTechnicalKey(value: string): boolean {
  // Contains @ operator suffix
  if (/@(gte|lte|lt|gt|ilike|is|not_in)/.test(value)) return true;
  // Is purely numeric
  if (/^\d+$/.test(value)) return true;
  // Contains SQL-like wildcards
  if (/^%.*%$/.test(value)) return true;
  // Lowercase with underscores (snake_case technical keys)
  if (/^[a-z]+(_[a-z]+)+$/.test(value)) return true;
  return false;
}

/**
 * Helper to check if a string looks like an ISO date
 */
function looksLikeIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value);
}

describe("FilterChipBar contracts (invariants)", () => {
  beforeEach(() => {
    mockFilterValues = {};
    mockSetFilters.mockClear();
  });

  /**
   * CONTRACT 1: Human-readable categories (IMPLEMENTED)
   *
   * Every chip category should be a human-readable label.
   * Never show technical keys like "due_date@lt" or "parent_organization_id".
   */
  describe("Contract 1: Human-readable categories", () => {
    // These configs will be the actual configs after fixes
    const TASK_FILTER_CONFIG: ChipFilterConfig[] = [
      {
        key: "due_date@lt",
        label: "Overdue",
        type: "boolean",
        formatLabel: () => "Overdue tasks",
      },
      {
        key: "id",
        label: "Task",
        type: "reference",
        reference: "tasks",
      },
    ];

    test("due_date@lt category is 'Overdue' not technical key", () => {
      mockFilterValues = { "due_date@lt": "2025-01-15" };

      const { result } = renderHook(() => useFilterChipBar(TASK_FILTER_CONFIG), { wrapper });

      const chip = result.current.chips[0];
      expect(chip?.category).toBe("Overdue");
      expect(looksLikeTechnicalKey(chip?.category ?? "")).toBe(false);
    });

    test("task id category is 'Task' not technical key", () => {
      mockFilterValues = { id: 123 };

      const { result } = renderHook(() => useFilterChipBar(TASK_FILTER_CONFIG), { wrapper });

      const chip = result.current.chips[0];
      expect(chip?.category).toBe("Task");
      expect(looksLikeTechnicalKey(chip?.category ?? "")).toBe(false);
    });
  });

  /**
   * CONTRACT 2: Reference types resolve to names (IMPLEMENTED)
   *
   * When a filter uses a reference type, the label should show
   * the resolved display name, never a numeric ID.
   */
  describe("Contract 2: Reference names resolved", () => {
    const ORG_CONFIG: ChipFilterConfig[] = [
      {
        key: "parent_organization_id",
        label: "Parent",
        type: "reference",
        reference: "organizations",
      },
    ];

    test("parent_organization_id shows org name not numeric ID", () => {
      mockFilterValues = { parent_organization_id: "456" };

      const { result } = renderHook(() => useFilterChipBar(ORG_CONFIG), { wrapper });

      const chip = result.current.chips[0];
      // Should show resolved org name (from mock), not "456"
      expect(chip?.label).toContain("Acme Corp");
      expect(/^\d+$/.test(chip?.label ?? "")).toBe(false);
    });

    test("task id shows task title not numeric ID", () => {
      const TASK_CONFIG: ChipFilterConfig[] = [
        { key: "id", label: "Task", type: "reference", reference: "tasks" },
      ];
      mockFilterValues = { id: 789 };

      const { result } = renderHook(() => useFilterChipBar(TASK_CONFIG), { wrapper });

      const chip = result.current.chips[0];
      // Should show task title (from mock), not "789"
      expect(chip?.label).toContain("Follow up");
      expect(/^\d+$/.test(chip?.label ?? "")).toBe(false);
    });
  });

  /**
   * CONTRACT 3: Dates show formatted labels (IMPLEMENTED)
   *
   * Date filters should show human-readable formats like "Jan 1, 2025"
   * or preset labels like "This week", never raw ISO strings.
   */
  describe("Contract 3: Dates formatted", () => {
    const DATE_CONFIG: ChipFilterConfig[] = [
      {
        key: "created_at_gte",
        label: "Created after",
        type: "date-range",
        removalGroup: "created_at_range",
      },
    ];

    test("created_at_gte shows formatted date not ISO string", () => {
      mockFilterValues = { created_at_gte: "2025-01-15" };

      const { result } = renderHook(() => useFilterChipBar(DATE_CONFIG), { wrapper });

      const chip = result.current.chips[0];
      // Should be formatted like "Jan 15, 2025"
      expect(looksLikeIsoDate(chip?.label ?? "")).toBe(false);
      expect(chip?.label).toMatch(/\w+ \d+, \d+/); // "Mon D, YYYY" format
    });
  });

  /**
   * CONTRACT 4: Boolean filters show semantic labels (IMPLEMENTED)
   *
   * Boolean/toggle filters should show descriptive labels
   * like "Stale deals" or "Completed", not "true"/"false".
   */
  describe("Contract 4: Boolean semantic labels", () => {
    const BOOL_CONFIG: ChipFilterConfig[] = [
      {
        key: "stale",
        label: "Status",
        type: "boolean",
        formatLabel: (value: unknown) => (value === true ? "Stale deals" : "Active deals"),
      },
    ];

    test("stale=true shows 'Stale deals' not 'true'", () => {
      mockFilterValues = { stale: true };

      const { result } = renderHook(() => useFilterChipBar(BOOL_CONFIG), { wrapper });

      const chip = result.current.chips[0];
      expect(chip?.label).toBe("Stale deals");
      expect(chip?.label).not.toBe("true");
    });
  });

  /**
   * CONTRACT 5: @ilike filters humanized (IMPLEMENTED)
   *
   * Column text filters with @ilike suffix should:
   * - Have humanized category ("Name contains" not "name@ilike")
   * - Have stripped wildcards in label ("Acme" not "%Acme%")
   */
  describe("Contract 5: @ilike humanized", () => {
    test("name@ilike shows humanized category and stripped value", () => {
      mockFilterValues = { "name@ilike": "%Acme%" };

      // Note: @ilike will be handled by pattern matching, not explicit config
      const { result } = renderHook(() => useFilterChipBar([]), { wrapper });

      const chip = result.current.chips[0];
      // Category should be humanized
      expect(chip?.category).toBe("Name contains");
      expect(looksLikeTechnicalKey(chip?.category ?? "")).toBe(false);
      // Value should have wildcards stripped
      expect(chip?.label).toBe("Acme");
      expect(chip?.label).not.toContain("%");
    });

    test("first_name@ilike humanizes underscores", () => {
      mockFilterValues = { "first_name@ilike": "%John%" };

      const { result } = renderHook(() => useFilterChipBar([]), { wrapper });

      const chip = result.current.chips[0];
      // Underscores should become spaces, first letter capitalized
      expect(chip?.category).toBe("First name contains");
      expect(chip?.label).toBe("John");
    });
  });

  /**
   * CONTRACT 6: Exclusion operators show resolved choices (IMPLEMENTED)
   *
   * stage@not_in should show the resolved stage names, not raw values.
   */
  describe("Contract 6: Exclusion operators resolved", () => {
    const STAGE_CONFIG: ChipFilterConfig[] = [
      {
        key: "stage@not_in",
        label: "Excluding stages",
        type: "multiselect",
        choices: [
          { id: "closed_won", name: "Won" },
          { id: "closed_lost", name: "Lost" },
        ],
      },
    ];

    test("stage@not_in shows resolved stage names", () => {
      mockFilterValues = { "stage@not_in": ["closed_won", "closed_lost"] };

      const { result } = renderHook(() => useFilterChipBar(STAGE_CONFIG), { wrapper });

      // Should have chips for each excluded stage
      const labels = result.current.chips.map((c) => c.label);
      expect(labels).toContain("Won");
      expect(labels).toContain("Lost");
      expect(labels).not.toContain("closed_won");
      expect(labels).not.toContain("closed_lost");
    });
  });
});
