import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { TaskItem } from "../../types";

// Mock react-admin hooks
const mockNotify = vi.fn();
vi.mock("react-admin", () => ({
  useNotify: () => mockNotify,
  useDataProvider: () => ({
    getList: vi.fn().mockResolvedValue({ data: [] }),
    update: vi.fn().mockResolvedValue({ data: {} }),
  }),
}));

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

// Mutable state for mocks
const mockState = {
  loading: false,
  error: null as Error | null,
  tasks: createMockTasks(),
  completeTask: vi.fn(),
};

// Mock useMyTasks hook
vi.mock("../hooks/useMyTasks", () => ({
  useMyTasks: () => ({
    tasks: mockState.tasks,
    loading: mockState.loading,
    error: mockState.error,
    completeTask: mockState.completeTask,
  }),
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
    <h2 id={id} data-testid="sheet-title">{children}</h2>
  ),
  SheetDescription: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <p id={id} data-testid="sheet-description">{children}</p>
  ),
}));

// Import component AFTER mocks are set up
import { TaskCompleteSheet } from "../TaskCompleteSheet";

describe("TaskCompleteSheet", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.loading = false;
    mockState.error = null;
    mockState.tasks = createMockTasks();
    mockState.completeTask.mockResolvedValue(undefined);
    mockNotify.mockClear();
  });

  describe("Rendering", () => {
    it("renders nothing when closed", () => {
      render(
        <TaskCompleteSheet
          open={false}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      expect(screen.queryByTestId("sheet")).not.toBeInTheDocument();
    });

    it("renders task list when open", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      // Wait for component to render
      await waitFor(() => {
        expect(screen.getByTestId("sheet-title")).toHaveTextContent("Complete Task");
      });

      expect(screen.getByText("Call John about proposal")).toBeInTheDocument();
      expect(screen.getByText("Send contract to Sarah")).toBeInTheDocument();
      expect(screen.getByText("Prepare demo for Acme Corp")).toBeInTheDocument();
    });

    it("shows overdue badge when there are overdue tasks", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("1 overdue")).toBeInTheDocument();
      });
    });

    it("shows remaining task count", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("3 tasks remaining")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper aria attributes on sheet", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        const title = screen.getByTestId("sheet-title");
        expect(title).toHaveAttribute("id", "complete-task-title");
      });

      const description = screen.getByTestId("sheet-description");
      expect(description).toHaveAttribute("id", "complete-task-description");
    });

    it("complete buttons have descriptive aria-labels", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByLabelText('Mark "Call John about proposal" as complete')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByLabelText('Mark "Send contract to Sarah" as complete')
      ).toBeInTheDocument();
    });

    it("complete buttons meet minimum touch target size (44px)", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Call John about proposal")).toBeInTheDocument();
      });

      // Get only the complete buttons (not any other buttons)
      const completeButtons = screen.getAllByRole("button").filter(
        (btn) => btn.getAttribute("aria-label")?.includes("as complete")
      );

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
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Call John about proposal")).toBeInTheDocument();
      });

      const completeButton = screen.getByLabelText(
        'Mark "Call John about proposal" as complete'
      );
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockState.completeTask).toHaveBeenCalledWith(1);
      });
    });

    it("calls onRefresh after successful completion", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Call John about proposal")).toBeInTheDocument();
      });

      const completeButton = screen.getByLabelText(
        'Mark "Call John about proposal" as complete'
      );
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("Task Sorting", () => {
    it("shows overdue tasks first", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Call John about proposal")).toBeInTheDocument();
      });

      const completeButtons = screen.getAllByRole("button").filter(
        (btn) => btn.getAttribute("aria-label")?.includes("as complete")
      );

      // First task should be the overdue one
      expect(completeButtons[0]).toHaveAttribute(
        "aria-label",
        'Mark "Call John about proposal" as complete'
      );
    });
  });

  describe("Priority Display", () => {
    it("shows priority badges for all tasks", async () => {
      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("High")).toBeInTheDocument();
      });

      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Critical")).toBeInTheDocument();
    });
  });

  describe("Visual Styling", () => {
    it("uses semantic color classes (no hex codes)", async () => {
      const { container } = render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("sheet-content")).toBeInTheDocument();
      });

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
    it("shows empty state when no tasks", async () => {
      mockState.tasks = [];

      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("All caught up!")).toBeInTheDocument();
      });

      expect(screen.getByText("No pending tasks to complete")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows skeleton while loading", async () => {
      mockState.loading = true;

      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("task-list-skeleton")).toBeInTheDocument();
      });
    });
  });

  describe("Error State", () => {
    it("shows error message when error occurs", async () => {
      mockState.error = new Error("Failed to fetch tasks");

      render(
        <TaskCompleteSheet
          open={true}
          onOpenChange={mockOnOpenChange}
          onRefresh={mockOnRefresh}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Failed to load tasks")).toBeInTheDocument();
      });

      expect(screen.getByText("Failed to fetch tasks")).toBeInTheDocument();
    });
  });
});
