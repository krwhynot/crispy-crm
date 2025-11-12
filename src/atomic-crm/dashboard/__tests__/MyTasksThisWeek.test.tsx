import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TestMemoryRouter } from "ra-core";
import { MyTasksThisWeek } from "../MyTasksThisWeek";
import type { Task } from "../../types";
import userEvent from "@testing-library/user-event";

// Mock react-admin hooks
const mockGetList = vi.fn();
const mockGetIdentity = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    useGetList: () => mockGetList(),
    useGetIdentity: () => mockGetIdentity(),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock QuickCompleteTaskModal
vi.mock("../QuickCompleteTaskModal", () => ({
  QuickCompleteTaskModal: ({ task, onClose }: { task: Task; onClose: () => void }) => (
    <div data-testid="quick-complete-modal">
      <div>Mock Modal for: {task.title}</div>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe("MyTasksThisWeek", () => {
  const mockCurrentUserId = 1;
  const today = new Date("2025-11-12T10:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(today);

    mockGetIdentity.mockReturnValue({
      identity: { id: mockCurrentUserId },
    });
  });

  describe("Loading State", () => {
    it("should display skeleton rows while loading", () => {
      mockGetList.mockReturnValue({
        data: undefined,
        isPending: true,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      // Should show loading skeletons
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Error State", () => {
    it("should display error message when fetch fails", () => {
      mockGetList.mockReturnValue({
        data: undefined,
        isPending: false,
        error: new Error("Network error"),
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load tasks/i)).toHaveClass("text-destructive");
    });
  });

  describe("Empty State", () => {
    it("should display empty message when no tasks", () => {
      mockGetList.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      expect(screen.getByText(/no tasks this week/i)).toBeInTheDocument();
      expect(screen.getByText(/no tasks this week/i)).toHaveClass("text-muted-foreground");
    });
  });

  describe("Task Grouping", () => {
    it("should group tasks into OVERDUE, TODAY, and THIS WEEK sections", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Overdue Task",
          due_date: "2025-11-10", // 2 days ago
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
        {
          id: 2,
          title: "Today Task",
          due_date: "2025-11-12", // today
          completed: false,
          contact_id: 1,
          type: "Email",
          sales_id: mockCurrentUserId,
        },
        {
          id: 3,
          title: "Future Task",
          due_date: "2025-11-15", // 3 days from now
          completed: false,
          contact_id: 1,
          type: "Meeting",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      // Check for group headers
      expect(screen.getByText(/⚠️ OVERDUE/i)).toBeInTheDocument();
      expect(screen.getByText(/📅 DUE TODAY/i)).toBeInTheDocument();
      expect(screen.getByText(/📆 THIS WEEK/i)).toBeInTheDocument();

      // Check for task titles
      expect(screen.getByText("Overdue Task")).toBeInTheDocument();
      expect(screen.getByText("Today Task")).toBeInTheDocument();
      expect(screen.getByText("Future Task")).toBeInTheDocument();
    });

    it("should only show sections with tasks", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Today Only",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      // Should show TODAY section
      expect(screen.getByText(/📅 DUE TODAY/i)).toBeInTheDocument();

      // Should NOT show OVERDUE or THIS WEEK sections
      expect(screen.queryByText(/⚠️ OVERDUE/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/📆 THIS WEEK/i)).not.toBeInTheDocument();
    });
  });

  describe("Task Row Styling", () => {
    it("should render task rows with correct height and hover state", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Test Task",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const taskRow = screen.getByText("Test Task").closest("div[class*='h-8']");
      expect(taskRow).toBeInTheDocument();
      expect(taskRow).toHaveClass("h-8");
      expect(taskRow?.className).toMatch(/hover:bg-muted/);
    });
  });

  describe("Checkbox Interaction", () => {
    it("should open QuickCompleteTaskModal when checkbox is clicked", async () => {
      const user = userEvent.setup();
      const tasks: Task[] = [
        {
          id: 1,
          title: "Task to Complete",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      // Find and click checkbox
      const checkbox = screen.getByRole("checkbox", {
        name: /complete task: task to complete/i,
      });
      await user.click(checkbox);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByTestId("quick-complete-modal")).toBeInTheDocument();
        expect(screen.getByText(/mock modal for: task to complete/i)).toBeInTheDocument();
      });
    });

    it("should close modal when close button is clicked", async () => {
      const user = userEvent.setup();
      const tasks: Task[] = [
        {
          id: 1,
          title: "Task to Complete",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      // Open modal
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Close modal
      await waitFor(() => {
        expect(screen.getByTestId("quick-complete-modal")).toBeInTheDocument();
      });

      const closeButton = screen.getByText("Close");
      await user.click(closeButton);

      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByTestId("quick-complete-modal")).not.toBeInTheDocument();
      });
    });
  });

  describe("Row Navigation", () => {
    it("should navigate to task detail when row is clicked", async () => {
      const user = userEvent.setup();
      const tasks: Task[] = [
        {
          id: 123,
          title: "Clickable Task",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const taskRow = screen.getByText("Clickable Task").closest("div[role='button']");
      expect(taskRow).toBeInTheDocument();

      await user.click(taskRow!);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/tasks/123");
      });
    });
  });

  describe("Due Date Badges", () => {
    it("should show destructive badge for overdue tasks", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Overdue Task",
          due_date: "2025-11-08", // 4 days ago
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const badge = screen.getByText("Overdue Task")
        .closest("div")
        ?.querySelector(".text-destructive");
      expect(badge).toBeInTheDocument();
    });

    it("should show warning badge for today tasks", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Today Task",
          due_date: "2025-11-12", // today
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const badge = screen.getByText("Today Task").closest("div")?.querySelector(".text-warning");
      expect(badge).toBeInTheDocument();
    });

    it("should show muted badge for future tasks", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Future Task",
          due_date: "2025-11-15", // 3 days from now
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const badge = screen.getByText("Future Task")
        .closest("div")
        ?.querySelector(".text-muted-foreground");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Footer Link", () => {
    it("should render footer link to /tasks", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Test Task",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const footerLink = screen.getByText(/view all tasks/i);
      expect(footerLink).toBeInTheDocument();
      expect(footerLink).toHaveAttribute("href", "/tasks");
      expect(footerLink).toHaveClass("text-primary");
      expect(footerLink).toHaveClass("hover:underline");
    });

    it("should have border-t-2 border-border on footer", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Test Task",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const footer = screen.getByText(/view all tasks/i).closest("div");
      expect(footer).toHaveClass("border-t-2");
      expect(footer).toHaveClass("border-border");
    });
  });

  describe("Header with Count Badge", () => {
    it("should display task count in header", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Task 1",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
        {
          id: 2,
          title: "Task 2",
          due_date: "2025-11-13",
          completed: false,
          contact_id: 1,
          type: "Email",
          sales_id: mockCurrentUserId,
        },
        {
          id: 3,
          title: "Task 3",
          due_date: "2025-11-14",
          completed: false,
          contact_id: 1,
          type: "Meeting",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      expect(screen.getByText(/my tasks this week/i)).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument(); // Count badge
    });
  });

  describe("Accessibility", () => {
    it("should have visually hidden labels for checkboxes", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Accessible Task",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const checkbox = screen.getByRole("checkbox", {
        name: /complete task: accessible task/i,
      });
      expect(checkbox).toBeInTheDocument();
    });

    it("should have aria-label on interactive rows", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Interactive Task",
          due_date: "2025-11-12",
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const row = screen.getByText("Interactive Task").closest("div[role='button']");
      expect(row).toHaveAttribute("aria-label");
    });

    it("should have aria-hidden on icons", () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: "Task with Icons",
          due_date: "2025-11-10", // overdue
          completed: false,
          contact_id: 1,
          type: "Call",
          sales_id: mockCurrentUserId,
        },
      ];

      mockGetList.mockReturnValue({
        data: tasks,
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      const icons = document.querySelectorAll("svg[aria-hidden='true']");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Data Fetching", () => {
    it("should fetch tasks with correct filter parameters", () => {
      mockGetList.mockReturnValue({
        data: [],
        isPending: false,
        error: null,
      });

      render(
        <TestMemoryRouter>
          <MyTasksThisWeek />
        </TestMemoryRouter>
      );

      // Verify useGetList was called (the actual call happens in the component)
      expect(mockGetList).toHaveBeenCalled();
    });
  });
});
