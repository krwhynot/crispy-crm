/**
 * UserDisableReassignDialog Tests
 *
 * Verifies the disable-user wizard:
 * 1. Loading state while fetching record counts
 * 2. Zero records path -> direct disable
 * 3. Records found -> reassign step with counts and target selector
 * 4. Full pagination via fetchAllRecords
 * 5. Fail-fast guard when fetched total < expected total
 * 6. Cache invalidation on successful reassign + disable
 * 7. Cancel button calls onClose
 * 8. Count fetch error handling
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// vi.hoisted ensures these are available inside vi.mock factories
const {
  mockNotify,
  mockRefresh,
  mockUpdate,
  mockDataProvider,
  mockQueryClient,
  mockOnClose,
  mockOnSuccess,
  capturedSelectOnValueChange,
} = vi.hoisted(() => ({
  mockNotify: vi.fn(),
  mockRefresh: vi.fn(),
  mockUpdate: vi.fn(),
  mockDataProvider: {
    getList: vi.fn(),
    update: vi.fn(),
  },
  mockQueryClient: {
    invalidateQueries: vi.fn(),
  },
  mockOnClose: vi.fn(),
  mockOnSuccess: vi.fn(),
  capturedSelectOnValueChange: { current: null as ((val: string) => void) | null },
}));

// Mock react-admin
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useNotify: vi.fn(() => mockNotify),
    useRefresh: vi.fn(() => mockRefresh),
    useUpdate: vi.fn(() => [mockUpdate, { isLoading: false }]),
    useDataProvider: vi.fn(() => mockDataProvider),
    useGetList: vi.fn(() => ({
      data: [
        { id: 2, first_name: "Jane", last_name: "Smith", role: "rep" },
        { id: 3, first_name: "Bob", last_name: "Admin", role: "admin" },
      ],
      isPending: false,
      total: 2,
    })),
    useRecordContext: vi.fn(() => null),
  };
});

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useNotify: vi.fn(() => mockNotify),
    useRefresh: vi.fn(() => mockRefresh),
    useUpdate: vi.fn(() => [mockUpdate, { isLoading: false }]),
    useDataProvider: vi.fn(() => mockDataProvider),
    useGetList: vi.fn(() => ({
      data: [
        { id: 2, first_name: "Jane", last_name: "Smith", role: "rep" },
        { id: 3, first_name: "Bob", last_name: "Admin", role: "admin" },
      ],
      isPending: false,
      total: 2,
    })),
    useRecordContext: vi.fn(() => null),
  };
});

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: vi.fn(() => mockQueryClient),
  };
});

// Mock logger to suppress output
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Dialog components for testability
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode; className?: string }) => (
    <h2>{children}</h2>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  ),
}));

// Mock Select components - captures onValueChange for test invocation
vi.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
    disabled,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (val: string) => void;
    disabled?: boolean;
  }) => {
    // Capture the callback so tests can trigger value changes directly
    if (onValueChange) {
      capturedSelectOnValueChange.current = onValueChange;
    }
    return (
      <div data-testid="select-root" data-value={value} data-disabled={disabled}>
        {children}
      </div>
    );
  },
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode; id?: string; className?: string }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
}));

// Mock AdminButton
vi.mock("@/components/admin/AdminButton", () => ({
  AdminButton: ({
    children,
    onClick,
    disabled,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

// Mock lucide icons
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <span data-testid="icon-alert" />,
  User: () => <span data-testid="icon-user" />,
  Building2: () => <span data-testid="icon-building" />,
  Briefcase: () => <span data-testid="icon-briefcase" />,
  CheckSquare: () => <span data-testid="icon-check" />,
}));

// Import component AFTER mocks
import { UserDisableReassignDialog } from "../UserDisableReassignDialog";
import type { Sale } from "../../types";

const mockUser: Sale = {
  id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@test.com",
  role: "rep",
  disabled: false,
};

/** Helper: mock all 4 count fetches to return specified totals */
function mockCountFetches(counts: {
  opportunities?: number;
  contacts?: number;
  organizations?: number;
  tasks?: number;
}) {
  const { opportunities = 0, contacts = 0, organizations = 0, tasks = 0 } = counts;
  mockDataProvider.getList.mockImplementation((resource: string) => {
    const map: Record<string, { data: unknown[]; total: number }> = {
      opportunities: {
        data: Array(Math.min(opportunities, 10)).fill({ id: 1 }),
        total: opportunities,
      },
      contacts: { data: Array(Math.min(contacts, 10)).fill({ id: 1 }), total: contacts },
      organizations: {
        data: Array(Math.min(organizations, 10)).fill({ id: 1 }),
        total: organizations,
      },
      tasks: { data: Array(Math.min(tasks, 10)).fill({ id: 1 }), total: tasks },
    };
    return Promise.resolve(map[resource] ?? { data: [], total: 0 });
  });
}

describe("UserDisableReassignDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSelectOnValueChange.current = null;
  });

  // =========================================================================
  // 1. Loading State
  // =========================================================================
  describe("loading state", () => {
    test("shows loading spinner when dialog opens and counts are being fetched", () => {
      // Make getList never resolve so we stay in loading state
      mockDataProvider.getList.mockReturnValue(new Promise(() => {}));

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Checking records...")).toBeDefined();
      expect(screen.getByText(/Checking for records owned by this user/)).toBeDefined();
    });
  });

  // =========================================================================
  // 2. Zero Records -> Direct Disable
  // =========================================================================
  describe("zero records - direct disable", () => {
    test("shows no-records message when user has no assigned records", async () => {
      mockCountFetches({});

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/has no opportunities, contacts, organizations, or tasks assigned/)
        ).toBeDefined();
      });
    });

    test("clicking Disable User calls update with disabled: true", async () => {
      mockCountFetches({});
      mockUpdate.mockImplementation(
        (_resource: string, _params: unknown, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
          return Promise.resolve({ data: { ...mockUser, disabled: true } });
        }
      );

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Disable User")).toBeDefined();
      });

      await act(async () => {
        await userEvent.click(screen.getByText("Disable User"));
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        "sales",
        { id: 1, data: { disabled: true }, previousData: mockUser },
        expect.objectContaining({ returnPromise: true })
      );
    });
  });

  // =========================================================================
  // 3. Records Found -> Reassign Step
  // =========================================================================
  describe("records found - reassign step", () => {
    test("displays correct count for opportunities", async () => {
      mockCountFetches({ opportunities: 5 });

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("5 Opportunities")).toBeDefined();
      });
    });

    test("renders target user selector with sales list", async () => {
      mockCountFetches({ opportunities: 3 });

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Reassign all records to:")).toBeDefined();
      });

      // Target users from useGetList mock
      expect(screen.getByTestId("select-item-2")).toBeDefined();
      expect(screen.getByTestId("select-item-3")).toBeDefined();
      expect(screen.getByText("Jane Smith")).toBeDefined();
      expect(screen.getByText(/Bob Admin/)).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Full Pagination (fetchAllRecords)
  // =========================================================================
  describe("full pagination", () => {
    test("fetchAllRecords calls getList for each page when total > MAX_PAGE_SIZE", async () => {
      // First call: count fetch returns total=150
      // Then fetchAllRecords calls: page 1 (100 records), page 2 (50 records)
      let callIndex = 0;
      mockDataProvider.getList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          callIndex++;
          if (callIndex === 1) {
            // Initial count fetch
            return Promise.resolve({ data: [], total: 150 });
          }
          if (callIndex === 2) {
            // fetchAllRecords page 1
            return Promise.resolve({
              data: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
              total: 150,
            });
          }
          if (callIndex === 3) {
            // fetchAllRecords page 2
            return Promise.resolve({
              data: Array.from({ length: 50 }, (_, i) => ({ id: i + 101 })),
              total: 150,
            });
          }
        }
        // Other resources return 0
        return Promise.resolve({ data: [], total: 0 });
      });

      mockDataProvider.update.mockResolvedValue({ data: { id: 1 } });
      mockUpdate.mockImplementation(
        (_resource: string, _params: unknown, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
          return Promise.resolve({ data: { ...mockUser, disabled: true } });
        }
      );

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Wait for reassign step
      await waitFor(() => {
        expect(screen.getByText(/150 Opportunities/)).toBeDefined();
      });

      // Select a target user via captured onValueChange callback
      await act(async () => {
        capturedSelectOnValueChange.current?.("2");
      });

      // Click reassign button
      const reassignButton = screen.getByText(/Reassign .* Records & Disable/);
      await act(async () => {
        await userEvent.click(reassignButton);
      });

      // Verify getList was called multiple times for opportunities (count + pagination)
      const oppCalls = mockDataProvider.getList.mock.calls.filter(
        (call: unknown[]) => call[0] === "opportunities"
      );
      expect(oppCalls.length).toBeGreaterThanOrEqual(3); // count + page1 + page2
    });
  });

  // =========================================================================
  // 5. Fail-Fast Guard
  // =========================================================================
  describe("fail-fast guard", () => {
    test("aborts when fetched records < expected total", async () => {
      // Count fetch says 100 opportunities, but fetchAllRecords only gets 50
      let oppCallIndex = 0;
      mockDataProvider.getList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          oppCallIndex++;
          if (oppCallIndex === 1) {
            // Initial count fetch returns total=100
            return Promise.resolve({ data: [], total: 100 });
          }
          if (oppCallIndex === 2) {
            // fetchAllRecords page 1: returns 50 records
            return Promise.resolve({
              data: Array.from({ length: 50 }, (_, i) => ({ id: i + 1 })),
              total: 100,
            });
          }
          // fetchAllRecords page 2: returns empty to break the loop
          // This simulates a data integrity issue where records disappeared
          return Promise.resolve({ data: [], total: 100 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/100 Opportunities/)).toBeDefined();
      });

      // Select a target user via captured callback
      await act(async () => {
        capturedSelectOnValueChange.current?.("2");
      });

      // Click reassign
      const reassignButton = screen.getByText(/Reassign .* Records & Disable/);
      await act(async () => {
        await userEvent.click(reassignButton);
      });

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          "Could not fetch all records. Disable aborted for safety.",
          { type: "error" }
        );
      });
    });
  });

  // =========================================================================
  // 6. Cache Invalidation on Success
  // =========================================================================
  describe("cache invalidation on success", () => {
    test("invalidates all 5 resource caches after successful reassign and disable", async () => {
      // Set up: 1 opportunity to reassign
      let oppCallIndex = 0;
      mockDataProvider.getList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          oppCallIndex++;
          if (oppCallIndex === 1) {
            return Promise.resolve({ data: [{ id: 10 }], total: 1 });
          }
          // fetchAllRecords
          return Promise.resolve({ data: [{ id: 10 }], total: 1 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      // Mock dataProvider.update for batchReassign
      mockDataProvider.update.mockResolvedValue({ data: { id: 10 } });

      // Mock useUpdate's update to capture and invoke onSuccess
      mockUpdate.mockImplementation(
        (_resource: string, _params: unknown, options?: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
          return Promise.resolve({ data: { ...mockUser, disabled: true } });
        }
      );

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("1 Opportunity")).toBeDefined();
      });

      // Select target user via captured callback
      await act(async () => {
        capturedSelectOnValueChange.current?.("2");
      });

      // Click reassign
      const reassignButton = screen.getByText(/Reassign .* Records & Disable/);
      await act(async () => {
        await userEvent.click(reassignButton);
      });

      await waitFor(() => {
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledTimes(5);
      });

      // Verify each resource key was invalidated
      const invalidateCalls = mockQueryClient.invalidateQueries.mock.calls;
      const invalidatedKeys = invalidateCalls.map(
        (call: Array<{ queryKey: readonly string[] }>) => call[0].queryKey[0]
      );
      expect(invalidatedKeys).toContain("opportunities");
      expect(invalidatedKeys).toContain("contacts");
      expect(invalidatedKeys).toContain("organizations");
      expect(invalidatedKeys).toContain("tasks");
      expect(invalidatedKeys).toContain("sales");
    });
  });

  // =========================================================================
  // 7. Cancel / Abort
  // =========================================================================
  describe("cancel behavior", () => {
    test("cancel button in reassign step calls onClose", async () => {
      mockCountFetches({ opportunities: 5 });

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("5 Opportunities")).toBeDefined();
      });

      const cancelButton = screen.getByText("Cancel");
      await act(async () => {
        await userEvent.click(cancelButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 8. Count Fetch Error
  // =========================================================================
  describe("count fetch error", () => {
    test("notifies error and closes dialog when count fetch fails", async () => {
      mockDataProvider.getList.mockRejectedValue(new Error("Network error"));

      renderWithAdminContext(
        <UserDisableReassignDialog
          user={mockUser}
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith("Failed to check user records", {
          type: "error",
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
