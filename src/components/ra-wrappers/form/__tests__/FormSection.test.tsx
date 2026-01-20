import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormSection } from "../FormSection";

describe("FormSection", () => {
  test("renders title in uppercase", () => {
    render(
      <FormSection title="contact information">
        <div>Content</div>
      </FormSection>
    );

    const title = screen.getByText("contact information");
    expect(title).toHaveClass("uppercase");
  });

  test("applies correct header styling classes", () => {
    render(
      <FormSection title="Test Section">
        <div>Content</div>
      </FormSection>
    );

    const title = screen.getByText("Test Section");
    expect(title).toHaveClass("text-xs");
    expect(title).toHaveClass("font-semibold");
    expect(title).toHaveClass("uppercase");
    expect(title).toHaveClass("tracking-wider");
    expect(title).toHaveClass("text-muted-foreground");
  });

  test("renders horizontal divider with correct border styling", () => {
    const { container } = render(
      <FormSection title="Test Section">
        <div>Content</div>
      </FormSection>
    );

    const header = container.querySelector('[data-slot="form-section-header"]');
    expect(header).toHaveClass("border-b");
    expect(header).toHaveClass("border-border");
    expect(header).toHaveClass("pb-2");
  });

  test("applies correct margin to content area", () => {
    const { container } = render(
      <FormSection title="Test Section">
        <div data-testid="content">Content</div>
      </FormSection>
    );

    const wrapper = container.querySelector('[data-slot="form-section"]');
    expect(wrapper?.firstChild?.nextSibling).toHaveClass("mb-6");
  });

  test("renders children content", () => {
    render(
      <FormSection title="Test Section">
        <div data-testid="child-content">Test Child Content</div>
      </FormSection>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test Child Content")).toBeInTheDocument();
  });

  test("renders optional description when provided", () => {
    render(
      <FormSection title="Test Section" description="This is a description">
        <div>Content</div>
      </FormSection>
    );

    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });

  test("does not render description when not provided", () => {
    const { container } = render(
      <FormSection title="Test Section">
        <div>Content</div>
      </FormSection>
    );

    const description = container.querySelector('[data-slot="form-section-description"]');
    expect(description).not.toBeInTheDocument();
  });

  test("applies custom className to wrapper", () => {
    const { container } = render(
      <FormSection title="Test Section" className="custom-test-class">
        <div>Content</div>
      </FormSection>
    );

    const wrapper = container.querySelector('[data-slot="form-section"]');
    expect(wrapper).toHaveClass("custom-test-class");
  });

  test("applies muted-foreground color to description", () => {
    render(
      <FormSection title="Test Section" description="Test description">
        <div>Content</div>
      </FormSection>
    );

    const description = screen.getByText("Test description");
    expect(description).toHaveClass("text-muted-foreground");
  });

  test("renders title as h3 heading for proper document hierarchy", () => {
    render(
      <FormSection title="Test Section">
        <div>Content</div>
      </FormSection>
    );

    const heading = screen.getByRole("heading", { level: 3, name: "Test Section" });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe("H3");
  });
});
