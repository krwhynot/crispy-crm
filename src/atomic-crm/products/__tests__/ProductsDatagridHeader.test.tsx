/**
 * ProductsDatagridHeader Tests
 *
 * Tests for column header components in the Products datagrid:
 * - ProductCategoryHeader: dynamic choices from distinct_product_categories view
 * - ProductStatusHeader: static choices from PRODUCT_STATUS_CHOICES
 *
 * Covers loading, error, and resolved states for dynamic data.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ProductCategoryHeader, ProductStatusHeader } from "../ProductsDatagridHeader";

// Mock react-admin
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "products",
    })),
    useGetList: vi.fn(() => ({
      data: undefined,
      isPending: true,
      error: undefined,
    })),
  };
});

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "products",
    })),
    useGetList: vi.fn(() => ({
      data: undefined,
      isPending: true,
      error: undefined,
    })),
  };
});

// Mock logger
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

import { useGetList, useListContext } from "react-admin";

describe("ProductCategoryHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useListContext).mockReturnValue({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "products",
    });
  });

  test("renders with filterType='none' while loading", () => {
    vi.mocked(useGetList).mockReturnValue({
      data: undefined,
      isPending: true,
      error: undefined,
      total: undefined,
    });

    renderWithAdminContext(<ProductCategoryHeader />);

    // Should show label text "Category"
    expect(screen.getByText("Category")).toBeInTheDocument();

    // No filter trigger button should be rendered in "none" mode
    expect(screen.queryByRole("button", { name: /filter/i })).not.toBeInTheDocument();
  });

  test("renders with choices after useGetList resolves", () => {
    vi.mocked(useGetList).mockReturnValue({
      data: [{ id: "beverages", name: "Beverages" }],
      isPending: false,
      error: undefined,
      total: 1,
    });

    renderWithAdminContext(<ProductCategoryHeader />);

    // Should show label text "Category"
    expect(screen.getByText("Category")).toBeInTheDocument();

    // Should have a filter trigger button (checkbox filter renders its own)
    const trigger = screen.getByRole("button", { name: "Filter by Category" });
    expect(trigger).toBeInTheDocument();
  });

  test("renders filterType='none' on error", () => {
    vi.mocked(useGetList).mockReturnValue({
      data: undefined,
      isPending: false,
      error: new Error("fail"),
      total: undefined,
    });

    renderWithAdminContext(<ProductCategoryHeader />);

    // Should show label text "Category" but no filter trigger
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /filter/i })).not.toBeInTheDocument();
  });
});

describe("ProductStatusHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useListContext).mockReturnValue({
      filterValues: {},
      setFilters: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "products",
    });
  });

  test("renders with 3 status choices", () => {
    renderWithAdminContext(<ProductStatusHeader />);

    // Should show label text "Status"
    expect(screen.getByText("Status")).toBeInTheDocument();

    // Should have a filter trigger button for checkbox filter
    const trigger = screen.getByRole("button", { name: "Filter by Status" });
    expect(trigger).toBeInTheDocument();
  });
});
