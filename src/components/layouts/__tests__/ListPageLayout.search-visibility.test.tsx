/**
 * Tests for ListPageLayout search auto-detection
 *
 * Verifies that ListPageLayout computes effectiveShowSearch from
 * isResourceSearchable() and forwards it to ListToolbar. Also tests
 * that explicit showSearch overrides auto-detection.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Capture props passed to ListToolbar
let capturedToolbarProps: Record<string, unknown> = {};

vi.mock("../ListToolbar", () => ({
  ListToolbar: (props: Record<string, unknown>) => {
    capturedToolbarProps = props;
    return <div data-testid="list-toolbar" />;
  },
}));

// Mock searchability: contacts and organizations are searchable, others are not
vi.mock("@/atomic-crm/searchability", () => ({
  isResourceSearchable: (resource: string) => ["contacts", "organizations"].includes(resource),
}));

// Mock FilterSidebarProvider as a passthrough
vi.mock("../FilterSidebarContext", () => ({
  FilterSidebarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFilterSidebarContext: () => ({
    isCollapsed: false,
    toggleSidebar: vi.fn(),
    isSheetOpen: false,
    setSheetOpen: vi.fn(),
    activeFilterCount: 0,
    hasToolbar: false,
    setHasToolbar: vi.fn(),
    orSource: null,
    setOrSource: vi.fn(),
  }),
}));

// Mock AdaptiveFilterContainer
vi.mock("../AdaptiveFilterContainer", () => ({
  AdaptiveFilterContainer: () => <div data-testid="filter-container" />,
}));

// Mock ListPageHeader
vi.mock("../ListPageHeader", () => ({
  ListPageHeader: () => <div data-testid="list-page-header" />,
}));

// Mock FilterChipBar
vi.mock("@/atomic-crm/filters/FilterChipBar", () => ({
  FilterChipBar: () => <div data-testid="filter-chip-bar" />,
}));

// Mock useFilterCleanup
vi.mock("@/atomic-crm/hooks/useFilterCleanup", () => ({
  useFilterCleanup: vi.fn(),
}));

// Mock listFilterSemantics
vi.mock("../listFilterSemantics", () => ({
  hasActiveUserFiltersWithOrSource: () => false,
}));

// Mock BulkActionsToolbar
vi.mock("@/components/ra-wrappers/bulk-actions-toolbar", () => ({
  BulkActionsToolbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ListNoResults
vi.mock("@/components/ra-wrappers/ListNoResults", () => ({
  ListNoResults: () => <div data-testid="no-results" />,
}));

// Mock ListSkeleton
vi.mock("@/components/ui/list-skeleton", () => ({
  ListSkeleton: () => <div data-testid="list-skeleton" />,
}));

// Mock ra-core ListContext with data so toolbar renders
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  const React = await import("react");

  // Create a mock ListContext value with data
  const mockListContextValue = {
    data: [{ id: 1 }],
    total: 1,
    isPending: false,
    isLoading: false,
    isFetching: false,
    filterValues: {},
    setFilters: vi.fn(),
    displayedFilters: {},
    sort: { field: "id", order: "ASC" },
    setSort: vi.fn(),
    page: 1,
    perPage: 25,
    setPage: vi.fn(),
    setPerPage: vi.fn(),
    resource: "test",
    selectedIds: [],
    onSelect: vi.fn(),
    onToggleItem: vi.fn(),
    onUnselectItems: vi.fn(),
    refetch: vi.fn(),
    error: null,
  };

  return {
    ...actual,
    ListContext: React.createContext(mockListContextValue),
    useListContext: () => mockListContextValue,
    useTranslate:
      () =>
      (key: string): string =>
        key,
  };
});

import { ListPageLayout } from "../ListPageLayout";

describe("ListPageLayout search auto-detection", () => {
  beforeEach(() => {
    capturedToolbarProps = {};
  });

  test("passes showSearch=true to ListToolbar for searchable resources", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(
      <ListPageLayout resource="contacts" sortFields={["first_name", "last_name"]}>
        <div>content</div>
      </ListPageLayout>
    );

    expect(screen.getByTestId("list-toolbar")).toBeInTheDocument();
    expect(capturedToolbarProps.showSearch).toBe(true);
  });

  test("passes showSearch=false to ListToolbar for non-searchable resources", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(
      <ListPageLayout resource="tasks" sortFields={["due_date"]}>
        <div>content</div>
      </ListPageLayout>
    );

    expect(screen.getByTestId("list-toolbar")).toBeInTheDocument();
    expect(capturedToolbarProps.showSearch).toBe(false);
  });

  test("showSearch=true override forces true on non-searchable resources", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(
      <ListPageLayout resource="tasks" sortFields={["due_date"]} showSearch={true}>
        <div>content</div>
      </ListPageLayout>
    );

    expect(screen.getByTestId("list-toolbar")).toBeInTheDocument();
    expect(capturedToolbarProps.showSearch).toBe(true);
  });

  test("showSearch=false override forces false on searchable resources", () => {
    // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
    render(
      <ListPageLayout resource="contacts" sortFields={["first_name"]} showSearch={false}>
        <div>content</div>
      </ListPageLayout>
    );

    expect(screen.getByTestId("list-toolbar")).toBeInTheDocument();
    expect(capturedToolbarProps.showSearch).toBe(false);
  });
});
