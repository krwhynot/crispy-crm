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
  SaveContextProvider,
  Form as RaForm,
} from "ra-core";
import React from "react";

// FormWrapper that provides React Admin Form context
// RaForm includes FormProvider internally which our form components use
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

  // RaForm provides FormProvider internally which is required for our custom form components
  // (FormField, FormLabel, FormControl, FormError) to work properly
  return (
    <SaveContextProvider value={saveContext}>
      <RaForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        mode="onChange"
      >
        {children}
        <button type="submit">Submit</button>
      </RaForm>
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
          email: "test@example.com"
        }),
        expect.anything() // React Hook Form also passes the event
      );
    });
  });

  test("displays validation errors from FormError component", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="email"
          label="Email"
          validate={[required(), minLength(5)]}
        />
      </FormWrapper>,
      { resource: "test" }
    );

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Should show required error (English translation is "Required")
    await waitFor(() => {
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    // Type insufficient characters
    const input = screen.getByRole("textbox");
    await user.type(input, "abc");
    await user.click(submitButton);

    // Should show minLength error (English translation is "Must be %{min} characters at least")
    await waitFor(() => {
      expect(screen.getByText("Must be 5 characters at least")).toBeInTheDocument();
    });
  });

  test("shows required field indicator when field is required", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="name"
          label="Name"
          validate={required()}
        />
      </FormWrapper>,
      { resource: "test" }
    );

    // React Admin adds an asterisk to required fields
    const label = screen.getByText(/Name/);
    expect(label.textContent).toContain("*");
  });

  test("renders textarea in multiline mode", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="description"
          label="Description"
          multiline
        />
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
        <TextInput
          source="notes"
          label="Notes"
          multiline
        />
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
          notes: multilineText
        }),
        expect.anything() // React Hook Form also passes the event
      );
    });
  });

  test("respects disabled and readOnly props", () => {
    const { rerender } = renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="name"
          label="Name"
          disabled
        />
      </FormWrapper>,
      { resource: "test" }
    );

    let input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toBeDisabled();

    // Test readOnly
    rerender(
      <FormWrapper>
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
      { resource: "test" }
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
      { resource: "test" }
    );

    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.type).toBe("datetime-local");
    expect(input.value).toBe("2025-01-15T10:30");
  });

  test("displays helper text when provided", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="email"
          label="Email"
          helperText="Enter your email address"
        />
      </FormWrapper>,
      { resource: "test" }
    );

    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
  });

  test("hides label when label prop is false", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="hidden_label"
          label={false}
        />
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
        <TextInput
          source="custom"
          label="Custom"
          className="custom-class"
        />
      </FormWrapper>,
      { resource: "test" }
    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveClass("custom-class");
  });

  test("handles complex validation with multiple rules", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper>
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
      { resource: "test" }
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
      const errors = screen.queryByText(/Username is required|Username must/);
      expect(errors).not.toBeInTheDocument();
    });
  });

  test("preserves form field name from source prop", () => {
    renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="contact.email"
          label="Contact Email"
        />
      </FormWrapper>,
      { resource: "test" }
    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveAttribute("role", "group");

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "contact.email");
  });

  test("integrates with React Hook Form's error state", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <FormWrapper>
        <TextInput
          source="email"
          label="Email"
          validate={required()}
        />
      </FormWrapper>,
      { resource: "test" }
    );

    const submitButton = screen.getByText("Submit");
    await user.click(submitButton);

    // Wait for validation error to appear first
    await waitFor(() => {
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    // Then check the error state attributes
    await waitFor(() => {
      const label = document.querySelector('[data-slot="form-label"]');
      expect(label).toHaveAttribute("data-error", "true");

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });
});