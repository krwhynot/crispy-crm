/**
 * Accessibility Tests for Form Primitives
 *
 * Tests WCAG 2.1 AA compliance for form components:
 * - ARIA attributes on validation errors
 * - Focus state visibility
 * - Screen reader announcements via live regions
 *
 * These tests document and verify the existing accessibility features
 * in form-primitives.tsx (FormControl, FormError, FormField).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormField, FormLabel, FormControl, FormError } from "../form-primitives";
import { Input } from "@/components/ui/input";

// Test schema with validation
const testSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  email: z.string().email("Invalid email address"),
});

type TestFormData = z.infer<typeof testSchema>;

// Helper component that provides form context
const TestForm = ({
  children,
  defaultValues = { title: "", email: "" },
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: Partial<TestFormData>;
  onSubmit?: (data: TestFormData) => void;
}) => {
  const methods = useForm<TestFormData>({
    defaultValues,
    resolver: zodResolver(testSchema),
    mode: "onSubmit",
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
};

// Helper component that wraps input with form primitives
const TestField = ({ name, label }: { name: keyof TestFormData; label: string }) => {
  const id = `test-${name}`;

  return (
    <FormField id={id} name={name}>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input data-testid={`input-${name}`} />
      </FormControl>
      <FormError />
    </FormField>
  );
};

describe("Form Primitives Accessibility", () => {
  describe("ARIA Attributes on Validation Errors", () => {
    it("error messages have role='alert' and aria-live='polite'", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      // Submit form to trigger validation
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Wait for error to appear
      await waitFor(() => {
        const errorElement = screen.getByText(/title is required/i);
        expect(errorElement).toBeInTheDocument();
      });

      const errorElement = screen.getByText(/title is required/i);

      // Verify ARIA attributes for screen readers
      expect(errorElement).toHaveAttribute("role", "alert");
      expect(errorElement).toHaveAttribute("aria-live", "polite");
    });

    it("invalid inputs have aria-invalid='true'", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      const input = screen.getByTestId("input-title");

      // Submit form to trigger validation
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Wait for validation and check aria-invalid
      await waitFor(() => {
        expect(input).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("valid inputs do not have aria-invalid='true'", async () => {
      const user = userEvent.setup();

      render(
        <TestForm defaultValues={{ title: "Valid Title", email: "test@example.com" }}>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      const input = screen.getByTestId("input-title");

      // Submit form - should succeed
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Valid input should not have aria-invalid
      expect(input).not.toHaveAttribute("aria-invalid", "true");
    });

    it("inputs reference errors via aria-describedby", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      const input = screen.getByTestId("input-title");

      // Submit form to trigger validation
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Wait for error and check aria-describedby
      await waitFor(() => {
        const describedBy = input.getAttribute("aria-describedby");
        expect(describedBy).toBeTruthy();

        // The describedby should include the message id
        expect(describedBy).toContain("message");
      });

      // Verify the referenced element exists and contains error text
      const describedBy = input.getAttribute("aria-describedby");
      const messageId = describedBy?.split(" ").find((id) => id.includes("message"));

      if (messageId) {
        const errorElement = document.getElementById(messageId);
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(/title is required/i);
      }
    });
  });

  describe("Label Accessibility", () => {
    it("labels are properly associated with inputs via htmlFor", () => {
      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      const label = screen.getByText("Title");
      const input = screen.getByTestId("input-title");

      // Label should have htmlFor matching input id
      expect(label).toHaveAttribute("for", input.id);
    });

    it("labels show error state with data-error attribute", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      const label = screen.getByText("Title");

      // Before submission, no error state
      expect(label).toHaveAttribute("data-error", "false");

      // Submit form to trigger validation
      await user.click(screen.getByRole("button", { name: /save/i }));

      // After validation error
      await waitFor(() => {
        expect(label).toHaveAttribute("data-error", "true");
      });
    });
  });

  describe("Form Field Structure", () => {
    it("form fields have role='group' for screen readers", () => {
      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      // The FormField wraps content in a div with role="group"
      const fieldGroup = screen.getByRole("group");
      expect(fieldGroup).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("inputs are focusable via tab", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
          <TestField name="email" label="Email" />
        </TestForm>
      );

      // Tab through form
      await user.tab();
      expect(screen.getByTestId("input-title")).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId("input-email")).toHaveFocus();
    });

    it("submit button is focusable via tab", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      await user.tab(); // Focus input
      await user.tab(); // Focus submit button

      expect(screen.getByRole("button", { name: /save/i })).toHaveFocus();
    });
  });

  describe("Screen Reader Announcements", () => {
    it("error messages are announced via aria-live region", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      // Submit form to trigger validation
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        const errorElement = screen.getByText(/title is required/i);

        // aria-live="polite" means it will be announced after current speech
        expect(errorElement).toHaveAttribute("aria-live", "polite");
      });
    });

    it("multiple validation errors are each announced", async () => {
      const user = userEvent.setup();

      render(
        <TestForm defaultValues={{ email: "invalid" }}>
          <TestField name="title" label="Title" />
          <TestField name="email" label="Email" />
        </TestForm>
      );

      // Submit form to trigger validation
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        // Both error messages should have alert role
        // Note: Error messages may vary based on Zod schema configuration
        const errorMessages = screen.getAllByRole("alert");
        expect(errorMessages.length).toBeGreaterThanOrEqual(2);

        // Each error should have aria-live for screen reader announcements
        errorMessages.forEach((error) => {
          expect(error).toHaveAttribute("aria-live", "polite");
        });
      });
    });
  });

  describe("Error State Styling", () => {
    it("invalid inputs have destructive styling via aria-invalid", async () => {
      const user = userEvent.setup();

      render(
        <TestForm>
          <TestField name="title" label="Title" />
        </TestForm>
      );

      const input = screen.getByTestId("input-title");

      // Submit form to trigger validation
      await user.click(screen.getByRole("button", { name: /save/i }));

      await waitFor(() => {
        // Input should have aria-invalid which triggers CSS styling
        expect(input).toHaveAttribute("aria-invalid", "true");
      });
    });
  });
});

describe("Input Component Accessibility", () => {
  it("Input component supports aria-invalid styling", () => {
    render(<Input aria-invalid={true} data-testid="invalid-input" />);

    const input = screen.getByTestId("invalid-input");
    expect(input).toHaveAttribute("aria-invalid", "true");

    // The className should include aria-invalid styling
    // (This is applied via CSS class: aria-invalid:ring-destructive/20)
    expect(input.className).toContain("aria-invalid");
  });
});
