import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { z } from "zod";
import { FormProgressBar } from "../FormProgressBar";

vi.mock("../formProgressUtils", () => ({
  useFormProgress: vi.fn(() => ({
    percentage: 50,
    completedRequired: 2,
    totalRequired: 4,
    fields: {},
  })),
}));

vi.mock("@/atomic-crm/utils/getRequiredFields", () => ({
  getRequiredFields: vi.fn(() => ["name", "email", "phone"]),
}));

describe("FormProgressBar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders with correct ARIA attributes", () => {
    renderWithAdminContext(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("role", "progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    expect(progressBar).toHaveAttribute("aria-label", "Form completion progress");
    expect(progressBar).toHaveAttribute("aria-valuetext", "2 of 4 required fields complete");
  });

  test("shows field count in simple mode", () => {
    renderWithAdminContext(<FormProgressBar />);

    expect(screen.getByText("2 of 4 required fields")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("shows step info in wizard mode", () => {
    renderWithAdminContext(<FormProgressBar currentStep={2} totalSteps={5} stepName="Contact Information" />);

    expect(screen.getByText("Step 2 of 5: Contact Information")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("wizard mode without step name", () => {
    renderWithAdminContext(<FormProgressBar currentStep={3} totalSteps={5} />);

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
  });

  test("progress bar width matches percentage", () => {
    renderWithAdminContext(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    const fillBar = progressBar.querySelector("div");

    expect(fillBar).toHaveStyle({ width: "50%" });
  });

  test("uses semantic color classes", () => {
    renderWithAdminContext(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("bg-muted");

    const fillBar = progressBar.querySelector("div");
    expect(fillBar).toHaveClass("bg-primary");
  });

  test("applies custom className correctly", () => {
    const { container } = renderWithAdminContext(<FormProgressBar className="custom-test-class" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-test-class");
    expect(wrapper).toHaveClass("space-y-2");
  });

  test("hides step info when showStepInfo is false", () => {
    renderWithAdminContext(<FormProgressBar showStepInfo={false} />);

    expect(screen.queryByText("2 of 4 required fields")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
  });

  test("percentage text uses tabular-nums for stable width", () => {
    renderWithAdminContext(<FormProgressBar />);

    const percentageText = screen.getByText("50%");
    expect(percentageText).toHaveClass("tabular-nums");
  });

  test("progress bar has correct styling classes", () => {
    renderWithAdminContext(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveClass("relative");
    expect(progressBar).toHaveClass("h-2");
    expect(progressBar).toHaveClass("w-full");
    expect(progressBar).toHaveClass("overflow-hidden");
    expect(progressBar).toHaveClass("rounded-full");
    expect(progressBar).toHaveClass("bg-muted");
  });

  test("fill bar has transition animation classes", () => {
    renderWithAdminContext(<FormProgressBar />);

    const progressBar = screen.getByRole("progressbar");
    const fillBar = progressBar.querySelector("div");

    expect(fillBar).toHaveClass("transition-all");
    expect(fillBar).toHaveClass("duration-200");
    expect(fillBar).toHaveClass("ease-out");
  });

  test("aria-valuetext in wizard mode includes step name", () => {
    renderWithAdminContext(<FormProgressBar currentStep={1} totalSteps={3} stepName="Account Details" />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuetext", "Step 1 of 3: Account Details");
  });

  test("aria-valuetext in wizard mode without step name", () => {
    renderWithAdminContext(<FormProgressBar currentStep={1} totalSteps={3} />);

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuetext", "Step 1 of 3");
  });

  test("semantic muted text color applied to step info", () => {
    const { container } = renderWithAdminContext(<FormProgressBar />);

    const stepInfoContainer = container.querySelector('[class*="text-foreground"]');
    expect(stepInfoContainer).toBeInTheDocument();
  });

  describe("Dot indicator mode (with schema)", () => {
    const mockSchema = z.strictObject({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string(),
      description: z.string().optional(),
    });

    test("renders dots instead of progress bar when schema provided", () => {
      renderWithAdminContext(<FormProgressBar schema={mockSchema} />);

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

      expect(screen.getByRole("group")).toBeInTheDocument();
    });

    test("renders correct number of dots based on context totalRequired", () => {
      renderWithAdminContext(<FormProgressBar schema={mockSchema} />);

      const dots = screen.getAllByRole("img");
      // Uses totalRequired from context (4), not schema introspection (3)
      expect(dots).toHaveLength(4);
    });

    test("filled dots match completedRequired count", () => {
      renderWithAdminContext(<FormProgressBar schema={mockSchema} />);

      const dots = screen.getAllByRole("img");

      // completedRequired = 2, totalRequired = 4
      expect(dots[0]).toHaveAttribute("aria-label", "Completed");
      expect(dots[1]).toHaveAttribute("aria-label", "Completed");
      expect(dots[2]).toHaveAttribute("aria-label", "Pending");
      expect(dots[3]).toHaveAttribute("aria-label", "Pending");
    });

    test("dots have correct accessibility labels", () => {
      renderWithAdminContext(<FormProgressBar schema={mockSchema} />);

      const group = screen.getByRole("group");
      // Uses context totalRequired (4), not schema introspection (3)
      expect(group).toHaveAttribute("aria-label", "2 of 4 required fields complete");
    });

    test("hides percentage in dot mode", () => {
      renderWithAdminContext(<FormProgressBar schema={mockSchema} />);

      expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });

    test("shows field count text in dot mode", () => {
      renderWithAdminContext(<FormProgressBar schema={mockSchema} />);

      // Uses context totalRequired (4), not schema introspection (3)
      expect(screen.getByText("2 of 4 required fields")).toBeInTheDocument();
    });

    test("dot mode respects showStepInfo=false", () => {
      renderWithAdminContext(<FormProgressBar schema={mockSchema} showStepInfo={false} />);

      expect(screen.queryByText("2 of 3 required fields")).not.toBeInTheDocument();
      expect(screen.getByRole("group")).toBeInTheDocument();
    });
  });

  describe("backward compatibility", () => {
    test("no schema renders percentage bar (existing behavior)", () => {
      renderWithAdminContext(<FormProgressBar />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
    });

    test("wizard mode ignores schema and shows percentage bar", () => {
      const mockSchema = z.strictObject({ name: z.string() });
      renderWithAdminContext(<FormProgressBar schema={mockSchema} currentStep={1} totalSteps={3} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
    });
  });
});
