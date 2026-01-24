/**
 * Shared test utilities for OrganizationList tests
 *
 * This module provides common mock setup, types, and utilities
 * used across the split OrganizationList test files.
 */

import { vi } from "vitest";
import { createMockOrganization } from "@/tests/utils/mock-providers";

// Mock component prop types
export interface MockChildrenProps {
  children?: React.ReactNode;
}

export interface MockFieldProps extends MockChildrenProps {
  source?: string;
  sortable?: boolean;
  label?: string;
  sortBy?: string;
}

export interface MockLayoutProps extends MockChildrenProps {
  filterComponent?: React.ReactNode;
  onRowClick?: (id: string | number, resource: string, record: unknown) => void;
  recordId?: string | number;
  isOpen?: boolean;
  placeholder?: string;
}

export interface MockBadgeProps {
  type?: string;
  priority?: string;
  status?: string;
}

// Track sortable column configuration for testing
export const sortableColumns: { label: string; sortBy: string; sortable: boolean }[] = [];

// Mock function references for slide-over state
export const mockOpenSlideOver = vi.fn();
export const mockCloseSlideOver = vi.fn();
export const mockToggleMode = vi.fn();

// Standard mock organizations for testing
export const mockOrganizations = [
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

// Default list context for testing
export const defaultListContext = {
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

/**
 * Setup all vi.mock calls for OrganizationList tests.
 * IMPORTANT: This function must be called BEFORE any imports
 * that depend on these mocks. Use vi.hoisted() or call at module level.
 */
export function setupOrganizationListMocks(): void {
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
      FilterLiveForm: ({ children }: MockChildrenProps) => <div>{children}</div>,
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

  // Mock jsonexport
  vi.mock("jsonexport/dist", () => ({
    default: vi.fn((data, options, callback) => {
      const csv = "id,name\n1,Test Org";
      callback(null, csv);
    }),
  }));

  // Mock OrganizationSlideOver to simplify testing
  vi.mock("../OrganizationSlideOver", () => ({
    OrganizationSlideOver: ({ recordId, isOpen }: MockLayoutProps) => (
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
    TutorialProvider: ({ children }: MockChildrenProps) => children,
  }));

  // Mock PageTutorialTrigger to avoid tutorial context requirement
  vi.mock("@/atomic-crm/tutorial/PageTutorialTrigger", () => ({
    PageTutorialTrigger: () => null,
  }));

  // Mock PremiumDatagrid to expose row click handler and track column config
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

  // Mock OrganizationBadges
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
    List: ({ children }: MockChildrenProps) => <div data-testid="list-wrapper">{children}</div>,
  }));

  // Mock OrganizationEmpty
  vi.mock("../OrganizationEmpty", () => ({
    OrganizationEmpty: () => <div data-testid="organization-empty">No organizations</div>,
  }));

  // Mock ListNoResults to avoid useResourceContext() returning null
  vi.mock("@/components/ra-wrappers/ListNoResults", () => ({
    ListNoResults: () => <div data-testid="list-no-results">No results</div>,
  }));

  // Mock FloatingCreateButton
  vi.mock("@/components/ra-wrappers/FloatingCreateButton", () => ({
    FloatingCreateButton: () => <button data-testid="floating-create">Create</button>,
  }));

  // Mock TopToolbar and buttons
  vi.mock("../layout/TopToolbar", () => ({
    TopToolbar: ({ children }: MockChildrenProps) => (
      <div data-testid="top-toolbar">{children}</div>
    ),
  }));

  vi.mock("@/components/ra-wrappers/export-button", () => ({
    ExportButton: () => <button data-testid="export-button">Export</button>,
  }));

  vi.mock("@/components/ra-wrappers/bulk-actions-toolbar", () => ({
    BulkActionsToolbar: () => <div data-testid="bulk-actions-toolbar">Bulk Actions</div>,
  }));

  // Mock OrganizationListFilter
  vi.mock("../OrganizationListFilter", () => ({
    OrganizationListFilter: () => <div data-testid="organization-list-filter">Filters</div>,
  }));

  // Mock ListSearchBar to avoid FilterLiveForm/SearchInput context issues
  vi.mock("@/components/ra-wrappers/ListSearchBar", () => ({
    ListSearchBar: ({ placeholder }: MockLayoutProps) => (
      <div data-testid="list-search-bar">
        <input type="text" placeholder={placeholder || "Search..."} data-testid="search-input" />
      </div>
    ),
  }));

  // Mock useSlideOverState hook
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
}
