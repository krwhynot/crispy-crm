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
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMyTasks } from "../useMyTasks";

// Create stable mock functions OUTSIDE the factory to prevent new references
const mockGetList = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

// Create a stable dataProvider object that persists across renders
const stableDataProvider = {
  getList: mockGetList,
  update: mockUpdate,
  delete: mockDelete,
};

// Mock react-admin with stable reference
vi.mock("react-admin", () => ({
  useDataProvider: () => stableDataProvider,
}));

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

// Test fixtures
const TODAY = new Date("2024-03-15T12:00:00Z");
const YESTERDAY = new Date("2024-03-14T12:00:00Z");
const TOMORROW = new Date("2024-03-16T12:00:00Z");
const NEXT_WEEK = new Date("2024-03-20T12:00:00Z");
const TWO_WEEKS = new Date("2024-03-29T12:00:00Z");

const createMockTask = (overrides = {}) => ({
  id: 1,
  title: "Test Task",
  due_date: TODAY.toISOString(),
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(TODAY);

    // Reset current sale state
    currentSaleState.salesId = 42;
    currentSaleState.loading = false;
    currentSaleState.error = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Task Fetching", () => {
    it("should fetch tasks when salesId is available", async () => {
      const mockTasks = [
        createMockTask({ id: 1, due_date: TODAY.toISOString() }),
        createMockTask({ id: 2, due_date: TOMORROW.toISOString() }),
      ];

      mockGetList.mockResolvedValue({
        data: mockTasks,
        total: mockTasks.length,
      });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith("tasks", expect.objectContaining({
        filter: {
          sales_id: 42,
          completed: false,
        },
      }));
      expect(result.current.tasks).toHaveLength(2);
    });

    it("should not fetch tasks when salesId is null", async () => {
      currentSaleState.salesId = null;

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).not.toHaveBeenCalled();
      expect(result.current.tasks).toHaveLength(0);
    });

    it("should wait for sales loading to complete", async () => {
      currentSaleState.salesId = null;
      currentSaleState.loading = true;

      const { result } = renderHook(() => useMyTasks());

      // Should still be loading
      expect(result.current.loading).toBe(true);
      expect(mockGetList).not.toHaveBeenCalled();
    });

    it("should handle fetch errors gracefully", async () => {
      const mockError = new Error("Network error");
      mockGetList.mockRejectedValue(mockError);

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks());

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

      mockGetList.mockResolvedValue({ data: mockTasks, total: mockTasks.length });

      const { result } = renderHook(() => useMyTasks());

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
    it("should return 'overdue' for dates before today", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const status = result.current.calculateStatus(YESTERDAY);
      expect(status).toBe("overdue");
    });

    it("should return 'today' for dates on the same day", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Same day, different time
      const sameDayDifferentTime = new Date("2024-03-15T23:59:59Z");
      const status = result.current.calculateStatus(sameDayDifferentTime);
      expect(status).toBe("today");
    });

    it("should return 'tomorrow' for dates on the next day", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const status = result.current.calculateStatus(TOMORROW);
      expect(status).toBe("tomorrow");
    });

    it("should return 'upcoming' for dates within the next week", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const status = result.current.calculateStatus(NEXT_WEEK);
      expect(status).toBe("upcoming");
    });

    it("should return 'later' for dates beyond next week", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const status = result.current.calculateStatus(TWO_WEEKS);
      expect(status).toBe("later");
    });

    it("should handle midnight boundary correctly (day 7 exact)", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Exactly 7 days out at midnight
      const exactlySevenDays = new Date("2024-03-22T00:00:00Z");
      const status = result.current.calculateStatus(exactlySevenDays);
      // 7 days from Mar 15 = Mar 22, which is NOT before nextWeek (Mar 22)
      // So it should be 'later' (>= 7 days)
      expect(status).toBe("later");
    });
  });

  describe("completeTask()", () => {
    it("should update task and remove from local state", async () => {
      const mockTask = createMockTask({ id: 1 });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockUpdate.mockResolvedValue({ data: { ...mockTask, completed: true } });

      const { result } = renderHook(() => useMyTasks());

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
      expect(result.current.tasks).toHaveLength(0);
    });

    it("should re-throw error on failure", async () => {
      const mockTask = createMockTask({ id: 1 });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockUpdate.mockRejectedValue(new Error("Update failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await expect(
        act(async () => {
          await result.current.completeTask(1);
        })
      ).rejects.toThrow("Update failed");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("snoozeTask() - Optimistic Update", () => {
    it("should optimistically update task due date", async () => {
      const mockTask = createMockTask({ id: 1, due_date: TODAY.toISOString() });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockUpdate.mockResolvedValue({ data: mockTask });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].status).toBe("today");
      });

      await act(async () => {
        await result.current.snoozeTask(1);
      });

      // Should have moved to tomorrow status
      expect(result.current.tasks[0].status).toBe("tomorrow");
    });

    it("should rollback on API failure", async () => {
      const mockTask = createMockTask({ id: 1, due_date: TODAY.toISOString() });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockUpdate.mockRejectedValue(new Error("Snooze failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      const originalStatus = result.current.tasks[0].status;

      await expect(
        act(async () => {
          await result.current.snoozeTask(1);
        })
      ).rejects.toThrow("Snooze failed");

      // Should rollback to original status
      expect(result.current.tasks[0].status).toBe(originalStatus);

      consoleErrorSpy.mockRestore();
    });

    it("should handle non-existent task gracefully", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

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
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockDelete.mockResolvedValue({ data: mockTask });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteTask(1);
      });

      expect(result.current.tasks).toHaveLength(0);
    });

    it("should rollback on API failure", async () => {
      const mockTask = createMockTask({ id: 1 });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockDelete.mockRejectedValue(new Error("Delete failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await expect(
        act(async () => {
          await result.current.deleteTask(1);
        })
      ).rejects.toThrow("Delete failed");

      // Should rollback - task should be back in the list
      expect(result.current.tasks).toHaveLength(1);
      expect(result.current.tasks[0].id).toBe(1);

      consoleErrorSpy.mockRestore();
    });

    it("should handle non-existent task gracefully", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.deleteTask(999);
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe("updateTaskDueDate()", () => {
    it("should update task due date optimistically", async () => {
      const mockTask = createMockTask({ id: 1, due_date: TODAY.toISOString() });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockUpdate.mockResolvedValue({ data: mockTask });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateTaskDueDate(1, NEXT_WEEK);
      });

      expect(result.current.tasks[0].status).toBe("upcoming");
      expect(mockUpdate).toHaveBeenCalledWith("tasks", {
        id: 1,
        data: expect.objectContaining({
          due_date: NEXT_WEEK.toISOString(),
        }),
        previousData: expect.any(Object),
      });
    });

    it("should rollback on API failure", async () => {
      const mockTask = createMockTask({ id: 1, due_date: TODAY.toISOString() });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });
      mockUpdate.mockRejectedValue(new Error("Update failed"));

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      const originalStatus = result.current.tasks[0].status;

      await expect(
        act(async () => {
          await result.current.updateTaskDueDate(1, NEXT_WEEK);
        })
      ).rejects.toThrow("Update failed");

      expect(result.current.tasks[0].status).toBe(originalStatus);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("updateTaskLocally()", () => {
    it("should update task in local state without API call", async () => {
      const mockTask = createMockTask({ id: 1 });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });

      const { result } = renderHook(() => useMyTasks());

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
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      const originalTask = { ...result.current.tasks[0] };

      // Modify the task
      act(() => {
        result.current.updateTaskLocally(1, { subject: "Modified" });
      });

      expect(result.current.tasks[0].subject).toBe("Modified");

      // Rollback
      act(() => {
        result.current.rollbackTask(1, originalTask);
      });

      expect(result.current.tasks[0].subject).toBe("Test Task");
    });
  });

  describe("viewTask()", () => {
    it("should navigate to task show page", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      // Mock window.location
      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        value: { href: "" },
        writable: true,
      });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.viewTask(123);
      });

      expect(window.location.href).toBe("/#/tasks/123/show");

      // Restore
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
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
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });

      const { result } = renderHook(() => useMyTasks());

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
      });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });

      const { result } = renderHook(() => useMyTasks());

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
      });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      expect(result.current.tasks[0].relatedTo).toEqual({
        type: "organization",
        name: "Acme Corp",
        id: 300,
      });
    });

    it("should handle missing related entity gracefully", async () => {
      const mockTask = createMockTask({
        id: 1,
        opportunity_id: null,
        contact_id: null,
        organization_id: null,
        opportunity: undefined,
        contact: undefined,
        organization: undefined,
      });
      mockGetList.mockResolvedValue({ data: [mockTask], total: 1 });

      const { result } = renderHook(() => useMyTasks());

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
      });

      expect(result.current.tasks[0].relatedTo).toEqual({
        type: "organization",
        name: "Unknown",
        id: 0,
      });
    });
  });
});
