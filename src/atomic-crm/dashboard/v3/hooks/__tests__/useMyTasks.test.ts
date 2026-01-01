/**
 * useMyTasks Hook Test Suite
 *
 * Tests the task management hook for the TasksPanel component.
 * Critical behaviors tested:
 * - calculateStatus() date logic with timezone handling
 * - snoozeTask() optimistic update AND rollback on failure
 * - completeTask() removes from local state
 * - deleteTask() optimistic update AND rollback on failure
 * - Task fetching and mapping to UI model
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { ReactNode } from "react";
import { useMyTasks } from "../useMyTasks";
import { startOfDay, addDays } from "date-fns";

// Create a fresh QueryClient for each test to avoid test pollution
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

// QueryClient instance (created fresh in beforeEach)
let queryClient: QueryClient;

// Track which tasks have been completed or deleted to simulate server filtering
const completedTaskIds = new Set<number>();
const deletedTaskIds = new Set<number>();

// Store the base tasks data that tests will populate
let baseTasksData: any[] = [];

// Version counter to trigger re-fetch after mutations
let mutationVersion = 0;

// Create stable mock functions OUTSIDE the factory to prevent new references
const mockGetList = vi.fn().mockImplementation((resource: string, _params: any) => {
  if (resource === "tasks") {
    // Filter out completed and deleted tasks to simulate server-side filtering
    const filteredTasks = baseTasksData.filter(
      (task: any) => !completedTaskIds.has(task.id) && !deletedTaskIds.has(task.id)
    );
    return Promise.resolve({
      data: filteredTasks,
      total: filteredTasks.length,
    });
  }
  return Promise.resolve({ data: [], total: 0 });
});

const mockUpdate = vi.fn();
const mockDelete = vi.fn();

// Wrap mockUpdate to track completed tasks and update base data for snooze
const wrappedUpdate = async (...args: any[]) => {
  const result = await mockUpdate(...args);
  const [resource, params] = args;
  if (resource === "tasks") {
    // Track completed tasks
    if (params.data?.completed === true) {
      completedTaskIds.add(params.id);
      mutationVersion++;
    }
    // Update base data for other updates (like snooze)
    if (params.data?.due_date) {
      const taskIndex = baseTasksData.findIndex((t: any) => t.id === params.id);
      if (taskIndex !== -1) {
        baseTasksData[taskIndex] = { ...baseTasksData[taskIndex], ...params.data };
        mutationVersion++;
      }
    }
  }
  return result;
};

// Wrap mockDelete to track deleted tasks
const wrappedDelete = async (...args: any[]) => {
  const result = await mockDelete(...args);
  const [resource, params] = args;
  if (resource === "tasks") {
    deletedTaskIds.add(params.id);
    mutationVersion++;
  }
  return result;
};

// Create a stable dataProvider object that persists across renders
const stableDataProvider = {
  getList: mockGetList,
  update: wrappedUpdate,
  delete: wrappedDelete,
};

// Mock @tanstack/react-query's useQueryClient
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

// Mock react-admin with stable reference
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-admin")>();
  const React = await import("react");

  return {
    ...actual,
    useDataProvider: () => stableDataProvider,
    // Mock useGetList using React state to simulate async behavior
    useGetList: (
      resource: string,
      params: any,
      options?: { enabled?: boolean; staleTime?: number }
    ) => {
      // Support enabled option - if false, don't fetch
      const enabled = options?.enabled !== false;

      const [state, setState] = React.useState<{
        data: any[];
        total: number;
        isLoading: boolean;
        error: Error | null;
      }>({
        data: [],
        total: 0,
        isLoading: enabled, // Only loading if enabled
        error: null,
      });

      const fetchData = React.useCallback(async () => {
        if (!enabled) return;
        setState((s: any) => ({ ...s, isLoading: true, error: null }));
        try {
          const result = await mockGetList(resource, params);
          setState({
            data: result?.data || [],
            total: result?.total || 0,
            isLoading: false,
            error: null,
          });
        } catch (e) {
          setState({
            data: [],
            total: 0,
            isLoading: false,
            error: e instanceof Error ? e : new Error("Failed to fetch"),
          });
        }
      }, [resource, JSON.stringify(params), enabled, mutationVersion]);

      React.useEffect(() => {
        if (enabled) {
          fetchData();
        }
      }, [fetchData, enabled]);

      return {
        data: state.data,
        total: state.total,
        isLoading: state.isLoading,
        isPending: state.isLoading, // Also provide isPending for compatibility
        error: state.error,
        refetch: fetchData,
      };
    },
  };
});

// Mock useCurrentSale hook - mutable values stored in object
const currentSaleState = {
  salesId: null as number | null,
  loading: false,
  error: null as Error | null,
};

vi.mock("../useCurrentSale", () => ({
  useCurrentSale: () => ({
    salesId: currentSaleState.salesId,
    loading: currentSaleState.loading,
    error: currentSaleState.error,
  }),
}));

// Create test fixtures based on real current time
const createTestDates = () => {
  const now = new Date();
  const today = startOfDay(now);
  return {
    now,
    today,
    yesterday: addDays(today, -1),
    tomorrow: addDays(today, 1),
    twoDaysOut: addDays(today, 2),
    fiveDaysOut: addDays(today, 5),
    eightDaysOut: addDays(today, 8),
  };
};

const createMockTask = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: "Test Task",
  due_date: new Date().toISOString(),
  priority: "medium",
  type: "call",
  completed: false,
  sales_id: 42,
  opportunity_id: 100,
  opportunity: { id: 100, name: "Test Opportunity" },
  description: "Test notes",
  ...overrides,
});

describe("useMyTasks", () => {
  // Wrapper component for providing QueryClient context
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    vi.clearAllMocks();
    // Create fresh QueryClient for each test
    queryClient = createTestQueryClient();
    // Reset current sale state
    currentSaleState.salesId = 42;
    currentSaleState.loading = false;
    currentSaleState.error = null;
    // Clear task tracking sets and base data
    completedTaskIds.clear();
    deletedTaskIds.clear();
    baseTasksData = [];
    mutationVersion = 0;
  });

  describe("Task Fetching", () => {
    it("should fetch tasks when salesId is available", async () => {
      const dates = createTestDates();
      baseTasksData = [
        createMockTask({ id: 1, due_date: dates.today.toISOString() }),
        createMockTask({ id: 2, due_date: dates.tomorrow.toISOString() }),
      ];

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "tasks",
        expect.objectContaining({
          filter: {
            sales_id: 42,
            completed: false,
            "deleted_at@is": null,
          },
        })
      );
      expect(result.current.tasks).toHaveLength(2);
    });

    it("should not fetch tasks when salesId is null", async () => {
      currentSaleState.salesId = null;

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).not.toHaveBeenCalled();
      expect(result.current.tasks).toHaveLength(0);
    });

    it("should handle fetch errors gracefully", async () => {
      const mockError = new Error("Network error");
      mockGetList.mockRejectedValueOnce(mockError);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      consoleErrorSpy.mockRestore();
    });

    it("should map task types correctly", async () => {
      const mockTasks = [
        createMockTask({ id: 1, type: "call" }),
        createMockTask({ id: 2, type: "email" }),
        createMockTask({ id: 3, type: "meeting" }),
        createMockTask({ id: 4, type: "follow-up" }),
        createMockTask({ id: 5, type: "demo" }),
        createMockTask({ id: 6, type: "unknown" }),
      ];

      baseTasksData = mockTasks;

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks[0].taskType).toBe("Call");
      expect(result.current.tasks[1].taskType).toBe("Email");
      expect(result.current.tasks[2].taskType).toBe("Meeting");
      expect(result.current.tasks[3].taskType).toBe("Follow-up");
      expect(result.current.tasks[4].taskType).toBe("Demo");
      expect(result.current.tasks[5].taskType).toBe("Other"); // Unknown maps to Other
    });
  });

  describe("calculateStatus() - Date Logic", () => {
    it("should return correct status for various dates", async () => {
      const dates = createTestDates();
      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Overdue
      expect(result.current.calculateStatus(dates.yesterday)).toBe("overdue");

      // Today
      expect(result.current.calculateStatus(dates.today)).toBe("today");

      // Tomorrow
      expect(result.current.calculateStatus(dates.tomorrow)).toBe("tomorrow");

      // Upcoming (within week)
      expect(result.current.calculateStatus(dates.fiveDaysOut)).toBe("upcoming");

      // Later (beyond week)
      expect(result.current.calculateStatus(dates.eightDaysOut)).toBe("later");
    });

    it("should handle same day with different times", async () => {
      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Early morning today
      const earlyToday = new Date();
      earlyToday.setHours(0, 1, 0, 0);

      // Late evening today
      const lateToday = new Date();
      lateToday.setHours(23, 59, 0, 0);

      const earlyStatus = result.current.calculateStatus(earlyToday);
      const lateStatus = result.current.calculateStatus(lateToday);

      // Both should return 'today' since they're on the same calendar day
      expect(earlyStatus).toBe("today");
      expect(lateStatus).toBe("today");
    });
  });

  describe("completeTask()", () => {
    it("should update task and remove from local state", async () => {
      const mockTask = createMockTask({ id: 1 });
      baseTasksData = [mockTask];
      mockUpdate.mockResolvedValueOnce({ data: { ...mockTask, completed: true } });

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.completeTask(1);
      });

      expect(mockUpdate).toHaveBeenCalledWith("tasks", {
        id: 1,
        data: expect.objectContaining({ completed: true }),
        previousData: expect.any(Object),
      });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(0);
      });
    });

    it("should re-throw error on failure", async () => {
      const mockTask = createMockTask({ id: 1 });
      baseTasksData = [mockTask];
      mockUpdate.mockRejectedValueOnce(new Error("Update failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      let error: Error | null = null;
      await act(async () => {
        try {
          await result.current.completeTask(1);
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error).toBeTruthy();
      expect(error?.message).toBe("Update failed");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("snoozeTask() - Optimistic Update", () => {
    it("should optimistically update task due date", async () => {
      const dates = createTestDates();
      const mockTask = createMockTask({ id: 1, due_date: dates.today.toISOString() });
      baseTasksData = [mockTask];
      // Return updated task with tomorrow's date when update is called
      const tomorrowDate = addDays(dates.today, 1);
      mockUpdate.mockResolvedValueOnce({
        data: { ...mockTask, due_date: tomorrowDate.toISOString() },
      });

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].status).toBe("today");
      });

      // Small delay to ensure React effects have flushed and tasksRef is updated
      await act(async () => {
        // Yield to allow effects to run
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.snoozeTask(1);
      });

      // Should have moved to tomorrow status via optimistic update
      await waitFor(
        () => {
          expect(result.current.tasks[0].status).toBe("tomorrow");
        },
        { timeout: 2000 }
      );
    });

    it("should rollback on API failure", async () => {
      const dates = createTestDates();
      const mockTask = createMockTask({ id: 1, due_date: dates.today.toISOString() });
      baseTasksData = [mockTask];
      mockUpdate.mockRejectedValueOnce(new Error("Snooze failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      const originalStatus = result.current.tasks[0].status;

      let error: Error | null = null;
      await act(async () => {
        try {
          await result.current.snoozeTask(1);
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error?.message).toBe("Snooze failed");
      // Should rollback to original status
      expect(result.current.tasks[0].status).toBe(originalStatus);

      consoleErrorSpy.mockRestore();
    });

    it("should handle non-existent task gracefully", async () => {
      // No tasks

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw for non-existent task
      await act(async () => {
        await result.current.snoozeTask(999);
      });

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteTask() - Optimistic Update", () => {
    it("should optimistically remove task from state", async () => {
      const mockTask = createMockTask({ id: 1 });
      baseTasksData = [mockTask];
      mockDelete.mockResolvedValueOnce({ data: mockTask });

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteTask(1);
      });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(0);
      });
    });

    it("should rollback on API failure", async () => {
      const mockTask = createMockTask({ id: 1 });
      baseTasksData = [mockTask];
      mockDelete.mockRejectedValueOnce(new Error("Delete failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      let error: Error | null = null;
      await act(async () => {
        try {
          await result.current.deleteTask(1);
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error?.message).toBe("Delete failed");
      // Should rollback - task should be back in the list
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe(1);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("updateTaskLocally()", () => {
    it("should update task in local state without API call", async () => {
      const mockTask = createMockTask({ id: 1 });
      baseTasksData = [mockTask];

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      act(() => {
        result.current.updateTaskLocally(1, { subject: "Updated Subject" });
      });

      expect(result.current.tasks[0].subject).toBe("Updated Subject");
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("rollbackTask()", () => {
    it("should restore task to previous state", async () => {
      const mockTask = createMockTask({ id: 1, title: "Original Title" });
      baseTasksData = [mockTask];

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      const originalTask = { ...result.current.tasks[0] };
      // Store original subject for comparison (mapped from title)
      const originalSubject = originalTask.subject;

      // Modify the task
      act(() => {
        result.current.updateTaskLocally(1, { subject: "Modified" });
      });

      expect(result.current.tasks[0].subject).toBe("Modified");

      // Rollback
      act(() => {
        result.current.rollbackTask(1, originalTask);
      });

      // Should restore to the original subject value
      expect(result.current.tasks[0].subject).toBe(originalSubject);
    });
  });

  describe("Related Entity Mapping", () => {
    it("should map opportunity as related entity", async () => {
      const mockTask = createMockTask({
        id: 1,
        opportunity_id: 100,
        opportunity: { id: 100, name: "Big Deal" },
        contact_id: null,
        organization_id: null,
      });
      baseTasksData = [mockTask];

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      expect(result.current.tasks[0].relatedTo).toEqual({
        type: "opportunity",
        name: "Big Deal",
        id: 100,
      });
    });

    it("should map contact as related entity when no opportunity", async () => {
      const mockTask = createMockTask({
        id: 1,
        opportunity_id: null,
        contact_id: 200,
        contact: { id: 200, name: "John Doe" },
        organization_id: null,
        opportunity: undefined,
      });
      baseTasksData = [mockTask];

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      expect(result.current.tasks[0].relatedTo).toEqual({
        type: "contact",
        name: "John Doe",
        id: 200,
      });
    });

    it("should map organization as fallback related entity", async () => {
      const mockTask = createMockTask({
        id: 1,
        opportunity_id: null,
        contact_id: null,
        organization_id: 300,
        organization: { id: 300, name: "Acme Corp" },
        opportunity: undefined,
        contact: undefined,
      });
      baseTasksData = [mockTask];

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      expect(result.current.tasks[0].relatedTo).toEqual({
        type: "organization",
        name: "Acme Corp",
        id: 300,
      });
    });
  });
});
