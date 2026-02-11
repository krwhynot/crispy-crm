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
import type { GetListParams, UpdateParams, DeleteParams, RaRecord } from "ra-core";
import { useMyTasks } from "../useMyTasks";
import { startOfDay, addDays } from "date-fns";
import { dashboardKeys } from "@/atomic-crm/queryKeys";
import { SHORT_STALE_TIME_MS } from "@/atomic-crm/constants/appConstants";

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

// Task data shape as returned from the API
interface TaskData {
  id: number;
  title: string;
  due_date: string;
  priority: string;
  type: string;
  completed: boolean;
  sales_id: number;
  opportunity_id: number | null;
  opportunity?: { id: number; name: string };
  contact_id?: number | null;
  contact?: { id: number; name: string };
  organization_id?: number | null;
  organization?: { id: number; name: string };
  description: string | null;
  [key: string]: unknown;
}

// Store the base tasks data that tests will populate
let baseTasksData: TaskData[] = [];

// Version counter to trigger re-fetch after mutations
let mutationVersion = 0;

// Track staleTime options passed to useGetList for verification
let lastUseGetListOptions: { enabled?: boolean; staleTime?: number } | undefined;

// Create stable mock functions OUTSIDE the factory to prevent new references
const mockGetList = vi.fn().mockImplementation((resource: string, _params: GetListParams) => {
  if (resource === "tasks") {
    // Filter out completed and deleted tasks to simulate server-side filtering
    const filteredTasks = baseTasksData.filter(
      (task: TaskData) => !completedTaskIds.has(task.id) && !deletedTaskIds.has(task.id)
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
const wrappedUpdate = async (resource: string, params: UpdateParams<RaRecord>) => {
  const result = await mockUpdate(resource, params);
  if (resource === "tasks") {
    // Track completed tasks
    if (params.data?.completed === true) {
      completedTaskIds.add(params.id as number);
      mutationVersion++;
    }
    // Update base data for other updates (like snooze)
    if (params.data?.due_date) {
      const taskIndex = baseTasksData.findIndex((t: TaskData) => t.id === params.id);
      if (taskIndex !== -1) {
        baseTasksData[taskIndex] = { ...baseTasksData[taskIndex], ...params.data } as TaskData;
        mutationVersion++;
      }
    }
  }
  return result;
};

// Wrap mockDelete to track deleted tasks
const wrappedDelete = async (resource: string, params: DeleteParams<RaRecord>) => {
  const result = await mockDelete(resource, params);
  if (resource === "tasks") {
    deletedTaskIds.add(params.id as number);
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
// IMPORTANT: Return the real QueryClient from the test wrapper to support useMutation
vi.mock("@tanstack/react-query", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() required in vi.mock factory (runs before static imports)
  const actual = (await importOriginal()) as typeof import("@tanstack/react-query");
  return {
    ...actual,
    // Return the real query client instance from the wrapper
    // This allows useMutation to work properly with cancelQueries, etc.
    useQueryClient: () => queryClient,
  };
});

// Mock react-admin with stable reference
vi.mock("react-admin", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() required in vi.mock factory (runs before static imports)
  const actual = (await importOriginal()) as typeof import("react-admin");
  const React = await import("react");

  return {
    ...actual,
    useDataProvider: () => stableDataProvider,
    // Mock useGetList using React state to simulate async behavior
    useGetList: (
      resource: string,
      params: GetListParams,
      options?: { enabled?: boolean; staleTime?: number }
    ) => {
      // Capture options for staleTime verification
      lastUseGetListOptions = options;

      // Support enabled option - if false, don't fetch
      const enabled = options?.enabled !== false;

      // State shape for the mock useGetList
      interface MockUseGetListState {
        data: RaRecord[];
        total: number;
        isLoading: boolean;
        error: Error | null;
      }

      const [state, setState] = React.useState<MockUseGetListState>({
        data: [],
        total: 0,
        isLoading: enabled, // Only loading if enabled
        error: null,
      });

      // Serialize params for stable dependency - params object changes each render but content is stable
      const paramsKey = JSON.stringify(params);
      const fetchData = React.useCallback(async () => {
        if (!enabled) return;
        setState((s) => ({ ...s, isLoading: true, error: null }));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- params accessed via paramsKey serialization; mutationVersion is module-scoped
      }, [resource, paramsKey, enabled, mutationVersion]);

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
    vi.resetAllMocks();
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
    lastUseGetListOptions = undefined;
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

    it("RACE CONDITION FIX: should handle rapid clicks without state loss", async () => {
      // This test verifies the fix for the race condition bug where rapid clicks
      // on "Complete" caused state loss due to concurrent mutations and refetches
      const mockTask1 = createMockTask({ id: 1 });
      const mockTask2 = createMockTask({ id: 2 });
      const mockTask3 = createMockTask({ id: 3 });
      baseTasksData = [mockTask1, mockTask2, mockTask3];

      // Simulate API delays to expose race conditions
      mockUpdate.mockImplementation(async (_resource: string, params: UpdateParams<RaRecord>) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { data: { ...params.previousData, completed: true } };
      });

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(3);
      });

      // Simulate rapid clicks - complete all 3 tasks quickly without awaiting
      await act(async () => {
        const promises = [
          result.current.completeTask(1),
          result.current.completeTask(2),
          result.current.completeTask(3),
        ];
        await Promise.all(promises);
      });

      // All tasks should be completed and removed from state
      // Without the race condition fix, some tasks might reappear due to
      // stale data from concurrent refetches overwriting fresh data
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(0);
      });

      // Verify all 3 mutations were called
      expect(mockUpdate).toHaveBeenCalledTimes(3);
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
    it("should optimistically hide task when snoozed and call API with snooze_until", async () => {
      const dates = createTestDates();
      const mockTask = createMockTask({ id: 1, due_date: dates.today.toISOString() });
      baseTasksData = [mockTask];

      // Use a promise we can control to verify optimistic state during the API call
      let resolveUpdate: (value: unknown) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdate.mockImplementationOnce(() => updatePromise);

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].status).toBe("today");
      });

      // Small delay to ensure React effects have flushed and tasksRef is updated
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Start snooze - this will set optimistic state but API is pending
      let snoozePromise: Promise<void>;
      act(() => {
        snoozePromise = result.current.snoozeTask(1);
      });

      // Task should be hidden immediately via optimistic update
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(0);
      });

      // Verify the API was called with snooze_until (not due_date)
      expect(mockUpdate).toHaveBeenCalledWith(
        "tasks",
        expect.objectContaining({
          id: 1,
          data: expect.objectContaining({
            snooze_until: expect.any(String),
          }),
        })
      );

      // Resolve the API call
      const snoozeUntil = addDays(dates.today, 1);
      resolveUpdate!({
        data: { ...mockTask, snooze_until: snoozeUntil.toISOString() },
      });

      await act(async () => {
        await snoozePromise;
      });
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

      let error: Error | null = null;
      await act(async () => {
        try {
          await result.current.snoozeTask(1);
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error?.message).toBe("Snooze failed");
      // Should rollback - task should reappear in the list
      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0]?.id).toBe(1);
      });

      consoleErrorSpy.mockRestore();
    });

    it("should throw error for non-existent task", async () => {
      // No tasks
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should throw for non-existent task
      let error: Error | null = null;
      await act(async () => {
        try {
          await result.current.snoozeTask(999);
        } catch (e) {
          error = e as Error;
        }
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain("Task 999 not found");
      expect(mockUpdate).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
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

  describe("Cache Invalidation Strategy", () => {
    /**
     * These tests verify that dashboardKeys.all is invalidated when tasks change.
     * Per STALE_STATE_STRATEGY.md, cross-resource dependencies must be invalidated:
     * "Task complete -> dashboardKeys.all (Task counts change)"
     *
     * Current implementation (lines 200-202, 291-293, 349-351, 433-435) invalidates:
     * - taskKeys.all
     * - opportunityKeys.all
     * - activityKeys.all
     *
     * MISSING: dashboardKeys.all - dashboard task counts will show stale data
     */

    it("should invalidate dashboardKeys when task is completed", async () => {
      const mockTask = createMockTask({ id: 1 });
      baseTasksData = [mockTask];
      mockUpdate.mockResolvedValueOnce({ data: { ...mockTask, completed: true } });

      // Spy on invalidateQueries to track what keys are invalidated
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.completeTask(1);
      });

      // Wait for onSettled to fire
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });

      // FAILING ASSERTION: dashboardKeys.all should be invalidated but is NOT
      // This test will FAIL (RED phase) until dashboardKeys is added to onSettled
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: dashboardKeys.all,
      });

      invalidateSpy.mockRestore();
    });

    it("should invalidate dashboardKeys when task is snoozed", async () => {
      const dates = createTestDates();
      const mockTask = createMockTask({ id: 1, due_date: dates.today.toISOString() });
      baseTasksData = [mockTask];
      mockUpdate.mockResolvedValueOnce({
        data: { ...mockTask, snooze_until: addDays(dates.today, 1).toISOString() },
      });

      // Spy on invalidateQueries to track what keys are invalidated
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      // Small delay to ensure React effects have flushed and tasksRef is updated
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.snoozeTask(1);
      });

      // Wait for onSettled to fire
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });

      // FAILING ASSERTION: dashboardKeys.all should be invalidated but is NOT
      // This test will FAIL (RED phase) until dashboardKeys is added to onSettled
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: dashboardKeys.all,
      });

      invalidateSpy.mockRestore();
    });

    it("should invalidate dashboardKeys when task is deleted", async () => {
      const mockTask = createMockTask({ id: 1 });
      baseTasksData = [mockTask];
      mockDelete.mockResolvedValueOnce({ data: mockTask });

      // Spy on invalidateQueries to track what keys are invalidated
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteTask(1);
      });

      // Wait for onSettled to fire
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });

      // FAILING ASSERTION: dashboardKeys.all should be invalidated but is NOT
      // This test will FAIL (RED phase) until dashboardKeys is added to onSettled
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: dashboardKeys.all,
      });

      invalidateSpy.mockRestore();
    });

    it("should invalidate dashboardKeys when task due date is updated", async () => {
      const dates = createTestDates();
      const mockTask = createMockTask({ id: 1, due_date: dates.today.toISOString() });
      baseTasksData = [mockTask];
      const newDueDate = dates.fiveDaysOut;
      mockUpdate.mockResolvedValueOnce({
        data: { ...mockTask, due_date: newDueDate.toISOString() },
      });

      // Spy on invalidateQueries to track what keys are invalidated
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateTaskDueDate(1, newDueDate);
      });

      // Wait for onSettled to fire
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });

      // FAILING ASSERTION: dashboardKeys.all should be invalidated but is NOT
      // This test will FAIL (RED phase) until dashboardKeys is added to onSettled
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: dashboardKeys.all,
      });

      invalidateSpy.mockRestore();
    });
  });

  describe("Stale Time Configuration", () => {
    /**
     * STALE_STATE_STRATEGY.md requires dashboard widget data to use SHORT_STALE_TIME_MS (30s)
     * because task counts change frequently.
     *
     * Current implementation uses 5 * 60 * 1000 (5 minutes) - this test should FAIL.
     */
    it("should use SHORT_STALE_TIME_MS for task list data", async () => {
      const dates = createTestDates();
      baseTasksData = [createMockTask({ id: 1, due_date: dates.today.toISOString() })];

      const { result } = renderHook(() => useMyTasks(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Per STALE_STATE_STRATEGY.md: Task counts and next task info should use SHORT_STALE_TIME_MS (30s)
      // This test will FAIL because the hook currently uses 5 * 60 * 1000 (5 minutes)
      expect(lastUseGetListOptions?.staleTime).toBe(SHORT_STALE_TIME_MS);
    });
  });
});
