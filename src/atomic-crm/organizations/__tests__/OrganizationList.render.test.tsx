/**
 * OrganizationList rendering tests
 *
 * Tests basic rendering, layout structure, and empty states.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OrganizationList } from "../OrganizationList";
import {
  type MockChildrenProps,
  type MockFieldProps,
  type MockLayoutProps,
  type MockBadgeProps,
  mockOpenSlideOver,
  mockCloseSlideOver,
  mockToggleMode,
  sortableColumns,
  mockOrganizations,
  createDefaultListContext,
  resetMocks,
} from "./OrganizationList.test-utils";

// Mock dependencies - must be at top level
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isLoading: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "organizations",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
    })),
    useGetList: vi.fn(),
    useGetIdentity: () => ({
      data: { id: 1, fullName: "Test User", sales_id: 1 },
      isLoading: false,
    }),
    FilterLiveForm: ({ children }: MockChildrenProps) => <div>{children}</div>,
    downloadCSV: vi.fn(),
  };
});

vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isLoading: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "organizations",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
    })),
    TextField: ({ source, sortable, label }: MockFieldProps) => (
      <span
        data-testid={`text-field-${source}`}
        data-sortable={sortable !== false ? "true" : "false"}
        data-sort-by={source}
      >
        {label || source}
      </span>
    ),
    ReferenceField: ({ source, sortable, children, label }: MockFieldProps) => (
      <span
        data-testid={`ref-field-${source}`}
        data-sortable={sortable ? "true" : "false"}
        data-sort-by={source}
      >
        {label}
        {children}
      </span>
    ),
    FunctionField: ({ label, sortBy, sortable }: MockFieldProps) => {
      let labelText = "";
      if (typeof label === "string") {
        labelText = label;
      } else if (label?.type?.name) {
        const name = label.type.name;
        labelText = name.replace(/^Organization/, "").replace(/Header$/, "");
      }

      return (
        <div
          data-testid={`function-field-${labelText}`}
          data-sortable={sortBy ? "true" : sortable === false ? "false" : "unknown"}
          data-sort-by={sortBy || ""}
        >
          {label}
        </div>
      );
    },
  };
});

vi.mock("jsonexport/dist", () => ({
  default: vi.fn((data, options, callback) => {
    const csv = "id,name\n1,Test Org";
    callback(null, csv);
  }),
}));

vi.mock("../OrganizationSlideOver", () => ({
  OrganizationSlideOver: ({ recordId, isOpen }: MockLayoutProps) => (
    <div data-testid="organization-slide-over">
      {isOpen && <div data-testid={`slide-over-org-${recordId}`}>Slide Over</div>}
    </div>
  ),
}));

vi.mock("@/atomic-crm/tutorial/TutorialProvider", () => ({
  useTutorial: () => ({
    isActive: false,
    currentChapter: null,
    currentStep: null,
    startTutorial: vi.fn(),
    endTutorial: vi.fn(),
    nextStep: vi.fn(),
    previousStep: vi.fn(),
    skipTutorial: vi.fn(),
  }),
  TutorialProvider: ({ children }: MockChildrenProps) => children,
}));

vi.mock("@/atomic-crm/tutorial/PageTutorialTrigger", () => ({
  PageTutorialTrigger: () => null,
}));

vi.mock("@/components/ra-wrappers/PremiumDatagrid", () => ({
  PremiumDatagrid: ({ children, onRowClick }: MockLayoutProps) => {
    sortableColumns.length = 0;

    const processChild = (child: React.ReactNode) => {
      if (!child?.props) return;

      const { label, sortBy, sortable, source } = child.props;
      const columnLabel = label || source || "";
      const columnSortBy = sortBy || source || "";
      const isSortable = sortBy !== undefined || sortable === true;

      if (columnLabel) {
        sortableColumns.push({
          label: columnLabel,
          sortBy: columnSortBy,
          sortable: sortable !== false && (isSortable || sortable === undefined),
        });
      }
    };

    if (Array.isArray(children)) {
      children.forEach(processChild);
    } else {
      processChild(children);
    }

    return (
      <div data-testid="premium-datagrid" className="table-row-premium">
        {children}
        <div
          data-testid="mock-row-1"
          onClick={() => onRowClick && onRowClick(1)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              if (onRowClick) onRowClick(1);
            }
          }}
          role="row"
          tabIndex={0}
        >
          Mock Organization Row
        </div>
      </div>
    );
  },
}));

vi.mock("../OrganizationBadges", () => ({
  OrganizationTypeBadge: ({ type }: MockBadgeProps) => (
    <span data-testid="org-type-badge" data-type={type}>
      {type}
    </span>
  ),
  PriorityBadge: ({ priority }: MockBadgeProps) => (
    <span data-testid="priority-badge" data-priority={priority}>
      {priority}
    </span>
  ),
}));

vi.mock("@/components/layouts/StandardListLayout", () => ({
  StandardListLayout: ({ children, filterComponent }: MockLayoutProps) => (
    <div data-testid="standard-list-layout">
      <div data-testid="filter-sidebar">{filterComponent}</div>
      <div data-testid="list-content">{children}</div>
    </div>
  ),
}));

vi.mock("@/components/ra-wrappers/list", () => ({
  List: ({ children }: MockChildrenProps) => <div data-testid="list-wrapper">{children}</div>,
}));

vi.mock("../OrganizationEmpty", () => ({
  OrganizationEmpty: () => <div data-testid="organization-empty">No organizations</div>,
}));

vi.mock("@/components/ra-wrappers/ListNoResults", () => ({
  ListNoResults: () => <div data-testid="list-no-results">No results</div>,
}));

vi.mock("@/components/ra-wrappers/FloatingCreateButton", () => ({
  FloatingCreateButton: () => <button data-testid="floating-create">Create</button>,
}));

vi.mock("../layout/TopToolbar", () => ({
  TopToolbar: ({ children }: MockChildrenProps) => <div data-testid="top-toolbar">{children}</div>,
}));

vi.mock("@/components/ra-wrappers/export-button", () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>,
}));

vi.mock("@/components/ra-wrappers/bulk-actions-toolbar", () => ({
  BulkActionsToolbar: () => <div data-testid="bulk-actions-toolbar">Bulk Actions</div>,
}));

vi.mock("../OrganizationListFilter", () => ({
  OrganizationListFilter: () => <div data-testid="organization-list-filter">Filters</div>,
}));

vi.mock("@/components/ra-wrappers/ListSearchBar", () => ({
  ListSearchBar: ({ placeholder }: MockLayoutProps) => (
    <div data-testid="list-search-bar">
      <input type="text" placeholder={placeholder || "Search..."} data-testid="search-input" />
    </div>
  ),
}));

vi.mock("@/hooks/useSlideOverState", () => ({
  useSlideOverState: () => ({
    slideOverId: null,
    isOpen: false,
    mode: "view" as const,
    openSlideOver: mockOpenSlideOver,
    closeSlideOver: mockCloseSlideOver,
    toggleMode: mockToggleMode,
  }),
}));

vi.mock("../hooks/useFilterCleanup", () => ({
  useFilterCleanup: vi.fn(),
}));

vi.mock("../OrganizationViewSwitcher", () => ({
  OrganizationViewSwitcher: ({
    view,
    onViewChange,
  }: {
    view: string;
    onViewChange: (v: string) => void;
  }) => (
    <div data-testid="org-view-switcher" data-view={view}>
      <button data-testid="switch-to-list" onClick={() => onViewChange("list")}>
        List
      </button>
      <button data-testid="switch-to-card" onClick={() => onViewChange("card")}>
        Card
      </button>
    </div>
  ),
}));

vi.mock("../OrganizationCardGrid", () => ({
  OrganizationCardGrid: ({ onCardClick }: { onCardClick: (id: number) => void }) => (
    <div data-testid="organization-card-grid">
      <div
        data-testid="mock-card-1"
        onClick={() => onCardClick(1)}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") onCardClick(1);
        }}
        role="button"
        tabIndex={0}
      >
        Mock Card
      </div>
    </div>
  ),
}));

import { useListContext, useGetList } from "ra-core";

describe("OrganizationList rendering", () => {
  beforeEach(() => {
    resetMocks();
    localStorage.removeItem("organization.view.preference");
    vi.mocked(useListContext).mockReturnValue(createDefaultListContext());
    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.removeItem("organization.view.preference");
  });

  test("renders PremiumDatagrid with table structure", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toBeInTheDocument();
      expect(datagrid).toHaveClass("table-row-premium");
    });
  });

  test("renders OrganizationSlideOver component", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const slideOver = screen.getByTestId("organization-slide-over");
      expect(slideOver).toBeInTheDocument();
    });
  });

  test("row click calls openSlideOver with correct ID", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const mockRow = screen.getByTestId("mock-row-1");
      expect(mockRow).toBeInTheDocument();

      fireEvent.click(mockRow);

      expect(mockOpenSlideOver).toHaveBeenCalledWith(1, "view");
    });
  });

  test("renders with StandardListLayout and filter sidebar", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByTestId("standard-list-layout")).toBeInTheDocument();
      expect(screen.getByTestId("filter-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();
    });
  });

  test("renders empty state when no organizations and no filters", async () => {
    const emptyContext = {
      ...createDefaultListContext(),
      data: [],
      total: 0,
      filterValues: {},
    };

    vi.mocked(useListContext).mockReturnValue(emptyContext);

    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.queryByTestId("premium-datagrid")).not.toBeInTheDocument();
      expect(screen.getByTestId("organization-empty")).toBeInTheDocument();
    });
  });

  test("renders ListNoResults when filters are applied with no results", async () => {
    const emptyWithFiltersContext = {
      ...createDefaultListContext(),
      data: [],
      total: 0,
      filterValues: { priority: "A" },
    };

    vi.mocked(useListContext).mockReturnValue(emptyWithFiltersContext);

    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const noResults = screen.getByTestId("list-no-results");
      expect(noResults).toBeInTheDocument();
    });
  });

  test("renders view switcher in toolbar", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByTestId("org-view-switcher")).toBeInTheDocument();
    });
  });

  test("defaults to list view showing PremiumDatagrid", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();
      expect(screen.queryByTestId("organization-card-grid")).not.toBeInTheDocument();
    });
  });

  test("switches to card view when card toggle is clicked", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("switch-to-card"));

    await waitFor(() => {
      expect(screen.getByTestId("organization-card-grid")).toBeInTheDocument();
      expect(screen.queryByTestId("premium-datagrid")).not.toBeInTheDocument();
    });
  });

  test("renders card grid when localStorage preference is card", async () => {
    localStorage.setItem("organization.view.preference", "card");

    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByTestId("organization-card-grid")).toBeInTheDocument();
      expect(screen.queryByTestId("premium-datagrid")).not.toBeInTheDocument();
    });
  });

  test("card click calls openSlideOver with correct ID", async () => {
    localStorage.setItem("organization.view.preference", "card");

    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const mockCard = screen.getByTestId("mock-card-1");
      expect(mockCard).toBeInTheDocument();

      fireEvent.click(mockCard);

      expect(mockOpenSlideOver).toHaveBeenCalledWith(1, "view");
    });
  });
});
