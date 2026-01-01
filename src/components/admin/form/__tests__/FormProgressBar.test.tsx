import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProgressBar } from "../FormProgressBar";

vi.mock("../FormProgressProvider", () => ({
  useFormProgress: vi.fn(() => ({
    percentage: 50,
    completedRequired: 2,
    totalRequired: 4,
    fields: {},
  })),
}));

describe("FormProgressBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders with correct ARIA attributes", () => {
    render(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("role", "progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(progressBar).toHaveAttribute("aria-label", "Form completion progress");
    expect(progressBar).toHaveAttribute("aria-valuetext", "2 of 4 required fields complete");
  });

  test("shows field count in simple mode", () => {
    render(<FormProgressBar />);

    expect(screen.getByText("2 of 4 required fields")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("shows step info in wizard mode", () => {
    render(<FormProgressBar currentStep={2} totalSteps={5} stepName="Contact Information" />);

    expect(screen.getByText("Step 2 of 5: Contact Information")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("wizard mode without step name", () => {
    render(<FormProgressBar currentStep={3} totalSteps={5} />);

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
  });

  test("progress bar width matches percentage", () => {
    render(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    const fillBar = progressBar.querySelector("div");

    expect(fillBar).toHaveStyle({ width: "50%" });
  });

  test("uses semantic color classes", () => {
    render(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("bg-muted");

    const fillBar = progressBar.querySelector("div");
    expect(fillBar).toHaveClass("bg-primary");
  });

  test("applies custom className correctly", () => {
    const { container } = render(<FormProgressBar className="custom-test-class" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-test-class");
    expect(wrapper).toHaveClass("space-y-2");
  });

  test("hides step info when showStepInfo is false", () => {
    render(<FormProgressBar showStepInfo={false} />);

    expect(screen.queryByText("2 of 4 required fields")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
  });

  test("percentage text uses tabular-nums for stable width", () => {
    render(<FormProgressBar />);

    const percentageText = screen.getByText("50%");
    expect(percentageText).toHaveClass("tabular-nums");
  });

  test("progress bar has correct styling classes", () => {
    render(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("relative");
    expect(progressBar).toHaveClass("h-2");
    expect(progressBar).toHaveClass("w-full");
    expect(progressBar).toHaveClass("overflow-hidden");
    expect(progressBar).toHaveClass("rounded-full");
    expect(progressBar).toHaveClass("bg-muted");
  });

  test("fill bar has transition animation classes", () => {
    render(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    const fillBar = progressBar.querySelector("div");

    expect(fillBar).toHaveClass("transition-all");
    expect(fillBar).toHaveClass("duration-200");
    expect(fillBar).toHaveClass("ease-out");
  });

  test("aria-valuetext in wizard mode includes step name", () => {
    render(<FormProgressBar currentStep={1} totalSteps={3} stepName="Account Details" />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuetext", "Step 1 of 3: Account Details");
  });

  test("aria-valuetext in wizard mode without step name", () => {
    render(<FormProgressBar currentStep={1} totalSteps={3} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuetext", "Step 1 of 3");
  });

  test("semantic muted text color applied to step info", () => {
    const { container } = render(<FormProgressBar />);

    // Component uses text-foreground/70 for muted text styling
    const stepInfoContainer = container.querySelector('[class*="text-foreground"]');
    expect(stepInfoContainer).toBeInTheDocument();
  });
});
