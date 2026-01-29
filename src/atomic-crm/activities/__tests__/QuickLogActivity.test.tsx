import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { QuickLogActivity } from "../QuickLogActivity";
import type { Task } from "../../types";

// Mock ra-core hooks
const mockDataProvider = {
  create: vi.fn(),
};

const mockNotify = vi.fn();
const mockGetOne = vi.fn();

vi.mock("ra-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ra-core")>();
  return {
    ...actual,
    useDataProvider: () => mockDataProvider,
    useNotify: () => mockNotify,
    useGetOne: (
      resource: string,
      params: Record<string, unknown>,
      options: Record<string, unknown>
    ) => {
      // Always return an object with data property, even if undefined
      return (
        mockGetOne(resource, params, options) || { data: undefined, isLoading: false, error: null }
      );
    },
  };
});

describe("QuickLogActivity", () => {
  const mockTask: Task = {
    id: 1,
    title: "Call customer about order",
    description: "Discuss pricing and delivery",
    type: "Call",
    due_date: "2025-11-15",
    completed: false,
    completed_at: null,
    priority: "medium",
    contact_id: 10,
    opportunity_id: 20,
    sales_id: 5,
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T10:00:00Z",
    reminder_date: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return value for useGetOne
    mockGetOne.mockReturnValue({ data: undefined, isLoading: false, error: null });
  });

  it("should render the dialog with task information", () => {
    renderWithAdminContext(<QuickLogActivity open={true} onClose={vi.fn()} task={mockTask} />);

    expect(screen.getByText("Log Activity Details")).toBeInTheDocument();
    expect(screen.getByText("What happened with this task? (optional)")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Completed task: Call customer about order")
    ).toBeInTheDocument();
  });

  it("should infer activity type from task type", () => {
    renderWithAdminContext(<QuickLogActivity open={true} onClose={vi.fn()} task={mockTask} />);

    // The select should show "Call" as it maps from the task type
    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("aria-expanded", "false");
  });

  it("should infer activity type from task title when type is Other", () => {
    const taskWithNoType = { ...mockTask, type: "Other", title: "Email vendor about pricing" };

    renderWithAdminContext(
      <QuickLogActivity open={true} onClose={vi.fn()} task={taskWithNoType} />
    );

    expect(
      screen.getByDisplayValue("Completed task: Email vendor about pricing")
    ).toBeInTheDocument();
  });

  it("should call onClose when Skip button is clicked", () => {
    const onClose = vi.fn();

    renderWithAdminContext(<QuickLogActivity open={true} onClose={onClose} task={mockTask} />);

    fireEvent.click(screen.getByText("Skip"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should save activity when Save button is clicked", async () => {
    const onClose = vi.fn();
    mockDataProvider.create.mockResolvedValue({ data: { id: 100 } });

    renderWithAdminContext(<QuickLogActivity open={true} onClose={onClose} task={mockTask} />);

    // Change notes
    const textarea = screen.getByPlaceholderText("What was discussed or accomplished?");
    fireEvent.change(textarea, { target: { value: "Discussed pricing, customer wants 2 cases" } });

    // Click save
    fireEvent.click(screen.getByText("Save Activity"));

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith("activities", {
        data: {
          activity_type: "interaction",
          type: "call",
          subject: "Completed: Call customer about order",
          description: "Discussed pricing, customer wants 2 cases",
          activity_date: expect.any(String),
          contact_id: 10,
          opportunity_id: 20,
          organization_id: null,
          related_task_id: 1,
          follow_up_required: false,
        },
      });
      expect(mockNotify).toHaveBeenCalledWith("Activity logged successfully", { type: "success" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("should fetch opportunity to get organization_id when task has opportunity_id", () => {
    mockGetOne.mockReturnValue({
      data: {
        id: 20,
        customer_organization_id: 100,
        name: "Test Opportunity",
      },
      isLoading: false,
      error: null,
    });

    renderWithAdminContext(<QuickLogActivity open={true} onClose={vi.fn()} task={mockTask} />);

    expect(mockGetOne).toHaveBeenCalledWith("opportunities", { id: 20 }, { enabled: true });
  });

  it("should handle save errors gracefully", async () => {
    const onClose = vi.fn();
    mockDataProvider.create.mockRejectedValue(new Error("Network error"));

    renderWithAdminContext(<QuickLogActivity open={true} onClose={onClose} task={mockTask} />);

    fireEvent.click(screen.getByText("Save Activity"));

    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith("Failed to log activity", { type: "error" });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it("should disable inputs while submitting", async () => {
    mockDataProvider.create.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderWithAdminContext(<QuickLogActivity open={true} onClose={vi.fn()} task={mockTask} />);

    fireEvent.click(screen.getByText("Save Activity"));

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.getByText("Skip")).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByPlaceholderText("What was discussed or accomplished?")).toBeDisabled();
  });
});
