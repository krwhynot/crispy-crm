/**
 * FilterableColumnHeader Behavior Tests
 *
 * Tests for the FilterableColumnHeader component which wraps column labels
 * with integrated filter icons for Excel-style list header filtering.
 *
 * Covers:
 * - Text filter icon activation based on @ilike filter state
 * - Checkbox active count for array filter values
 * - filterType="none" rendering (label only)
 * - Active badge count accuracy
 * - Event propagation stopping on filter trigger clicks
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { FilterableColumnHeader } from "../FilterableColumnHeader";

// Mock react-admin to provide useListContext
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "test",
    })),
  };
});

// Mock ra-core as well (some components may import from ra-core directly)
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "test",
    })),
  };
});

// Mock logger to suppress structured logging in tests
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    metric: vi.fn(),
    breadcrumb: vi.fn(),
  },
}));

// Import mocked useListContext for per-test configuration
import { useListContext } from "react-admin";

describe("FilterableColumnHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("text filter icon activation", () => {
    test("activates when source@ilike exists in filterValues", () => {
      vi.mocked(useListContext).mockReturnValue({
        filterValues: { "name@ilike": "%test%" },
        setFilters: vi.fn(),
        sort: { field: "name", order: "ASC" },
        setSort: vi.fn(),
        resource: "test",
      });

      renderWithAdminContext(
        <FilterableColumnHeader source="name" label="Name" filterType="text" />
      );

      const trigger = screen.getByRole("button", { name: "Filter by Name" });
      // Active state: text-primary class applied
      expect(trigger.className).toContain("text-primary");
    });

    test("does NOT activate for empty @ilike value", () => {
      vi.mocked(useListContext).mockReturnValue({
        filterValues: { "name@ilike": "" },
        setFilters: vi.fn(),
        sort: { field: "name", order: "ASC" },
        setSort: vi.fn(),
        resource: "test",
      });

      renderWithAdminContext(
        <FilterableColumnHeader source="name" label="Name" filterType="text" />
      );

      const trigger = screen.getByRole("button", { name: "Filter by Name" });
      // Inactive state: text-muted-foreground class applied
      expect(trigger.className).toContain("text-muted-foreground");
    });

    test("does NOT activate when only bare source key exists", () => {
      vi.mocked(useListContext).mockReturnValue({
        filterValues: { name: "test" },
        setFilters: vi.fn(),
        sort: { field: "name", order: "ASC" },
        setSort: vi.fn(),
        resource: "test",
      });

      renderWithAdminContext(
        <FilterableColumnHeader source="name" label="Name" filterType="text" />
      );

      const trigger = screen.getByRole("button", { name: "Filter by Name" });
      // Bare key should not activate text filter -- only @ilike key matters
      expect(trigger.className).toContain("text-muted-foreground");
    });
  });

  describe("checkbox filter", () => {
    test("active count works for array values", () => {
      vi.mocked(useListContext).mockReturnValue({
        filterValues: { status: ["a", "b"] },
        setFilters: vi.fn(),
        sort: { field: "name", order: "ASC" },
        setSort: vi.fn(),
        resource: "test",
      });

      renderWithAdminContext(
        <FilterableColumnHeader
          source="status"
          label="Status"
          filterType="checkbox"
          choices={[
            { id: "a", name: "Active" },
            { id: "b", name: "Inactive" },
            { id: "c", name: "Pending" },
          ]}
        />
      );

      // The CheckboxColumnFilter renders its own trigger with badge
      const trigger = screen.getByRole("button", { name: "Filter by Status" });
      expect(trigger).toBeInTheDocument();

      // Badge should show count of 2
      const badge = screen.getByLabelText("2 filters active");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("2");
    });

    test("active badge shows correct count for multi-select", () => {
      vi.mocked(useListContext).mockReturnValue({
        filterValues: { type: ["customer", "prospect", "vendor"] },
        setFilters: vi.fn(),
        sort: { field: "name", order: "ASC" },
        setSort: vi.fn(),
        resource: "test",
      });

      renderWithAdminContext(
        <FilterableColumnHeader
          source="type"
          label="Type"
          filterType="checkbox"
          choices={[
            { id: "customer", name: "Customer" },
            { id: "prospect", name: "Prospect" },
            { id: "vendor", name: "Vendor" },
          ]}
        />
      );

      const badge = screen.getByLabelText("3 filters active");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("3");
    });
  });

  describe("filterType='none'", () => {
    test("renders label only with no filter trigger button", () => {
      vi.mocked(useListContext).mockReturnValue({
        filterValues: {},
        setFilters: vi.fn(),
        sort: { field: "name", order: "ASC" },
        setSort: vi.fn(),
        resource: "test",
      });

      renderWithAdminContext(
        <FilterableColumnHeader source="name" label="Name" filterType="none" />
      );

      // Label should be visible
      expect(screen.getByText("Name")).toBeInTheDocument();

      // No filter trigger button should exist
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("event propagation", () => {
    test("filter trigger click stops propagation", () => {
      vi.mocked(useListContext).mockReturnValue({
        filterValues: {},
        setFilters: vi.fn(),
        sort: { field: "name", order: "ASC" },
        setSort: vi.fn(),
        resource: "test",
      });

      const parentClickSpy = vi.fn();

      renderWithAdminContext(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div onClick={parentClickSpy}>
          <FilterableColumnHeader source="name" label="Name" filterType="text" />
        </div>
      );

      const trigger = screen.getByRole("button", { name: "Filter by Name" });
      fireEvent.click(trigger);

      // Parent handler should NOT be called because stopPropagation is called
      expect(parentClickSpy).not.toHaveBeenCalled();
    });
  });
});
