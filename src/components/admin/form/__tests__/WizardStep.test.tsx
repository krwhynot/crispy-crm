import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { WizardStep } from "../WizardStep";
import { renderWithWizard, DEFAULT_TEST_STEPS } from "./test-utils";
import type { WizardStepConfig } from "../wizard-types";

describe("WizardStep", () => {
  test("renders nothing when step does not match currentStep", () => {
    renderWithWizard(
      <>
        <WizardStep step={1}>
          <div data-testid="step-1-content">Step 1 Content</div>
        </WizardStep>
        <WizardStep step={2}>
          <div data-testid="step-2-content">Step 2 Content</div>
        </WizardStep>
      </>
    );

    // Step 1 should be visible (current)
    expect(screen.getByTestId("step-1-content")).toBeInTheDocument();

    // Step 2 should not be in the document at all
    expect(screen.queryByTestId("step-2-content")).not.toBeInTheDocument();
  });

  test("renders children when step matches currentStep", () => {
    renderWithWizard(
      <WizardStep step={1}>
        <div data-testid="step-content">My Step Content</div>
      </WizardStep>
    );

    expect(screen.getByTestId("step-content")).toBeInTheDocument();
    expect(screen.getByText("My Step Content")).toBeInTheDocument();
  });

  test("has correct id for focus management", () => {
    renderWithWizard(
      <WizardStep step={1}>
        <div>Content</div>
      </WizardStep>
    );

    const stepPanel = document.getElementById("wizard-step-1");
    expect(stepPanel).toBeInTheDocument();
  });

  test("has role tabpanel for accessibility", () => {
    renderWithWizard(
      <WizardStep step={1}>
        <div>Content</div>
      </WizardStep>
    );

    const stepPanel = screen.getByRole("tabpanel");
    expect(stepPanel).toBeInTheDocument();
    expect(stepPanel).toHaveAttribute("aria-labelledby", "wizard-step-1-trigger");
  });

  test("renders step heading with title from config", () => {
    const customSteps: WizardStepConfig[] = [
      { id: "basic", title: "Basic Information", fields: [] },
      { id: "details", title: "Details", fields: [] },
    ];

    renderWithWizard(
      <WizardStep step={1}>
        <div>Content</div>
      </WizardStep>,
      { steps: customSteps }
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Step 1: Basic Information"
    );
  });

  test("applies custom className", () => {
    renderWithWizard(
      <WizardStep step={1} className="custom-class">
        <div>Content</div>
      </WizardStep>
    );

    const stepPanel = screen.getByRole("tabpanel");
    expect(stepPanel).toHaveClass("custom-class");
    expect(stepPanel).toHaveClass("space-y-6"); // Default class should also be present
  });
});
