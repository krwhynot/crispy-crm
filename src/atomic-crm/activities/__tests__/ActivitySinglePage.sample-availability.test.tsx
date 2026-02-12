/**
 * Tests for ActivitySinglePage - Sample Type Availability
 *
 * Validates that the full Activity form (not Quick Add) shows all interaction types
 * including Sample, Administrative, and Other.
 */

import { describe, it, expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, FormProvider } from "react-hook-form";
import { AdminContext } from "react-admin";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { FormProgressProvider } from "@/components/ra-wrappers/form";
import ActivitySinglePage from "../ActivitySinglePage";
import { INTERACTION_TYPE_OPTIONS } from "@/atomic-crm/validation/activities";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      activity_type: "activity",
      type: "call",
      subject: "",
      activity_date: new Date().toISOString().split("T")[0],
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

/**
 * Helper to find the Interaction Type select trigger.
 * The Radix Select trigger renders as role="combobox" but without an accessible name
 * linked from the FormLabel. We locate it via the data-tutorial container.
 */
function getInteractionTypeSelect(): HTMLElement {
  const container = document.querySelector('[data-tutorial="activity-type"]');
  if (!container) throw new Error("Could not find activity-type container");
  const trigger = within(container as HTMLElement).getByRole("combobox");
  return trigger;
}

describe("ActivitySinglePage - Sample Type Availability", () => {
  it("should show Sample type in full Activity form (not Quick Add)", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <ActivitySinglePage />
      </TestWrapper>
    );

    const typeSelect = getInteractionTypeSelect();
    expect(typeSelect).toBeInTheDocument();

    await userEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Sample" })).toBeInTheDocument();
    });
  });

  it("should show all interaction types including Sample, Administrative, and Other", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <ActivitySinglePage />
      </TestWrapper>
    );

    const typeSelect = getInteractionTypeSelect();
    await userEvent.click(typeSelect);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Sample" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Administrative" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Other" })).toBeInTheDocument();
    });
  });

  it("should show sample_status field when Sample type is selected", async () => {
    renderWithAdminContext(
      <TestWrapper>
        <ActivitySinglePage />
      </TestWrapper>
    );

    const typeSelect = getInteractionTypeSelect();
    await userEvent.click(typeSelect);
    await userEvent.click(screen.getByRole("option", { name: "Sample" }));

    await waitFor(() => {
      expect(screen.getByText(/sample status/i)).toBeInTheDocument();
    });
  });

  it("should verify INTERACTION_TYPE_OPTIONS includes all 15 types", () => {
    expect(INTERACTION_TYPE_OPTIONS).toHaveLength(15);

    const typeValues = INTERACTION_TYPE_OPTIONS.map((opt) => opt.value);

    expect(typeValues).toContain("sample");
    expect(typeValues).toContain("administrative");
    expect(typeValues).toContain("other");
    expect(typeValues).toContain("call");
    expect(typeValues).toContain("email");
    expect(typeValues).toContain("meeting");
  });
});
