import { render as renderWithForm, screen, waitFor } from "./test-utils";
import { FormSectionWithProgress } from "../FormSectionWithProgress";
import { FormFieldWrapper } from "../FormFieldWrapper";

describe("FormSectionWithProgress", () => {
  describe("rendering", () => {
    it("renders title correctly", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Contact Info">
          <div>content</div>
        </FormSectionWithProgress>
      );
      expect(screen.getByText("Contact Info")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" description="Help text here">
          <div>content</div>
        </FormSectionWithProgress>
      );
      expect(screen.getByText("Help text here")).toBeInTheDocument();
    });

    it("does not render description when not provided", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test">
          <div>content</div>
        </FormSectionWithProgress>
      );
      expect(screen.queryByText(/help text/i)).not.toBeInTheDocument();
    });

    it("renders children", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test">
          <div data-testid="child">Child content</div>
        </FormSectionWithProgress>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("sets data-section-id attribute", () => {
      const { container } = renderWithForm(
        <FormSectionWithProgress id="contact-info" title="Test">
          <div>content</div>
        </FormSectionWithProgress>
      );
      expect(container.querySelector('[data-section-id="contact-info"]')).toBeInTheDocument();
    });
  });

  describe("completion indicator", () => {
    it("shows no indicator when requiredFields is empty", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" requiredFields={[]}>
          <div>content</div>
        </FormSectionWithProgress>
      );
      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-complete-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-incomplete-icon")).not.toBeInTheDocument();
    });

    it("shows no indicator when requiredFields is undefined", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test">
          <div>content</div>
        </FormSectionWithProgress>
      );
      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-complete-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-incomplete-icon")).not.toBeInTheDocument();
    });

    it("does not show icon when required fields are not registered", () => {
      renderWithForm(
        <FormSectionWithProgress
          id="test"
          title="Test"
          requiredFields={["first_name", "last_name"]}
        >
          <div>No fields registered yet</div>
        </FormSectionWithProgress>
      );

      // Should not show any icon when fields aren't registered/valid
      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-incomplete-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-complete-icon")).not.toBeInTheDocument();
    });

    it("does not show icon when required fields are incomplete", async () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" requiredFields={["first_name"]}>
          <FormFieldWrapper name="first_name" isRequired>
            <input data-testid="first-name-input" />
          </FormFieldWrapper>
        </FormSectionWithProgress>,
        { defaultValues: { first_name: "" } }
      );

      // Field registered but not valid - should not show any icon
      expect(screen.queryByText("Complete")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-incomplete-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("section-complete-icon")).not.toBeInTheDocument();
    });

    it("shows checkmark and Complete badge when all required fields valid", async () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" requiredFields={["first_name"]}>
          <FormFieldWrapper name="first_name" isRequired countDefaultAsFilled>
            <input data-testid="first-name-input" />
          </FormFieldWrapper>
        </FormSectionWithProgress>,
        { defaultValues: { first_name: "John" } }
      );

      // With valid default value and countDefaultAsFilled, field should be marked valid
      await waitFor(() => {
        expect(screen.getByText("Complete")).toBeInTheDocument();
        expect(screen.getByTestId("section-complete-icon")).toBeInTheDocument();
      });
    });

    it("requires ALL required fields to be valid for completion", async () => {
      renderWithForm(
        <FormSectionWithProgress
          id="test"
          title="Test"
          requiredFields={["first_name", "last_name"]}
        >
          <FormFieldWrapper name="first_name" isRequired>
            <input data-testid="first-name-input" />
          </FormFieldWrapper>
          <FormFieldWrapper name="last_name" isRequired>
            <input data-testid="last-name-input" />
          </FormFieldWrapper>
        </FormSectionWithProgress>,
        { defaultValues: { first_name: "John", last_name: "" } }
      );

      // Only one field valid — not complete, no icon shown
      await waitFor(() => {
        expect(screen.queryByText("Complete")).not.toBeInTheDocument();
        expect(screen.queryByTestId("section-incomplete-icon")).not.toBeInTheDocument();
        expect(screen.queryByTestId("section-complete-icon")).not.toBeInTheDocument();
      });
    });

    it("correctly computes completion from multiple fields", async () => {
      // Tests the useMemo completion calculation with all fields valid
      renderWithForm(
        <FormSectionWithProgress
          id="test"
          title="Test"
          requiredFields={["first_name", "last_name", "email"]}
        >
          <FormFieldWrapper name="first_name" isRequired countDefaultAsFilled>
            <input data-testid="first-name-input" />
          </FormFieldWrapper>
          <FormFieldWrapper name="last_name" isRequired countDefaultAsFilled>
            <input data-testid="last-name-input" />
          </FormFieldWrapper>
          <FormFieldWrapper name="email" isRequired countDefaultAsFilled>
            <input data-testid="email-input" />
          </FormFieldWrapper>
        </FormSectionWithProgress>,
        { defaultValues: { first_name: "John", last_name: "Doe", email: "john@example.com" } }
      );

      // All three fields have values with countDefaultAsFilled, so section should be complete
      await waitFor(() => {
        expect(screen.getByText("Complete")).toBeInTheDocument();
        expect(screen.getByTestId("section-complete-icon")).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("icons have aria-hidden for screen readers", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" requiredFields={["name"]}>
          <div>content</div>
        </FormSectionWithProgress>
      );

      // Icons should be decorative
      const svgs = document.querySelectorAll("svg");
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("title uses semantic heading element", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Section Title">
          <div>content</div>
        </FormSectionWithProgress>
      );

      expect(screen.getByRole("heading", { name: "Section Title" })).toBeInTheDocument();
    });

    it("heading is h3 level for proper hierarchy", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test Section">
          <div>content</div>
        </FormSectionWithProgress>
      );

      const heading = screen.getByRole("heading", { name: "Test Section" });
      expect(heading.tagName).toBe("H3");
    });
  });

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = renderWithForm(
        <FormSectionWithProgress id="test" title="Test" className="custom-class">
          <div>content</div>
        </FormSectionWithProgress>
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("has base spacing class", () => {
      const { container } = renderWithForm(
        <FormSectionWithProgress id="test" title="Test">
          <div>content</div>
        </FormSectionWithProgress>
      );

      expect(container.firstChild).toHaveClass("space-y-4");
    });

    it("uses semantic color token for complete badge", async () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" requiredFields={["name"]}>
          <FormFieldWrapper name="name" isRequired countDefaultAsFilled>
            <input data-testid="name-input" />
          </FormFieldWrapper>
        </FormSectionWithProgress>,
        { defaultValues: { name: "Valid" } }
      );

      await waitFor(() => {
        const badge = screen.getByTestId("section-complete-badge");
        expect(badge).toHaveClass("text-primary");
      });
    });

    it("does not show incomplete icon (design change: only show success)", () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" requiredFields={["name"]}>
          <div>content</div>
        </FormSectionWithProgress>
      );

      // No incomplete icon shown - only complete sections get visual indicator
      expect(screen.queryByTestId("section-incomplete-icon")).not.toBeInTheDocument();
    });

    it("uses semantic color token for complete icon", async () => {
      renderWithForm(
        <FormSectionWithProgress id="test" title="Test" requiredFields={["name"]}>
          <FormFieldWrapper name="name" isRequired countDefaultAsFilled>
            <input data-testid="name-input" />
          </FormFieldWrapper>
        </FormSectionWithProgress>,
        { defaultValues: { name: "Valid" } }
      );

      await waitFor(() => {
        const icon = screen.getByTestId("section-complete-icon");
        expect(icon).toHaveClass("text-primary");
      });
    });
  });
});
