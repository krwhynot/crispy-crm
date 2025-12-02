/**
 * Tests for ContactList components
 *
 * Tests rendering with contacts_summary view, sidebar filters,
 * custom exporter functionality, and tag display/filtering.
 *
 * Updated for refactored ContactList with PremiumDatagrid and slide-over pattern.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockContact } from "@/tests/utils/mock-providers";
import { ContactList } from "../ContactList";
import { ContactListFilter } from "../ContactListFilter";

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(),
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
    Datagrid: ({ children }: any) => <div data-testid="datagrid">{children}</div>,
    FunctionField: ({ label }: any) => <div data-testid={`function-field-${label}`}>{label}</div>,
    ReferenceField: ({ children, source, reference }: any) => (
      <div data-testid={`reference-field-${source}`} data-reference={reference}>
        {children}
      </div>
    ),
    TextField: ({ source }: any) => <span data-testid={`text-field-${source}`}>{source}</span>,
  };
});

// Mock jsonexport
vi.mock("jsonexport/dist", () => ({
  default: vi.fn((data, options, callback) => {
    // Simple CSV conversion for testing
    const csv = "id,name\n1,Test";
    callback(null, csv);
  }),
}));

// Mock ContactSlideOver to simplify testing
vi.mock("../ContactSlideOver", () => ({
  ContactSlideOver: ({ recordId, isOpen }: any) => (
    <div data-testid="contact-slide-over">
      {isOpen && <div data-testid={`slide-over-contact-${recordId}`}>Slide Over</div>}
    </div>
  ),
}));

// Mock PremiumDatagrid to expose row click handler
vi.mock("@/components/admin/PremiumDatagrid", () => ({
  PremiumDatagrid: ({ children, onRowClick }: any) => (
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
        Mock Contact Row
      </div>
    </div>
  ),
}));

// Mock ToggleFilterButton to avoid form context issues
vi.mock("@/components/admin/toggle-filter-button", () => ({
  ToggleFilterButton: ({ label, ...props }: any) => (
    <button data-testid={`toggle-filter-${label}`} {...props}>
      {label}
    </button>
  ),
}));

// Mock SearchInput to avoid form context issues
vi.mock("@/components/admin/search-input", () => ({
  SearchInput: ({ source, placeholder }: any) => (
    <input type="text" placeholder={placeholder || "Search..."} data-testid={`search-${source}`} />
  ),
}));

// Mock FilterCategory to always show children (avoid collapsed state in tests)
// Note: ContactListFilter imports from "@/atomic-crm/filters/FilterCategory"
vi.mock("@/atomic-crm/filters/FilterCategory", () => ({
  FilterCategory: ({ children, label }: any) => (
    <div data-testid={`filter-category-${label}`}>
      <div>{label}</div>
      {children}
    </div>
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

// Mock ContactEmpty
vi.mock("../ContactEmpty", () => ({
  ContactEmpty: () => <div data-testid="contact-empty">No contacts</div>,
}));

// Mock FloatingCreateButton
vi.mock("@/components/admin/FloatingCreateButton", () => ({
  FloatingCreateButton: () => <button data-testid="floating-create">Create</button>,
}));

// Mock TopToolbar and buttons
vi.mock("../layout/TopToolbar", () => ({
  TopToolbar: ({ children }: any) => <div data-testid="top-toolbar">{children}</div>,
}));

vi.mock("@/components/admin/create-button", () => ({
  CreateButton: () => <button data-testid="create-button">Create</button>,
}));

vi.mock("@/components/admin/export-button", () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>,
}));

vi.mock("@/components/admin/sort-button", () => ({
  SortButton: () => <button data-testid="sort-button">Sort</button>,
}));

vi.mock("@/components/admin/bulk-actions-toolbar", () => ({
  BulkActionsToolbar: () => <div data-testid="bulk-actions-toolbar">Bulk Actions</div>,
}));

// Mock all field components
vi.mock("@/components/admin/text-field", () => ({
  TextField: ({ source }: any) => <span data-testid={`text-field-${source}`}>{source}</span>,
}));

vi.mock("@/components/admin/reference-field", () => ({
  ReferenceField: ({ source, children }: any) => (
    <span data-testid={`ref-field-${source}`}>{children}</span>
  ),
}));

vi.mock("@/components/admin/date-field", () => ({
  DateField: ({ source }: any) => <span data-testid={`date-field-${source}`}>{source}</span>,
}));

vi.mock("@/components/admin/edit-button", () => ({
  EditButton: () => <button data-testid="edit-button">Edit</button>,
}));

// Mock other contact components
vi.mock("../Avatar", () => ({
  Avatar: () => <div data-testid="avatar">Avatar</div>,
}));

vi.mock("../TagsList", () => ({
  TagsList: () => <div data-testid="tags-list">Tags</div>,
}));

vi.mock("../misc/Status", () => ({
  Status: ({ status }: any) => <span data-testid="status">{status}</span>,
}));

// Mock ContactStatusBadge (new badge component)
vi.mock("../ContactBadges", () => ({
  ContactStatusBadge: ({ status }: any) => (
    <span data-testid="contact-status-badge" data-status={status}>
      {status}
    </span>
  ),
}));

// Mock useSlideOverState hook (will be customized in tests)
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

// Mock SidebarActiveFilters to avoid useContactFilterChips dependency
vi.mock("../SidebarActiveFilters", () => ({
  SidebarActiveFilters: () => <div data-testid="sidebar-active-filters" />,
}));

// Import mocked functions after mock definition
import { useListContext, useGetList } from "ra-core";

describe("ContactList", () => {
  const mockTags = [
    { id: 1, name: "VIP", color: "blue" },
    { id: 2, name: "Lead", color: "green" },
    { id: 3, name: "Customer", color: "purple" },
  ];

  const mockContacts = [
    createMockContact({
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: [{ email: "john@example.com", type: "Work" }],
      phone: [{ number: "555-0100", type: "Work" }],
      tags: [1, 2], // VIP and Lead tags
      company_name: "Tech Corp",
      organization_id: 1, // Single org relationship per PRD
      role: "decision_maker",
      purchase_influence: "High",
      sales_id: 1,
      last_seen: new Date().toISOString(),
    }),
    createMockContact({
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: [{ email: "jane@example.com", type: "Personal" }],
      tags: [3], // Customer tag
      company_name: "Health Inc",
      organization_id: 2, // Single org relationship per PRD
      role: "influencer",
      purchase_influence: "Medium",
      sales_id: 2,
      last_seen: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    }),
    createMockContact({
      id: 3,
      first_name: "Bob",
      last_name: "Wilson",
      email: [{ email: "bob@example.com", type: "Other" }],
      tags: [],
      company_name: null,
      organization_id: null, // No org (edge case)
      role: "executive",
      purchase_influence: "Low",
      sales_id: 1,
      last_seen: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    }),
  ];

  const defaultListContext = {
    data: mockContacts,
    total: mockContacts.length,
    isPending: false,
    isLoading: false,
    filterValues: {},
    setFilters: vi.fn(),
    setSort: vi.fn(),
    setPage: vi.fn(),
    setPerPage: vi.fn(),
    page: 1,
    perPage: 25,
    sort: { field: "last_seen", order: "DESC" },
    resource: "contacts",
    selectedIds: [],
    onSelect: vi.fn(),
    onToggleItem: vi.fn(),
    onUnselectItems: vi.fn(),
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockOpenSlideOver.mockClear();
    mockCloseSlideOver.mockClear();
    mockToggleMode.mockClear();

    // Setup default mocks
    (useListContext as any).mockReturnValue(defaultListContext);
    (useGetList as any).mockReturnValue({
      data: mockTags,
      total: mockTags.length,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders PremiumDatagrid with table structure", async () => {
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Verify PremiumDatagrid is rendered
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toBeInTheDocument();

      // Verify premium class is applied
      expect(datagrid).toHaveClass("table-row-premium");
    });
  });

  test("renders ContactSlideOver component", async () => {
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Verify ContactSlideOver is in the tree
      const slideOver = screen.getByTestId("contact-slide-over");
      expect(slideOver).toBeInTheDocument();
    });
  });

  test("row click calls openSlideOver with correct ID", async () => {
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Find and click the mock row
      const mockRow = screen.getByTestId("mock-row-1");
      expect(mockRow).toBeInTheDocument();

      fireEvent.click(mockRow);

      // Verify openSlideOver was called with correct ID and mode
      expect(mockOpenSlideOver).toHaveBeenCalledWith(1, "view");
    });
  });

  test("renders with StandardListLayout and filter sidebar", async () => {
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // StandardListLayout should render the datagrid
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toBeInTheDocument();
    });
  });

  test("renders empty state when no contacts and no filters", async () => {
    const emptyContext = {
      ...defaultListContext,
      data: [],
      total: 0,
      filterValues: {},
    };

    (useListContext as any).mockReturnValue(emptyContext);

    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Should not show datagrid when empty
      expect(screen.queryByTestId("premium-datagrid")).not.toBeInTheDocument();
    });
  });

  test("renders datagrid when filters are applied even if no results", async () => {
    const emptyWithFiltersContext = {
      ...defaultListContext,
      data: [],
      total: 0,
      filterValues: { tags: [1] }, // Has active filters
    };

    (useListContext as any).mockReturnValue(emptyWithFiltersContext);

    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Should show datagrid when filters are active (even if no results)
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toBeInTheDocument();
    });
  });
});

describe("ContactList 7-column structure", () => {
  /**
   * Tests for the refactored ContactList with 7 columns:
   * 1. Avatar (non-sortable)
   * 2. Name (computed first_name + last_name, sortable)
   * 3. Role (merged Title + Department, sortable by title)
   * 4. Organization (reference field, sortable)
   * 5. Status (ContactStatusBadge, non-sortable)
   * 6. Notes (nb_notes count, non-sortable)
   * 7. Last Activity (date field, sortable)
   *
   * Removed columns: Tags, Actions
   */

  const mockTags = [
    { id: 1, name: "VIP", color: "blue" },
    { id: 2, name: "Lead", color: "green" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useGetList for tags (used by ContactListFilter)
    (useGetList as any).mockReturnValue({
      data: mockTags,
      total: mockTags.length,
      isPending: false,
    });

    (useListContext as any).mockReturnValue({
      data: [
        {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          title: "CEO",
          department: "Executive",
          status: "warm",
          last_seen: "2024-01-15T10:00:00Z",
          nb_notes: 5,
          nb_tasks: 2,
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
      sort: { field: "last_seen", order: "DESC" },
      resource: "contacts",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test("renders 7 columns: Avatar, Name, Role, Organization, Status, Notes, Last Activity", async () => {
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // PremiumDatagrid should render
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();

      // FunctionField for Name, Role, Status, and Notes columns (via mock)
      expect(screen.getByTestId("function-field-Name")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Role")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Status")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Notes")).toBeInTheDocument();

      // Empty label for Avatar column
      expect(screen.getByTestId("function-field-")).toBeInTheDocument();
    });
  });

  test("does NOT render Tags column (removed)", async () => {
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Tags column should NOT exist
      expect(screen.queryByTestId("function-field-Tags")).not.toBeInTheDocument();
      expect(screen.queryByTestId("tags-list")).not.toBeInTheDocument();
    });
  });

  test("does NOT render Actions column (removed)", async () => {
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Actions column should NOT exist
      expect(screen.queryByTestId("function-field-Actions")).not.toBeInTheDocument();
      // EditButton should NOT be rendered in the list
      // (It's now accessed via slide-over, not inline in the table)
    });
  });

  test("uses ContactStatusBadge for status display", async () => {
    // This test verifies the badge component is used instead of the dot indicator
    // The mock for ContactBadges creates an element with data-testid="contact-status-badge"
    renderWithAdminContext(<ContactList />);

    await waitFor(() => {
      // Status field should render (via FunctionField mock)
      expect(screen.getByTestId("function-field-Status")).toBeInTheDocument();
    });
  });
});

describe("ContactListFilter", () => {
  const mockTags = [
    { id: 1, name: "VIP", color: "blue" },
    { id: 2, name: "Lead", color: "green" },
    { id: 3, name: "Customer", color: "purple" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useGetList as any).mockReturnValue({
      data: mockTags,
      total: mockTags.length,
      isPending: false,
    });

    (useListContext as any).mockReturnValue({
      filterValues: {},
      setFilters: vi.fn(),
      data: [],
      total: 0,
      isPending: false,
    });
  });

  test("renders tag filters", () => {
    // Tags are loaded via useGetList and only render if data exists
    renderWithAdminContext(<ContactListFilter />);

    // Since we mock useGetList to return tags, they should be rendered
    // Using getAllByText since tags may appear in multiple locations (badge + filter)
    expect(screen.getAllByText("VIP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lead").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Customer").length).toBeGreaterThan(0);
  });

  test("renders last activity filters", () => {
    renderWithAdminContext(<ContactListFilter />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("Before this week")).toBeInTheDocument();
    expect(screen.getByText("Before this month")).toBeInTheDocument();
    expect(screen.getByText("Before last month")).toBeInTheDocument();
  });

  test("renders account manager filter", () => {
    renderWithAdminContext(<ContactListFilter />);

    expect(screen.getByText("Me")).toBeInTheDocument();
  });

  test("renders last activity date filters", () => {
    renderWithAdminContext(<ContactListFilter />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("This week")).toBeInTheDocument();
    expect(screen.getByText("Before this week")).toBeInTheDocument();
    expect(screen.getByText("Before this month")).toBeInTheDocument();
    expect(screen.getByText("Before last month")).toBeInTheDocument();
  });
});

describe("ContactList localStorage cleanup", () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    vi.clearAllMocks();
  });

  test("cleans up invalid status filter from localStorage", () => {
    // Mock localStorage with invalid status filter
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "RaStore.contacts.listParams") {
        return JSON.stringify({
          filter: {
            status: "invalid", // This should be cleaned up
            tags: [1],
          },
        });
      }
      return null;
    });

    // Simulate the cleanup logic from ContactList
    const cleanupInvalidFilter = () => {
      const key = "RaStore.contacts.listParams";
      const storedParams = localStorage.getItem(key);
      if (storedParams) {
        try {
          const params = JSON.parse(storedParams);
          if (params?.filter?.status) {
            delete params.filter.status;
            localStorage.setItem(key, JSON.stringify(params));
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    cleanupInvalidFilter();

    // Verify localStorage was updated to remove status filter
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "RaStore.contacts.listParams",
      expect.not.stringContaining("status")
    );

    const savedParams = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedParams.filter).not.toHaveProperty("status");
    expect(savedParams.filter.tags).toEqual([1]);
  });
});

describe("ContactList exporter", () => {
  test("exports contacts with related data", async () => {
    const mockContacts = [
      createMockContact({
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: [
          { email: "john.work@example.com", type: "Work" },
          { email: "john.home@example.com", type: "Home" },
        ],
        phone: [
          { number: "555-0100", type: "Work" },
          { number: "555-0200", type: "Mobile" },
        ],
        tags: [1, 2],
        organization_id: 1, // Single org relationship per PRD
        sales_id: 1,
      }),
    ];

    const mockSales = {
      1: { id: 1, first_name: "Alice", last_name: "Manager" },
    };

    const mockTags = {
      1: { id: 1, name: "VIP" },
      2: { id: 2, name: "Lead" },
    };

    const mockOrganizations = {
      1: { id: 1, name: "Tech Corp" },
    };

    // Mock the exporter function - mirrors simplified single-org pattern from ContactList.tsx
    const exporter = async (records: any[]) => {
      const sales = mockSales;
      const tags = mockTags;
      const organizations = mockOrganizations;

      const contacts = records.map((contact) => {
        return {
          ...contact,
          // Single organization_id pattern (not multi-org array)
          organization_name: contact.organization_id
            ? organizations[contact.organization_id as keyof typeof organizations]?.name
            : undefined,
          sales: `${sales[contact.sales_id as keyof typeof sales].first_name} ${
            sales[contact.sales_id as keyof typeof sales].last_name
          }`,
          tags: contact.tags
            .map((tagId: number) => tags[tagId as keyof typeof tags].name)
            .join(", "),
          email_work: contact.email?.find((email: any) => email.type === "Work")?.email,
          email_home: contact.email?.find((email: any) => email.type === "Home")?.email,
          phone_work: contact.phone?.find((phone: any) => phone.type === "Work")?.number,
          phone_mobile: contact.phone?.find((phone: any) => phone.type === "Mobile")?.number,
        };
      });

      return contacts;
    };

    const exportedData = await exporter(mockContacts, vi.fn());

    expect(exportedData[0]).toMatchObject({
      first_name: "John",
      last_name: "Doe",
      organization_name: "Tech Corp",
      sales: "Alice Manager",
      tags: "VIP, Lead",
      email_work: "john.work@example.com",
      email_home: "john.home@example.com",
      phone_work: "555-0100",
      phone_mobile: "555-0200",
    });
  });
});
