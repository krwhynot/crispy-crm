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
import {
  required,
  minLength,
  maxLength,
  Form as RaForm,
  SaveContextProvider,
} from "ra-core";
import React from "react";

// Simplified FormWrapper - relies on renderWithAdminContext for providers
const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: any;
  onSubmit?: (data: any) => void;
}) => {
  const saveContext = {
    save: onSubmit,
    saving: false,
    mutationMode: "pessimistic" as const
  };

  return (
    <SaveContextProvider value={saveContext}>
      <RaForm defaultValues={defaultValues}>
        {children}
        <button type="submit">Submit</button>
      </RaForm>
    </SaveContextProvider>
  );
};

describe("TextInput", () => {
  test("renders with label and input", () => {
    renderWithAdminContext(
      <FormWrapper resource="contacts">
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
      <FormWrapper onSubmit={onSubmit} resource="contacts">
        <TextInput source="email" label="Email" />
      </FormWrapper>
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "test@example.com");

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com"
        })
      );
    });
  });

  test("displays validation errors from FormError component", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="email"
          label="Email"
          validate={[required(), minLength(5)]}
        />
      </FormWrapper>,

    );

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Should show required error
    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    // Type insufficient characters
    const input = screen.getByRole("textbox");
    await user.type(input, "abc");
    await user.click(submitButton);

    // Should show minLength error
    await waitFor(() => {
      expect(screen.getByText(/at least 5 characters/i)).toBeInTheDocument();
    });
  });

  test("shows required field indicator when field is required", () => {
    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="name"
          label="Name"
          validate={required()}
        />
      </FormWrapper>,

    );

    // React Admin adds an asterisk to required fields
    const label = screen.getByText(/Name/);
    expect(label.textContent).toContain("*");
  });

  test("renders textarea in multiline mode", () => {
    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="description"
          label="Description"
          multiline
        />
      </FormWrapper>,

    );

    const textarea = document.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
  });

  test("handles multiline text input correctly", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithAdminContext(
      <FormWrapper onSubmit={onSubmit}>
        <TextInput
          source="notes"
          label="Notes"
          multiline
        />
      </FormWrapper>,

    );

    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const multilineText = "Line 1\nLine 2\nLine 3";
    await user.type(textarea, multilineText);

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: multilineText
        })
      );
    });
  });

  test("respects disabled and readOnly props", () => {
    const { rerender } = renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="name"
          label="Name"
          disabled
        />
      </FormWrapper>,

    );

    let input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toBeDisabled();

    // Test readOnly
    rerender(
      <FormWrapper resource="test">
        <TextInput
          source="name"
          label="Name"
          readOnly
        />
      </FormWrapper>
    );

    input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveAttribute("readonly");
  });

  test("handles date input type correctly", () => {
    renderWithAdminContext(
      <FormWrapper defaultValues={{ date: "2025-01-15T10:30:00" }}>
        <TextInput
          source="date"
          label="Date"
          type="date"
        />
      </FormWrapper>,

    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.type).toBe("date");
    expect(input.value).toBe("2025-01-15");
  });

  test("handles datetime-local input type correctly", () => {
    renderWithAdminContext(
      <FormWrapper defaultValues={{ datetime: "2025-01-15T10:30:00" }}>
        <TextInput
          source="datetime"
          label="Date Time"
          type="datetime-local"
        />
      </FormWrapper>,

    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.type).toBe("datetime-local");
    expect(input.value).toBe("2025-01-15T10:30");
  });

  test("displays helper text when provided", () => {
    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="email"
          label="Email"
          helperText="Enter your email address"
        />
      </FormWrapper>,

    );

    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
  });

  test("hides label when label prop is false", () => {
    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="hidden_label"
          label={false}
        />
      </FormWrapper>,

    );

    // Should not render label
    const labels = document.querySelectorAll("label");
    expect(labels.length).toBe(0);
  });

  test("applies custom className", () => {
    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="custom"
          label="Custom"
          className="custom-class"
        />
      </FormWrapper>,

    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveClass("custom-class");
  });

  test("handles complex validation with multiple rules", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="username"
          label="Username"
          validate={[
            required("Username is required"),
            minLength(3, "Username must be at least 3 characters"),
            maxLength(20, "Username must be at most 20 characters")
          ]}
        />
      </FormWrapper>,

    );

    const input = screen.getByRole("textbox");
    const submitButton = screen.getByText("Submit");

    // Test empty field
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Username is required")).toBeInTheDocument();
    });

    // Test too short
    await user.type(input, "ab");
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Username must be at least 3 characters")).toBeInTheDocument();
    });

    // Clear and test too long
    await user.clear(input);
    await user.type(input, "a".repeat(21));
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText("Username must be at most 20 characters")).toBeInTheDocument();
    });

    // Valid input
    await user.clear(input);
    await user.type(input, "validuser");
    await user.click(submitButton);

    await waitFor(() => {
      const errors = screen.queryByText(/Username/);
      expect(errors).not.toBeInTheDocument();
    });
  });

  test("preserves form field name from source prop", () => {
    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="contact.email"
          label="Contact Email"
        />
      </FormWrapper>,

    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveAttribute("role", "group");

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "contact.email");
  });

  test("integrates with React Hook Form's error state", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper resource="test">
        <TextInput
          source="email"
          label="Email"
          validate={required()}
        />
      </FormWrapper>,

    );

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    await waitFor(() => {
      const label = document.querySelector('[data-slot="form-label"]');
      expect(label).toHaveAttribute("data-error", "true");

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });
});