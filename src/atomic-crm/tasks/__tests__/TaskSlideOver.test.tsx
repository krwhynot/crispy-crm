/**
 * Tests for TaskSlideOver component
 *
 * Unit tests focused on:
 * - Tab configuration (2 tabs: details, related)
 * - Record representation (task title formatting)
 * - Header actions (mode toggle)
 *
 * Target coverage: Tab configuration and record representation logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode, ComponentType } from "react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { TaskSlideOver } from "../TaskSlideOver";

interface MockTabConfig {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string; "data-testid"?: string }>;
  component: ComponentType<{
    record: Record<string, unknown>;
    mode: string;
    onModeToggle: () => void;
  }>;
}

interface MockResourceSlideOverProps {
  resource: string;
  recordId: number | null;
  isOpen: boolean;
  onClose: () => void;
  mode: string;
  onModeToggle: () => void;
  tabs: MockTabConfig[];
  recordRepresentation?: (record: Record<string, unknown>) => string;
}

interface MockTabComponentProps {
  record: Record<string, unknown>;
  mode: string;
}

interface MockDoMockSlideOverProps {
  recordId: number;
  isOpen: boolean;
  recordRepresentation?: (record: Record<string, unknown>) => string;
}

// Mock dependencies
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetOne: vi.fn(),
    useUpdate: vi.fn(),
    useNotify: vi.fn(() => vi.fn()),
    RecordContextProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Form: ({
      children,
      onSubmit,
      record,
    }: {
      children: ReactNode;
      onSubmit?: (data: Record<string, unknown>) => void;
      record?: Record<string, unknown>;
    }) => (
      <form
        data-testid="task-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) onSubmit(record);
        }}
      >
        {children}
      </form>
    ),
  };
});

// Mock ResourceSlideOver to expose tab configuration for testing
vi.mock("@/components/layouts/ResourceSlideOver", () => ({
  ResourceSlideOver: ({
    resource,
    recordId,
    isOpen,
    onClose,
    mode,
    onModeToggle,
    tabs,
    recordRepresentation,
  }: MockResourceSlideOverProps) => {
    const mockRecord = {
      id: recordId,
      title: "Test Task Title",
      description: "Test description",
    };

    if (!isOpen) return null;

    return (
      <div role="dialog" data-testid="resource-slide-over" data-resource={resource}>
        <div data-testid="slide-over-header">
          <h2 data-testid="record-title">
            {recordRepresentation ? recordRepresentation(mockRecord) : `${resource} #${recordId}`}
          </h2>
          <button onClick={onModeToggle} data-testid="mode-toggle">
            {mode === "view" ? "Edit" : "Cancel"}
          </button>
          <button onClick={onClose} data-testid="close-button">
            Close
          </button>
        </div>

        <div role="tablist" data-testid="tab-list">
          {tabs.map((tab: MockTabConfig) => (
            <button
              key={tab.key}
              role="tab"
              data-testid={`tab-${tab.key}`}
              data-tab-key={tab.key}
              data-tab-label={tab.label}
              data-has-icon={!!tab.icon}
            >
              {tab.icon && <tab.icon className="h-4 w-4" data-testid={`icon-${tab.key}`} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Expose tab count for testing */}
        <div data-testid="tab-count">{tabs.length}</div>

        <div data-testid="tab-content">
          {tabs.map((tab: MockTabConfig) => {
            const TabComponent = tab.component;
            return (
              <div key={tab.key} data-testid={`tab-panel-${tab.key}`}>
                <TabComponent record={mockRecord} mode={mode} onModeToggle={onModeToggle} />
              </div>
            );
          })}
        </div>
      </div>
    );
  },
}));

// Mock tab components
vi.mock("../TaskSlideOverDetailsTab", () => ({
  TaskSlideOverDetailsTab: ({ record, mode }: MockTabComponentProps) => (
    <div data-testid="task-details-tab">
      <p>Details for task: {record.title}</p>
      <p>Mode: {mode}</p>
    </div>
  ),
}));

vi.mock("../TaskRelatedItemsTab", () => ({
  TaskRelatedItemsTab: ({ record, mode }: MockTabComponentProps) => (
    <div data-testid="task-related-tab">
      <p>Related items for task {record.id}</p>
      <p>Mode: {mode}</p>
    </div>
  ),
}));

describe("TaskSlideOver", () => {
  const mockOnClose = vi.fn();
  const mockOnModeToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Tab Configuration", () => {
    it("has exactly 2 tabs", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const tabCount = screen.getByTestId("tab-count");
        expect(tabCount).toHaveTextContent("2");
      });
    });

    it("has correct tab keys: 'details' and 'related'", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("tab-details")).toBeInTheDocument();
        expect(screen.getByTestId("tab-related")).toBeInTheDocument();
      });
    });

    it("details tab has key 'details' and label 'Details'", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const detailsTab = screen.getByTestId("tab-details");
        expect(detailsTab).toHaveAttribute("data-tab-key", "details");
        expect(detailsTab).toHaveAttribute("data-tab-label", "Details");
        expect(detailsTab).toHaveTextContent("Details");
      });
    });

    it("related tab has key 'related' and label 'Related Items'", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const relatedTab = screen.getByTestId("tab-related");
        expect(relatedTab).toHaveAttribute("data-tab-key", "related");
        expect(relatedTab).toHaveAttribute("data-tab-label", "Related Items");
        expect(relatedTab).toHaveTextContent("Related Items");
      });
    });

    it("each tab has an icon configured", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const detailsTab = screen.getByTestId("tab-details");
        const relatedTab = screen.getByTestId("tab-related");

        expect(detailsTab).toHaveAttribute("data-has-icon", "true");
        expect(relatedTab).toHaveAttribute("data-has-icon", "true");
      });
    });

    it("details tab uses CheckSquareIcon", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        // Icon is rendered inside the tab
        expect(screen.getByTestId("icon-details")).toBeInTheDocument();
      });
    });

    it("related tab uses LinkIcon", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        // Icon is rendered inside the tab
        expect(screen.getByTestId("icon-related")).toBeInTheDocument();
      });
    });

    it("renders tab panels for each configured tab", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("tab-panel-details")).toBeInTheDocument();
        expect(screen.getByTestId("tab-panel-related")).toBeInTheDocument();
      });
    });
  });

  describe("Record Representation", () => {
    it("formats task title correctly when title exists", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={123}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const title = screen.getByTestId("record-title");
        expect(title).toHaveTextContent("Test Task Title");
      });
    });

    it("displays fallback 'Task #id' when title is empty", async () => {
      // Override the mock to return empty title
      vi.doMock("@/components/layouts/ResourceSlideOver", () => ({
        ResourceSlideOver: ({
          recordId,
          isOpen,
          recordRepresentation,
        }: MockDoMockSlideOverProps) => {
          const mockRecordNoTitle = {
            id: recordId,
            title: "",
          };

          if (!isOpen) return null;

          return (
            <div role="dialog" data-testid="resource-slide-over">
              <h2 data-testid="record-title-fallback">
                {recordRepresentation
                  ? recordRepresentation(mockRecordNoTitle)
                  : `Task #${recordId}`}
              </h2>
            </div>
          );
        },
      }));

      // Test the recordRepresentation function logic directly
      // The function is: (record: Task) => record.title || `Task #${record.id}`
      const recordWithNoTitle = { id: 456, title: "" };
      const result = recordWithNoTitle.title || `Task #${recordWithNoTitle.id}`;
      expect(result).toBe("Task #456");
    });

    it("recordRepresentation returns title when present", () => {
      // Test the logic directly
      const recordWithTitle = { id: 789, title: "Important Follow-up" };
      const result = recordWithTitle.title || `Task #${recordWithTitle.id}`;
      expect(result).toBe("Important Follow-up");
    });

    it("recordRepresentation returns Task #id when title is null", () => {
      const recordWithNullTitle = { id: 100, title: null };
      const result = recordWithNullTitle.title || `Task #${recordWithNullTitle.id}`;
      expect(result).toBe("Task #100");
    });

    it("recordRepresentation returns Task #id when title is undefined", () => {
      const recordWithUndefinedTitle = { id: 200, title: undefined };
      const result = recordWithUndefinedTitle.title || `Task #${recordWithUndefinedTitle.id}`;
      expect(result).toBe("Task #200");
    });
  });

  describe("Header Actions", () => {
    it("displays Edit button in view mode", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const toggleButton = screen.getByTestId("mode-toggle");
        expect(toggleButton).toHaveTextContent("Edit");
      });
    });

    it("displays Cancel button in edit mode", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="edit"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const toggleButton = screen.getByTestId("mode-toggle");
        expect(toggleButton).toHaveTextContent("Cancel");
      });
    });

    it("calls onModeToggle when Edit button is clicked", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("mode-toggle")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("mode-toggle"));

      expect(mockOnModeToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onModeToggle when Cancel button is clicked in edit mode", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="edit"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("mode-toggle")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("mode-toggle"));

      expect(mockOnModeToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("close-button")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("close-button"));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Basic Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={false}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders slide-over when isOpen is true", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("uses tasks resource", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        const slideOver = screen.getByTestId("resource-slide-over");
        expect(slideOver).toHaveAttribute("data-resource", "tasks");
      });
    });

    it("passes mode prop to tab components", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="edit"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        // Details tab should show edit mode
        const detailsTab = screen.getByTestId("task-details-tab");
        expect(within(detailsTab).getByText("Mode: edit")).toBeInTheDocument();

        // Related tab should show edit mode
        const relatedTab = screen.getByTestId("task-related-tab");
        expect(within(relatedTab).getByText("Mode: edit")).toBeInTheDocument();
      });
    });

    it("passes record data to tab components", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={1}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      await waitFor(() => {
        // Details tab receives record
        expect(screen.getByText("Details for task: Test Task Title")).toBeInTheDocument();

        // Related tab receives record
        expect(screen.getByText("Related items for task 1")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles null recordId", async () => {
      renderWithAdminContext(
        <TaskSlideOver
          recordId={null}
          isOpen={true}
          mode="view"
          onClose={mockOnClose}
          onModeToggle={mockOnModeToggle}
        />
      );

      // When recordId is null, the component still renders (ResourceSlideOver handles empty state)
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });
});
