import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { TaskItem } from "../../types";
import type * as ReactAdmin from "react-admin";

// Mock react-admin hooks - use importOriginal to preserve all exports
const mockNotify = vi.fn();
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useNotify: () => mockNotify,
    useDataProvider: () => ({
      getList: vi.fn().mockResolvedValue({ data: [] }),
      update: vi.fn().mockResolvedValue({ data: {} }),
    }),
  };
});

// Create mock tasks
const createMockTasks = (): TaskItem[] => [
  {
    id: 1,
    subject: "Call John about proposal",
    dueDate: new Date("2025-01-15"),
    priority: "high",
    taskType: "Call",
    relatedTo: { type: "contact", name: "John Smith", id: 1 },
    status: "overdue",
  },
  {
    id: 2,
    subject: "Send contract to Sarah",
    dueDate: new Date(),
    priority: "medium",
    taskType: "Email",
    relatedTo: { type: "contact", name: "Sarah Jones", id: 2 },
    status: "today",
  },
  {
    id: 3,
    subject: "Prepare demo for Acme Corp",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    priority: "critical",
    taskType: "Demo",
    relatedTo: { type: "organization", name: "Acme Corp", id: 3 },
    status: "tomorrow",
  },
];

// Create mock complete function
const mockCompleteTask = vi.fn();

// Mock useMyTasks hook - using vi.hoisted for proper hoisting
vi.mock("../../hooks/useMyTasks", () => ({
  useMyTasks: vi.fn(() => ({
    tasks: createMockTasks(),
    loading: false,
    error: null,
    completeTask: mockCompleteTask,
  })),
}));

// Mock Sheet components for simpler testing
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <h2 id={id} data-testid="sheet-title">
      {children}
    </h2>
  ),
  SheetDescription: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <p id={id} data-testid="sheet-description">
      {children}
    </p>
  ),
}));

// Import component AFTER mocks are set up
import { TaskCompleteSheet } from "../TaskCompleteSheet";
import { useMyTasks } from "../../hooks/useMyTasks";

// Get the mocked function for manipulation
const mockedUseMyTasks = vi.mocked(useMyTasks);

describe("TaskCompleteSheet", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCompleteTask.mockResolvedValue(undefined);
    mockNotify.mockClear();

    // Reset mock to default state
    mockedUseMyTasks.mockReturnValue({
      tasks: createMockTasks(),
      loading: false,
      error: null,
      completeTask: mockCompleteTask,
      snoozeTask: vi.fn(),
      deleteTask: vi.fn(),
      viewTask: vi.fn(),
      updateTaskDueDate: vi.fn(),
      updateTaskLocally: vi.fn(),
      rollbackTask: vi.fn(),
      calculateStatus: vi.fn(),
    });
  });

  describe("Rendering", () => {
    it("renders nothing when closed", () => {
      render(
        <TaskCompleteSheet open={false} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.queryByTestId("sheet")).not.toBeInTheDocument();
    });

    it("renders task list when open", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByTestId("sheet-title")).toHaveTextContent("Complete Task");
      expect(screen.getByText("Call John about proposal")).toBeInTheDocument();
      expect(screen.getByText("Send contract to Sarah")).toBeInTheDocument();
      expect(screen.getByText("Prepare demo for Acme Corp")).toBeInTheDocument();
    });

    it("shows overdue badge when there are overdue tasks", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText("1 overdue")).toBeInTheDocument();
    });

    it("shows remaining task count", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText("3 tasks remaining")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper aria attributes on sheet", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      const title = screen.getByTestId("sheet-title");
      expect(title).toHaveAttribute("id", "complete-task-title");

      const description = screen.getByTestId("sheet-description");
      expect(description).toHaveAttribute("id", "complete-task-description");
    });

    it("complete buttons have descriptive aria-labels", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(
        screen.getByLabelText('Mark "Call John about proposal" as complete')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Mark "Send contract to Sarah" as complete')
      ).toBeInTheDocument();
    });

    it("complete buttons meet minimum touch target size (44px)", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      // Get only the complete buttons (not any other buttons)
      const completeButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label")?.includes("as complete"));

      expect(completeButtons.length).toBe(3);

      completeButtons.forEach((button) => {
        // Button should have h-11 w-11 classes (44x44px)
        expect(button).toHaveClass("h-11");
        expect(button).toHaveClass("w-11");
      });
    });
  });

  describe("Interactions", () => {
    it("calls completeTask when complete button is clicked", async () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      const completeButton = screen.getByLabelText('Mark "Call John about proposal" as complete');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockCompleteTask).toHaveBeenCalledWith(1);
      });
    });

    it("calls onRefresh after successful completion", async () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      const completeButton = screen.getByLabelText('Mark "Call John about proposal" as complete');
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("Task Sorting", () => {
    it("shows overdue tasks first", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      const completeButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label")?.includes("as complete"));

      // First task should be the overdue one
      expect(completeButtons[0]).toHaveAttribute(
        "aria-label",
        'Mark "Call John about proposal" as complete'
      );
    });
  });

  describe("Priority Display", () => {
    it("shows priority badges for all tasks", () => {
      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Critical")).toBeInTheDocument();
    });
  });

  describe("Visual Styling", () => {
    it("uses semantic color classes (no hex codes)", () => {
      const { container } = render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      const sheetContent = screen.getByTestId("sheet-content");

      // Check for semantic classes in the rendered content
      expect(sheetContent.querySelector(".text-muted-foreground")).toBeInTheDocument();
      expect(sheetContent.querySelector(".border-border")).toBeInTheDocument();

      // Ensure no inline hex colors
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const style = el.getAttribute("style") || "";
        expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      });
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no tasks", () => {
      mockedUseMyTasks.mockReturnValue({
        tasks: [],
        loading: false,
        error: null,
        completeTask: mockCompleteTask,
        snoozeTask: vi.fn(),
        deleteTask: vi.fn(),
        viewTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        updateTaskLocally: vi.fn(),
        rollbackTask: vi.fn(),
        calculateStatus: vi.fn(),
      });

      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText("All caught up!")).toBeInTheDocument();
      expect(screen.getByText("No pending tasks to complete")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows skeleton while loading", () => {
      mockedUseMyTasks.mockReturnValue({
        tasks: [],
        loading: true,
        error: null,
        completeTask: mockCompleteTask,
        snoozeTask: vi.fn(),
        deleteTask: vi.fn(),
        viewTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        updateTaskLocally: vi.fn(),
        rollbackTask: vi.fn(),
        calculateStatus: vi.fn(),
      });

      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByTestId("task-list-skeleton")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("shows error message when error occurs", () => {
      mockedUseMyTasks.mockReturnValue({
        tasks: [],
        loading: false,
        error: new Error("Failed to fetch tasks"),
        completeTask: mockCompleteTask,
        snoozeTask: vi.fn(),
        deleteTask: vi.fn(),
        viewTask: vi.fn(),
        updateTaskDueDate: vi.fn(),
        updateTaskLocally: vi.fn(),
        rollbackTask: vi.fn(),
        calculateStatus: vi.fn(),
      });

      render(
        <TaskCompleteSheet open={true} onOpenChange={mockOnOpenChange} onRefresh={mockOnRefresh} />
      );

      expect(screen.getByText("Failed to load tasks")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch tasks")).toBeInTheDocument();
    });
  });
});
