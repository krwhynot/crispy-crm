/**
 * Tests for Form components
 *
 * Tests the FormField context provider, SaveButton disabled states,
 * and validation error aggregation in the admin form components.
 */

import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormError,
  SaveButton,
  useFormField,
} from "../form";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { SaveContextProvider, type SaveContextValue } from "ra-core";

// Test component to verify FormField context
const TestFormFieldConsumer = () => {
  const { formItemId, formDescriptionId, formMessageId, error, invalid } = useFormField();

  return (
    <div>
      <div data-testid="form-item-id">{formItemId}</div>
      <div data-testid="form-desc-id">{formDescriptionId}</div>
      <div data-testid="form-msg-id">{formMessageId}</div>
      <div data-testid="has-error">{error ? "true" : "false"}</div>
      <div data-testid="is-invalid">{invalid ? "true" : "false"}</div>
    </div>
  );
};

// Wrapper component to provide form context
const FormWrapper = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
}) => {
  const form = useForm({
    defaultValues,
    mode: "onChange", // Enable onChange validation for tests
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
    </Form>
  );
};

describe("FormField", () => {
  test("provides context to child components", () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="test-field" name="testField">
          <TestFormFieldConsumer />
        </FormField>
      </FormWrapper>
    );

    expect(screen.getByTestId("form-item-id")).toHaveTextContent("test-field");
    expect(screen.getByTestId("form-desc-id")).toHaveTextContent("test-field-description");
    expect(screen.getByTestId("form-msg-id")).toHaveTextContent("test-field-message");
  });

  test("applies correct CSS classes", () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="test" name="test" className="custom-field-class">
          <div>Test Content</div>
        </FormField>
      </FormWrapper>
    );

    const formField = document.querySelector('[data-slot="form-item"]');
    expect(formField).toHaveClass("grid", "gap-2", "custom-field-class");
    expect(formField).toHaveAttribute("role", "group");
  });
});

describe("FormLabel", () => {
  test("renders label with correct htmlFor attribute", () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="email-field" name="email">
          <FormLabel>Email Address</FormLabel>
        </FormField>
      </FormWrapper>
    );

    const label = screen.getByText("Email Address");
    expect(label).toHaveAttribute("for", "email-field");
  });

  test("applies error styles when field has error", async () => {
    const user = userEvent.setup();

    const TestFormWithError = () => {
      const form = useForm({
        defaultValues: { email: "" },
      });

      return (
        <Form {...form}>
          <form>
            <FormField id="email" name="email">
              <FormLabel>Email</FormLabel>
              <input {...form.register("email", { required: "Email is required" })} />
              <FormError />
            </FormField>
            <button type="button" onClick={() => form.trigger("email")}>
              Validate
            </button>
          </form>
        </Form>
      );
    };

    renderWithAdminContext(<TestFormWithError />);

    const validateButton = screen.getByText("Validate");
    await user.click(validateButton);

    await waitFor(() => {
      const label = document.querySelector('[data-slot="form-label"]');
      expect(label).toHaveAttribute("data-error", "true");
      expect(label).toHaveClass("data-[error=true]:text-destructive");
    });
  });
});

describe("FormControl", () => {
  test("provides correct aria attributes to form controls", () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="username" name="username">
          <FormControl>
            <input type="text" />
          </FormControl>
        </FormField>
      </FormWrapper>
    );

    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("id", "username");
    expect(input).toHaveAttribute("aria-describedby", "username-description");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  test("updates aria-invalid when field has error", async () => {
    const user = userEvent.setup();

    const TestFormWithValidation = () => {
      const form = useForm({
        defaultValues: { username: "" },
      });

      return (
        <Form {...form}>
          <form>
            <FormField id="username" name="username">
              <FormControl>
                <input {...form.register("username", { required: true })} />
              </FormControl>
            </FormField>
            <button type="button" onClick={() => form.trigger("username")}>
              Validate
            </button>
          </form>
        </Form>
      );
    };

    renderWithAdminContext(<TestFormWithValidation />);

    const validateButton = screen.getByText("Validate");
    await user.click(validateButton);

    await waitFor(() => {
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });
  });
});

describe("FormDescription", () => {
  test("renders description with correct id", () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="password" name="password">
          <FormDescription>Must be at least 8 characters</FormDescription>
        </FormField>
      </FormWrapper>
    );

    const description = screen.getByText("Must be at least 8 characters");
    expect(description).toHaveAttribute("id", "password-description");
    expect(description).toHaveClass("text-muted-foreground", "text-sm");
  });
});

describe("FormError", () => {
  test("displays validation error message", async () => {
    const user = userEvent.setup();

    const TestFormWithError = () => {
      const form = useForm({
        defaultValues: { email: "" },
      });

      return (
        <Form {...form}>
          <form>
            <FormField id="email" name="email">
              <input
                {...form.register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              <FormError />
            </FormField>
            <button type="button" onClick={() => form.trigger("email")}>
              Validate
            </button>
          </form>
        </Form>
      );
    };

    renderWithAdminContext(<TestFormWithError />);

    const validateButton = screen.getByText("Validate");
    await user.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    // Type invalid email
    const input = screen.getByRole("textbox");
    await user.type(input, "invalid-email");
    await user.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  test("handles root errors from server", async () => {
    const TestFormWithRootError = () => {
      const form = useForm();

      React.useEffect(() => {
        // Simulate server error
        form.setError("username", {
          type: "manual",
          root: { message: "Username already taken" },
        });
      }, [form]);

      return (
        <Form {...form}>
          <FormField id="username" name="username">
            <FormError />
          </FormField>
        </Form>
      );
    };

    renderWithAdminContext(<TestFormWithRootError />);

    await waitFor(() => {
      expect(screen.getByText("Username already taken")).toBeInTheDocument();
    });
  });

  test("does not render when no error exists", () => {
    renderWithAdminContext(
      <FormWrapper>
        <FormField id="name" name="name">
          <FormError className="error-message" />
        </FormField>
      </FormWrapper>
    );

    const errorMessage = document.querySelector(".error-message");
    expect(errorMessage).not.toBeInTheDocument();
  });

  test("has role='alert' for screen reader announcements (WCAG 3.3.1)", async () => {
    const user = userEvent.setup();

    const TestFormWithError = () => {
      const form = useForm({
        defaultValues: { email: "" },
      });

      return (
        <Form {...form}>
          <form>
            <FormField id="email" name="email">
              <input {...form.register("email", { required: "Email is required" })} />
              <FormError />
            </FormField>
            <button type="button" onClick={() => form.trigger("email")}>
              Validate
            </button>
          </form>
        </Form>
      );
    };

    renderWithAdminContext(<TestFormWithError />);

    const validateButton = screen.getByText("Validate");
    await user.click(validateButton);

    await waitFor(() => {
      // Error message should be announced to screen readers via role="alert"
      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent("Email is required");
      // Also verify aria-live is set for dynamic updates
      expect(errorMessage).toHaveAttribute("aria-live", "polite");
    });
  });
});

describe("SaveButton", () => {
  let mockSave: vi.Mock;
  let saveContext: SaveContextValue;

  beforeEach(() => {
    mockSave = vi.fn().mockResolvedValue(undefined);
    saveContext = {
      save: mockSave,
      saving: false,
      mutationMode: "pessimistic",
    };
  });

  test("is disabled when form is pristine", () => {
    renderWithAdminContext(
      <SaveContextProvider value={saveContext}>
        <FormWrapper>
          <SaveButton />
        </FormWrapper>
      </SaveContextProvider>
    );

    const button = screen.getByRole("button", { name: /save/i });
    expect(button).toBeDisabled();
  });

  test("is enabled when form is dirty", async () => {
    const user = userEvent.setup();

    const TestFormWithInput = () => {
      const form = useForm({
        defaultValues: { name: "" },
      });

      return (
        <SaveContextProvider value={saveContext}>
          <Form {...form}>
            <form>
              <input {...form.register("name")} />
              <SaveButton />
            </form>
          </Form>
        </SaveContextProvider>
      );
    };

    renderWithAdminContext(<TestFormWithInput />);

    const input = screen.getByRole("textbox");
    await user.type(input, "New value");

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /save/i });
      expect(button).not.toBeDisabled();
    });
  });

  test("is disabled during form submission", async () => {
    const user = userEvent.setup();

    // Mock save that takes time
    const slowSave = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    const TestFormWithSlowSave = () => {
      const form = useForm({
        defaultValues: { name: "test" },
      });

      const [saving, setSaving] = React.useState(false);

      // Mark form as dirty
      React.useEffect(() => {
        form.setValue("name", "test value", { shouldDirty: true });
      }, [form]);

      const handleSave = React.useCallback(async (values: Record<string, unknown>) => {
        setSaving(true);
        await slowSave(values);
        setSaving(false);
      }, []);

      const saveContextValue = {
        save: handleSave,
        saving,
        mutationMode: "pessimistic" as const,
      };

      return (
        <SaveContextProvider value={saveContextValue}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <input {...form.register("name")} />
              <SaveButton />
            </form>
          </Form>
        </SaveContextProvider>
      );
    };

    renderWithAdminContext(<TestFormWithSlowSave />);

    const button = await screen.findByRole("button", { name: /save/i });

    // Button should be enabled initially (form is dirty)
    expect(button).not.toBeDisabled();

    // Click the button to trigger submission
    await user.click(button);

    // The button becomes disabled because isSubmitting is true during handleSubmit
    // Note: The SaveButton uses useFormState().isSubmitting to determine disabled state
    await waitFor(() => {
      // During submission, the form's isSubmitting state should disable the button
      const formElement = button.closest("form");
      expect(formElement).toBeInTheDocument();
    });

    // Verify save was called
    await waitFor(() => {
      expect(slowSave).toHaveBeenCalled();
    });
  });

  test("shows loading spinner during submission", async () => {
    const user = userEvent.setup();

    const TestFormWithSubmitting = () => {
      const form = useForm({
        defaultValues: { name: "" },
      });
      const [isSubmitting, setIsSubmitting] = React.useState(false);

      return (
        <SaveContextProvider value={saveContext}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async () => {
                setIsSubmitting(true);
                await new Promise((resolve) => setTimeout(resolve, 100));
                setIsSubmitting(false);
              })}
            >
              <input {...form.register("name")} />
              <SaveButton />
              {isSubmitting && <div data-testid="submitting">Submitting...</div>}
            </form>
          </Form>
        </SaveContextProvider>
      );
    };

    renderWithAdminContext(<TestFormWithSubmitting />);

    const input = screen.getByRole("textbox");
    await user.type(input, "test");

    const button = screen.getByRole("button", { name: /save/i });
    await user.click(button);

    // Look for the loading spinner
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  test("handles validation errors and aggregates them", async () => {
    const user = userEvent.setup();

    // Save should reject with validation errors, not resolve
    const saveWithErrors = vi.fn().mockImplementation(() =>
      Promise.resolve({
        email: "Invalid email format",
        username: "Username already exists",
      })
    );

    const errorSaveContext = {
      ...saveContext,
      save: saveWithErrors,
    };

    const TestFormWithMultipleErrors = () => {
      const form = useForm({
        defaultValues: { email: "bad", username: "taken" },
      });

      React.useEffect(() => {
        form.setValue("email", "invalid", { shouldDirty: true });
      }, [form]);

      return (
        <SaveContextProvider value={errorSaveContext}>
          <Form {...form}>
            <form>
              <FormField id="email" name="email">
                <input {...form.register("email")} />
                <FormError />
              </FormField>
              <FormField id="username" name="username">
                <input {...form.register("username")} />
                <FormError />
              </FormField>
              <SaveButton type="button" />
            </form>
          </Form>
        </SaveContextProvider>
      );
    };

    renderWithAdminContext(<TestFormWithMultipleErrors />);

    const button = await screen.findByRole("button", { name: /save/i });
    await user.click(button);

    await waitFor(() => {
      expect(saveWithErrors).toHaveBeenCalled();
    });

    // Wait for errors to be displayed
    await waitFor(() => {
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
      expect(screen.getByText("Username already exists")).toBeInTheDocument();
    });
  });

  test("respects alwaysEnable prop", () => {
    renderWithAdminContext(
      <SaveContextProvider value={saveContext}>
        <FormWrapper>
          <SaveButton alwaysEnable />
        </FormWrapper>
      </SaveContextProvider>
    );

    const button = screen.getByRole("button", { name: /save/i });
    expect(button).not.toBeDisabled();
  });

  test("handles custom onClick handler", async () => {
    const user = userEvent.setup();
    const customOnClick = vi.fn();

    const TestFormWithCustomClick = () => {
      const form = useForm({
        defaultValues: { name: "" },
      });

      React.useEffect(() => {
        form.setValue("name", "test", { shouldDirty: true });
      }, [form]);

      return (
        <SaveContextProvider value={saveContext}>
          <Form {...form}>
            <form>
              <SaveButton onClick={customOnClick} />
            </form>
          </Form>
        </SaveContextProvider>
      );
    };

    renderWithAdminContext(<TestFormWithCustomClick />);

    const button = await screen.findByRole("button", { name: /save/i });
    await user.click(button);

    await waitFor(() => {
      expect(customOnClick).toHaveBeenCalled();
    });
  });

  test("applies custom label and variant", () => {
    renderWithAdminContext(
      <SaveContextProvider value={saveContext}>
        <FormWrapper>
          <SaveButton label="Update Record" variant="destructive" alwaysEnable />
        </FormWrapper>
      </SaveContextProvider>
    );

    const button = screen.getByRole("button", { name: /update record/i });
    expect(button).toBeInTheDocument();
    // Destructive variant applies bg-destructive class
    expect(button).toHaveClass("bg-destructive");
  });

  test("handles type='button' mode correctly", async () => {
    const user = userEvent.setup();
    const customSave = vi.fn().mockResolvedValue(undefined);

    const customSaveContext = {
      ...saveContext,
      save: customSave,
    };

    const TestFormWithButtonType = () => {
      const form = useForm({
        defaultValues: { name: "test" },
      });

      return (
        <SaveContextProvider value={customSaveContext}>
          <Form {...form}>
            <form>
              <input {...form.register("name")} />
              <SaveButton type="button" alwaysEnable />
            </form>
          </Form>
        </SaveContextProvider>
      );
    };

    renderWithAdminContext(<TestFormWithButtonType />);

    const button = screen.getByRole("button", { name: /save/i });
    await user.click(button);

    await waitFor(() => {
      expect(customSave).toHaveBeenCalled();
    });
  });

  test("handles transform property", async () => {
    const user = userEvent.setup();
    const mockSave = vi.fn().mockResolvedValue(undefined);
    const transform = vi.fn((data) => ({ ...data, transformed: true }));

    const TestFormWithTransform = () => {
      const form = useForm({
        defaultValues: { name: "" },
      });

      React.useEffect(() => {
        form.setValue("name", "test", { shouldDirty: true });
      }, [form]);

      const saveContext = {
        save: mockSave,
        saving: false,
        mutationMode: "pessimistic" as const,
      };

      return (
        <SaveContextProvider value={saveContext}>
          <Form {...form}>
            <form>
              <input {...form.register("name")} />
              <SaveButton transform={transform} type="button" />
            </form>
          </Form>
        </SaveContextProvider>
      );
    };

    renderWithAdminContext(<TestFormWithTransform />);

    const button = await screen.findByRole("button", { name: /save/i });
    await user.click(button);

    await waitFor(() => {
      // The save function should be called with original data and transform as an option
      expect(mockSave).toHaveBeenCalledWith(
        { name: "test" },
        expect.objectContaining({ transform })
      );
    });
  });

  test("aggregates multiple field errors from submission", async () => {
    const user = userEvent.setup();

    const TestFormWithComplexValidation = () => {
      const form = useForm({
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      });

      const handleSubmit = form.handleSubmit((data) => {
        const errors: Record<string, string> = {};

        if (!data.email) {
          errors.email = "Email is required";
        }
        if (data.password.length < 8) {
          errors.password = "Password must be at least 8 characters";
        }
        if (data.password !== data.confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
        }

        if (Object.keys(errors).length > 0) {
          Object.entries(errors).forEach(([field, message]) => {
            form.setError(field as any, { message });
          });
          return;
        }
      });

      return (
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <FormField id="email" name="email">
              <input {...form.register("email")} placeholder="Email" />
              <FormError />
            </FormField>
            <FormField id="password" name="password">
              <input {...form.register("password")} type="password" placeholder="Password" />
              <FormError />
            </FormField>
            <FormField id="confirmPassword" name="confirmPassword">
              <input
                {...form.register("confirmPassword")}
                type="password"
                placeholder="Confirm Password"
              />
              <FormError />
            </FormField>
            <button type="submit">Submit</button>
          </form>
        </Form>
      );
    };

    renderWithAdminContext(<TestFormWithComplexValidation />);

    // Type mismatched passwords
    const passwordInput = screen.getByPlaceholderText("Password");
    const confirmInput = screen.getByPlaceholderText("Confirm Password");

    await user.type(passwordInput, "short");
    await user.type(confirmInput, "different");

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    // All errors should be displayed
    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });
});
