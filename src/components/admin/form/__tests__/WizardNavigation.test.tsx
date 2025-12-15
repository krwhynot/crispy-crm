import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FormProgressProvider } from "../FormProgressProvider";
import { FormWizard } from "../FormWizard";
import { WizardNavigation } from "../WizardNavigation";
import { WizardStep } from "../WizardStep";
import { renderWithWizard, render } from "./test-utils";
import type { WizardStepConfig } from "../wizard-types";

describe("WizardNavigation", () => {
  test("hides Previous button on first step", () => {
    renderWithWizard(<WizardNavigation />);

    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  test("shows Previous button on subsequent steps", async () => {
    const user = userEvent.setup();
    const stepsNoValidation: WizardStepConfig[] = [
      { id: "step1", title: "Step 1", fields: [] },
      { id: "step2", title: "Step 2", fields: [] },
    ];

    renderWithWizard(<WizardNavigation />, { steps: stepsNoValidation });

    // Initially on step 1, no Previous button
    expect(screen.queryByRole("button", { name: /previous/i })).not.toBeInTheDocument();

    // Click Next to go to step 2
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Now Previous should be visible
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
    });
  });

  test("shows Next with arrow on non-final steps", () => {
    renderWithWizard(<WizardNavigation />);

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeInTheDocument();
    // Check for the arrow icon (ChevronRight) - it should be aria-hidden
    expect(nextButton.querySelector("svg")).toBeInTheDocument();
  });

  test("shows submitLabel on final step", async () => {
    const user = userEvent.setup();
    const singleStepConfig: WizardStepConfig[] = [
      { id: "step1", title: "Only Step", fields: [] },
    ];

    renderWithWizard(<WizardNavigation submitLabel="Create Opportunity" />, {
      steps: singleStepConfig,
    });

    // On the only step (final step), should show submitLabel
    expect(screen.getByRole("button", { name: "Create Opportunity" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  test("shows loading state when isSubmitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );
    const singleStepConfig: WizardStepConfig[] = [
      { id: "step1", title: "Step 1", fields: [] },
    ];

    renderWithWizard(<WizardNavigation submitLabel="Submit" />, {
      steps: singleStepConfig,
      onSubmit,
    });

    const submitButton = screen.getByRole("button", { name: "Submit" });

    // Click submit
    await user.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });

  test("disables buttons when isSubmitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );
    const singleStepConfig: WizardStepConfig[] = [
      { id: "step1", title: "Step 1", fields: [] },
    ];

    renderWithWizard(<WizardNavigation submitLabel="Submit" />, {
      steps: singleStepConfig,
      onSubmit,
    });

    const submitButton = screen.getByRole("button", { name: "Submit" });
    await user.click(submitButton);

    await waitFor(() => {
      // The button should be disabled during submission
      expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    });
  });

  test("Cancel button shows when showCancel is true", () => {
    const onCancel = vi.fn();
    renderWithWizard(<WizardNavigation showCancel onCancel={onCancel} />);

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  test("Cancel button calls onCancel when clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithWizard(<WizardNavigation showCancel onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("all buttons have h-11 (44px touch target)", () => {
    const onCancel = vi.fn();
    renderWithWizard(<WizardNavigation showCancel onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const nextButton = screen.getByRole("button", { name: /next/i });

    expect(cancelButton).toHaveClass("h-11");
    expect(nextButton).toHaveClass("h-11");
  });

  test("has role toolbar for accessibility", () => {
    renderWithWizard(<WizardNavigation />);

    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(screen.getByRole("toolbar")).toHaveAttribute(
      "aria-label",
      "Form navigation"
    );
  });
});
