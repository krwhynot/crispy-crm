/**
 * TaskCreate Tests - URL Params & Validation
 *
 * Tests for Bug #1: URL params not pre-filling title/type
 * Tests for Bug #2: Validation errors not visible
 *
 * TDD: These tests are written BEFORE the fix to verify:
 * 1. The bugs exist (tests should initially fail)
 * 2. The fix works (tests should pass after implementation)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskCreate from "../TaskCreate";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { ConfigurationProvider } from "../../root/ConfigurationContext";

// Wrap TaskCreate with ConfigurationProvider for taskTypes
const TaskCreateWithConfig = () => (
  <ConfigurationProvider>
    <TaskCreate />
  </ConfigurationProvider>
);

describe("TaskCreate - URL Params Pre-fill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills title from URL param", async () => {
    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create?title=Follow-up%3A%20Call%20John"],
    });

    // Find the title input
    const titleInput = await screen.findByLabelText(/task title/i);

    // Should have the decoded URL param value
    expect(titleInput).toHaveValue("Follow-up: Call John");
  });

  it("pre-fills type from URL param (Title-case)", async () => {
    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create?type=Follow-up"],
    });

    // Find the type select - it should show "Follow-up"
    // SelectInput renders a button with SelectValue inside
    const typeButton = await screen.findByRole("combobox", { name: /type/i });

    // The selected value should be "Follow-up"
    expect(typeButton).toHaveTextContent(/Follow-up/i);
  });

  it("pre-fills type from URL param (maps snake_case to Title-case)", async () => {
    // This tests backward compatibility with existing follow-up flow
    // that sends type=follow_up instead of type=Follow-up
    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create?type=follow_up"],
    });

    const typeButton = await screen.findByRole("combobox", { name: /type/i });

    // Should map follow_up → Follow-up
    expect(typeButton).toHaveTextContent(/Follow-up/i);
  });

  it("handles both title and type params together", async () => {
    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create?title=Test%20Task&type=Meeting"],
    });

    const titleInput = await screen.findByLabelText(/task title/i);
    const typeButton = await screen.findByRole("combobox", { name: /type/i });

    expect(titleInput).toHaveValue("Test Task");
    expect(typeButton).toHaveTextContent(/Meeting/i);
  });

  it("uses schema defaults when no URL params provided", async () => {
    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    // Title should be empty (no default)
    const titleInput = await screen.findByLabelText(/task title/i);
    expect(titleInput).toHaveValue("");

    // Type should default to "Call" per getTaskDefaultValues()
    const typeButton = await screen.findByRole("combobox", { name: /type/i });
    expect(typeButton).toHaveTextContent(/Call/i);
  });

  it("pre-fills opportunity_id from URL param", async () => {
    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create?opportunity_id=123"],
      dataProvider: {
        getOne: vi.fn().mockResolvedValue({
          data: { id: 123, title: "Test Opportunity" },
        }),
        getMany: vi.fn().mockResolvedValue({
          data: [{ id: 123, title: "Test Opportunity" }],
        }),
      },
    });

    // The opportunity reference field should be populated
    // This may require waiting for the reference to load
    await waitFor(
      () => {
        const opportunityField = screen.getByRole("combobox", { name: /opportunity/i });
        expect(opportunityField).toHaveTextContent(/Test Opportunity/i);
      },
      { timeout: 2000 }
    );
  });

  it("pre-fills contact_id from URL param", async () => {
    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create?contact_id=456"],
      dataProvider: {
        getOne: vi.fn().mockResolvedValue({
          data: { id: 456, first_name: "John", last_name: "Doe" },
        }),
        getMany: vi.fn().mockResolvedValue({
          data: [{ id: 456, first_name: "John", last_name: "Doe" }],
        }),
      },
    });

    await waitFor(
      () => {
        const contactField = screen.getByRole("combobox", { name: /contact/i });
        expect(contactField).toHaveTextContent(/John/i);
      },
      { timeout: 2000 }
    );
  });
});

describe("TaskCreate - Validation Errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error when title is empty on blur", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    // Find and focus the title input
    const titleInput = await screen.findByLabelText(/task title/i);

    // Clear any existing value and blur to trigger validation
    await user.clear(titleInput);
    await user.tab(); // Blur the field

    // Error message should appear (mode="onBlur")
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it("shows error when due date is cleared on blur", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    // Find the due date input
    const dueDateInput = await screen.findByLabelText(/due date/i);

    // Clear the date and blur
    await user.clear(dueDateInput);
    await user.tab();

    // Error should appear
    await waitFor(() => {
      expect(screen.getByText(/due date is required/i)).toBeInTheDocument();
    });
  });

  it("clears error when field is corrected", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    const titleInput = await screen.findByLabelText(/task title/i);

    // Trigger error
    await user.clear(titleInput);
    await user.tab();

    // Verify error appears
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });

    // Fix the field
    await user.click(titleInput);
    await user.type(titleInput, "Fixed title");
    await user.tab();

    // Error should clear
    await waitFor(() => {
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
    });
  });

  it("error message has role=alert for accessibility", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    const titleInput = await screen.findByLabelText(/task title/i);

    // Trigger validation error
    await user.clear(titleInput);
    await user.tab();

    // Find error message with role="alert"
    await waitFor(() => {
      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it("input has aria-invalid when validation fails", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    const titleInput = await screen.findByLabelText(/task title/i);

    // Initially not invalid
    expect(titleInput).not.toHaveAttribute("aria-invalid", "true");

    // Trigger validation error
    await user.clear(titleInput);
    await user.tab();

    // Should now be aria-invalid
    await waitFor(() => {
      expect(titleInput).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("shows FormErrorSummary when multiple fields have errors", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(<TaskCreateWithConfig />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    const titleInput = await screen.findByLabelText(/task title/i);
    const dueDateInput = await screen.findByLabelText(/due date/i);

    // Clear both required fields
    await user.clear(titleInput);
    await user.clear(dueDateInput);

    // Click save to trigger full form validation
    const saveButton = screen.getByRole("button", { name: /save/i });
    await user.click(saveButton);

    // FormErrorSummary should show with error count
    await waitFor(() => {
      expect(screen.getByText(/validation error/i)).toBeInTheDocument();
    });
  });
});
