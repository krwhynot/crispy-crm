import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormFieldWrapper } from "../FormFieldWrapper";

// Mock react-hook-form
vi.mock("react-hook-form", () => ({
  useFormState: vi.fn(() => ({ errors: {} })),
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

    mockUseFormState.mockReturnValue({ errors: {} });
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
    mockUseFormState.mockReturnValue({ errors: {} });

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
    mockUseFormState.mockReturnValue({ errors: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

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
    });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    const xIcon = container.querySelector(".text-destructive");
    expect(xIcon).toBeInTheDocument();
  });

  test("updates provider when validity changes", () => {
    mockUseWatch.mockReturnValue("test@example.com");
    mockUseFormState.mockReturnValue({ errors: {} });

    render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockMarkFieldValid).toHaveBeenCalledWith("email", true);
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
    mockUseFormState.mockReturnValue({ errors: {} });

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
    mockUseFormState.mockReturnValue({ errors: {} });

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
    mockUseFormState.mockReturnValue({ errors: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("h-4");
    expect(icon).toHaveClass("w-4");
  });

  test("marks field as invalid when has value but has error", () => {
    mockUseWatch.mockReturnValue("invalid-email");
    mockUseFormState.mockReturnValue({
      errors: {
        email: { message: "Invalid format" },
      },
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
    mockUseFormState.mockReturnValue({ errors: {} });

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
    mockUseFormState.mockReturnValue({ errors: {} });

    const { container } = render(
      <FormFieldWrapper name="email">
        <input data-testid="input" />
      </FormFieldWrapper>
    );

    expect(mockMarkFieldValid).toHaveBeenCalledWith("email", false);
    const icon = container.querySelector("svg");
    expect(icon).not.toBeInTheDocument();
  });
});
