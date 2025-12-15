import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepIndicator } from "../StepIndicator";
import { WizardNavigation } from "../WizardNavigation";
import { renderWithWizard } from "./test-utils";
import type { WizardStepConfig } from "../wizard-types";

describe("StepIndicator", () => {
  const fourSteps: WizardStepConfig[] = [
    { id: "basic", title: "Basic Info", fields: [] },
    { id: "principal", title: "Principal", fields: [] },
    { id: "details", title: "Details", fields: [] },
    { id: "notes", title: "Notes", fields: [] },
  ];

  test("renders correct number of steps", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    // Should have 4 list items
    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(4);
  });

  test("shows checkmark for completed steps", async () => {
    const user = userEvent.setup();

    renderWithWizard(
      <>
        <StepIndicator />
        <WizardNavigation />
      </>,
      { steps: fourSteps }
    );

    // Go to step 2
    await user.click(screen.getByRole("button", { name: /next/i }));

    // First step should now show a checkmark (completed)
    await waitFor(() => {
      const listItems = screen.getAllByRole("listitem");
      // Check for the Check icon in the first step
      const firstStepCircle = listItems[0].querySelector("svg");
      expect(firstStepCircle).toBeInTheDocument();
    });
  });

  test("shows number for current and future steps", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    // Current step (1) should show "1"
    expect(screen.getByText("1")).toBeInTheDocument();

    // Future steps should show their numbers
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  test("current step has aria-current step", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    const listItems = screen.getAllByRole("listitem");
    expect(listItems[0]).toHaveAttribute("aria-current", "step");
    expect(listItems[1]).not.toHaveAttribute("aria-current");
    expect(listItems[2]).not.toHaveAttribute("aria-current");
    expect(listItems[3]).not.toHaveAttribute("aria-current");
  });

  test("completed steps have primary background", async () => {
    const user = userEvent.setup();

    renderWithWizard(
      <>
        <StepIndicator />
        <WizardNavigation />
      </>,
      { steps: fourSteps }
    );

    // Go to step 2
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      const listItems = screen.getAllByRole("listitem");
      // First step's circle should have bg-primary class
      const firstStepCircle = listItems[0].querySelector(
        ".bg-primary"
      );
      expect(firstStepCircle).toBeInTheDocument();
    });
  });

  test("current step has border style", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    const listItems = screen.getAllByRole("listitem");
    // Current step should have border-primary
    const currentStepCircle = listItems[0].querySelector(
      ".border-primary"
    );
    expect(currentStepCircle).toBeInTheDocument();
  });

  test("future steps have muted style", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    const listItems = screen.getAllByRole("listitem");
    // Future steps should have border-muted
    const futureStepCircle = listItems[1].querySelector(
      ".border-muted"
    );
    expect(futureStepCircle).toBeInTheDocument();
  });

  test("connector lines exist and have correct initial styling", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    // Get all connectors (divs with aria-hidden and w-12 class)
    const connectors = Array.from(document.querySelectorAll("div[aria-hidden='true']"))
      .filter((el) => el.classList.contains("w-12"));

    // Should have 3 connectors (between 4 steps)
    expect(connectors.length).toBe(3);

    // All should be styled with h-0.5 and either bg-muted or bg-primary
    connectors.forEach((conn) => {
      expect(conn).toHaveClass("mx-2"); // Common styling
      // Should have a background color class
      const hasBgClass = conn.classList.contains("bg-muted") || conn.classList.contains("bg-primary");
      expect(hasBgClass).toBe(true);
    });
  });

  test("labels hidden on small screens (md:block)", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    // Find the label spans within list items (not the sr-only announcement)
    const listItems = screen.getAllByRole("listitem");
    listItems.forEach((item) => {
      const labelSpan = item.querySelector("span.hidden.md\\:block");
      expect(labelSpan).toBeInTheDocument();
    });
  });

  test("uses semantic ol/li structure", () => {
    renderWithWizard(<StepIndicator />, { steps: fourSteps });

    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(list).toHaveAttribute("aria-label", "Form steps");

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(4);
    listItems.forEach((item) => {
      expect(item.tagName).toBe("LI");
    });
  });

  test("applies custom className", () => {
    renderWithWizard(<StepIndicator className="custom-indicator" />, {
      steps: fourSteps,
    });

    const list = screen.getByRole("list");
    expect(list).toHaveClass("custom-indicator");
  });
});
