import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TasksPanel } from "../TasksPanel";

const mockTaskData = [
  {
    id: 1,
    subject: "Follow up on Q4 proposal",
    dueDate: new Date(Date.now() - 86400000),
    priority: "high" as const,
    taskType: "Call" as const,
    relatedTo: { type: "opportunity" as const, name: "Q4 Enterprise Deal", id: 101 },
    status: "overdue" as const,
  },
  {
    id: 2,
    subject: "Send contract for review",
    dueDate: new Date(),
    priority: "critical" as const,
    taskType: "Email" as const,
    relatedTo: { type: "contact" as const, name: "John Smith", id: 202 },
    status: "today" as const,
  },
  {
    id: 3,
    subject: "Schedule demo meeting",
    dueDate: new Date(Date.now() + 86400000),
    priority: "medium" as const,
    taskType: "Meeting" as const,
    relatedTo: { type: "organization" as const, name: "TechCorp", id: 303 },
    status: "tomorrow" as const,
  },
];

// Mock the useMyTasks hook with vi.fn() for per-test control
const mockUseMyTasks = vi.fn();
vi.mock("../../hooks/useMyTasks", () => ({
  useMyTasks: () => mockUseMyTasks(),
}));

// Mock React Admin's useNotify hook - use importOriginal to preserve all exports
const mockNotify = vi.fn();
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-admin")>();
  return {
    ...actual,
    useNotify: () => mockNotify,
  };
});

describe("TasksPanel", () => {
  beforeEach(() => {
    // Default mock returns all task statuses
    // Note: snoozeTask is deprecated in favor of updateTaskDueDate for SnoozePopover
    mockUseMyTasks.mockReturnValue({
      tasks: mockTaskData,
      loading: false,
      error: null,
      completeTask: vi.fn(),
      updateTaskDueDate: vi.fn(),
      deleteTask: vi.fn(),
      viewTask: vi.fn(),
    });
  });

  it("should render panel headers and helper text", () => {
    render(<TasksPanel />);

    expect(screen.getByText("My Tasks")).toBeInTheDocument();
    expect(screen.getByText("Today's priorities and upcoming activities")).toBeInTheDocument();
  });

  it("should render task groups", () => {
    render(<TasksPanel />);

    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("should apply interactive-card class to task items", () => {
    const { container } = render(<TasksPanel />);
    const cards = container.querySelectorAll(".interactive-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("should hide Today and Tomorrow groups when they have no tasks", () => {
    // Override mock to return only overdue tasks
    mockUseMyTasks.mockReturnValue({
      tasks: [mockTaskData[0]], // Only overdue task
      loading: false,
      error: null,
      completeTask: vi.fn(),
      updateTaskDueDate: vi.fn(),
      deleteTask: vi.fn(),
      viewTask: vi.fn(),
    });

    render(<TasksPanel />);

    // Should show Overdue group with tasks
    expect(screen.getByText("Overdue")).toBeInTheDocument();

    // Should NOT show empty Today and Tomorrow groups
    expect(screen.queryByText("Today")).not.toBeInTheDocument();
    expect(screen.queryByText("Tomorrow")).not.toBeInTheDocument();
  });

  it("should show all groups when they have tasks", () => {
    // Uses default mock with all task statuses
    render(<TasksPanel />);

    // All groups should be visible when they have tasks
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("should show snooze popover when snooze button is clicked", async () => {
    const user = userEvent.setup();
    const mockUpdateTaskDueDate = vi.fn().mockResolvedValue(undefined);
    mockUseMyTasks.mockReturnValue({
      tasks: [mockTaskData[1]], // Today task
      loading: false,
      error: null,
      completeTask: vi.fn(),
      updateTaskDueDate: mockUpdateTaskDueDate,
      deleteTask: vi.fn(),
      viewTask: vi.fn(),
    });

    render(<TasksPanel />);

    // Find and click the snooze button (now opens a popover)
    const snoozeButton = screen.getByLabelText(/Snooze "Send contract for review"/);
    await user.click(snoozeButton);

    // Popover should appear with snooze options
    await waitFor(() => {
      expect(screen.getByText("Snooze until")).toBeInTheDocument();
      expect(screen.getByText("Tomorrow")).toBeInTheDocument();
      expect(screen.getByText("Next Week")).toBeInTheDocument();
      expect(screen.getByText("Pick a date...")).toBeInTheDocument();
    });
  });

  it("should snooze task to tomorrow when Tomorrow option is clicked", async () => {
    const user = userEvent.setup();
    const mockUpdateTaskDueDate = vi.fn().mockResolvedValue(undefined);
    mockUseMyTasks.mockReturnValue({
      tasks: [mockTaskData[1]], // Today task
      loading: false,
      error: null,
      completeTask: vi.fn(),
      updateTaskDueDate: mockUpdateTaskDueDate,
      deleteTask: vi.fn(),
      viewTask: vi.fn(),
    });

    render(<TasksPanel />);

    // Open snooze popover
    const snoozeButton = screen.getByLabelText(/Snooze "Send contract for review"/);
    await user.click(snoozeButton);

    // Click Tomorrow option
    await waitFor(() => {
      expect(screen.getByText("Tomorrow")).toBeInTheDocument();
    });
    const tomorrowOption = screen.getByText("Tomorrow").closest("button");
    await user.click(tomorrowOption!);

    // Wait for async snooze operation
    await waitFor(() => {
      expect(mockUpdateTaskDueDate).toHaveBeenCalledWith(2, expect.any(Date));
    });

    // Should show success notification
    expect(mockNotify).toHaveBeenCalledWith(
      "Task snoozed",
      expect.objectContaining({ type: "success" })
    );
  });

  describe("New Task button", () => {
    it("should render New Task button in header", () => {
      mockUseMyTasks.mockReturnValue({
        tasks: [],
        loading: false,
        error: null,
        completeTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        deleteTask: vi.fn(),
        viewTask: vi.fn(),
      });

      render(<TasksPanel />);

      // Should show New Task button
      expect(screen.getByRole("button", { name: /new task/i })).toBeInTheDocument();
    });
  });

  describe("More menu", () => {
    it("should open dropdown menu when More button is clicked", async () => {
      const user = userEvent.setup();
      mockUseMyTasks.mockReturnValue({
        tasks: [mockTaskData[1]], // Today task
        loading: false,
        error: null,
        completeTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        deleteTask: vi.fn(),
        viewTask: vi.fn(),
      });

      render(<TasksPanel />);

      // Find and click the More button using userEvent for proper Radix interaction
      const moreButton = screen.getByLabelText(/More actions for "Send contract for review"/);
      await user.click(moreButton);

      // Menu should appear with View, Edit, Delete options
      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /view/i })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
      });
    });

    it("should call onView when View is clicked", async () => {
      const user = userEvent.setup();
      const mockViewTask = vi.fn();
      mockUseMyTasks.mockReturnValue({
        tasks: [mockTaskData[1]],
        loading: false,
        error: null,
        completeTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        deleteTask: vi.fn(),
        viewTask: mockViewTask,
      });

      render(<TasksPanel />);

      // Open menu
      const moreButton = screen.getByLabelText(/More actions for "Send contract for review"/);
      await user.click(moreButton);

      // Click View
      const viewItem = await screen.findByRole("menuitem", { name: /view/i });
      await user.click(viewItem);

      expect(mockViewTask).toHaveBeenCalledWith(2);
    });

    it("should call onDelete when Delete is clicked", async () => {
      const user = userEvent.setup();
      const mockDeleteTask = vi.fn().mockResolvedValue(undefined);
      mockUseMyTasks.mockReturnValue({
        tasks: [mockTaskData[1]],
        loading: false,
        error: null,
        completeTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        deleteTask: mockDeleteTask,
        viewTask: vi.fn(),
      });

      render(<TasksPanel />);

      // Open menu
      const moreButton = screen.getByLabelText(/More actions for "Send contract for review"/);
      await user.click(moreButton);

      // Click Delete
      const deleteItem = await screen.findByRole("menuitem", { name: /delete/i });
      await user.click(deleteItem);

      expect(mockDeleteTask).toHaveBeenCalledWith(2);
    });

    it("should show success toast when task is deleted", async () => {
      const user = userEvent.setup();
      const mockDeleteTask = vi.fn().mockResolvedValue(undefined);
      mockUseMyTasks.mockReturnValue({
        tasks: [mockTaskData[1]],
        loading: false,
        error: null,
        completeTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        deleteTask: mockDeleteTask,
        viewTask: vi.fn(),
      });

      render(<TasksPanel />);

      // Open menu and click Delete
      const moreButton = screen.getByLabelText(/More actions for "Send contract for review"/);
      await user.click(moreButton);

      const deleteItem = await screen.findByRole("menuitem", { name: /delete/i });
      await user.click(deleteItem);

      await waitFor(() => {
        expect(mockNotify).toHaveBeenCalledWith(
          "Task deleted",
          expect.objectContaining({ type: "success" })
        );
      });
    });
  });
});
