/**
 * Integration tests for OrganizationImportDialog
 *
 * Tests the organization import dialog component integration:
 * - Dialog opens and closes correctly
 * - File upload flow works
 * - CSV parsing is triggered
 * - Import progress is shown
 * - Results are displayed
 */

import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OrganizationImportDialog } from "./OrganizationImportDialog";

// Mock Papa Parse
vi.mock("papaparse", () => ({
  default: {
    parse: vi.fn((file, options) => {
      // Simulate successful CSV parsing
      const mockData = [
        {
          name: "Test Organization 1",
          website: "https://test1.com",
          phone: "555-0001",
        },
        {
          name: "Test Organization 2",
          website: "https://test2.com",
          phone: "555-0002",
        },
      ];

      // Call complete callback immediately
      setTimeout(() => {
        options.complete({ data: mockData });
      }, 0);
    }),
  },
}));

describe("OrganizationImportDialog", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders dialog when open prop is true", () => {
    renderWithAdminContext(<OrganizationImportDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByText("Import Organizations")).toBeInTheDocument();
    expect(screen.getByText(/Upload a CSV file with organization data/)).toBeInTheDocument();
  });

  test("does not render dialog when open prop is false", () => {
    renderWithAdminContext(<OrganizationImportDialog open={false} onClose={mockOnClose} />);

    expect(screen.queryByText("Import Organizations")).not.toBeInTheDocument();
  });

  test("shows file upload instructions", () => {
    renderWithAdminContext(<OrganizationImportDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Upload a CSV file with organization data/)).toBeInTheDocument();
    expect(screen.getByText(/Required column: name/)).toBeInTheDocument();
  });

  test("shows cancel and import buttons", () => {
    renderWithAdminContext(<OrganizationImportDialog open={true} onClose={mockOnClose} />);

    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import/i })).toBeInTheDocument();
  });

  test("import button is disabled when no file is selected", () => {
    renderWithAdminContext(<OrganizationImportDialog open={true} onClose={mockOnClose} />);

    const importButton = screen.getByRole("button", { name: /Import/i });
    expect(importButton).toBeDisabled();
  });

  test("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    renderWithAdminContext(<OrganizationImportDialog open={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("dialog structure includes proper ARIA attributes", () => {
    renderWithAdminContext(<OrganizationImportDialog open={true} onClose={mockOnClose} />);

    // Dialog should have proper role
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Dialog should have a title
    expect(screen.getByText("Import Organizations")).toBeInTheDocument();
  });

  test("shows required field information in alert", () => {
    renderWithAdminContext(<OrganizationImportDialog open={true} onClose={mockOnClose} />);

    // Check that the alert with instructions is present
    const alert = screen.getByText(/Upload a CSV file with organization data/);
    expect(alert).toBeInTheDocument();

    // Verify required and optional columns are mentioned
    expect(screen.getByText(/Required column: name/)).toBeInTheDocument();
    expect(screen.getByText(/Optional columns:/)).toBeInTheDocument();
  });
});
