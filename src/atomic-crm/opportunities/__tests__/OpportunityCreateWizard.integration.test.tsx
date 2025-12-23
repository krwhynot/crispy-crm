/**
 * OpportunityCreateWizard Integration Tests
 *
 * Tests the multi-step wizard functionality for creating opportunities.
 * Covers navigation, validation, accessibility, and form submission.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  FormProgressProvider,
  FormProgressBar,
  FormWizard,
  WizardStep,
  WizardNavigation,
  StepIndicator,
} from "@/components/admin/form";
import { OPPORTUNITY_WIZARD_STEPS } from "../forms/OpportunityWizardSteps";
import { renderWithWizard } from "@/components/admin/form/__tests__/test-utils";
import type { WizardStepConfig } from "@/components/admin/form";

/**
 * Test wrapper that mimics the OpportunityCreateWizard structure
 * without needing the full React Admin context
 */
function TestOpportunityWizard({
  onSubmit = vi.fn(),
  defaultValues = {},
}: {
  onSubmit?: (data: unknown) => void | Promise<void>;
  defaultValues?: Record<string, unknown>;
}) {
  const methods = useForm({
    defaultValues: {
      name: "",
      customer_organization_id: "",
      stage: "new_lead",
      priority: "medium",
      estimated_close_date: "",
      ...defaultValues,
    },
    mode: "onBlur",
  });

  return (
    <FormProvider {...methods}>
      <FormProgressProvider initialProgress={10}>
        <StepIndicator className="mb-4" />
        <FormProgressBar className="mb-6" />
        <FormWizard steps={OPPORTUNITY_WIZARD_STEPS} onSubmit={onSubmit}>
          <WizardStep step={1}>
            <div data-testid="step-1-content">
              <label htmlFor="name">Opportunity Name</label>
              <input
                id="name"
                {...methods.register("name", { required: "Name is required" })}
              />
              <label htmlFor="customer">Customer Organization</label>
              <input
                id="customer"
                {...methods.register("customer_organization_id")}
              />
            </div>
          </WizardStep>

          <WizardStep step={2}>
            <div data-testid="step-2-content">
              <label htmlFor="stage">Stage</label>
              <select id="stage" {...methods.register("stage")}>
                <option value="new_lead">New Lead</option>
                <option value="qualified">Qualified</option>
              </select>
              <label htmlFor="priority">Priority</label>
              <select id="priority" {...methods.register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <label htmlFor="close-date">Est. Close Date</label>
              <input
                id="close-date"
                type="date"
                {...methods.register("estimated_close_date")}
              />
            </div>
          </WizardStep>

          <WizardStep step={3}>
            <div data-testid="step-3-content">
              <p>Contacts & Products (Step 3)</p>
            </div>
          </WizardStep>

          <WizardStep step={4}>
            <div data-testid="step-4-content">
              <p>Additional Details (Step 4)</p>
            </div>
          </WizardStep>

          <WizardNavigation
            submitLabel="Create Opportunity"
            showCancel
            onCancel={vi.fn()}
          />
        </FormWizard>
      </FormProgressProvider>
    </FormProvider>
  );
}

describe("OpportunityCreateWizard Integration", () => {
  describe("Step Indicator", () => {
    test("renders step indicator with 4 steps", () => {
      renderWithWizard(<StepIndicator />, { steps: OPPORTUNITY_WIZARD_STEPS });

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(4);

      // Verify step titles are present (visible on md+ screens)
      expect(screen.getByText("Basic Information")).toBeInTheDocument();
      expect(screen.getByText("Pipeline & Team")).toBeInTheDocument();
      expect(screen.getByText("Contacts & Products")).toBeInTheDocument();
      expect(screen.getByText("Additional Details")).toBeInTheDocument();
    });

    test("shows correct step numbers", () => {
      renderWithWizard(<StepIndicator />, { steps: OPPORTUNITY_WIZARD_STEPS });

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    test("first step has aria-current attribute", () => {
      renderWithWizard(<StepIndicator />, { steps: OPPORTUNITY_WIZARD_STEPS });

      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).toHaveAttribute("aria-current", "step");
    });
  });

  describe("Navigation", () => {
    test("starts on step 1", async () => {
      const { container } = renderWithWizard(
        <>
          <StepIndicator />
          <WizardNavigation />
        </>,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      // Step 1 should be current
      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).toHaveAttribute("aria-current", "step");

      // Previous button should not be visible on step 1
      expect(
        screen.queryByRole("button", { name: /previous/i })
      ).not.toBeInTheDocument();

      // Next button should be visible
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    test("Next button advances to next step", async () => {
      const user = userEvent.setup();

      renderWithWizard(
        <>
          <StepIndicator />
          <WizardNavigation />
        </>,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      // Click Next
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Step 2 should now be current
      await waitFor(() => {
        const listItems = screen.getAllByRole("listitem");
        expect(listItems[1]).toHaveAttribute("aria-current", "step");
      });

      // Previous button should now be visible
      expect(
        screen.getByRole("button", { name: /previous/i })
      ).toBeInTheDocument();
    });

    test("Previous button goes back to previous step", async () => {
      const user = userEvent.setup();

      renderWithWizard(
        <>
          <StepIndicator />
          <WizardNavigation />
        </>,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      // Go to step 2
      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /previous/i })
        ).toBeInTheDocument();
      });

      // Go back to step 1
      await user.click(screen.getByRole("button", { name: /previous/i }));

      // Step 1 should be current again
      await waitFor(() => {
        const listItems = screen.getAllByRole("listitem");
        expect(listItems[0]).toHaveAttribute("aria-current", "step");
      });

      // Previous button should be hidden again
      expect(
        screen.queryByRole("button", { name: /previous/i })
      ).not.toBeInTheDocument();
    });

    test("shows checkmark for completed steps", async () => {
      const user = userEvent.setup();

      renderWithWizard(
        <>
          <StepIndicator />
          <WizardNavigation />
        </>,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      // Go to step 2
      await user.click(screen.getByRole("button", { name: /next/i }));

      // First step should show checkmark (svg icon)
      await waitFor(() => {
        const listItems = screen.getAllByRole("listitem");
        const checkIcon = listItems[0].querySelector("svg");
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe("Final Step", () => {
    test("shows submit button on final step", async () => {
      const user = userEvent.setup();

      renderWithWizard(
        <>
          <StepIndicator />
          <WizardNavigation submitLabel="Create Opportunity" />
        </>,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      // Navigate to final step (step 4)
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Should show submit button instead of Next
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Create Opportunity" })
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /next/i })
        ).not.toBeInTheDocument();
      });
    });

    test("submit button calls onSubmit handler", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      // Use single-step wizard to test submission directly
      const singleStep: WizardStepConfig[] = [
        { id: "only", title: "Only Step", fields: [] },
      ];

      renderWithWizard(
        <WizardNavigation submitLabel="Create Opportunity" />,
        {
          steps: singleStep,
          onSubmit,
          defaultValues: { name: "Test Opportunity" },
        }
      );

      await user.click(
        screen.getByRole("button", { name: "Create Opportunity" })
      );

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Test Opportunity" })
        );
      });
    });
  });

  describe("Progress Bar", () => {
    test("progress bar is rendered", () => {
      renderWithWizard(<FormProgressBar />, { steps: OPPORTUNITY_WIZARD_STEPS });

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    test("step indicator has proper ARIA structure", () => {
      renderWithWizard(<StepIndicator />, { steps: OPPORTUNITY_WIZARD_STEPS });

      const list = screen.getByRole("list");
      expect(list.tagName).toBe("OL");
      expect(list).toHaveAttribute("aria-label", "Form steps");

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(4);
    });

    test("navigation has toolbar role", () => {
      renderWithWizard(<WizardNavigation />, { steps: OPPORTUNITY_WIZARD_STEPS });

      const toolbar = screen.getByRole("toolbar");
      expect(toolbar).toHaveAttribute("aria-label", "Form navigation");
    });

    test("all buttons have 44px touch targets", () => {
      renderWithWizard(
        <WizardNavigation showCancel onCancel={vi.fn()} />,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      const nextButton = screen.getByRole("button", { name: /next/i });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      expect(nextButton).toHaveClass("h-11");
      expect(cancelButton).toHaveClass("h-11");
    });
  });

  describe("Step Content Visibility", () => {
    test("all steps are mounted but only current step is visible", async () => {
      const user = userEvent.setup();

      const TestWizard = () => {
        const methods = useForm({ defaultValues: {}, mode: "onBlur" });

        return (
          <FormProvider {...methods}>
            <FormProgressProvider>
              <FormWizard
                steps={OPPORTUNITY_WIZARD_STEPS}
                onSubmit={vi.fn()}
              >
                <WizardStep step={1}>
                  <div data-testid="step-1">Step 1 Content</div>
                </WizardStep>
                <WizardStep step={2}>
                  <div data-testid="step-2">Step 2 Content</div>
                </WizardStep>
                <WizardStep step={3}>
                  <div data-testid="step-3">Step 3 Content</div>
                </WizardStep>
                <WizardStep step={4}>
                  <div data-testid="step-4">Step 4 Content</div>
                </WizardStep>
                <WizardNavigation />
              </FormWizard>
            </FormProgressProvider>
          </FormProvider>
        );
      };

      const { container } = renderWithWizard(<TestWizard />, {
        steps: OPPORTUNITY_WIZARD_STEPS,
      });

      // All steps should be in DOM
      expect(screen.getByTestId("step-1")).toBeInTheDocument();
      expect(screen.getByTestId("step-2")).toBeInTheDocument();
      expect(screen.getByTestId("step-3")).toBeInTheDocument();
      expect(screen.getByTestId("step-4")).toBeInTheDocument();

      // Step 1 container should be visible
      const step1Container = screen.getByTestId("step-1").parentElement;
      expect(step1Container).not.toHaveClass("hidden");
      expect(step1Container).not.toHaveAttribute("aria-hidden", "true");

      // Inactive steps should be hidden
      const step2Container = screen.getByTestId("step-2").parentElement;
      const step3Container = screen.getByTestId("step-3").parentElement;
      const step4Container = screen.getByTestId("step-4").parentElement;

      expect(step2Container).toHaveClass("hidden");
      expect(step2Container).toHaveAttribute("aria-hidden", "true");
      expect(step3Container).toHaveClass("hidden");
      expect(step3Container).toHaveAttribute("aria-hidden", "true");
      expect(step4Container).toHaveClass("hidden");
      expect(step4Container).toHaveAttribute("aria-hidden", "true");

      // Navigate to step 2
      await user.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        // Step 2 container should now be visible
        expect(screen.getByTestId("step-2").parentElement).not.toHaveClass(
          "hidden"
        );
        expect(
          screen.getByTestId("step-2").parentElement
        ).not.toHaveAttribute("aria-hidden", "true");

        // Step 1 container should now be hidden
        expect(screen.getByTestId("step-1").parentElement).toHaveClass(
          "hidden"
        );
        expect(screen.getByTestId("step-1").parentElement).toHaveAttribute(
          "aria-hidden",
          "true"
        );
      });
    });
  });

  describe("Loading State", () => {
    test("shows loading state during submission", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      const singleStep: WizardStepConfig[] = [
        { id: "only", title: "Only Step", fields: [] },
      ];

      renderWithWizard(
        <WizardNavigation submitLabel="Create Opportunity" />,
        {
          steps: singleStep,
          onSubmit,
        }
      );

      await user.click(
        screen.getByRole("button", { name: "Create Opportunity" })
      );

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });
    });

    test("disables buttons during submission", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      );

      const singleStep: WizardStepConfig[] = [
        { id: "only", title: "Only Step", fields: [] },
      ];

      renderWithWizard(
        <WizardNavigation submitLabel="Create Opportunity" />,
        {
          steps: singleStep,
          onSubmit,
        }
      );

      await user.click(
        screen.getByRole("button", { name: "Create Opportunity" })
      );

      // Button should be disabled
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
      });
    });
  });

  describe("Cancel Button", () => {
    test("Cancel button is visible when showCancel is true", () => {
      const onCancel = vi.fn();

      renderWithWizard(
        <WizardNavigation showCancel onCancel={onCancel} />,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    test("Cancel button calls onCancel when clicked", async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      renderWithWizard(
        <WizardNavigation showCancel onCancel={onCancel} />,
        { steps: OPPORTUNITY_WIZARD_STEPS }
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Step Configuration", () => {
    test("OPPORTUNITY_WIZARD_STEPS has correct structure", () => {
      expect(OPPORTUNITY_WIZARD_STEPS).toHaveLength(4);

      expect(OPPORTUNITY_WIZARD_STEPS[0]).toEqual({
        id: "basic",
        title: "Basic Information",
        fields: ["name", "customer_organization_id"],
      });

      expect(OPPORTUNITY_WIZARD_STEPS[1]).toEqual({
        id: "pipeline",
        title: "Pipeline & Team",
        fields: ["stage", "priority", "estimated_close_date"],
      });

      expect(OPPORTUNITY_WIZARD_STEPS[2]).toEqual({
        id: "relationships",
        title: "Contacts & Products",
        fields: [],
      });

      expect(OPPORTUNITY_WIZARD_STEPS[3]).toEqual({
        id: "details",
        title: "Additional Details",
        fields: [],
      });
    });
  });

  describe("Form State Persistence", () => {
    test("preserves form data when navigating between steps", async () => {
      const user = userEvent.setup();

      const TestPersistenceWizard = () => {
        const methods = useForm({
          defaultValues: { name: "", customer_organization_id: "" },
          mode: "onBlur",
        });

        return (
          <FormProvider {...methods}>
            <FormProgressProvider>
              <FormWizard steps={OPPORTUNITY_WIZARD_STEPS} onSubmit={vi.fn()}>
                <WizardStep step={1}>
                  <label htmlFor="opp-name">Opportunity Name</label>
                  <input id="opp-name" {...methods.register("name")} />
                </WizardStep>
                <WizardStep step={2}>
                  <p data-testid="step-2-content">Step 2 content</p>
                </WizardStep>
                <WizardStep step={3}>
                  <p>Step 3 content</p>
                </WizardStep>
                <WizardStep step={4}>
                  <p>Step 4 content</p>
                </WizardStep>
                <WizardNavigation />
              </FormWizard>
            </FormProgressProvider>
          </FormProvider>
        );
      };

      renderWithWizard(<TestPersistenceWizard />, {
        steps: OPPORTUNITY_WIZARD_STEPS,
      });

      // Fill Step 1 input
      const nameInput = screen.getByLabelText(/opportunity name/i);
      await user.type(nameInput, "Big Deal 2025");

      // Navigate to Step 2
      await user.click(screen.getByRole("button", { name: /next/i }));

      // Verify we're on step 2
      await waitFor(() => {
        const step2Container = screen.getByTestId("step-2-content").parentElement;
        expect(step2Container).not.toHaveClass("hidden");
      });

      // Navigate back to Step 1
      await user.click(screen.getByRole("button", { name: /previous/i }));

      // Verify data persisted
      await waitFor(() => {
        expect(screen.getByLabelText(/opportunity name/i)).toHaveValue("Big Deal 2025");
      });
    });
  });
});
