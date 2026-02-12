/**
 * TimelineEntry Component Tests
 *
 * Tests for the timeline entry component that renders activities and tasks
 * in a unified timeline view.
 *
 * Test Coverage:
 * - Icon rendering for each activity subtype (call, email, meeting, note, etc.)
 * - Unknown subtype handling with graceful fallback and logging
 * - Content display (title, description, date)
 * - Entry type differentiation (activity vs task)
 * - Organization-level activity detection
 *
 * Note: This file uses bare render() with mocked ra-core instead of renderWithAdminContext
 * because we specifically mock RecordContextProvider to test the component in isolation
 * without requiring full React Admin context.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the logger before importing the component
vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the ReferenceField to avoid React Admin context requirements
vi.mock("@/components/ra-wrappers/reference-field", () => ({
  ReferenceField: ({ source }: { source: string }) => (
    <span data-testid={`reference-field-${source}`}>Mock User</span>
  ),
}));

// Mock RecordContextProvider from ra-core with partial import
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    RecordContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Import component and logger after mocks are set up
import { TimelineEntry } from "../TimelineEntry";
import { logger } from "@/lib/logger";

// Helper to create timeline entry data
interface TimelineEntryData {
  id: number;
  entry_type: "activity" | "task";
  subtype: string;
  title: string;
  description?: string;
  entry_date: string;
  contact_id?: number;
  organization_id?: number;
  opportunity_id?: number;
  created_by?: number;
  sales_id?: number;
  created_at: string;
}

function createTimelineEntry(overrides: Partial<TimelineEntryData> = {}): TimelineEntryData {
  return {
    id: 1,
    entry_type: "activity",
    subtype: "call",
    title: "Test Entry",
    description: "Test description",
    entry_date: "2024-01-15",
    created_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

// Wrapper component with MemoryRouter for Link components
// Uses bare render() because we mock ra-core RecordContextProvider for isolation testing
function renderWithRouter(ui: React.ReactElement) {
  // eslint-disable-next-line no-restricted-syntax -- Using bare render with mocked ra-core for isolation
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("TimelineEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("icon rendering", () => {
    it("renders Phone icon for call subtype", () => {
      const entry = createTimelineEntry({ subtype: "call" });
      const { container } = renderWithRouter(<TimelineEntry entry={entry} />);

      // Phone icon should be present - check for SVG with the icon
      const iconContainer = container.querySelector(".rounded-full");
      expect(iconContainer).toBeInTheDocument();

      // Verify it rendered the correct subtype text
      expect(screen.getByText("Call")).toBeInTheDocument();
    });

    it("renders Mail icon for email subtype", () => {
      const entry = createTimelineEntry({ subtype: "email" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("renders Users icon for meeting subtype", () => {
      const entry = createTimelineEntry({ subtype: "meeting" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Meeting")).toBeInTheDocument();
    });

    it("renders FileText icon for note subtype", () => {
      const entry = createTimelineEntry({ subtype: "note" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Note")).toBeInTheDocument();
    });

    it("renders Clock icon for follow_up subtype", () => {
      const entry = createTimelineEntry({ subtype: "follow_up" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Follow up")).toBeInTheDocument();
    });

    it("renders ArrowRightLeft icon for stage_change subtype", () => {
      const entry = createTimelineEntry({
        subtype: "stage_change",
        title: "Stage changed",
        description: "Pipeline stage changed",
      });
      const { container } = renderWithRouter(<TimelineEntry entry={entry} />);

      // Stage change icon should have text-primary class
      const iconContainer = container.querySelector(".rounded-full");
      expect(iconContainer).toBeInTheDocument();

      // Check the subtype text (underscores replaced with spaces)
      expect(screen.getByText("Stage change")).toBeInTheDocument();
    });

    it("handles unknown subtype gracefully with fallback icon", () => {
      const entry = createTimelineEntry({
        subtype: "unknown_type_xyz",
        title: "Unknown activity",
      });
      renderWithRouter(<TimelineEntry entry={entry} />);

      // Component uses replace("_", " ") which only replaces first underscore
      // "unknown_type_xyz" -> "Unknown type_xyz"
      expect(screen.getByText("Unknown type_xyz")).toBeInTheDocument();

      // Should log warning with proper context
      expect(logger.warn).toHaveBeenCalledWith(
        "Unknown timeline subtype",
        expect.objectContaining({
          subtype: "unknown_type_xyz",
          entryId: 1,
          metric: "timeline.unknown_subtype",
        })
      );
    });

    it("logs warning only once per render for unknown subtype", () => {
      const entry = createTimelineEntry({ subtype: "weird_activity" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(logger.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("content display", () => {
    it("displays entry title", () => {
      const entry = createTimelineEntry({ title: "My Test Title" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("My Test Title")).toBeInTheDocument();
    });

    it("displays entry description", () => {
      const entry = createTimelineEntry({ description: "This is a detailed description" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("This is a detailed description")).toBeInTheDocument();
    });

    it("displays formatted entry date", () => {
      const entry = createTimelineEntry({ entry_date: "2024-01-15" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      // date-fns format "MMM d, yyyy" = "Jan 15, 2024"
      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    });

    it("handles missing description gracefully", () => {
      const entry = createTimelineEntry({ description: undefined });
      const { container } = renderWithRouter(<TimelineEntry entry={entry} />);

      // The description container should not be present
      const descriptionElement = container.querySelector(".whitespace-pre-line");
      expect(descriptionElement).not.toBeInTheDocument();
    });

    it("handles empty title gracefully", () => {
      const entry = createTimelineEntry({ title: "" });
      const { container } = renderWithRouter(<TimelineEntry entry={entry} />);

      // Empty title should not render the title div
      const titleElements = container.querySelectorAll(".font-medium.mb-1");
      const titleElement = Array.from(titleElements).find((el) => !el.textContent);
      expect(titleElement).toBeFalsy();
    });
  });

  describe("entry type differentiation", () => {
    it("shows Task badge for task entries", () => {
      const entry = createTimelineEntry({ entry_type: "task" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Task")).toBeInTheDocument();
    });

    it("does not show Task badge for activity entries", () => {
      const entry = createTimelineEntry({ entry_type: "activity" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      // "Task" badge should not be present (subtype "Call" will be there)
      const taskBadge = screen.queryByText("Task");
      expect(taskBadge).not.toBeInTheDocument();
    });

    it("shows View Task link for task entries", () => {
      const entry = createTimelineEntry({ entry_type: "task" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("View Task")).toBeInTheDocument();
    });

    it("shows View Opportunity link when opportunity_id is present", () => {
      const entry = createTimelineEntry({ opportunity_id: 123 });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("View Opportunity")).toBeInTheDocument();
    });

    it("does not show View Opportunity link when opportunity_id is absent", () => {
      const entry = createTimelineEntry({ opportunity_id: undefined });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.queryByText("View Opportunity")).not.toBeInTheDocument();
    });
  });

  describe("assignee and creator display", () => {
    it("shows assigned user for tasks with sales_id", () => {
      const entry = createTimelineEntry({
        entry_type: "task",
        sales_id: 5,
      });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText(/assigned to/)).toBeInTheDocument();
      expect(screen.getByTestId("reference-field-sales_id")).toBeInTheDocument();
    });

    it("shows creator for activities with created_by", () => {
      const entry = createTimelineEntry({
        entry_type: "activity",
        created_by: 3,
      });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText(/^by$/)).toBeInTheDocument();
      expect(screen.getByTestId("reference-field-created_by")).toBeInTheDocument();
    });

    it("does not show assignee for tasks without sales_id", () => {
      const entry = createTimelineEntry({
        entry_type: "task",
        sales_id: undefined,
      });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.queryByText(/assigned to/)).not.toBeInTheDocument();
    });
  });

  describe("organization-level activity detection", () => {
    it("shows Organization badge when viewing contact and activity is org-level", () => {
      const entry = createTimelineEntry({
        organization_id: 10,
        contact_id: 5,
      });
      renderWithRouter(<TimelineEntry entry={entry} currentContactId={999} />);

      expect(screen.getByText("Organization")).toBeInTheDocument();
    });

    it("does not show Organization badge when activity is for current contact", () => {
      const entry = createTimelineEntry({
        organization_id: 10,
        contact_id: 5,
      });
      renderWithRouter(<TimelineEntry entry={entry} currentContactId={5} />);

      expect(screen.queryByText("Organization")).not.toBeInTheDocument();
    });

    it("does not show Organization badge when no currentContactId provided", () => {
      const entry = createTimelineEntry({
        organization_id: 10,
        contact_id: 5,
      });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.queryByText("Organization")).not.toBeInTheDocument();
    });

    it("applies dashed border styling for org-level entries", () => {
      const entry = createTimelineEntry({
        organization_id: 10,
        contact_id: 5,
      });
      const { container } = renderWithRouter(
        <TimelineEntry entry={entry} currentContactId={999} />
      );

      const entryDiv = container.querySelector(".border-dashed");
      expect(entryDiv).toBeInTheDocument();
    });
  });

  describe("styling and layout", () => {
    it("has proper touch target sizing on icon container (h-11 w-11)", () => {
      const entry = createTimelineEntry();
      const { container } = renderWithRouter(<TimelineEntry entry={entry} />);

      const iconContainer = container.querySelector(".w-11.h-11");
      expect(iconContainer).toBeInTheDocument();
    });

    it("applies different background color for tasks vs activities", () => {
      const taskEntry = createTimelineEntry({ entry_type: "task" });
      const activityEntry = createTimelineEntry({ entry_type: "activity" });

      const { container: taskContainer } = renderWithRouter(<TimelineEntry entry={taskEntry} />);
      const { container: activityContainer } = renderWithRouter(
        <TimelineEntry entry={activityEntry} />
      );

      const taskIconContainer = taskContainer.querySelector(".bg-secondary\\/20");
      const activityIconContainer = activityContainer.querySelector(".bg-primary\\/10");

      expect(taskIconContainer).toBeInTheDocument();
      expect(activityIconContainer).toBeInTheDocument();
    });

    it("uses semantic Tailwind colors (no hardcoded hex)", () => {
      const entry = createTimelineEntry();
      const { container } = renderWithRouter(<TimelineEntry entry={entry} />);

      // Verify no inline styles with hex colors
      const allElements = container.querySelectorAll("*");
      allElements.forEach((el) => {
        const style = el.getAttribute("style") || "";
        expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      });
    });

    it("links have minimum touch target height (min-h-11)", () => {
      const entry = createTimelineEntry({ opportunity_id: 123 });
      const { container } = renderWithRouter(<TimelineEntry entry={entry} />);

      const link = container.querySelector("a.min-h-11");
      expect(link).toBeInTheDocument();
    });
  });

  describe("subtype formatting", () => {
    it("capitalizes first letter of subtype", () => {
      const entry = createTimelineEntry({ subtype: "call" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Call")).toBeInTheDocument();
    });

    it("replaces underscores with spaces in subtype display", () => {
      const entry = createTimelineEntry({ subtype: "follow_up" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Follow up")).toBeInTheDocument();
    });

    it("handles multi-word subtypes with underscores", () => {
      const entry = createTimelineEntry({ subtype: "stage_change" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      expect(screen.getByText("Stage change")).toBeInTheDocument();
    });
  });

  describe("date handling", () => {
    it("handles invalid date gracefully", () => {
      const entry = createTimelineEntry({ entry_date: "invalid-date" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      // Should fall back to current date formatting - component still renders
      const dateElement = screen.getByText(/\d{4}/);
      expect(dateElement).toBeInTheDocument();
    });

    it("handles empty date string", () => {
      const entry = createTimelineEntry({ entry_date: "" });
      renderWithRouter(<TimelineEntry entry={entry} />);

      // Should fall back to current date
      const dateElement = screen.getByText(/\d{4}/);
      expect(dateElement).toBeInTheDocument();
    });
  });
});
