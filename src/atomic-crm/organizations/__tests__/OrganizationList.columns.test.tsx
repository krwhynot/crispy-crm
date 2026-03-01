/**
 * OrganizationList column structure tests
 *
 * Tests for the OrganizationList with 7 columns:
 * 1. Name - Primary identifier (sortable), includes inline parent/branches chips
 * 2. Type - Organization classification (sortable by organization_type)
 * 3. Priority - Business priority indicator (sortable)
 * 4. Segment - Playbook/Operator category (sortable by segment_name)
 * 5. State - US state code (sortable, filterable)
 * 6. Contacts - Computed count metric (non-sortable)
 * 7. Opportunities - Computed count metric (non-sortable)
 *
 * Parent hierarchy is shown as an inline chip in the Name cell (not a dedicated column).
 * Parent filtering is available via sidebar dropdown (not sortable).
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
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
  resetMocks,
} from "./OrganizationList.test-utils";

/**
 * Shared mock state for ListPageLayout branching.
 * Synced in beforeEach with the same values set on useListContext mock.
 */
const mockListState = vi.hoisted(() => ({
  data: [] as unknown[],
  isPending: false,
  filterValues: {} as Record<string, unknown>,
}));

// System filter keys excluded from empty-state detection (matches ListPageLayout)
const EMPTY_STATE_SYSTEM_KEYS = vi.hoisted(() => new Set(["deleted_at", "deleted_at@is", "$or"]));

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
    FunctionField: ({ label, sortBy, sortable, textAlign }: MockFieldProps) => {
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
          data-text-align={textAlign || ""}
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

vi.mock("@/components/ra-wrappers/PremiumDatagrid", () => ({
  PremiumDatagrid: ({
    children,
    onRowClick,
    configurable,
    preferenceKey,
    rowClassName,
  }: MockLayoutProps & {
    configurable?: boolean;
    preferenceKey?: string;
    rowClassName?: string | ((record: unknown, index: number) => string);
  }) => {
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
      <div
        data-testid="premium-datagrid"
        data-configurable={configurable ? "true" : "false"}
        data-preference-key={preferenceKey || ""}
        data-row-class-fn={typeof rowClassName === "function" ? "true" : "false"}
        className="table-row-premium"
      >
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

/** Captured sortFields from the most recent ListPageLayout render */
const capturedSortFields = vi.hoisted(() => ({ value: [] as string[] }));

vi.mock("@/components/layouts/ListPageLayout", () => ({
  ListPageLayout: ({
    children,
    filterComponent,
    viewSwitcher,
    emptyState,
    sortFields,
  }: {
    children: React.ReactNode;
    filterComponent?: React.ReactNode;
    viewSwitcher?: React.ReactNode;
    emptyState?: React.ReactNode;
    sortFields?: string[];
    [key: string]: unknown;
  }) => {
    if (sortFields) capturedSortFields.value = sortFields;
    const hasUserFilters =
      mockListState.filterValues &&
      Object.keys(mockListState.filterValues).some(
        (key: string) => !EMPTY_STATE_SYSTEM_KEYS.has(key)
      );

    if (mockListState.isPending) {
      return <div data-testid="loading-skeleton">Loading...</div>;
    }

    if (!mockListState.data?.length && !hasUserFilters && emptyState) {
      return <>{emptyState}</>;
    }

    if (!mockListState.data?.length && hasUserFilters) {
      return (
        <div data-testid="standard-list-layout">
          <div data-testid="filter-sidebar">{filterComponent}</div>
          {viewSwitcher && <div data-testid="toolbar-view-switcher">{viewSwitcher}</div>}
          <div data-testid="list-content">
            <div data-testid="list-no-results">No results</div>
          </div>
        </div>
      );
    }

    return (
      <div data-testid="standard-list-layout">
        <div data-testid="filter-sidebar">{filterComponent}</div>
        {viewSwitcher && <div data-testid="toolbar-view-switcher">{viewSwitcher}</div>}
        <div data-testid="list-content">{children}</div>
      </div>
    );
  },
}));

vi.mock("@/components/ra-wrappers/list", () => ({
  List: ({ children, actions }: MockChildrenProps & { actions?: React.ReactNode }) => (
    <div data-testid="list-wrapper">
      {actions !== false && actions}
      {children}
    </div>
  ),
}));

vi.mock("../OrganizationEmpty", () => ({
  OrganizationEmpty: () => <div data-testid="organization-empty">No organizations</div>,
}));

vi.mock("@/components/ra-wrappers/ListNoResults", () => ({
  ListNoResults: () => <div data-testid="list-no-results">No results</div>,
}));

vi.mock("@/components/ra-wrappers/bulk-actions-toolbar", () => ({
  BulkActionsToolbar: () => <div data-testid="bulk-actions-toolbar">Bulk Actions</div>,
}));

vi.mock("../OrganizationListFilter", () => ({
  OrganizationListFilter: () => <div data-testid="organization-list-filter">Filters</div>,
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

import { useListContext, useGetList } from "ra-core";

describe("OrganizationList 7-column structure", () => {
  beforeEach(() => {
    resetMocks();

    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    const listContext = {
      data: [
        {
          id: 1,
          name: "Tech Corp",
          organization_type: "restaurant",
          priority: "A",
          segment_id: "22222222-2222-4222-8222-000000000001",
          segment_name: "Major Broadline",
          parent_organization_id: null,
          nb_contacts: 5,
          nb_opportunities: 3,
        },
      ],
      total: 1,
      isPending: false,
      isLoading: false,
      filterValues: {},
      setFilters: vi.fn(),
      setSort: vi.fn(),
      setPage: vi.fn(),
      setPerPage: vi.fn(),
      page: 1,
      perPage: 25,
      sort: { field: "name", order: "ASC" },
      resource: "organizations",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
    };

    vi.mocked(useListContext).mockReturnValue(listContext);

    // Sync hoisted mock state for ListPageLayout branching
    mockListState.data = listContext.data;
    mockListState.isPending = listContext.isPending;
    mockListState.filterValues = listContext.filterValues;
  });

  test("renders 7 columns: Name, Type, Priority, Segment, State, Contacts, Opportunities", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();

      // Column 1: Name (FunctionField) - includes inline parent/branches chips
      expect(screen.getByTestId("function-field-Name")).toBeInTheDocument();

      // Column 2: Type (FunctionField)
      expect(screen.getByTestId("function-field-Type")).toBeInTheDocument();

      // Column 3: Priority (FunctionField)
      expect(screen.getByTestId("function-field-Priority")).toBeInTheDocument();

      // Column 4: Segment (FunctionField)
      expect(screen.getByTestId("function-field-Segment")).toBeInTheDocument();

      // Column 5: State (TextField)
      expect(screen.getByTestId("text-field-state")).toBeInTheDocument();

      // Column 6: Contacts (FunctionField)
      expect(screen.getByTestId("function-field-Contacts")).toBeInTheDocument();

      // Column 7: Opportunities (FunctionField)
      expect(screen.getByTestId("function-field-Opps")).toBeInTheDocument();
    });
  });
});

describe("OrganizationList column sorting configuration", () => {
  beforeEach(() => {
    resetMocks();

    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    const listContext = {
      data: [
        {
          id: 1,
          name: "Test Org",
          organization_type: "restaurant",
          priority: "A",
          segment_id: "22222222-2222-4222-8222-000000000001",
          segment_name: "Major Broadline",
          parent_organization_id: null,
          nb_contacts: 5,
          nb_opportunities: 3,
        },
      ],
      total: 1,
      isPending: false,
      isLoading: false,
      filterValues: {},
      setFilters: vi.fn(),
      setSort: vi.fn(),
      setPage: vi.fn(),
      setPerPage: vi.fn(),
      page: 1,
      perPage: 25,
      sort: { field: "name", order: "ASC" },
      resource: "organizations",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
    };

    vi.mocked(useListContext).mockReturnValue(listContext);

    // Sync hoisted mock state for ListPageLayout branching
    mockListState.data = listContext.data;
    mockListState.isPending = listContext.isPending;
    mockListState.filterValues = listContext.filterValues;
  });

  test("Name column is sortable", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const nameField = screen.getByTestId("function-field-Name");
      expect(nameField).toHaveAttribute("data-sortable", "true");
      expect(nameField).toHaveAttribute("data-sort-by", "name");
    });
  });

  test("Type column is sortable by organization_type", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const typeField = screen.getByTestId("function-field-Type");
      expect(typeField).toHaveAttribute("data-sortable", "true");
      expect(typeField).toHaveAttribute("data-sort-by", "organization_type");
    });
  });

  test("Priority column is sortable by priority", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const priorityField = screen.getByTestId("function-field-Priority");
      expect(priorityField).toHaveAttribute("data-sortable", "true");
      expect(priorityField).toHaveAttribute("data-sort-by", "priority");
    });
  });

  test("Segment column is sortable by segment_name", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const segmentField = screen.getByTestId("function-field-Segment");
      expect(segmentField).toHaveAttribute("data-sortable", "true");
      expect(segmentField).toHaveAttribute("data-sort-by", "segment_name");
    });
  });

  test("Contacts column is NOT sortable (computed count)", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const contactsField = screen.getByTestId("function-field-Contacts");
      expect(contactsField).toHaveAttribute("data-sortable", "false");
    });
  });

  test("Opportunities column is NOT sortable (computed count)", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const opportunitiesField = screen.getByTestId("function-field-Opps");
      expect(opportunitiesField).toHaveAttribute("data-sortable", "false");
    });
  });

  test("Contacts column is right-aligned", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const contactsField = screen.getByTestId("function-field-Contacts");
      expect(contactsField).toHaveAttribute("data-text-align", "right");
    });
  });

  test("Opportunities column is right-aligned", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const oppsField = screen.getByTestId("function-field-Opps");
      expect(oppsField).toHaveAttribute("data-text-align", "right");
    });
  });

  test("PremiumDatagrid receives rowClassName function for zebra striping", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toHaveAttribute("data-row-class-fn", "true");
    });
  });

  test("parent_organization_name is not in sortFields (filtering only)", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(capturedSortFields.value).not.toContain("parent_organization_name");
    });
  });
});
