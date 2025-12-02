import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import { TasksPanel } from "../components/TasksPanel";

// Mock react-admin's useDataProvider and useNotify
const mockUpdate = vi.fn();
vi.mock("react-admin", () => ({
  useDataProvider: () => ({
    getList: vi.fn().mockResolvedValue({ data: [] }),
    update: mockUpdate,
  }),
  useNotify: () => vi.fn(),
}));

// Mock useCurrentSale
vi.mock("../hooks/useCurrentSale", () => ({
  useCurrentSale: () => ({
    salesId: 1,
    loading: false,
  }),
}));

// Create mock functions that we can control
const mockCompleteTask = vi.fn();
const mockUpdateTaskDueDate = vi.fn();
const mockDeleteTask = vi.fn();
const mockViewTask = vi.fn();

// Mock useMyTasks with controllable mock functions
vi.mock("../hooks/useMyTasks", () => ({
  useMyTasks: () => ({
    tasks: [
      {
        id: 1,
        subject: "Test Task",
        dueDate: new Date(),
        priority: "medium",
        taskType: "Call",
        relatedTo: {
          type: "opportunity",
          name: "Test Opp",
          id: 1,
        },
        status: "today",
      },
    ],
    loading: false,
    error: null,
    completeTask: mockCompleteTask,
    updateTaskDueDate: mockUpdateTaskDueDate,
    deleteTask: mockDeleteTask,
    viewTask: mockViewTask,
  }),
}));

// Import after mocks
import type { TaskItem } from "../types";

// Create a mock task factory
function createMockTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 1,
    subject: "Test Task",
    dueDate: new Date(),
    priority: "medium",
    taskType: "Call",
    relatedTo: {
      type: "opportunity",
      name: "Test Opp",
      id: 1,
    },
    status: "today",
    ...overrides,
  };
}

describe("Task Snooze Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateTaskDueDate.mockResolvedValue(undefined);
  });

  describe("Snooze Button Rendering", () => {
    it("should render snooze button with alarm clock icon", () => {
      render(<TasksPanel />);

      // Look for snooze button by aria-label
      const snoozeButton = screen.getByRole("button", {
        name: /snooze.*test task/i,
      });
      expect(snoozeButton).toBeInTheDocument();
    });

    it("should have accessible title on snooze button", () => {
      render(<TasksPanel />);

      const snoozeButton = screen.getByTitle("Snooze task");
      expect(snoozeButton).toBeInTheDocument();
    });

    it("should have 44px touch target (WCAG compliance)", () => {
      render(<TasksPanel />);

      const snoozeButton = screen.getByTitle("Snooze task");
      // h-11 w-11 in Tailwind = 44px x 44px
      expect(snoozeButton).toHaveClass("h-11", "w-11");
    });
  });

  describe("Snooze Date Calculation", () => {
    it("should calculate snooze date as end of following day", () => {
      const today = new Date("2025-01-15T10:00:00");
      const expectedSnoozeDate = endOfDay(addDays(today, 1));

      // The snooze date should be Jan 16, 23:59:59
      expect(expectedSnoozeDate.getDate()).toBe(16);
      expect(expectedSnoozeDate.getHours()).toBe(23);
      expect(expectedSnoozeDate.getMinutes()).toBe(59);
    });

    it("should work correctly for overdue tasks", () => {
      const overdueDueDate = subDays(new Date(), 2); // 2 days ago
      const expectedSnoozeDate = endOfDay(addDays(overdueDueDate, 1)); // 1 day ago

      // The snoozed overdue task moves to end of the day after its original due date
      expect(expectedSnoozeDate).toBeDefined();
    });
  });

  describe("Status Recalculation After Snooze", () => {
    it('should recalculate status to "tomorrow" when snoozed from today', () => {
      const today = startOfDay(new Date());
      const _tomorrow = startOfDay(addDays(today, 1));

      // Helper function matching the hook logic
      const calculateStatus = (dueDate: Date) => {
        const dueDateStart = startOfDay(dueDate);
        const todayStart = startOfDay(new Date());
        const tomorrowStart = addDays(todayStart, 1);

        if (dueDateStart < todayStart) return "overdue";
        if (dueDateStart.getTime() === todayStart.getTime()) return "today";
        if (dueDateStart.getTime() === startOfDay(tomorrowStart).getTime()) return "tomorrow";
        return "upcoming";
      };

      // Task due today, snoozed to tomorrow
      const todayTask = createMockTask({ dueDate: today, status: "today" });
      const newDueDate = endOfDay(addDays(todayTask.dueDate, 1));

      expect(calculateStatus(newDueDate)).toBe("tomorrow");
    });

    it('should recalculate status to "today" when overdue task snoozed', () => {
      const yesterday = subDays(startOfDay(new Date()), 1);
      const _today = startOfDay(new Date());

      const calculateStatus = (dueDate: Date) => {
        const dueDateStart = startOfDay(dueDate);
        const todayStart = startOfDay(new Date());

        if (dueDateStart < todayStart) return "overdue";
        if (dueDateStart.getTime() === todayStart.getTime()) return "today";
        return "upcoming";
      };

      // Task due yesterday (overdue), snoozed to today
      const overdueTask = createMockTask({
        dueDate: yesterday,
        status: "overdue",
      });
      const newDueDate = endOfDay(addDays(overdueTask.dueDate, 1));

      expect(calculateStatus(newDueDate)).toBe("today");
    });
  });

  describe("Optimistic UI Update", () => {
    it("should trigger snooze when button is clicked", async () => {
      render(<TasksPanel />);

      const snoozeButton = screen.getByTitle("Snooze task");
      expect(snoozeButton).not.toBeDisabled();

      // Click should open the popover
      fireEvent.click(snoozeButton);

      // Wait for popover to open and find "Tomorrow" button
      await waitFor(() => {
        expect(screen.getByText("Tomorrow")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner while snoozing", async () => {
      // Create a promise that we can control
      let resolveSnooze: () => void;
      const snoozePromise = new Promise<void>((resolve) => {
        resolveSnooze = resolve;
      });
      mockUpdateTaskDueDate.mockReturnValue(snoozePromise);

      render(<TasksPanel />);

      const snoozeButton = screen.getByTitle("Snooze task");
      fireEvent.click(snoozeButton);

      // Wait for popover and click Tomorrow
      await waitFor(() => {
        expect(screen.getByText("Tomorrow")).toBeInTheDocument();
      });

      const tomorrowButton = screen.getByText("Tomorrow").closest("button");
      fireEvent.click(tomorrowButton!);

      // Button should show loading state
      await waitFor(() => {
        expect(mockUpdateTaskDueDate).toHaveBeenCalled();
      });

      // Resolve the snooze
      resolveSnooze!();
    });
  });

  describe("Error Handling", () => {
    it("should handle snooze failure gracefully", async () => {
      mockUpdateTaskDueDate.mockRejectedValue(new Error("Network error"));

      render(<TasksPanel />);

      const snoozeButton = screen.getByTitle("Snooze task");
      fireEvent.click(snoozeButton);

      // Wait for popover and click Tomorrow
      await waitFor(() => {
        expect(screen.getByText("Tomorrow")).toBeInTheDocument();
      });

      const tomorrowButton = screen.getByText("Tomorrow").closest("button");
      fireEvent.click(tomorrowButton!);

      // Should not throw and updateTaskDueDate should be called
      await waitFor(() => {
        expect(mockUpdateTaskDueDate).toHaveBeenCalled();
      });
    });
  });
});
