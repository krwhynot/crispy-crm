/**
 * Tests for TextInput component
 *
 * Tests the integration of shadcn/ui Input/Textarea with React Admin's useInput hook,
 * including error display, validation, and multiline mode.
 */

import { describe, test, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextInput } from "../text-input";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { SaveContextProvider } from "ra-core";
import { useForm } from "react-hook-form";
import { Form } from "../form";
import React from "react";

// FormWrapper that provides both React Admin Form context and React Hook Form FormProvider
const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
}) => {
  const saveContext = {
    save: onSubmit,
    saving: false,
    mutationMode: "pessimistic" as const,
  };

  const form = useForm({
    defaultValues,
    mode: "onChange",
  });

  return (
    <SaveContextProvider value={saveContext}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {children}
          <button type="submit">Submit</button>
        </form>
      </Form>
    </SaveContextProvider>
  );
};

describe("TextInput", () => {
  test("renders with label and input", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput source="name" label="Name" />
      </FormWrapper>,
      { resource: "contacts" }
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("integrates with useInput hook and updates form values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <TextInput source="email" label="Email" />
      </FormWrapper>,
      { resource: "contacts" }
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "test@example.com");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
        }),
        expect.anything() // React Hook Form also passes the event
      );
    });
  });

  // Note: Validation tests removed per Engineering Constitution
  // All validation must occur at the API boundary (data provider) using Zod schemas
  // Form-level validation is forbidden

  test("renders textarea in multiline mode", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput source="description" label="Description" multiline />
      </FormWrapper>,
      { resource: "test" }
    );

    const textarea = document.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
  });

  test("handles multiline text input correctly", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <TextInput source="notes" label="Notes" multiline />
      </FormWrapper>,
      { resource: "test" }
    );

    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const multilineText = "Line 1\nLine 2\nLine 3";
    await user.type(textarea, multilineText);

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: multilineText,
        }),
        expect.anything() // React Hook Form also passes the event
      );
    });
  });

  test("respects disabled and readOnly props", () => {
    const { rerender } = renderWithAdminContext(
      <FormWrapper>
        <TextInput source="name" label="Name" disabled />
      </FormWrapper>,
      { resource: "test" }
    );

    let input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toBeDisabled();

    // Test readOnly
    rerender(
      <FormWrapper>
        <TextInput source="name" label="Name" readOnly />
      </FormWrapper>
    );

    input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveAttribute("readonly");
  });

  test("handles date input type correctly", () => {
    renderWithAdminContext(
      <FormWrapper defaultValues={{ date: "2025-01-15T10:30:00" }}>
        <TextInput source="date" label="Date" type="date" />
      </FormWrapper>,
      { resource: "test" }
    );

    // Date inputs don't have role="textbox", query by label instead
    const input = screen.getByLabelText("Date") as HTMLInputElement;
    expect(input.type).toBe("date");
    expect(input.value).toBe("2025-01-15");
  });

  test("handles datetime-local input type correctly", () => {
    renderWithAdminContext(
      <FormWrapper defaultValues={{ datetime: "2025-01-15T10:30:00" }}>
        <TextInput source="datetime" label="Date Time" type="datetime-local" />
      </FormWrapper>,
      { resource: "test" }
    );

    // Datetime-local inputs don't have role="textbox", query by label instead
    const input = screen.getByLabelText("Date Time") as HTMLInputElement;
    expect(input.type).toBe("datetime-local");
    expect(input.value).toBe("2025-01-15T10:30");
  });

  test("displays helper text when provided", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput source="email" label="Email" helperText="Enter your email address" />
      </FormWrapper>,
      { resource: "test" }
    );

    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
  });

  test("hides label when label prop is false", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput source="hidden_label" label={false} />
      </FormWrapper>,
      { resource: "test" }
    );

    // Should not render label
    const labels = document.querySelectorAll("label");
    expect(labels.length).toBe(0);
  });

  test("applies custom className", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput source="custom" label="Custom" className="custom-class" />
      </FormWrapper>,
      { resource: "test" }
    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveClass("custom-class");
  });

  test("preserves form field name from source prop", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput source="contact.email" label="Contact Email" />
      </FormWrapper>,
      { resource: "test" }
    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveAttribute("role", "group");

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "contact.email");
  });
});
