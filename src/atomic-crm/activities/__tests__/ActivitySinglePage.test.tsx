/**
 * Tests for ActivitySinglePage component
 *
 * Tests single-page form layout with collapsible sections for Activities.
 * Uses TDD approach with proper Radix Collapsible testing patterns.
 */

import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { AdminContext } from "react-admin";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import ActivitySinglePage from "../ActivitySinglePage";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      type: "",
      subject: "",
      activity_date: "",
      duration_minutes: null,
      description: "",
      opportunity_id: null,
      contact_id: null,
      organization_id: null,
      follow_up_required: false,
      follow_up_date: "",
      follow_up_notes: "",
      sentiment: "",
      outcome: "",
      location: "",
    },
    mode: "onBlur",
  });

  return (
    <AdminContext>
      <FormProvider {...methods}>
        <form>{children}</form>
      </FormProvider>
    </AdminContext>
  );
};

describe("ActivitySinglePage", () => {
  describe("Always Expanded Sections", () => {
    test("renders Activity Details section expanded by default", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      expect(screen.getByText(/activity details/i)).toBeInTheDocument();
      expect(screen.getByText(/interaction type/i)).toBeVisible();
      expect(screen.getByText(/^subject$/i)).toBeVisible();
      expect(screen.getByText(/^date$/i)).toBeVisible();
      expect(screen.getByText(/duration \(minutes\)/i)).toBeVisible();
      expect(screen.getByText(/^notes$/i)).toBeVisible();
    });

    test("renders Relationships section expanded by default", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      expect(screen.getByText(/relationships/i)).toBeInTheDocument();
      expect(screen.getByText(/^opportunity$/i)).toBeVisible();
      expect(screen.getByText(/^contact$/i)).toBeVisible();
      expect(screen.getByText(/^organization$/i)).toBeVisible();
    });
  });

  describe("Collapsible Sections", () => {
    test("Follow-up section is collapsed by default", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      expect(screen.getByText(/follow-up/i)).toBeInTheDocument();

      // Radix Collapsible unmounts content when closed - use toBeNull()
      expect(screen.queryByText(/^sentiment$/i)).toBeNull();
      expect(screen.queryByText(/follow-up date/i)).toBeNull();
      expect(screen.queryByText(/follow-up notes/i)).toBeNull();
    });

    test("Outcome section is collapsed by default", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Find the Outcome section header specifically (not the helper text)
      const outcomeHeader = screen.getAllByText(/outcome/i).find((el) => el.tagName === "H3");
      expect(outcomeHeader).toBeInTheDocument();

      // Radix Collapsible unmounts content when closed - use toBeNull()
      expect(screen.queryByText(/^location$/i)).toBeNull();
    });

    test("can expand Follow-up section", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Find and click the Follow-up trigger
      const followUpTrigger = screen.getByRole("button", { name: /follow-up/i });
      await user.click(followUpTrigger);

      // Fields should now be visible
      expect(screen.getByText(/^sentiment$/i)).toBeVisible();
      expect(screen.getByText(/follow-up date/i)).toBeVisible();
      expect(screen.getByText(/follow-up notes/i)).toBeVisible();
    });

    test("can expand Outcome section", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Find and click the Outcome trigger
      const outcomeTrigger = screen.getByRole("button", { name: /outcome/i });
      await user.click(outcomeTrigger);

      // Fields should now be visible
      expect(screen.getByText(/^location$/i)).toBeVisible();
      // Check for the outcome field label (not the subject helper text)
      const outcomeLabels = screen.getAllByText(/outcome/i);
      const outcomeFieldLabel = outcomeLabels.find(
        (el) => el.tagName === "SPAN" && el.textContent === "Outcome"
      );
      expect(outcomeFieldLabel).toBeVisible();
    });

    test("can collapse expanded sections", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Expand Follow-up
      const followUpTrigger = screen.getByRole("button", { name: /follow-up/i });
      await user.click(followUpTrigger);
      expect(screen.getByText(/^sentiment$/i)).toBeVisible();

      // Collapse it again
      await user.click(followUpTrigger);
      expect(screen.queryByText(/^sentiment$/i)).toBeNull();
    });
  });

  describe("Form Structure", () => {
    test("uses FormSection for headers", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      const sections = document.querySelectorAll('[data-slot="form-section"]');
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    test("uses FormGrid for field layout", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      const grids = document.querySelectorAll('[data-testid="form-grid"]');
      expect(grids.length).toBeGreaterThanOrEqual(1);
    });
  });
});
