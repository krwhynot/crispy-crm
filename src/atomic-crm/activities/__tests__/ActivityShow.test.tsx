/**
 * Smoke tests for ActivityShow component
 *
 * Tests the activity details view including:
 * - Loading states
 * - Basic field display (subject, type, date)
 * - Conditional rendering (follow-up card, related records)
 * - Missing record handling
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import ActivityShow from "../ActivityShow";
import type { ActivityRecord } from "../../types";

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useShowContext: vi.fn(),
  };
});

vi.mock("@/components/ra-wrappers/reference-field", () => ({
  ReferenceField: ({ children, source }: { children?: React.ReactNode; source: string }) => (
    <div data-testid={`reference-field-${source}`}>{children || "Reference"}</div>
  ),
}));

vi.mock("@/components/ra-wrappers/date-field", () => ({
  DateField: ({ source }: { source: string }) => (
    <span data-testid={`date-field-${source}`}>2024-01-15</span>
  ),
}));

import { useShowContext } from "ra-core";

/**
 * Create a mock ActivityRecord for testing
 */
function createMockActivity(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: 1,
    activity_type: "activity",
    type: "call",
    subject: "Follow-up call with client",
    activity_date: "2024-01-15",
    created_at: "2024-01-15T10:00:00Z",
    ...overrides,
  };
}

describe("ActivityShow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("Loading State", () => {
    test("renders loading state when isPending is true", () => {
      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: undefined,
        isPending: true,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      expect(screen.getByText("Loading activity...")).toBeInTheDocument();
    });

    test("renders loading state when record is null", () => {
      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: null,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      expect(screen.getByText("Loading activity...")).toBeInTheDocument();
    });
  });

  describe("Basic Field Display", () => {
    test("displays activity subject in card header", async () => {
      const mockActivity = createMockActivity({
        subject: "Important client meeting",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Important client meeting")).toBeInTheDocument();
      });
    });

    test("displays activity_type and type badges", async () => {
      const mockActivity = createMockActivity({
        activity_type: "activity",
        type: "call",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("activity")).toBeInTheDocument();
        // Type is formatted through ACTIVITY_TYPE_FROM_API - "Call" badge exists
        expect(screen.getByText("Call")).toBeInTheDocument();
      });
    });

    test("displays activity date", async () => {
      const mockActivity = createMockActivity();

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Date")).toBeInTheDocument();
        expect(screen.getByTestId("date-field-activity_date")).toBeInTheDocument();
      });
    });

    test("displays description when present", async () => {
      const mockActivity = createMockActivity({
        description: "Discussed quarterly targets and next steps.",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Discussed quarterly targets and next steps.")).toBeInTheDocument();
      });
    });
  });

  describe("Conditional Rendering", () => {
    test("shows Related Records card when opportunity_id is present", async () => {
      const mockActivity = createMockActivity({
        opportunity_id: 5,
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Related Records")).toBeInTheDocument();
        expect(screen.getByText("Opportunity")).toBeInTheDocument();
        expect(screen.getByTestId("reference-field-opportunity_id")).toBeInTheDocument();
      });
    });

    test("shows Follow-up card when follow_up_required is true", async () => {
      const mockActivity = createMockActivity({
        follow_up_required: true,
        follow_up_date: "2024-01-20",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Follow-up")).toBeInTheDocument();
        expect(screen.getByText("Required")).toBeInTheDocument();
      });
    });

    test("hides Related Records card when no related IDs present", async () => {
      const mockActivity = createMockActivity({
        opportunity_id: undefined,
        contact_id: undefined,
        organization_id: undefined,
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Follow-up call with client")).toBeInTheDocument();
      });

      expect(screen.queryByText("Related Records")).not.toBeInTheDocument();
    });

    test("shows sample status for sample activities", async () => {
      const mockActivity = createMockActivity({
        type: "sample",
        sample_status: "sent",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Sample Status")).toBeInTheDocument();
      });
    });
  });

  describe("Sentiment Display", () => {
    test("displays sentiment badge when present", async () => {
      const mockActivity = createMockActivity({
        sentiment: "positive",
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Positive")).toBeInTheDocument();
      });
    });
  });

  describe("Fallback Display", () => {
    test("shows 'Untitled Activity' when subject is missing", async () => {
      const mockActivity = createMockActivity({
        subject: undefined,
      });

      (useShowContext as ReturnType<typeof vi.fn>).mockReturnValue({
        record: mockActivity,
        isPending: false,
      });

      renderWithAdminContext(<ActivityShow />, {
        resource: "activities",
      });

      await waitFor(() => {
        expect(screen.getByText("Untitled Activity")).toBeInTheDocument();
      });
    });
  });
});
