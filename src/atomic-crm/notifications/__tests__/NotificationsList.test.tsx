import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import NotificationsList from "../NotificationsList";

const mockNotifications = [
  {
    id: 1,
    type: "task_overdue",
    message: "Task 'Follow up' is overdue",
    entity_type: "task",
    entity_id: 42,
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    type: "system",
    message: "System maintenance scheduled",
    entity_type: null,
    entity_id: null,
    read: true,
    created_at: new Date().toISOString(),
  },
];

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useListContext: vi.fn(() => ({
      data: mockNotifications,
      total: 2,
      isLoading: false,
      isPending: false,
      filterValues: {},
      setFilters: vi.fn(),
      displayedFilters: {},
      showFilter: vi.fn(),
      hideFilter: vi.fn(),
      sort: { field: "created_at", order: "DESC" },
      setSort: vi.fn(),
      resource: "notifications",
      selectedIds: [],
      onSelect: vi.fn(),
      onToggleItem: vi.fn(),
      onUnselectItems: vi.fn(),
    })),
    useUpdate: () => [vi.fn().mockResolvedValue({ data: { id: 1 } }), { isPending: false }],
    useNotify: () => vi.fn(),
    useGetIdentity: () => ({
      data: { id: 1, fullName: "Test User", sales_id: 1 },
      isLoading: false,
    }),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@/components/ra-wrappers/list", () => ({
  List: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="list-wrapper">{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/list-pagination", () => ({
  ListPagination: () => <div data-testid="list-pagination" />,
}));

vi.mock("@/components/layouts/ListPageLayout", () => ({
  ListPageLayout: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="list-page-layout">{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/toggle-filter-button", () => ({
  ToggleFilterButton: ({ label }: { label: string; [key: string]: unknown }) => (
    <button data-testid={`toggle-${label}`}>{label}</button>
  ),
}));

vi.mock("../filters/FilterCategory", () => ({
  FilterCategory: ({ children }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="filter-category">{children}</div>
  ),
}));

vi.mock("@/components/admin/AdminButton", () => ({
  AdminButton: ({
    children,
    onClick,
    "aria-label": ariaLabel,
    ...rest
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
    [key: string]: unknown;
  }) => (
    <button data-testid="admin-button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
}));

describe("NotificationsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders notification messages", async () => {
    renderWithAdminContext(<NotificationsList />);

    await waitFor(() => {
      expect(screen.getByText("Task 'Follow up' is overdue")).toBeInTheDocument();
      expect(screen.getByText("System maintenance scheduled")).toBeInTheDocument();
    });
  });

  test("renders mark-as-read button for unread notifications", async () => {
    renderWithAdminContext(<NotificationsList />);

    await waitFor(() => {
      const markReadBtn = screen.getByLabelText("Mark as read");
      expect(markReadBtn).toBeInTheDocument();
    });
  });

  test("renders notification type badges", async () => {
    renderWithAdminContext(<NotificationsList />);

    await waitFor(() => {
      expect(screen.getByText("Overdue Task")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument();
    });
  });
});
