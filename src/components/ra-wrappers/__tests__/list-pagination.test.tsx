/**
 * Tests for ListPagination component
 *
 * Validates export button visibility behavior (default hidden, opt-in via showExport),
 * selection-aware hiding, and layout regression for pagination controls.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ListPagination } from "../list-pagination";

// Mutable mock state for per-test control
const mockPaginationContext = {
  hasPreviousPage: false,
  hasNextPage: true,
  page: 1,
  perPage: 10,
  setPerPage: vi.fn(),
  total: 50,
  setPage: vi.fn(),
};

let mockSelectedIds: (string | number)[] = [];

const mockListContext = {
  get selectedIds() {
    return mockSelectedIds;
  },
  isPending: false,
  data: [{ id: 1 }, { id: 2 }],
  filterValues: {},
  resource: "items",
  sort: { field: "id", order: "ASC" as const },
  setFilters: vi.fn(),
  displayedFilters: {},
  showFilter: vi.fn(),
  hideFilter: vi.fn(),
  setSort: vi.fn(),
  onSelect: vi.fn(),
  onToggleItem: vi.fn(),
  onUnselectItems: vi.fn(),
};

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListPaginationContext: vi.fn(() => mockPaginationContext),
    useListContext: vi.fn(() => mockListContext),
    useTranslate: vi.fn(() => (_key: string, opts?: { _?: string }) => opts?._ ?? _key),
  };
});

// Stub ExportButton to avoid its transitive hook deps (useDataProvider, useNotify, etc.)
vi.mock("@/components/ra-wrappers/export-button", () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>,
}));

describe("ListPagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedIds = [];
  });

  describe("Export Button Visibility", () => {
    test("default render does not show export button", () => {
      renderWithAdminContext(<ListPagination />);
      expect(screen.queryByTestId("export-button")).not.toBeInTheDocument();
    });

    test("showExport={true} renders export button when no rows selected", () => {
      renderWithAdminContext(<ListPagination showExport />);
      expect(screen.getByTestId("export-button")).toBeInTheDocument();
    });

    test("showExport={true} hides export button when rows are selected", () => {
      mockSelectedIds = [1, 2];
      renderWithAdminContext(<ListPagination showExport />);
      expect(screen.queryByTestId("export-button")).not.toBeInTheDocument();
    });
  });

  describe("Layout Regression", () => {
    test("pagination controls render correctly with default showExport=false", () => {
      renderWithAdminContext(<ListPagination />);

      // Rows per page label
      expect(screen.getByText("Rows per page")).toBeInTheDocument();

      // Page range text
      expect(screen.getByText("1-10 of 50")).toBeInTheDocument();

      // Navigation buttons
      expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();

      // Page input
      expect(screen.getByLabelText("Page number")).toBeInTheDocument();

      // Total pages
      expect(screen.getByText("of 5")).toBeInTheDocument();
    });
  });
});
