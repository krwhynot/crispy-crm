/**
 * SalesList Smoke Test
 *
 * Verifies that SalesList renders without throwing errors.
 * SalesList uses useGetIdentity for identity-aware rendering
 * and UnifiedListPageLayout for the standard list pattern.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

// Mock react-admin
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "first_name", order: "ASC" },
      setSort: vi.fn(),
      setPage: vi.fn(),
      setPerPage: vi.fn(),
      page: 1,
      perPage: 25,
      resource: "sales",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
      error: undefined,
    })),
    useGetIdentity: vi.fn(() => ({
      data: { id: 1, fullName: "Test User", sales_id: 1 },
      isPending: false,
    })),
    FunctionField: ({
      label,
      render: _render,
    }: {
      label: string;
      render?: (record: Record<string, unknown>) => React.ReactNode;
    }) => <div data-testid={`function-field-${label}`}>{label}</div>,
    useRecordContext: vi.fn(() => null),
    EmailField: ({ source }: { source: string }) => (
      <span data-testid={`email-field-${source}`}>{source}</span>
    ),
    TextField: ({ source }: { source: string }) => (
      <span data-testid={`text-field-${source}`}>{source}</span>
    ),
  };
});

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isPending: false,
      isLoading: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "first_name", order: "ASC" },
      setSort: vi.fn(),
      setPage: vi.fn(),
      setPerPage: vi.fn(),
      page: 1,
      perPage: 25,
      resource: "sales",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
      error: undefined,
    })),
    useGetIdentity: vi.fn(() => ({
      data: { id: 1, fullName: "Test User", sales_id: 1 },
      isPending: false,
    })),
  };
});

// Mock component dependencies to isolate SalesList rendering
vi.mock("@/components/ra-wrappers/list", () => ({
  List: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="list-wrapper">{children}</div>
  ),
}));

vi.mock("@/components/layouts/UnifiedListPageLayout", () => ({
  UnifiedListPageLayout: ({
    children,
    filterComponent,
  }: {
    children: React.ReactNode;
    filterComponent: React.ReactNode;
  }) => (
    <div data-testid="unified-list-layout">
      <div data-testid="filter-sidebar">{filterComponent}</div>
      <div data-testid="list-content">{children}</div>
    </div>
  ),
}));

vi.mock("@/components/ra-wrappers/PremiumDatagrid", () => ({
  PremiumDatagrid: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="premium-datagrid">{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/RowHoverActions", () => ({
  RowHoverActions: () => <div data-testid="row-hover-actions" />,
}));

vi.mock("@/components/ui/list-skeleton", () => ({
  SalesListSkeleton: () => <div data-testid="sales-skeleton">Loading...</div>,
}));

vi.mock("@/components/ra-wrappers/create-button", () => ({
  CreateButton: () => <button data-testid="create-button">Create</button>,
}));

vi.mock("@/hooks/useSlideOverState", () => ({
  useSlideOverState: () => ({
    slideOverId: null,
    isOpen: false,
    mode: "view" as const,
    openSlideOver: vi.fn(),
    closeSlideOver: vi.fn(),
    toggleMode: vi.fn(),
  }),
}));

vi.mock("@/hooks/useListKeyboardNavigation", () => ({
  useListKeyboardNavigation: () => ({ focusedIndex: -1 }),
}));

vi.mock("../SalesSlideOver", () => ({
  SalesSlideOver: () => <div data-testid="sales-slide-over" />,
}));

vi.mock("../SalesListFilter", () => ({
  SalesListFilter: () => <div data-testid="sales-list-filter" />,
}));

// Mock FilterChipBar if used by UnifiedListPageLayout internals
vi.mock("../../filters", () => ({
  FilterChipBar: () => <div data-testid="filter-chip-bar" />,
}));

// Import SalesList (default export)
import SalesList from "../SalesList";

describe("SalesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders without errors (smoke test)", () => {
    expect(() => {
      renderWithAdminContext(<SalesList />);
    }).not.toThrow();
  });
});
