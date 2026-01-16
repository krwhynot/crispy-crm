/**
 * Tests for ActivitySinglePage component
 *
 * Tests single-page form layout with collapsible sections for Activities.
 * Uses TDD approach with proper Radix Collapsible testing patterns.
 */

import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { useForm, FormProvider } from "react-hook-form";
import { AdminContext } from "react-admin";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { FormProgressProvider } from "@/components/admin/form";
import ActivitySinglePage from "../ActivitySinglePage";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      // activity_type: "interaction" makes Opportunity field visible (conditionally rendered)
      activity_type: "interaction",
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
        <FormProgressProvider>
          <form>{children}</form>
        </FormProgressProvider>
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

  describe("Always Expanded Follow-up and Outcome Sections", () => {
    // Note: FormSection components are now always expanded (not collapsible)
    // Tests updated to reflect the new non-collapsible design

    test("Follow-up section is expanded by default with all fields visible", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Find the Follow-up section header using a more specific query (h3 in FormSectionWithProgress)
      const followUpHeaders = screen.getAllByText(/follow-up/i);
      const sectionHeader = followUpHeaders.find(
        (el) => el.tagName === "H3" && el.textContent === "Follow-up"
      );
      expect(sectionHeader).toBeInTheDocument();

      // All Follow-up fields should be visible (non-collapsible FormSection)
      expect(screen.getByText(/^sentiment$/i)).toBeVisible();
      // Use getAllByText for Follow-up Date since there are multiple matches
      const followUpDateLabels = screen.getAllByText(/follow-up date/i);
      expect(followUpDateLabels.length).toBeGreaterThan(0);
      expect(followUpDateLabels[0]).toBeVisible();
    });

    test("Outcome section is expanded by default with all fields visible", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Find the Outcome section header (h3 element in FormSectionWithProgress)
      const outcomeHeaders = screen.getAllByText(/outcome/i);
      const sectionHeader = outcomeHeaders.find(
        (el) => el.tagName === "H3" && el.textContent === "Outcome"
      );
      expect(sectionHeader).toBeInTheDocument();

      // All Outcome fields should be visible (non-collapsible FormSection)
      expect(screen.getByText(/^location$/i)).toBeVisible();
    });

    test("Follow-up section contains sentiment field", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Sentiment field should be rendered and visible
      expect(screen.getByText(/^sentiment$/i)).toBeVisible();
      expect(screen.getByText(/how did the contact respond/i)).toBeVisible();
    });

    test("Outcome section contains location and outcome fields", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Location field with helper text
      expect(screen.getByText(/^location$/i)).toBeVisible();
      expect(screen.getByText(/where did this occur/i)).toBeVisible();

      // Outcome field label (not section header)
      const outcomeLabels = screen.getAllByText(/outcome/i);
      const outcomeFieldLabel = outcomeLabels.find(
        (el) => el.tagName === "SPAN" && el.textContent === "Outcome"
      );
      expect(outcomeFieldLabel).toBeVisible();
    });

    test("all four sections render as non-collapsible FormSections", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      // Verify all sections are rendered
      expect(screen.getByText(/activity details/i)).toBeInTheDocument();
      expect(screen.getByText(/relationships/i)).toBeInTheDocument();

      // Follow-up and Outcome headers exist (multiple matches due to field labels)
      const followUpHeaders = screen.getAllByText(/follow-up/i);
      expect(followUpHeaders.length).toBeGreaterThan(0);

      const outcomeHeaders = screen.getAllByText(/outcome/i);
      expect(outcomeHeaders.length).toBeGreaterThan(0);

      // No collapsible triggers should exist (buttons with expand/collapse functionality)
      expect(screen.queryByRole("button", { name: /follow-up/i })).toBeNull();
      expect(screen.queryByRole("button", { name: /outcome/i })).toBeNull();
    });
  });

  describe("Form Structure", () => {
    test("uses FormSectionWithProgress for headers", () => {
      renderWithAdminContext(
        <TestWrapper>
          <ActivitySinglePage />
        </TestWrapper>
      );

      const sections = document.querySelectorAll('[data-slot="form-section-with-progress"]');
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
