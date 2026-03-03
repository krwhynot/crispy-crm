import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ProductDistributorList } from "../ProductDistributorList";

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: [
        {
          id: 1,
          product_name: "Widget A",
          distributor_name: "Dist Co",
          vendor_item_number: "DOT-001",
          status: "active",
          valid_from: "2025-01-01",
          valid_to: "2025-12-31",
        },
      ],
      total: 1,
      isLoading: false,
      isPending: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "created_at", order: "DESC" },
      setSort: vi.fn(),
      resource: "product_distributors",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
    })),
    useGetIdentity: () => ({
      data: { id: 1, fullName: "Test User", sales_id: 1 },
      isLoading: false,
    }),
  };
});

vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    TextField: ({ source, label }: { source: string; label?: string }) => (
      <span data-testid={`field-${source}`}>{label || source}</span>
    ),
    DateField: ({ source, label }: { source: string; label?: string }) => (
      <span data-testid={`field-${source}`}>{label || source}</span>
    ),
    SelectField: ({ source }: { source: string }) => (
      <span data-testid={`field-${source}`}>{source}</span>
    ),
  };
});

vi.mock("@/components/ra-wrappers/list", () => ({
  List: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="list-wrapper">{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/PremiumDatagrid", () => ({
  PremiumDatagrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="premium-datagrid">{children}</div>
  ),
}));

vi.mock("@/components/layouts/ListPageLayout", () => ({
  ListPageLayout: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="list-page-layout">{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/create-button", () => ({
  CreateButton: () => <button data-testid="create-button">Create</button>,
}));

vi.mock("@/components/ra-wrappers/list-pagination", () => ({
  ListPagination: () => <div data-testid="list-pagination" />,
}));

vi.mock("../ProductDistributorListFilter", () => ({
  ProductDistributorListFilter: () => <div data-testid="filter" />,
}));

describe("ProductDistributorList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders with datagrid and column fields", async () => {
    renderWithAdminContext(<ProductDistributorList />);

    await waitFor(() => {
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();
      expect(screen.getByTestId("field-product_name")).toBeInTheDocument();
      expect(screen.getByTestId("field-distributor_name")).toBeInTheDocument();
      expect(screen.getByTestId("field-vendor_item_number")).toBeInTheDocument();
      expect(screen.getByTestId("field-status")).toBeInTheDocument();
      expect(screen.getByTestId("field-valid_from")).toBeInTheDocument();
      expect(screen.getByTestId("field-valid_to")).toBeInTheDocument();
    });
  });

  test("renders within List and ListPageLayout wrappers", async () => {
    renderWithAdminContext(<ProductDistributorList />);

    await waitFor(() => {
      expect(screen.getByTestId("list-wrapper")).toBeInTheDocument();
      expect(screen.getByTestId("list-page-layout")).toBeInTheDocument();
    });
  });
});
