/**
 * TaskCreate Identity-Dependent Defaults Regression Tests
 *
 * Verifies that form values persist when identity loads asynchronously.
 *
 * Root cause: ra-core Form resets when defaultValues object reference changes.
 * When identity loads after form mount, defaultValues rebuilds with sales_id,
 * causing form state to reset and losing user input.
 *
 * Fix: Guard with isLoading || !identity?.id before rendering form,
 * then memoize defaultValues with stable identity.id.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGetIdentity, useGetList } from "ra-core";
import TaskCreate from "../TaskCreate";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

// Mock ra-core hooks to control identity loading state
vi.mock("ra-core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ra-core")>();
  return {
    ...actual,
    useGetIdentity: vi.fn(),
    useGetList: vi.fn(),
  };
});

describe("TaskCreate - identity-dependent defaults", () => {
  const mockSalesList = [
    { id: 100, name: "John Sales", email: "john@sales.com" },
    { id: 101, name: "Jane Rep", email: "jane@sales.com" },
  ];

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock useGetList for reference inputs
    (useGetList as Mock).mockImplementation((resource) => {
      if (resource === "sales") {
        return { data: mockSalesList, isLoading: false, total: mockSalesList.length };
      }
      return { data: [], isLoading: false, total: 0 };
    });
  });

  it("shows loading skeleton while identity is loading", async () => {
    // Identity is loading
    (useGetIdentity as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    });

    renderWithAdminContext(<TaskCreate />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    // Form should NOT be visible while identity loads
    expect(screen.queryByLabelText(/Task Title/i)).not.toBeInTheDocument();

    // Loading skeleton should be visible (animate-pulse class)
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders form after identity loads", async () => {
    // Identity is loaded
    (useGetIdentity as Mock).mockReturnValue({
      data: { id: 100, fullName: "John Sales" },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithAdminContext(<TaskCreate />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    // Form should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
    });
  });

  it("preserves form values when component re-renders with stable identity", async () => {
    const user = userEvent.setup();

    // Identity is loaded
    (useGetIdentity as Mock).mockReturnValue({
      data: { id: 100, fullName: "John Sales" },
      isLoading: false,
      refetch: vi.fn(),
    });

    const { rerender } = renderWithAdminContext(<TaskCreate />, {
      resource: "tasks",
      initialEntries: ["/tasks/create"],
    });

    // Wait for form to appear
    const titleInput = await screen.findByLabelText(/Task Title/i);

    // User types in title field
    await user.type(titleInput, "My important task");

    // Move focus to trigger onBlur
    await user.tab();

    // Simulate re-render (identity stays stable)
    await act(async () => {
      rerender(<TaskCreate />);
    });

    // ASSERT: Title must persist after re-render
    expect(titleInput).toHaveValue("My important task");
  });

  it("does not reset form when identity is already stable on mount", async () => {
    const user = userEvent.setup();

    // Identity loaded from the start
    (useGetIdentity as Mock).mockReturnValue({
      data: { id: 100, fullName: "John Sales" },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithAdminContext(<TaskCreate />, {
      resource: "tasks",
      initialEntries: ["/tasks/create?organization_id=90078"],
    });

    // Wait for form to appear
    const titleInput = await screen.findByLabelText(/Task Title/i);

    // Type and blur multiple times (simulating normal editing)
    await user.type(titleInput, "Test");
    await user.tab();
    await user.click(titleInput);
    await user.type(titleInput, " task title");
    await user.tab();

    // Value should be complete
    expect(titleInput).toHaveValue("Test task title");
  });
});
