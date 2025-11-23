import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TasksPanel } from "../TasksPanel";
import * as reactAdmin from "react-admin";

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

// Mock React Admin's useNotify hook
const mockNotify = vi.fn();
vi.mock("react-admin", () => ({
  useNotify: () => mockNotify,
}));

describe("TasksPanel", () => {
  beforeEach(() => {
    // Default mock returns all task statuses
    mockUseMyTasks.mockReturnValue({
      tasks: mockTaskData,
      loading: false,
      error: null,
      completeTask: vi.fn(),
      snoozeTask: vi.fn(),
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
      snoozeTask: vi.fn(),
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

  it("should show success toast when task is snoozed", async () => {
    const mockSnoozeTask = vi.fn().mockResolvedValue(undefined);
    mockUseMyTasks.mockReturnValue({
      tasks: [mockTaskData[1]], // Today task
      loading: false,
      error: null,
      completeTask: vi.fn(),
      snoozeTask: mockSnoozeTask,
    });

    render(<TasksPanel />);

    // Find and click the snooze button
    const snoozeButton = screen.getByLabelText(/Snooze "Send contract for review" by 1 day/);
    fireEvent.click(snoozeButton);

    // Wait for async snooze operation
    await waitFor(() => {
      expect(mockSnoozeTask).toHaveBeenCalledWith(2);
    });

    // Should show success notification
    expect(mockNotify).toHaveBeenCalledWith(
      "Task snoozed for tomorrow",
      expect.objectContaining({ type: "success" })
    );
  });
});
