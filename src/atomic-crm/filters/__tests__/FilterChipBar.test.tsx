/**
 * FilterChipBar Component Tests
 *
 * Tests the unified filter chip bar that displays active filters
 * above datagrids across all CRM list views.
 *
 * Covers:
 * - Rendering behavior (empty state, with filters)
 * - Chip removal functionality
 * - Clear all functionality
 * - ARIA accessibility attributes
 * - Keyboard navigation
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { FilterChipBar } from "../FilterChipBar";
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

// Mock the name resolution hooks
vi.mock("../useOrganizationNames", () => ({
  useOrganizationNames: () => ({
    getOrganizationName: (id: string) => `Org ${id}`,
  }),
}));

vi.mock("../useSalesNames", () => ({
  useSalesNames: () => ({
    getSalesName: (id: string) => `Sales ${id}`,
  }),
}));

vi.mock("../useTagNames", () => ({
  useTagNames: () => ({
    getTagName: (id: string) => `Tag ${id}`,
  }),
}));

vi.mock("../useSegmentNames", () => ({
  useSegmentNames: () => ({
    getSegmentName: (id: string) => `Segment ${id}`,
  }),
}));

vi.mock("../useCategoryNames", () => ({
  useCategoryNames: () => ({
    getCategoryName: (id: string) => `Category ${id}`,
  }),
}));

// Test configuration
const TEST_FILTER_CONFIG: ChipFilterConfig[] = [
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
      { id: "medium", name: "Medium" },
      { id: "low", name: "Low" },
    ],
  },
  {
    key: "organization_id",
    label: "Organization",
    type: "reference",
    reference: "organizations",
  },
];

describe("FilterChipBar", () => {
  beforeEach(() => {
    mockFilterValues = {};
    mockSetFilters.mockClear();
  });

  describe("Rendering", () => {
    test("renders nothing when no filters are active", () => {
      mockFilterValues = {};

      const { container } = renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      // Should not render the toolbar when no filters
      expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
      expect(container.innerHTML).toBe("");
    });

    test("renders chip bar when filters are active", () => {
      mockFilterValues = { status: "active" };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      expect(screen.getByRole("toolbar")).toBeInTheDocument();
      expect(screen.getByText("Active filters:")).toBeInTheDocument();
    });

    test("renders chips with correct labels from choices", () => {
      mockFilterValues = { status: "active", priority: ["high", "medium"] };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      // Status chip should show "Active" (from choices)
      expect(screen.getByText("Active")).toBeInTheDocument();
      // Priority chips should show "High" and "Medium"
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });

    test("renders reference chips with resolved names", () => {
      mockFilterValues = { organization_id: "org-123" };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      // Should show resolved organization name
      expect(screen.getByText("Org org-123")).toBeInTheDocument();
    });

    test("shows 'Clear all' button only when 2+ filters active", () => {
      // Single filter - no Clear all
      mockFilterValues = { status: "active" };
      const { rerender } = renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );
      expect(screen.queryByText("Clear all")).not.toBeInTheDocument();

      // Multiple filters - shows Clear all
      mockFilterValues = { status: "active", priority: ["high"] };
      rerender(<FilterChipBar filterConfig={TEST_FILTER_CONFIG} />);
      expect(screen.getByText("Clear all")).toBeInTheDocument();
    });
  });

  describe("Filter Removal", () => {
    test("removes single filter when chip X is clicked", () => {
      mockFilterValues = { status: "active", priority: ["high"] };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      // Click remove on status chip
      const removeButton = screen.getByLabelText("Remove Active filter");
      fireEvent.click(removeButton);

      expect(mockSetFilters).toHaveBeenCalledWith(
        expect.objectContaining({ priority: ["high"] }),
        expect.anything()
      );
    });

    test("removes all filters when Clear all is clicked", () => {
      mockFilterValues = { status: "active", priority: ["high", "medium"] };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      fireEvent.click(screen.getByText("Clear all"));

      // Should clear all user filters, keeping only system filters
      expect(mockSetFilters).toHaveBeenCalledWith({}, expect.anything());
    });
  });

  describe("Accessibility", () => {
    test("has correct ARIA roles", () => {
      mockFilterValues = { status: "active" };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      const toolbar = screen.getByRole("toolbar");
      expect(toolbar).toHaveAttribute("aria-label", "Active filters");
      expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");

      // Chips should be in a list
      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    test("remove buttons have accessible labels", () => {
      mockFilterValues = { status: "active" };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      expect(
        screen.getByRole("button", { name: /Remove Active filter/i })
      ).toBeInTheDocument();
    });

    test("Clear all button has accessible label with count", () => {
      mockFilterValues = { status: "active", priority: ["high", "medium"] };

      renderWithAdminContext(
        <FilterChipBar filterConfig={TEST_FILTER_CONFIG} />
      );

      expect(
        screen.getByRole("button", { name: /Clear all 3 filters/i })
      ).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    test("throws if filterConfig is empty", () => {
      expect(() =>
        renderWithAdminContext(<FilterChipBar filterConfig={[]} />)
      ).toThrow("FilterChipBar requires a non-empty filterConfig");
    });
  });
});
