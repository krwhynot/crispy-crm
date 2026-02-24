/**
 * Tests for ListToolbar search bar visibility
 *
 * Verifies that the showSearch prop controls ListSearchBar rendering
 * while keeping other toolbar elements (filter toggle, sort) intact.
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock ListSearchBar as a stub
vi.mock("@/components/ra-wrappers/ListSearchBar", () => ({
  ListSearchBar: () => <div data-testid="list-search-bar" />,
}));

// Mock SortButton as a stub
vi.mock("@/components/ra-wrappers/sort-button", () => ({
  SortButton: () => <div data-testid="sort-button" />,
}));

// Mock FilterSidebarContext
vi.mock("../FilterSidebarContext", () => ({
  useFilterSidebarContext: () => ({
    setHasToolbar: vi.fn(),
    isCollapsed: false,
    toggleSidebar: vi.fn(),
    isSheetOpen: false,
    setSheetOpen: vi.fn(),
    activeFilterCount: 0,
    hasToolbar: true,
    orSource: null,
    setOrSource: vi.fn(),
  }),
  useOptionalFilterSidebarContext: () => null,
}));

// Mock useListViewport
vi.mock("../useListViewport", () => ({
  useListHasDockedFilters: () => false,
}));

// Mock listFilterReset
vi.mock("../listFilterReset", () => ({
  resetListFilters: vi.fn(),
}));

// Mock ra-core hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: () => ({
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
    }),
    useListSortContext: () => ({
      sort: { field: "id", order: "ASC" },
      setSort: vi.fn(),
      resource: "test",
    }),
    useTranslate:
      () =>
      (key: string): string =>
        key,
    useTranslateLabel:
      () =>
      (props: Record<string, unknown>): string =>
        String(props.source ?? ""),
  };
});

import { TooltipProvider } from "@/components/ui/tooltip";
import { ListToolbar } from "../ListToolbar";

function renderToolbar(props: Partial<React.ComponentProps<typeof ListToolbar>> = {}) {
  // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
  return render(
    <TooltipProvider>
      <ListToolbar sortFields={["name", "created_at"]} {...props} />
    </TooltipProvider>
  );
}

describe("ListToolbar search visibility", () => {
  test("renders ListSearchBar when showSearch is true (default)", () => {
    renderToolbar();

    expect(screen.getByTestId("list-search-bar")).toBeInTheDocument();
  });

  test("renders ListSearchBar when showSearch is explicitly true", () => {
    renderToolbar({ showSearch: true });

    expect(screen.getByTestId("list-search-bar")).toBeInTheDocument();
  });

  test("does not render ListSearchBar when showSearch is false", () => {
    renderToolbar({ showSearch: false });

    expect(screen.queryByTestId("list-search-bar")).not.toBeInTheDocument();
  });

  test("filter toggle button remains visible when search is hidden", () => {
    renderToolbar({ showSearch: false });

    // Filter toggle should still be present
    const filterButton = screen.getByRole("button", { name: /filters/i });
    expect(filterButton).toBeInTheDocument();

    // Search bar should NOT be present
    expect(screen.queryByTestId("list-search-bar")).not.toBeInTheDocument();
  });
});
