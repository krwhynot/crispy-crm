/**
 * Tests for ActivityDetailsTab component
 *
 * Unit tests focused on:
 * - View mode rendering (subject, badges, dates, optional fields)
 * - Edit mode rendering (form inputs, form id)
 * - Props interface (record, mode, callbacks)
 *
 * Target coverage: View/edit mode rendering and props interface
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ActivityDetailsTab } from "../ActivityDetailsTab";
import type { ActivityRecord } from "@/atomic-crm/types";

interface MockFormProps {
  children: React.ReactNode;
  id?: string;
  onSubmit?: (data: Record<string, unknown>) => void;
  record?: Record<string, unknown>;
}

interface MockFieldProps {
  children?: React.ReactNode;
  source: string;
}

interface MockInputProps {
  source: string;
  label?: string;
  type?: string;
}

interface MockChoiceItem {
  id: string;
  name: string;
}

interface MockSelectInputProps extends MockInputProps {
  choices?: MockChoiceItem[];
}

// Mock ra-core hooks
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useUpdate: vi.fn(() => [vi.fn().mockResolvedValue({}), { isLoading: false }]),
    useNotify: vi.fn(() => vi.fn()),
    RecordContextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

// Mock react-admin Form to capture form submission
vi.mock("react-admin", async () => {
  const actual = await vi.importActual("react-admin");
  return {
    ...actual,
    Form: ({ children, id, onSubmit, record }: MockFormProps) => (
      <form
        id={id}
        data-testid="activity-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) onSubmit(record);
        }}
      >
        {children}
      </form>
    ),
    ReferenceField: ({ children, source }: MockFieldProps) => (
      <span data-testid={`reference-field-${source}`}>{children}</span>
    ),
  };
});

// Mock DirtyStateTracker to track calls
const mockDirtyStateTracker = vi.fn();
vi.mock("@/components/layouts/sidepane", async () => {
  const actual = await vi.importActual("@/components/layouts/sidepane");
  return {
    ...actual,
    DirtyStateTracker: ({ onDirtyChange }: { onDirtyChange?: (isDirty: boolean) => void }) => {
      mockDirtyStateTracker(onDirtyChange);
      return null;
    },
  };
});

// Mock form input components
vi.mock("@/components/ra-wrappers/text-input", () => ({
  TextInput: ({ source, label, type }: MockInputProps) => (
    <div data-testid={`text-input-${source}`}>
      <label>{label}</label>
      <input type={type || "text"} name={source} />
    </div>
  ),
}));

vi.mock("@/components/ra-wrappers/select-input", () => ({
  SelectInput: ({ source, label, choices }: MockSelectInputProps) => (
    <div data-testid={`select-input-${source}`}>
      <label>{label}</label>
      <select name={source}>
        {choices?.map((c: MockChoiceItem) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("@/components/ra-wrappers/boolean-input", () => ({
  BooleanInput: ({ source, label }: MockInputProps) => (
    <div data-testid={`boolean-input-${source}`}>
      <label>{label}</label>
      <input type="checkbox" name={source} />
    </div>
  ),
}));

vi.mock("@/components/ra-wrappers/reference-input", () => ({
  ReferenceInput: ({ source, children }: MockFieldProps) => (
    <div data-testid={`reference-input-${source}`}>{children}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/autocomplete-input", () => ({
  AutocompleteInput: ({ label }: { label?: string }) => (
    <div data-testid="autocomplete-input">
      <label>{label}</label>
      <input type="text" />
    </div>
  ),
}));

vi.mock("@/components/ra-wrappers/date-field", () => ({
  DateField: ({ source }: { source: string }) => (
    <span data-testid={`date-field-${source}`}>Date Value</span>
  ),
}));

// Mock DateInput to avoid FormProvider requirement in edit mode
vi.mock("@/components/ra-wrappers/date-input", () => ({
  DateInput: ({ source, label }: { source: string; label?: string }) => (
    <div data-testid={`date-input-${source}`}>
      <label>{label}</label>
      <input type="text" name={source} placeholder="Date input mock" />
    </div>
  ),
}));

/**
 * Factory function to create mock ActivityRecord for testing
 */
function createMockActivity(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: 1,
    activity_type: "activity",
    type: "call",
    subject: "Test Activity",
    activity_date: "2024-01-15",
    duration_minutes: 30,
    description: "Test description",
    sentiment: "positive",
    created_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("ActivityDetailsTab", () => {
  const mockOnModeToggle = vi.fn();
  const mockOnDirtyChange = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("View Mode Rendering", () => {
    it("renders activity subject", () => {
      const record = createMockActivity({ subject: "Important Sales Call" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Important Sales Call")).toBeInTheDocument();
    });

    it("renders fallback subject when subject is empty", () => {
      const record = createMockActivity({ subject: "" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Untitled Activity")).toBeInTheDocument();
    });

    it("renders activity type badge", () => {
      const record = createMockActivity({ activity_type: "activity" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("activity")).toBeInTheDocument();
    });

    it("renders interaction type badge", () => {
      const record = createMockActivity({ type: "call" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Call")).toBeInTheDocument();
    });

    it("renders activity date", () => {
      const record = createMockActivity({ activity_date: "2024-01-15" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Date:")).toBeInTheDocument();
      expect(screen.getByTestId("date-field-activity_date")).toBeInTheDocument();
    });

    it("renders duration when present", () => {
      const record = createMockActivity({ duration_minutes: 45 });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Duration:")).toBeInTheDocument();
      expect(screen.getByText("45 minutes")).toBeInTheDocument();
    });

    it("does not render duration when absent", () => {
      const record = createMockActivity({ duration_minutes: undefined });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.queryByText("Duration:")).not.toBeInTheDocument();
    });

    it("renders description when present", () => {
      const record = createMockActivity({ description: "Discussed new product launch" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Discussed new product launch")).toBeInTheDocument();
    });

    it("does not render description section when absent", () => {
      const record = createMockActivity({ description: undefined });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.queryByText("Description")).not.toBeInTheDocument();
    });

    describe("Sentiment Badge", () => {
      it("renders positive sentiment with default variant", () => {
        const record = createMockActivity({ sentiment: "positive" });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Positive")).toBeInTheDocument();
      });

      it("renders negative sentiment with destructive variant", () => {
        const record = createMockActivity({ sentiment: "negative" });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Negative")).toBeInTheDocument();
      });

      it("renders neutral sentiment with secondary variant", () => {
        const record = createMockActivity({ sentiment: "neutral" });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Neutral")).toBeInTheDocument();
      });

      it("does not render sentiment section when absent", () => {
        const record = createMockActivity({
          sentiment: undefined,
          outcome: undefined,
          location: undefined,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.queryByText("Sentiment:")).not.toBeInTheDocument();
      });
    });

    describe("Sample Status Section", () => {
      it("shows sample status section when type is sample", () => {
        const record = createMockActivity({
          type: "sample",
          sample_status: "sent",
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Sample Tracking")).toBeInTheDocument();
        expect(screen.getByText("Sent")).toBeInTheDocument();
      });

      it("does not show sample status section when type is not sample", () => {
        const record = createMockActivity({
          type: "call",
          sample_status: undefined,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.queryByText("Sample Tracking")).not.toBeInTheDocument();
      });

      it("does not show sample status section when sample_status is absent", () => {
        const record = createMockActivity({
          type: "sample",
          sample_status: undefined,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.queryByText("Sample Tracking")).not.toBeInTheDocument();
      });
    });

    describe("Follow-up Section", () => {
      it("shows follow-up section when follow_up_required is true", () => {
        const record = createMockActivity({
          follow_up_required: true,
          follow_up_date: "2024-01-20",
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Follow-up")).toBeInTheDocument();
        expect(screen.getByText("Follow-up Required")).toBeInTheDocument();
      });

      it("shows follow-up date when present", () => {
        const record = createMockActivity({
          follow_up_date: "2024-01-20",
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Follow-up Date:")).toBeInTheDocument();
        expect(screen.getByTestId("date-field-follow_up_date")).toBeInTheDocument();
      });

      it("shows follow-up notes when present", () => {
        const record = createMockActivity({
          follow_up_notes: "Remember to send proposal",
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Follow-up Notes")).toBeInTheDocument();
        expect(screen.getByText("Remember to send proposal")).toBeInTheDocument();
      });

      it("does not show follow-up section when no follow-up data", () => {
        const record = createMockActivity({
          follow_up_required: false,
          follow_up_date: undefined,
          follow_up_notes: undefined,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.queryByText("Follow-up")).not.toBeInTheDocument();
      });
    });

    describe("Related Records Section", () => {
      it("shows related records section when opportunity_id is present", () => {
        const record = createMockActivity({
          opportunity_id: 123,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Related Records")).toBeInTheDocument();
        expect(screen.getByText("Opportunity:")).toBeInTheDocument();
      });

      it("shows related records section when contact_id is present", () => {
        const record = createMockActivity({
          contact_id: 456,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Related Records")).toBeInTheDocument();
        expect(screen.getByText("Contact:")).toBeInTheDocument();
      });

      it("shows related records section when organization_id is present", () => {
        const record = createMockActivity({
          organization_id: 789,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.getByText("Related Records")).toBeInTheDocument();
        expect(screen.getByText("Organization:")).toBeInTheDocument();
      });

      it("does not show related records section when no related records", () => {
        const record = createMockActivity({
          opportunity_id: undefined,
          contact_id: undefined,
          organization_id: undefined,
        });

        renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        expect(screen.queryByText("Related Records")).not.toBeInTheDocument();
      });
    });

    it("renders metadata section with timestamps", () => {
      const record = createMockActivity({
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-16T14:30:00Z",
      });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      // SidepaneMetadata component is rendered
      expect(document.body.textContent).toContain("Created");
    });

    it("renders outcome when present", () => {
      const record = createMockActivity({
        outcome: "Scheduled demo for next week",
      });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Outcome:")).toBeInTheDocument();
      expect(screen.getByText("Scheduled demo for next week")).toBeInTheDocument();
    });

    it("renders location when present", () => {
      const record = createMockActivity({
        location: "Client Office - Downtown",
      });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Location:")).toBeInTheDocument();
      expect(screen.getByText("Client Office - Downtown")).toBeInTheDocument();
    });
  });

  describe("Edit Mode Rendering", () => {
    it("renders form in edit mode", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("activity-form")).toBeInTheDocument();
    });

    it("form has id=slide-over-edit-form", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      const form = screen.getByTestId("activity-form");
      expect(form).toHaveAttribute("id", "slide-over-edit-form");
    });

    // Activity type select was removed — activity_type is now auto-set to "activity"
    // (engagement/interaction distinction removed in simplify-activity-types migration)

    it("includes interaction type select input", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("select-input-type")).toBeInTheDocument();
      expect(screen.getByText("Interaction Type")).toBeInTheDocument();
    });

    it("includes subject text input", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("text-input-subject")).toBeInTheDocument();
      expect(screen.getByText("Subject")).toBeInTheDocument();
    });

    it("includes activity date input", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("date-input-activity_date")).toBeInTheDocument();
      expect(screen.getByText("Activity Date")).toBeInTheDocument();
    });

    it("includes sentiment select input", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("select-input-sentiment")).toBeInTheDocument();
      expect(screen.getByText("Sentiment")).toBeInTheDocument();
    });

    it("includes duration input", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("text-input-duration_minutes")).toBeInTheDocument();
      expect(screen.getByText("Duration (minutes)")).toBeInTheDocument();
    });

    it("includes description textarea", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("text-input-description")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("includes follow-up required boolean input", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("boolean-input-follow_up_required")).toBeInTheDocument();
      expect(screen.getByText("Follow-up Required")).toBeInTheDocument();
    });

    it("includes follow-up date input", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("date-input-follow_up_date")).toBeInTheDocument();
      expect(screen.getByText("Follow-up Date")).toBeInTheDocument();
    });

    it("includes follow-up notes textarea", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("text-input-follow_up_notes")).toBeInTheDocument();
      expect(screen.getByText("Follow-up Notes")).toBeInTheDocument();
    });

    it("includes sample status select when type is sample", () => {
      const record = createMockActivity({ type: "sample" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("select-input-sample_status")).toBeInTheDocument();
      expect(screen.getByText("Sample Status")).toBeInTheDocument();
    });

    it("does not include sample status select when type is not sample", () => {
      const record = createMockActivity({ type: "call" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.queryByTestId("select-input-sample_status")).not.toBeInTheDocument();
    });

    it("includes reference inputs for relationships", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByTestId("reference-input-opportunity_id")).toBeInTheDocument();
      expect(screen.getByTestId("reference-input-contact_id")).toBeInTheDocument();
      expect(screen.getByTestId("reference-input-organization_id")).toBeInTheDocument();
    });

    it("has accessible form role and label", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      const formContainer = screen.getByRole("form", { name: /edit activity form/i });
      expect(formContainer).toBeInTheDocument();
    });
  });

  describe("Props Interface", () => {
    it("accepts record prop", () => {
      const record = createMockActivity({ subject: "Custom Subject" });

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Custom Subject")).toBeInTheDocument();
    });

    it("accepts mode prop and renders correctly for view", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
      );

      // View mode does not render form
      expect(screen.queryByTestId("activity-form")).not.toBeInTheDocument();
    });

    it("accepts mode prop and renders correctly for edit", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="edit" onModeToggle={mockOnModeToggle} />
      );

      // Edit mode renders form
      expect(screen.getByTestId("activity-form")).toBeInTheDocument();
    });

    it("accepts onModeToggle prop", () => {
      const record = createMockActivity();
      const customModeToggle = vi.fn();

      renderWithAdminContext(
        <ActivityDetailsTab record={record} mode="view" onModeToggle={customModeToggle} />
      );

      // Component renders without error when onModeToggle is provided
      expect(screen.getByText("Test Activity")).toBeInTheDocument();
    });

    it("accepts onDirtyChange prop in edit mode", () => {
      const record = createMockActivity();

      renderWithAdminContext(
        <ActivityDetailsTab
          record={record}
          mode="edit"
          onModeToggle={mockOnModeToggle}
          onDirtyChange={mockOnDirtyChange}
        />
      );

      // DirtyStateTracker should receive onDirtyChange callback
      expect(mockDirtyStateTracker).toHaveBeenCalledWith(mockOnDirtyChange);
    });

    it("accepts isActiveTab prop", () => {
      const record = createMockActivity();

      // Should not throw when isActiveTab is provided
      renderWithAdminContext(
        <ActivityDetailsTab
          record={record}
          mode="view"
          onModeToggle={mockOnModeToggle}
          isActiveTab={true}
        />
      );

      expect(screen.getByText("Test Activity")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles record with minimal fields", () => {
      const minimalRecord: ActivityRecord = {
        id: 1,
        activity_type: "activity",
        type: "note",
        subject: "Minimal",
        activity_date: "2024-01-01",
        created_at: "2024-01-01T00:00:00Z",
      };

      renderWithAdminContext(
        <ActivityDetailsTab record={minimalRecord} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Minimal")).toBeInTheDocument();
    });

    it("handles record with all optional fields populated", () => {
      const fullRecord = createMockActivity({
        subject: "Full Record",
        description: "Full description",
        duration_minutes: 60,
        sentiment: "positive",
        outcome: "Great outcome",
        location: "Conference Room A",
        follow_up_required: true,
        follow_up_date: "2024-02-01",
        follow_up_notes: "Important follow-up",
        opportunity_id: 1,
        contact_id: 2,
        organization_id: 3,
        updated_at: "2024-01-20T12:00:00Z",
      });

      renderWithAdminContext(
        <ActivityDetailsTab record={fullRecord} mode="view" onModeToggle={mockOnModeToggle} />
      );

      expect(screen.getByText("Full Record")).toBeInTheDocument();
      expect(screen.getByText("Full description")).toBeInTheDocument();
      expect(screen.getByText("60 minutes")).toBeInTheDocument();
      expect(screen.getByText("Great outcome")).toBeInTheDocument();
      expect(screen.getByText("Conference Room A")).toBeInTheDocument();
      expect(screen.getByText("Follow-up Required")).toBeInTheDocument();
      expect(screen.getByText("Important follow-up")).toBeInTheDocument();
    });

    it("renders different interaction types correctly", () => {
      const types = ["email", "meeting", "demo", "sample"] as const;

      types.forEach((type) => {
        const record = createMockActivity({ type });

        const { unmount } = renderWithAdminContext(
          <ActivityDetailsTab record={record} mode="view" onModeToggle={mockOnModeToggle} />
        );

        // Each type should render without error
        expect(screen.getByText("Test Activity")).toBeInTheDocument();
        unmount();
      });
    });
  });
});
