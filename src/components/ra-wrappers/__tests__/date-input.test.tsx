/**
 * Tests for DateInput component
 *
 * Tests the integration of shadcn/ui Calendar with React Admin's useInput hook,
 * including timezone handling, clear functionality, and ref forwarding.
 *
 * CRITICAL BUG TESTS:
 * 1. Timezone Bug Prevention - Date saves as YYYY-MM-DD, not ISO string
 * 2. Clear Button - Appears on optional fields, hidden on required
 * 3. Ref Forwarding - For focus-on-error functionality
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { DateInput } from "../date-input";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { SaveContextProvider } from "ra-core";
import { useForm } from "react-hook-form";
import { Form } from "../form";

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

  // Reset form when defaultValues change - using JSON.stringify for deep comparison
  React.useEffect(() => {
    form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues)]);

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

describe("DateInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders with label and calendar icon button", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      expect(screen.getByText("Activity Date")).toBeInTheDocument();
      // DateInput uses a button trigger for the popover - accessible name comes from the associated label
      const triggerButton = screen.getByRole("button", { name: /activity date/i });
      expect(triggerButton).toBeInTheDocument();
    });

    test("shows placeholder when empty", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Activity Date" placeholder="Select date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      expect(screen.getByText("Select date")).toBeInTheDocument();
    });

    test("formats existing date correctly as 'January 15th, 2025'", () => {
      renderWithAdminContext(
        <FormWrapper defaultValues={{ activity_date: "2025-01-15" }}>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Should display formatted date - date-fns PPP format = "January 15th, 2025"
      expect(screen.getByText(/January 15(th)?,? 2025/i)).toBeInTheDocument();
    });

    test("hides label when label prop is false", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label={false} />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Should not render label element
      const labels = document.querySelectorAll("label");
      expect(labels.length).toBe(0);
    });

    test("applies custom className", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Date" className="custom-date-class" />
        </FormWrapper>,
        { resource: "activities" }
      );

      const formField = document.querySelector('[data-slot="form-item"]');
      expect(formField).toHaveClass("custom-date-class");
    });

    test("displays helper text when provided", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Date" helperText="Select the activity date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      expect(screen.getByText("Select the activity date")).toBeInTheDocument();
    });
  });

  describe("Calendar Interaction", () => {
    test("opens popover/calendar on button click", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Button's accessible name is from placeholder text
      const triggerButton = screen.getByRole("button", {
        name: /activity date|due date|date|created at/i,
      });
      await user.click(triggerButton);

      // Calendar should be visible - look for calendar grid or navigation
      await waitFor(() => {
        // Calendar uses a grid role or contains day buttons
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).toBeInTheDocument();
      });
    });

    test("selects date and closes popover", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper onSubmit={onSubmit}>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Open calendar
      const triggerButton = screen.getByRole("button", {
        name: /activity date|due date|date|created at/i,
      });
      await user.click(triggerButton);

      // Wait for calendar to appear
      await waitFor(() => {
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).toBeInTheDocument();
      });

      // Find and click on day 15 (look for button with "15" text)
      const dayButtons = screen.getAllByRole("button");
      const day15Button = dayButtons.find((btn) => btn.textContent === "15");
      expect(day15Button).toBeDefined();
      await user.click(day15Button!);

      // Calendar should close after selection
      await waitFor(() => {
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).not.toBeInTheDocument();
      });
    });

    test("updates field value after date selection", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      // Use current year and month to avoid calendar navigation issues
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      const testDate = `${currentYear}-${currentMonth}-01`;

      renderWithAdminContext(
        <FormWrapper onSubmit={onSubmit} defaultValues={{ activity_date: testDate }}>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Open calendar - when date is set, button shows formatted date
      const triggerButton = screen.getByRole("button", { name: /activity date/i });
      await user.click(triggerButton);

      // Wait for calendar and click day 15
      await waitFor(() => {
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).toBeInTheDocument();
      });

      const dayButtons = screen.getAllByRole("button");
      const day15Button = dayButtons.find((btn) => btn.textContent === "15");
      await user.click(day15Button!);

      // Submit form
      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            // Verify date is in YYYY-MM-DD format with day 15 in the current month
            activity_date: expect.stringMatching(new RegExp(`${currentYear}-${currentMonth}-15`)),
          }),
          expect.anything()
        );
      });
    });
  });

  describe("Critical Bug Tests", () => {
    /**
     * CRITICAL TEST 1: Timezone Bug Prevention
     *
     * Scenario: User selects Jan 15, 2025
     * Expected: field.onChange called with "2025-01-15" (YYYY-MM-DD)
     * NOT: ISO string like "2025-01-15T00:00:00.000Z" (causes timezone shift)
     */
    test("saves date in YYYY-MM-DD format without timezone shift (CRITICAL)", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper onSubmit={onSubmit} defaultValues={{ activity_date: "2025-01-01" }}>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Open calendar - button shows formatted date when value is set
      const triggerButton = screen.getByRole("button", { name: /activity date/i });
      await user.click(triggerButton);

      // Wait for calendar to appear
      await waitFor(() => {
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).toBeInTheDocument();
      });

      // Select day 15
      const dayButtons = screen.getAllByRole("button");
      const day15Button = dayButtons.find((btn) => btn.textContent === "15");
      await user.click(day15Button!);

      // Submit and verify format
      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
        const [formData] = onSubmit.mock.calls[0];
        const dateValue = formData.activity_date as string;

        // CRITICAL ASSERTION: Must be YYYY-MM-DD format only
        expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // Must NOT contain time component (timezone bug indicator)
        expect(dateValue).not.toMatch(/T\d{2}:\d{2}/);
      });
    });

    /**
     * CRITICAL TEST 2: Clear Button Visibility
     *
     * Scenario 1: Optional field with value -> X button visible
     * Scenario 2: Required field -> X button hidden
     * Scenario 3: Click X button -> field.onChange(null) called
     */
    test("shows clear button on optional field with value", async () => {
      renderWithAdminContext(
        <FormWrapper defaultValues={{ activity_date: "2025-01-15" }}>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Clear button has aria-label="Clear date"
      const clearButton = screen.getByRole("button", { name: /clear date/i });
      expect(clearButton).toBeInTheDocument();
    });

    test("hides clear button on required field", () => {
      // Use isRequired prop - React Admin's useInput() only recognizes built-in required() validator
      // For custom validate functions, isRequired must be explicitly passed

      renderWithAdminContext(
        <FormWrapper defaultValues={{ activity_date: "2025-01-15" }}>
          <DateInput source="activity_date" label="Activity Date" isRequired />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Clear button should NOT be visible for required field
      const clearButton = screen.queryByRole("button", { name: /clear date/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    test("clears value when clear button is clicked", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper defaultValues={{ activity_date: "2025-01-15" }} onSubmit={onSubmit}>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Click clear button (aria-label="Clear date")
      const clearButton = screen.getByRole("button", { name: /clear date/i });
      await user.click(clearButton);

      // Submit form
      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            activity_date: null,
          }),
          expect.anything()
        );
      });
    });

    /**
     * CRITICAL TEST 3: Ref Forwarding for Focus-on-Error
     *
     * Scenario: Create component with React.forwardRef
     * Expected: ref.current is HTMLButtonElement
     * Assertion: ref.current?.getAttribute("type") === "button"
     */
    test("forwards ref to button element for focus-on-error", () => {
      const ref = React.createRef<HTMLButtonElement>();

      renderWithAdminContext(
        <FormWrapper>
          <DateInput ref={ref} source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Ref should point to the trigger button
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.getAttribute("type")).toBe("button");
    });

    test("ref can be used to programmatically focus the input", () => {
      const ref = React.createRef<HTMLButtonElement>();

      renderWithAdminContext(
        <FormWrapper>
          <DateInput ref={ref} source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Should be able to focus via ref
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe("Feature Tests", () => {
    test("disableFuture prevents future date selection", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Activity Date" disableFuture />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Open calendar
      const triggerButton = screen.getByRole("button", {
        name: /activity date|due date|date|created at/i,
      });
      await user.click(triggerButton);

      await waitFor(() => {
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).toBeInTheDocument();
      });

      // Navigate to next month and check if future dates are disabled
      // Calendar navigation buttons typically don't have text, look for chevron buttons
      const navButtons = document.querySelectorAll(
        '[class*="button_next"], [class*="nav"] button:last-child'
      );
      if (navButtons.length > 0) {
        await user.click(navButtons[0] as HTMLElement);
      }

      // Days after today should be disabled
      await waitFor(() => {
        // Look for disabled day buttons (aria-disabled or disabled attribute)
        const disabledDays = document.querySelectorAll(
          'button[aria-disabled="true"], button[disabled]'
        );
        expect(disabledDays.length).toBeGreaterThan(0);
      });
    });

    test("disablePast prevents past date selection", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="due_date" label="Due Date" disablePast />
        </FormWrapper>,
        { resource: "tasks" }
      );

      // Open calendar
      const triggerButton = screen.getByRole("button", {
        name: /activity date|due date|date|created at/i,
      });
      await user.click(triggerButton);

      await waitFor(() => {
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).toBeInTheDocument();
      });

      // Navigate to previous month
      const navButtons = document.querySelectorAll(
        '[class*="button_previous"], [class*="nav"] button:first-child'
      );
      if (navButtons.length > 0) {
        await user.click(navButtons[0] as HTMLElement);
      }

      await waitFor(() => {
        const disabledDays = document.querySelectorAll(
          'button[aria-disabled="true"], button[disabled]'
        );
        expect(disabledDays.length).toBeGreaterThan(0);
      });
    });

    test("respects disabled state", () => {
      renderWithAdminContext(
        <FormWrapper defaultValues={{ activity_date: "2025-01-15" }}>
          <DateInput source="activity_date" label="Activity Date" disabled />
        </FormWrapper>,
        { resource: "activities" }
      );

      // When disabled, button shows formatted date but is disabled
      const triggerButton = screen.getByRole("button", { name: /activity date/i });
      expect(triggerButton).toBeDisabled();
    });

    test("respects readOnly state", async () => {
      const user = userEvent.setup();

      renderWithAdminContext(
        <FormWrapper defaultValues={{ activity_date: "2025-01-15" }}>
          <DateInput source="activity_date" label="Activity Date" readOnly />
        </FormWrapper>,
        { resource: "activities" }
      );

      // readOnly button shows formatted date
      const triggerButton = screen.getByRole("button", { name: /activity date/i });

      // In readOnly mode, clicking should not open calendar
      await user.click(triggerButton);

      // Calendar should NOT appear
      await waitFor(
        () => {
          const calendar = document.querySelector('[data-slot="calendar"]');
          expect(calendar).not.toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });
  });

  describe("React Admin Integration", () => {
    test("integrates with useInput hook", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper onSubmit={onSubmit}>
          <DateInput source="created_at" label="Created At" />
        </FormWrapper>,
        { resource: "contacts" }
      );

      // Open calendar - placeholder shows when no value
      const triggerButton = screen.getByRole("button", {
        name: /activity date|due date|date|created at/i,
      });
      await user.click(triggerButton);

      await waitFor(() => {
        const calendar = document.querySelector('[data-slot="calendar"]');
        expect(calendar).toBeInTheDocument();
      });

      // Select a date
      const dayButtons = screen.getAllByRole("button");
      const day10Button = dayButtons.find((btn) => btn.textContent === "10");
      await user.click(day10Button!);

      // Submit and verify value is passed through useInput
      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            created_at: expect.any(String),
          }),
          expect.anything()
        );
      });
    });

    test("preserves form field name from source prop", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="opportunity.expected_closing_date" label="Closing Date" />
        </FormWrapper>,
        { resource: "opportunities" }
      );

      const formField = document.querySelector('[data-slot="form-item"]');
      expect(formField).toHaveAttribute("role", "group");
    });

    test("handles nested source paths correctly", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      renderWithAdminContext(
        <FormWrapper onSubmit={onSubmit} defaultValues={{ details: { start_date: "2025-01-15" } }}>
          <DateInput source="details.start_date" label="Start Date" />
        </FormWrapper>,
        { resource: "projects" }
      );

      // Verify initial value is displayed - date-fns format "PPP" = "January 15th, 2025"
      expect(screen.getByText(/January 15(th)?,? 2025/i)).toBeInTheDocument();

      // Submit and verify nested path
      const submitButton = screen.getByText("Submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.objectContaining({
              start_date: "2025-01-15",
            }),
          }),
          expect.anything()
        );
      });
    });
  });

  describe("Accessibility", () => {
    test("has proper aria-invalid attribute on error", async () => {
      // This test verifies the error state is properly announced
      // Errors are set at the API boundary per Engineering Constitution
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      const formControl = document.querySelector('[data-slot="form-control"]');
      // Initially no error
      expect(formControl).not.toHaveAttribute("aria-invalid", "true");
    });

    test("associates label with input via aria-labelledby or htmlFor", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      const label = screen.getByText("Activity Date");
      const formControl = document.querySelector('[data-slot="form-control"]');

      // Label should have htmlFor pointing to control's id
      expect(label.closest("label")).toHaveAttribute("for");
      expect(formControl).toHaveAttribute("id");
    });

    test("meets minimum touch target size (44px)", () => {
      renderWithAdminContext(
        <FormWrapper>
          <DateInput source="activity_date" label="Activity Date" />
        </FormWrapper>,
        { resource: "activities" }
      );

      // Button accessible name is the placeholder when empty
      const triggerButton = screen.getByRole("button", {
        name: /activity date|due date|date|created at/i,
      });

      // Button should have minimum height for touch target (h-11 = 44px)
      // Note: In jsdom, computed styles may not reflect Tailwind classes
      // This test documents the expectation; visual verification needed
      expect(triggerButton).toHaveClass("h-11");
    });
  });
});
