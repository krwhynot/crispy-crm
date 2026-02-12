/**
 * Tests for ProductList component
 *
 * Tests rendering with products data, PremiumDatagrid,
 * column sorting configuration, badge components, and slide-over pattern.
 *
 * Column structure (5 columns):
 * 1. Name - Primary identifier (sortable by 'name')
 * 2. Category - Classification badge (sortable by 'category')
 * 3. Status - Lifecycle badge (sortable by 'status')
 * 4. Principal - Organization reference (sortable by 'principal_id')
 * 5. Certifications - Badges list (non-sortable)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { createMockProduct } from "@/tests/utils/mock-providers";
import { ProductList } from "../ProductList";

interface MockFieldProps {
  source?: string;
  sortable?: boolean;
  sortBy?: string;
  label?: string | React.ReactElement;
  children?: React.ReactNode;
  render?: (record: Record<string, unknown>) => React.ReactNode;
}

interface MockSlideOverProps {
  recordId?: number | null;
  isOpen?: boolean;
}

interface MockDatagridProps {
  children?: React.ReactNode;
  onRowClick?: (id: number) => void;
}

interface MockDatagridColumnProps {
  label?: string | React.ReactElement;
  sortBy?: string;
  sortable?: boolean;
  source?: string;
}

interface MockLayoutProps {
  children?: React.ReactNode;
  filterComponent?: React.ReactNode;
}

interface MockBadgeProps {
  children?: React.ReactNode;
  variant?: string;
}

interface MockFilterableBadgeProps {
  children?: React.ReactNode;
  source?: string;
  value?: string;
}

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isLoading: false,
      isPending: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "products",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
    })),
    useGetList: vi.fn(),
    useGetIdentity: () => ({
      data: { id: 1, fullName: "Test User", sales_id: 1 },
      isPending: false,
    }),
    FilterLiveForm: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    downloadCSV: vi.fn(),
  };
});

// Mock react-admin to avoid directory import issues
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: [],
      total: 0,
      isLoading: false,
      isPending: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "name", order: "ASC" },
      setSort: vi.fn(),
      resource: "products",
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
    FunctionField: ({ label, sortBy, sortable, render }: MockFieldProps) => {
      // Extract label text for testid - handle both string and React element labels
      let labelText = "";
      if (typeof label === "string") {
        labelText = label;
      } else if (label?.type?.name) {
        // React component - extract name from component name pattern
        // ProductCategoryHeader -> Category, ProductStatusHeader -> Status
        const name = label.type.name;
        labelText = name.replace(/^Product/, "").replace(/Header$/, "");
      }

      // Mock record for rendering badge components
      const mockRecord = {
        id: 1,
        name: "Test Product",
        category: "dry_goods",
        status: "active",
        certifications: ["Organic"],
      };

      return (
        <div
          data-testid={`function-field-${labelText}`}
          data-sortable={sortBy ? "true" : sortable === false ? "false" : "unknown"}
          data-sort-by={sortBy || ""}
        >
          {label}
          {render && render(mockRecord)}
        </div>
      );
    },
  };
});

// Mock jsonexport
vi.mock("jsonexport/dist", () => ({
  default: vi.fn((data, options, callback) => {
    const csv = "id,name\n1,Test Product";
    callback(null, csv);
  }),
}));

// Mock @/components/ra-wrappers/text-field (used by ProductList)
vi.mock("@/components/ra-wrappers/text-field", () => ({
  TextField: ({ source, sortable, label }: MockFieldProps) => (
    <span
      data-testid={`text-field-${source}`}
      data-sortable={sortable !== false ? "true" : "false"}
      data-sort-by={source}
    >
      {label || source}
    </span>
  ),
}));

// Mock @/components/ra-wrappers/reference-field (used by ProductList)
vi.mock("@/components/ra-wrappers/reference-field", () => ({
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
}));

// Mock ProductSlideOver to simplify testing
vi.mock("../ProductSlideOver", () => ({
  ProductSlideOver: ({ recordId, isOpen }: MockSlideOverProps) => (
    <div data-testid="product-slide-over">
      {isOpen && <div data-testid={`slide-over-product-${recordId}`}>Slide Over</div>}
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
  TutorialProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock PageTutorialTrigger to avoid tutorial context requirement
vi.mock("@/atomic-crm/tutorial/PageTutorialTrigger", () => ({
  PageTutorialTrigger: () => null,
}));

// Track sortable column configuration for testing
const sortableColumns: { label: string; sortBy: string; sortable: boolean }[] = [];

// Mock PremiumDatagrid to expose row click handler and track column config
vi.mock("@/components/ra-wrappers/PremiumDatagrid", () => ({
  PremiumDatagrid: ({ children, onRowClick }: MockDatagridProps) => {
    // Clear previous column tracking
    sortableColumns.length = 0;

    // Process children to extract column configuration
    const processChild = (
      child: React.ReactElement<MockDatagridColumnProps> | null | undefined
    ) => {
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
          Mock Product Row
        </div>
      </div>
    );
  },
}));

// Mock ProductsDatagridHeader components
vi.mock("../ProductsDatagridHeader", () => ({
  ProductNameHeader: () => <span data-testid="product-name-header">Product Name</span>,
  ProductCategoryHeader: () => <span data-testid="product-category-header">Category</span>,
  ProductStatusHeader: () => <span data-testid="product-status-header">Status</span>,
}));

// Mock StandardListLayout
vi.mock("@/components/layouts/StandardListLayout", () => ({
  StandardListLayout: ({ children, filterComponent }: MockLayoutProps) => (
    <div data-testid="standard-list-layout">
      <div data-testid="filter-sidebar">{filterComponent}</div>
      <div data-testid="list-content">{children}</div>
    </div>
  ),
}));

// Mock List component
vi.mock("@/components/ra-wrappers/list", () => ({
  List: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="list-wrapper">{children}</div>
  ),
}));

// Mock ProductEmpty
vi.mock("../ProductEmpty", () => ({
  ProductEmpty: () => <div data-testid="product-empty">No products</div>,
}));

// Mock FloatingCreateButton
vi.mock("@/components/ra-wrappers/FloatingCreateButton", () => ({
  FloatingCreateButton: () => <button data-testid="floating-create">Create</button>,
}));

// Mock TopToolbar
vi.mock("../layout/TopToolbar", () => ({
  TopToolbar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="top-toolbar">{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/bulk-actions-toolbar", () => ({
  BulkActionsToolbar: () => <div data-testid="bulk-actions-toolbar">Bulk Actions</div>,
}));

// Mock ProductListFilter
vi.mock("../ProductListFilter", () => ({
  ProductListFilter: () => <div data-testid="product-list-filter">Filters</div>,
}));

// Mock ListSearchBar to avoid FilterLiveForm/SearchInput context issues
vi.mock("@/components/ra-wrappers/ListSearchBar", () => ({
  ListSearchBar: ({ placeholder }: { placeholder?: string }) => (
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

// Mock useFilterCleanup hook - note: this hook is in the parent hooks directory
vi.mock("@/atomic-crm/hooks/useFilterCleanup", () => ({
  useFilterCleanup: vi.fn(),
}));

// Mock Badge component
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant }: MockBadgeProps) => (
    <span data-testid={`badge-${variant || "default"}`} data-variant={variant || "default"}>
      {children}
    </span>
  ),
}));

// Mock FilterableBadge component
vi.mock("@/components/ra-wrappers/FilterableBadge", () => ({
  FilterableBadge: ({ children, source, value }: MockFilterableBadgeProps) => (
    <div data-testid={`filterable-badge-${source}`} data-value={value}>
      {children}
    </div>
  ),
}));

// Import mocked functions after mock definition
import { useListContext, useGetList } from "ra-core";

describe("ProductList", () => {
  const mockProducts = [
    createMockProduct({
      id: 1,
      name: "Organic Flour",
      sku: "ORG-001",
      category: "dry_goods",
      status: "active",
      principal_id: 1,
      certifications: ["USDA Organic", "Non-GMO"],
    }),
    createMockProduct({
      id: 2,
      name: "Premium Olive Oil",
      sku: "OIL-002",
      category: "oils",
      status: "active",
      principal_id: 2,
      certifications: ["Extra Virgin"],
    }),
    createMockProduct({
      id: 3,
      name: "Legacy Sauce",
      sku: "SAU-003",
      category: "sauces",
      status: "discontinued",
      principal_id: 1,
      certifications: [],
    }),
  ];

  const defaultListContext = {
    data: mockProducts,
    total: mockProducts.length,
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
    resource: "products",
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

    vi.mocked(useListContext).mockReturnValue(defaultListContext);
    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("renders PremiumDatagrid with table structure", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toBeInTheDocument();
      expect(datagrid).toHaveClass("table-row-premium");
    });
  });

  test("renders ProductSlideOver component", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const slideOver = screen.getByTestId("product-slide-over");
      expect(slideOver).toBeInTheDocument();
    });
  });

  test("row click calls openSlideOver with correct ID", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const mockRow = screen.getByTestId("mock-row-1");
      expect(mockRow).toBeInTheDocument();

      fireEvent.click(mockRow);

      expect(mockOpenSlideOver).toHaveBeenCalledWith(1, "view");
    });
  });

  test("renders with StandardListLayout and filter sidebar", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      expect(screen.getByTestId("standard-list-layout")).toBeInTheDocument();
      expect(screen.getByTestId("filter-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();
    });
  });

  test("renders empty state when no products and no filters", async () => {
    const emptyContext = {
      ...defaultListContext,
      data: [],
      total: 0,
      filterValues: {},
    };

    vi.mocked(useListContext).mockReturnValue(emptyContext);

    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      expect(screen.queryByTestId("premium-datagrid")).not.toBeInTheDocument();
      expect(screen.getByTestId("product-empty")).toBeInTheDocument();
    });
  });

  test("renders datagrid when filters are applied even if no results", async () => {
    const emptyWithFiltersContext = {
      ...defaultListContext,
      data: [],
      total: 0,
      filterValues: { category: "oils" },
    };

    vi.mocked(useListContext).mockReturnValue(emptyWithFiltersContext);

    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const datagrid = screen.getByTestId("premium-datagrid");
      expect(datagrid).toBeInTheDocument();
    });
  });
});

describe("ProductList 5-column structure", () => {
  /**
   * Tests for the ProductList with 5 columns:
   * 1. Name - Primary identifier (sortable)
   * 2. Category - Classification badge (sortable by category)
   * 3. Status - Lifecycle badge (sortable by status)
   * 4. Principal - Organization reference (sortable by principal_id)
   * 5. Certifications - Badges list (non-sortable)
   */

  beforeEach(() => {
    vi.clearAllMocks();
    sortableColumns.length = 0;

    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    vi.mocked(useListContext).mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test Product",
          sku: "TST-001",
          category: "dry_goods",
          status: "active",
          principal_id: 1,
          certifications: ["Organic"],
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
      resource: "products",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test("renders 5 columns: Name, Category, Status, Principal, Certifications", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      expect(screen.getByTestId("premium-datagrid")).toBeInTheDocument();

      // TextField for Name (primary column, may have nested TextField in ReferenceField too)
      const nameFields = screen.getAllByTestId("text-field-name");
      expect(nameFields.length).toBeGreaterThanOrEqual(1);

      // FunctionField for Category and Status (using badges)
      expect(screen.getByTestId("function-field-Category")).toBeInTheDocument();
      expect(screen.getByTestId("function-field-Status")).toBeInTheDocument();

      // TextField for Principal (uses principal_name from summary view)
      expect(screen.getByTestId("text-field-principal_name")).toBeInTheDocument();

      // FunctionField for Certifications
      expect(screen.getByTestId("function-field-Certifications")).toBeInTheDocument();
    });
  });
});

describe("ProductList column sorting configuration", () => {
  /**
   * Tests that verify the correct sortable prop configuration:
   * - Name: sortable (sortBy='name')
   * - Category: sortable (sortBy='category')
   * - Status: sortable (sortBy='status')
   * - Principal: sortable (sortBy='principal_id')
   * - Certifications: NOT sortable (badges list)
   */

  beforeEach(() => {
    vi.clearAllMocks();
    sortableColumns.length = 0;

    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    vi.mocked(useListContext).mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test Product",
          sku: "TST-001",
          category: "dry_goods",
          status: "active",
          principal_id: 1,
          certifications: ["Organic"],
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
      resource: "products",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test("Name column is sortable", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      // Use getAllBy since ReferenceField also contains a nested TextField
      const nameFields = screen.getAllByTestId("text-field-name");
      // First one is the main Name column
      const nameField = nameFields[0];
      expect(nameField).toHaveAttribute("data-sortable", "true");
      expect(nameField).toHaveAttribute("data-sort-by", "name");
    });
  });

  test("Category column is sortable by category", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const categoryField = screen.getByTestId("function-field-Category");
      expect(categoryField).toHaveAttribute("data-sortable", "true");
      expect(categoryField).toHaveAttribute("data-sort-by", "category");
    });
  });

  test("Status column is sortable by status", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const statusField = screen.getByTestId("function-field-Status");
      expect(statusField).toHaveAttribute("data-sortable", "true");
      expect(statusField).toHaveAttribute("data-sort-by", "status");
    });
  });

  test("Principal column is sortable", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const principalField = screen.getByTestId("text-field-principal_name");
      expect(principalField).toHaveAttribute("data-sortable", "true");
      expect(principalField).toHaveAttribute("data-sort-by", "principal_name");
    });
  });

  test("Certifications column is NOT sortable", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const certificationsField = screen.getByTestId("function-field-Certifications");
      expect(certificationsField).toHaveAttribute("data-sortable", "false");
    });
  });
});

describe("ProductList badge components", () => {
  /**
   * Tests that verify badge component usage:
   * - CategoryBadge for category column
   * - StatusBadge for status column with semantic variants
   * - CertificationBadges for certifications with overflow handling
   */

  beforeEach(() => {
    vi.clearAllMocks();
    sortableColumns.length = 0;

    vi.mocked(useGetList).mockReturnValue({
      data: [],
      total: 0,
      isPending: false,
    });

    vi.mocked(useListContext).mockReturnValue({
      data: [
        {
          id: 1,
          name: "Test Product",
          sku: "TST-001",
          category: "dry_goods",
          status: "active",
          principal_id: 1,
          certifications: ["Organic", "Non-GMO", "Kosher", "Halal"],
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
      resource: "products",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  test("Category column uses FilterableBadge wrapper", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const categoryBadge = screen.getByTestId("filterable-badge-category");
      expect(categoryBadge).toBeInTheDocument();
    });
  });

  test("Status column uses FilterableBadge wrapper", async () => {
    renderWithAdminContext(<ProductList />);

    await waitFor(() => {
      const statusBadge = screen.getByTestId("filterable-badge-status");
      expect(statusBadge).toBeInTheDocument();
    });
  });
});
