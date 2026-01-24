/**
 * OrganizationList column structure tests
 *
 * Tests for the OrganizationList with 6 columns:
 * 1. Name - Primary identifier (sortable)
 * 2. Type - Organization classification (sortable by organization_type)
 * 3. Priority - Business priority indicator (sortable)
 * 4. Parent - Hierarchy reference (sortable by parent_organization_id)
 * 5. Contacts - Computed count metric (non-sortable)
 * 6. Opportunities - Computed count metric (non-sortable)
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

import { useListContext, useGetList } from "ra-core";

describe("OrganizationList 6-column structure", () => {
  beforeEach(() => {
    resetMocks();

    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    vi.mocked(useListContext).mockReturnValue({
      data: [
        {
          id: 1,
          name: "Tech Corp",
          organization_type: "restaurant",
          priority: "A",
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
    });
  });

  test("renders 6 columns: Name, Type, Priority, Parent, Contacts, Opportunities", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();

      const nameFields = screen.getAllByTestId("text-field-name");
      expect(nameFields.length).toBeGreaterThanOrEqual(1);
      expect(nameFields[0]).toHaveTextContent("Organization Name");

      expect(screen.getByTestId("function-field-Type")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Priority")).toBeInTheDocument();

      expect(screen.getByTestId("ref-field-parent_organization_id")).toBeInTheDocument();

      expect(screen.getByTestId("function-field-Contacts")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Opportunities")).toBeInTheDocument();
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

    vi.mocked(useListContext).mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test Org",
          organization_type: "restaurant",
          priority: "A",
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
    });
  });

  test("Name column is sortable", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const nameFields = screen.getAllByTestId("text-field-name");
      const nameField = nameFields[0];
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

  test("Parent column is sortable", async () => {
    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const parentField = screen.getByTestId("ref-field-parent_organization_id");
      expect(parentField).toHaveAttribute("data-sortable", "true");
      expect(parentField).toHaveAttribute("data-sort-by", "parent_organization_id");
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
      const opportunitiesField = screen.getByTestId("function-field-Opportunities");
      expect(opportunitiesField).toHaveAttribute("data-sortable", "false");
    });
  });
});
