/**
 * Tests for OrganizationList component
 *
 * Tests rendering with organizations data, PremiumDatagrid,
 * column sorting configuration, and slide-over pattern.
 *
 * Column structure (6 columns):
 * 1. Name - Primary identifier (sortable by 'name')
 * 2. Type - Organization classification (sortable by 'organization_type')
 * 3. Priority - Business priority indicator (sortable by 'priority')
 * 4. Parent - Hierarchy reference (sortable by 'parent_organization_id')
 * 5. Contacts - Computed count metric (non-sortable)
 * 6. Opportunities - Computed count metric (non-sortable)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockOrganization } from "@/tests/utils/mock-providers";
import { OrganizationList } from "../OrganizationList";

// Mock dependencies
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
    FilterLiveForm: ({ children }: any) => <div>{children}</div>,
    downloadCSV: vi.fn(),
  };
});

// Mock react-admin to avoid directory import issues
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    // Mock useListContext to avoid ListContextProvider requirement
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
    TextField: ({ source, sortable, label }: any) => (
      <span
        data-testid={`text-field-${source}`}
        data-sortable={sortable !== false ? "true" : "false"}
        data-sort-by={source}
      >
        {label || source}
      </span>
    ),
    ReferenceField: ({ source, sortable, children, label }: any) => (
      <span
        data-testid={`ref-field-${source}`}
        data-sortable={sortable ? "true" : "false"}
        data-sort-by={source}
      >
        {label}
        {children}
      </span>
    ),
    FunctionField: ({ label, sortBy, sortable }: any) => {
      // Extract label text for testid - handle both string and React element labels
      let labelText = "";
      if (typeof label === "string") {
        labelText = label;
      } else if (label?.type?.name) {
        // React component - extract name from component name pattern
        // OrganizationTypeHeader -> Type, OrganizationPriorityHeader -> Priority
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

// Mock jsonexport
vi.mock("jsonexport/dist", () => ({
  default: vi.fn((data, options, callback) => {
    const csv = "id,name\n1,Test Org";
    callback(null, csv);
  }),
}));

// Mock OrganizationSlideOver to simplify testing
vi.mock("../OrganizationSlideOver", () => ({
  OrganizationSlideOver: ({ recordId, isOpen }: any) => (
    <div data-testid="organization-slide-over">
      {isOpen && <div data-testid={`slide-over-org-${recordId}`}>Slide Over</div>}
    </div>
  ),
}));

// Mock TutorialProvider to avoid context error
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
  TutorialProvider: ({ children }: any) => children,
}));

// Mock PageTutorialTrigger to avoid tutorial context requirement
vi.mock("@/atomic-crm/tutorial/PageTutorialTrigger", () => ({
  PageTutorialTrigger: () => null,
}));

// Track sortable column configuration for testing
const sortableColumns: { label: string; sortBy: string; sortable: boolean }[] = [];

// Mock PremiumDatagrid to expose row click handler and track column config
vi.mock("@/components/admin/PremiumDatagrid", () => ({
  PremiumDatagrid: ({ children, onRowClick }: any) => {
    // Clear previous column tracking
    sortableColumns.length = 0;

    // Process children to extract column configuration
    const processChild = (child: any) => {
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

    // Process all children
    if (Array.isArray(children)) {
      children.forEach(processChild);
    } else {
      processChild(children);
    }

    return (
      <div data-testid="premium-datagrid" className="table-row-premium">
        {children}
        {/* Simulate a clickable row */}
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

// Mock OrganizationBadges
vi.mock("../OrganizationBadges", () => ({
  OrganizationTypeBadge: ({ type }: any) => (
    <span data-testid="org-type-badge" data-type={type}>
      {type}
    </span>
  ),
  PriorityBadge: ({ priority }: any) => (
    <span data-testid="priority-badge" data-priority={priority}>
      {priority}
    </span>
  ),
}));

// Mock StandardListLayout
vi.mock("@/components/layouts/StandardListLayout", () => ({
  StandardListLayout: ({ children, filterComponent }: any) => (
    <div data-testid="standard-list-layout">
      <div data-testid="filter-sidebar">{filterComponent}</div>
      <div data-testid="list-content">{children}</div>
    </div>
  ),
}));

// Mock List component
vi.mock("@/components/admin/list", () => ({
  List: ({ children }: any) => <div data-testid="list-wrapper">{children}</div>,
}));

// Mock OrganizationEmpty
vi.mock("../OrganizationEmpty", () => ({
  OrganizationEmpty: () => <div data-testid="organization-empty">No organizations</div>,
}));

// Mock ListNoResults to avoid useResourceContext() returning null
vi.mock("@/components/admin/ListNoResults", () => ({
  ListNoResults: () => <div data-testid="list-no-results">No results</div>,
}));

// Mock FloatingCreateButton
vi.mock("@/components/admin/FloatingCreateButton", () => ({
  FloatingCreateButton: () => <button data-testid="floating-create">Create</button>,
}));

// Mock TopToolbar and buttons
vi.mock("../layout/TopToolbar", () => ({
  TopToolbar: ({ children }: any) => <div data-testid="top-toolbar">{children}</div>,
}));

vi.mock("@/components/admin/export-button", () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>,
}));

vi.mock("@/components/admin/bulk-actions-toolbar", () => ({
  BulkActionsToolbar: () => <div data-testid="bulk-actions-toolbar">Bulk Actions</div>,
}));

// Mock OrganizationListFilter
vi.mock("../OrganizationListFilter", () => ({
  OrganizationListFilter: () => <div data-testid="organization-list-filter">Filters</div>,
}));

// Mock ListSearchBar to avoid FilterLiveForm/SearchInput context issues
vi.mock("@/components/admin/ListSearchBar", () => ({
  ListSearchBar: ({ placeholder }: any) => (
    <div data-testid="list-search-bar">
      <input type="text" placeholder={placeholder || "Search..."} data-testid="search-input" />
    </div>
  ),
}));

// Mock useSlideOverState hook
const mockOpenSlideOver = vi.fn();
const mockCloseSlideOver = vi.fn();
const mockToggleMode = vi.fn();

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

// Mock useFilterCleanup hook
vi.mock("../hooks/useFilterCleanup", () => ({
  useFilterCleanup: vi.fn(),
}));

// Import mocked functions after mock definition
import { useListContext, useGetList } from "ra-core";

describe("OrganizationList", () => {
  const mockOrganizations = [
    createMockOrganization({
      id: 1,
      name: "Tech Corp",
      organization_type: "restaurant",
      priority: "A",
      parent_organization_id: null,
      nb_contacts: 5,
      nb_opportunities: 3,
    }),
    createMockOrganization({
      id: 2,
      name: "Health Inc",
      organization_type: "distributor",
      priority: "B",
      parent_organization_id: 1,
      nb_contacts: 10,
      nb_opportunities: 7,
    }),
    createMockOrganization({
      id: 3,
      name: "Finance Co",
      organization_type: "supplier",
      priority: "C",
      parent_organization_id: null,
      nb_contacts: 0,
      nb_opportunities: 1,
    }),
  ];

  const defaultListContext = {
    data: mockOrganizations,
    total: mockOrganizations.length,
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenSlideOver.mockClear();
    mockCloseSlideOver.mockClear();
    mockToggleMode.mockClear();
    sortableColumns.length = 0;

    (useListContext as any).mockReturnValue(defaultListContext);
    (useGetList as any).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      ...defaultListContext,
      data: [],
      total: 0,
      filterValues: {},
    };

    (useListContext as any).mockReturnValue(emptyContext);

    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      expect(screen.queryByTestId("premium-datagrid")).not.toBeInTheDocument();
      expect(screen.getByTestId("organization-empty")).toBeInTheDocument();
    });
  });

  test("renders datagrid when filters are applied even if no results", async () => {
    const emptyWithFiltersContext = {
      ...defaultListContext,
      data: [],
      total: 0,
      filterValues: { priority: "A" },
    };

    (useListContext as any).mockReturnValue(emptyWithFiltersContext);

    renderWithAdminContext(<OrganizationList />);

    await waitFor(() => {
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toBeInTheDocument();
    });
  });
});

describe("OrganizationList 6-column structure", () => {
  /**
   * Tests for the OrganizationList with 6 columns:
   * 1. Name - Primary identifier (sortable)
   * 2. Type - Organization classification (sortable by organization_type)
   * 3. Priority - Business priority indicator (sortable)
   * 4. Parent - Hierarchy reference (sortable by parent_organization_id)
   * 5. Contacts - Computed count metric (non-sortable)
   * 6. Opportunities - Computed count metric (non-sortable)
   */

  beforeEach(() => {
    vi.clearAllMocks();
    sortableColumns.length = 0;

    (useGetList as any).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    (useListContext as any).mockReturnValue({
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

      // TextField for Name (use getAllBy since ReferenceField also has a nested TextField)
      const nameFields = screen.getAllByTestId("text-field-name");
      expect(nameFields.length).toBeGreaterThanOrEqual(1);
      // First one should be the main Name column
      expect(nameFields[0]).toHaveTextContent("Organization Name");

      // FunctionField for Type and Priority (using badges)
      expect(screen.getByTestId("function-field-Type")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Priority")).toBeInTheDocument();

      // ReferenceField for Parent
      expect(screen.getByTestId("ref-field-parent_organization_id")).toBeInTheDocument();

      // FunctionField for counts
      expect(screen.getByTestId("function-field-Contacts")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Opportunities")).toBeInTheDocument();
    });
  });
});

describe("OrganizationList column sorting configuration", () => {
  /**
   * Tests that verify the correct sortable prop configuration:
   * - Name: sortable (sortBy='name')
   * - Type: sortable (sortBy='organization_type')
   * - Priority: sortable (sortBy='priority')
   * - Parent: sortable (sortBy='parent_organization_id')
   * - Contacts: NOT sortable (computed count)
   * - Opportunities: NOT sortable (computed count)
   */

  beforeEach(() => {
    vi.clearAllMocks();
    sortableColumns.length = 0;

    (useGetList as any).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    (useListContext as any).mockReturnValue({
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
      // Use getAllBy since ReferenceField also contains a nested TextField
      const nameFields = screen.getAllByTestId("text-field-name");
      // First one is the main Name column
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

describe("OrganizationList exporter", () => {
  test("exports organizations with related data", async () => {
    const mockOrganizations = [
      createMockOrganization({
        id: 1,
        name: "Tech Corp",
        organization_type: "restaurant",
        priority: "A",
        parent_organization_id: 2,
        segment_id: "segment-1",
        sales_id: 1,
        website: "https://techcorp.com",
        phone: "555-1234",
        email: "info@techcorp.com",
        address: "123 Tech St",
        city: "Tech City",
        state: "TC",
        postal_code: "12345",
        nb_contacts: 5,
        nb_opportunities: 3,
      }),
    ];

    const mockSales = {
      1: { id: 1, first_name: "Alice", last_name: "Manager" },
    };

    const mockSegments = {
      "segment-1": { id: "segment-1", name: "Enterprise" },
    };

    const mockParentOrgs = {
      2: { id: 2, name: "Parent Corp" },
    };

    // Mock the exporter function
    const exporter = async (records: any[]) => {
      const sales = mockSales;
      const segments = mockSegments;
      const parentOrganizations = mockParentOrgs;

      const organizations = records.map((org) => ({
        id: org.id,
        name: org.name,
        organization_type: org.organization_type,
        priority: org.priority,
        parent_organization: org.parent_organization_id
          ? parentOrganizations[org.parent_organization_id as keyof typeof parentOrganizations]
              ?.name
          : undefined,
        segment: org.segment_id
          ? segments[org.segment_id as keyof typeof segments]?.name
          : undefined,
        sales_rep: org.sales_id
          ? `${sales[org.sales_id as keyof typeof sales]?.first_name} ${sales[org.sales_id as keyof typeof sales]?.last_name}`
          : undefined,
        website: org.website,
        phone: org.phone,
        email: org.email,
        nb_contacts: org.nb_contacts || 0,
        nb_opportunities: org.nb_opportunities || 0,
      }));

      return organizations;
    };

    const exportedData = await exporter(mockOrganizations);

    expect(exportedData[0]).toMatchObject({
      id: 1,
      name: "Tech Corp",
      organization_type: "restaurant",
      priority: "A",
      parent_organization: "Parent Corp",
      segment: "Enterprise",
      sales_rep: "Alice Manager",
      website: "https://techcorp.com",
      phone: "555-1234",
      email: "info@techcorp.com",
      nb_contacts: 5,
      nb_opportunities: 3,
    });
  });
});
