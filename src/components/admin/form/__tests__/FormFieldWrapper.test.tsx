import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormFieldWrapper } from "../FormFieldWrapper";

// Mock react-hook-form
vi.mock("react-hook-form", () => ({
  useFormState: vi.fn(() => ({ errors: {}, dirtyFields: {} })),
  useWatch: vi.fn(() => undefined),
}));

// Mock FormProgressProvider
vi.mock("../FormProgressProvider", () => ({
  useFormProgress: vi.fn(() => ({
    registerField: vi.fn(),
    markFieldValid: vi.fn(),
    fields: {},
    percentage: 10,
    totalRequired: 0,
    completedRequired: 0,
  })),
}));

// Import mocked modules to access their implementations
import { useFormState, useWatch } from "react-hook-form";
import { useFormProgress } from "../FormProgressProvider";

// Get mock functions
const mockUseFormState = vi.mocked(useFormState);
const mockUseWatch = vi.mocked(useWatch);
const mockUseFormProgress = vi.mocked(useFormProgress);

describe("FormFieldWrapper", () => {
  let mockRegisterField: ReturnType<typeof vi.fn>;
  let mockMarkFieldValid: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterField = vi.fn();
    mockMarkFieldValid = vi.fn();

    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });
    mockUseWatch.mockReturnValue(undefined);
    mockUseFormProgress.mockReturnValue({
      registerField: mockRegisterField,
      markFieldValid: mockMarkFieldValid,
      fields: {},
      percentage: 10,
      totalRequired: 0,
      completedRequired: 0,
    });
  });

  test("registers field with provider on mount", () => {
    render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockRegisterField).toHaveBeenCalledWith("email", false);
  });

  test("registers field as required when isRequired is true", () => {
    render(
      <FormFieldWrapper name="email" isRequired>
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockRegisterField).toHaveBeenCalledWith("email", true);
  });

  test("shows no indicator when field is empty", () => {
    mockUseWatch.mockReturnValue(undefined);
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    const checkIcon = container.querySelector("svg");
    expect(checkIcon).not.toBeInTheDocument();
  });

  test("shows checkmark when field has value and no error", () => {
    mockUseWatch.mockReturnValue("test@example.com");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    // Visual checkmark appears even for non-dirty fields (shows user the field has a value)
    const checkIcon = container.querySelector(".text-primary");
    expect(checkIcon).toBeInTheDocument();
    expect(checkIcon).toHaveClass("text-primary");
  });

  test("shows X icon when field has error", () => {
    mockUseWatch.mockReturnValue("invalid");
    mockUseFormState.mockReturnValue({
      errors: {
        email: { message: "Invalid email" },
      },
      dirtyFields: { email: true },
    });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    const xIcon = container.querySelector(".text-destructive");
    expect(xIcon).toBeInTheDocument();
  });

  test("marks field as NOT valid for progress when field has value but is not dirty", () => {
    // This is the key fix: schema defaults should not count toward progress
    mockUseWatch.mockReturnValue("test@example.com");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });

    render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    // Field has value but user hasn't modified it, so it shouldn't count for progress
    expect(mockMarkFieldValid).toHaveBeenCalledWith("email", false);
  });

  test("marks field as valid for progress when field has value AND is dirty", () => {
    mockUseWatch.mockReturnValue("test@example.com");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: { email: true } });

    render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    // Field has value AND user modified it, so it counts for progress
    expect(mockMarkFieldValid).toHaveBeenCalledWith("email", true);
  });

  test("marks field as valid for progress when countDefaultAsFilled is true", () => {
    // Some fields should count defaults as filled (e.g., stage dropdown)
    mockUseWatch.mockReturnValue("new_lead");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });

    render(
      <FormFieldWrapper name="stage" countDefaultAsFilled>
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    // Field has value and countDefaultAsFilled=true, so it counts for progress
    expect(mockMarkFieldValid).toHaveBeenCalledWith("stage", true);
  });

  test("uses useWatch instead of watch for isolated re-renders", () => {
    render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockUseWatch).toHaveBeenCalledWith({ name: "email" });
  });

  test("applies custom className correctly", () => {
    const { container } = render(
      <FormFieldWrapper name="email" className="custom-wrapper">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(container.firstChild).toHaveClass("custom-wrapper");
    expect(container.firstChild).toHaveClass("relative");
  });

  test("renders children content", () => {
    render(
      <FormFieldWrapper name="email">
        <input data-testid="child-input" placeholder="Email" />
      </FormFieldWrapper>
    );

    expect(screen.getByTestId("child-input")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
  });

  test("positions icon absolutely at right-3 top-9", () => {
    mockUseWatch.mockReturnValue("value");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    const icon = container.querySelector(".text-primary");
    expect(icon).toHaveClass("absolute");
    expect(icon).toHaveClass("right-3");
    expect(icon).toHaveClass("top-9");
  });

  test("checkmark has fade-in animation", () => {
    mockUseWatch.mockReturnValue("value");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    const checkIcon = container.querySelector(".text-primary");
    expect(checkIcon).toHaveClass("animate-in");
    expect(checkIcon).toHaveClass("fade-in");
    expect(checkIcon).toHaveClass("duration-100");
  });

  test("icon size is h-4 w-4", () => {
    mockUseWatch.mockReturnValue("value");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4");
    expect(icon).toHaveClass("w-4");
  });

  test("marks field as invalid when has value but has error (even if dirty)", () => {
    mockUseWatch.mockReturnValue("invalid-email");
    mockUseFormState.mockReturnValue({
      errors: {
        email: { message: "Invalid format" },
      },
      dirtyFields: { email: true },
    });

    render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockMarkFieldValid).toHaveBeenCalledWith("email", false);
  });

  test("treats null value as empty", () => {
    mockUseWatch.mockReturnValue(null);
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: { email: true } });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockMarkFieldValid).toHaveBeenCalledWith("email", false);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeInTheDocument();
  });

  test("treats empty string as empty", () => {
    mockUseWatch.mockReturnValue("");
    mockUseFormState.mockReturnValue({ errors: {}, dirtyFields: { email: true } });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockMarkFieldValid).toHaveBeenCalledWith("email", false);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeInTheDocument();
  });

  // WCAG 3.3.2 Accessibility Tests
  describe("aria-required propagation (WCAG 3.3.2)", () => {
    test("propagates aria-required='true' to child input when isRequired is true", () => {
      render(
        <FormFieldWrapper name="email" isRequired>
          <input data-testid="input" />
        </FormFieldWrapper>
      );

      expect(screen.getByTestId("input")).toHaveAttribute("aria-required", "true");
    });

    test("does not add aria-required when isRequired is false", () => {
      render(
        <FormFieldWrapper name="email">
          <input data-testid="input" />
        </FormFieldWrapper>
      );

      expect(screen.getByTestId("input")).not.toHaveAttribute("aria-required");
    });

    test("handles multiple children, applying aria-required to each", () => {
      render(
        <FormFieldWrapper name="email" isRequired>
          <input data-testid="input1" />
          <input data-testid="input2" />
        </FormFieldWrapper>
      );

      expect(screen.getByTestId("input1")).toHaveAttribute("aria-required", "true");
      expect(screen.getByTestId("input2")).toHaveAttribute("aria-required", "true");
    });

    test("gracefully handles non-element children (text nodes)", () => {
      // Should not throw when children include text nodes
      expect(() => {
        render(
          <FormFieldWrapper name="email" isRequired>
            Some text
            <input data-testid="input" />
          </FormFieldWrapper>
        );
      }).not.toThrow();

      expect(screen.getByTestId("input")).toHaveAttribute("aria-required", "true");
    });
  });
});
