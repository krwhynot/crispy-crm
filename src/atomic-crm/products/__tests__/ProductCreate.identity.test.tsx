/**
 * ProductCreate Identity-Dependent Defaults Regression Tests
 *
 * Verifies that form values persist when identity loads asynchronously.
 *
 * Root cause: ra-core Form resets when defaultValues object reference changes.
 * When identity loads after form mount, defaultValues rebuilds with created_by,
 * causing form state to reset and losing user input.
 *
 * Fix: Guard with isLoading || !identity?.id before rendering form,
 * then memoize defaultValues with stable identity.id.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useGetIdentity } from "ra-core";
import ProductCreate from "../ProductCreate";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

// Mock ra-core hooks to control identity loading state
vi.mock("ra-core", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- typeof import() required in vi.mock factory (runs before static imports)
  const actual = (await importOriginal()) as typeof import("ra-core");
  return {
    ...actual,
    useGetIdentity: vi.fn(),
  };
});

describe("ProductCreate - identity-dependent defaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton while identity is loading", async () => {
    // Identity is loading
    (useGetIdentity as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    });

    renderWithAdminContext(<ProductCreate />, {
      resource: "products",
      initialEntries: ["/products/create"],
    });

    // Form should NOT be visible while identity loads
    expect(screen.queryByLabelText(/Product Name/i)).not.toBeInTheDocument();

    // Loading skeleton should be visible (animate-pulse class)
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders form after identity loads", async () => {
    // Identity is loaded
    (useGetIdentity as Mock).mockReturnValue({
      data: { id: 100, fullName: "Test User" },
      isLoading: false,
      refetch: vi.fn(),
    });

    renderWithAdminContext(<ProductCreate />, {
      resource: "products",
      initialEntries: ["/products/create"],
    });

    // Form should be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/Product Name/i)).toBeInTheDocument();
    });
  });

  it("preserves form values when component re-renders with stable identity", async () => {
    const user = userEvent.setup();

    // Identity is loaded
    (useGetIdentity as Mock).mockReturnValue({
      data: { id: 100, fullName: "Test User" },
      isLoading: false,
      refetch: vi.fn(),
    });

    const { rerender } = renderWithAdminContext(<ProductCreate />, {
      resource: "products",
      initialEntries: ["/products/create"],
    });

    // Wait for form to appear
    const nameInput = await screen.findByLabelText(/Product Name/i);

    // User types in name field
    await user.type(nameInput, "Test Product");

    // Move focus to trigger onBlur
    await user.tab();

    // Simulate re-render (identity stays stable)
    await act(async () => {
      rerender(<ProductCreate />);
    });

    // ASSERT: Name must persist after re-render
    expect(nameInput).toHaveValue("Test Product");
  });
});
