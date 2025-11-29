/**
 * Tests for DuplicateOrgWarningDialog component
 *
 * Verifies the soft duplicate warning dialog behavior:
 * - Renders when open with duplicate name
 * - Does not render when closed
 * - Calls onCancel when "Change Name" clicked
 * - Calls onProceed when "Create Anyway" clicked
 * - Shows loading state when isLoading is true
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { DuplicateOrgWarningDialog } from "../DuplicateOrgWarningDialog";

describe("DuplicateOrgWarningDialog", () => {
  const defaultProps = {
    open: true,
    duplicateName: "Acme Corp",
    onCancel: vi.fn(),
    onProceed: vi.fn(),
    isLoading: false,
  };

  it("renders when open is true", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} />);

    expect(screen.getByText(/Potential Duplicate Organization/i)).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} open={false} />);

    expect(screen.queryByText(/Potential Duplicate Organization/i)).not.toBeInTheDocument();
  });

  it("displays the duplicate organization name", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} duplicateName="Test Company" />);

    expect(screen.getByText(/Test Company/)).toBeInTheDocument();
    expect(screen.getByText(/already exists in the system/i)).toBeInTheDocument();
  });

  it("calls onCancel when 'Change Name' button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<DuplicateOrgWarningDialog {...defaultProps} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /Change Name/i }));

    // Called at least once (may be called twice due to both onClick and onOpenChange)
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onProceed when 'Create Anyway' button is clicked", async () => {
    const user = userEvent.setup();
    const onProceed = vi.fn();

    render(<DuplicateOrgWarningDialog {...defaultProps} onProceed={onProceed} />);

    await user.click(screen.getByRole("button", { name: /Create Anyway/i }));

    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("shows 'Creating...' when isLoading is true", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} isLoading={true} />);

    expect(screen.getByRole("button", { name: /Creating.../i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Creating.../i })).toBeDisabled();
  });

  it("disables 'Create Anyway' button when loading", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} isLoading={true} />);

    const proceedButton = screen.getByRole("button", { name: /Creating.../i });
    expect(proceedButton).toBeDisabled();
  });

  it("shows the explanation text about proceeding or changing name", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} />);

    expect(
      screen.getByText(/Would you like to proceed anyway, or go back to change the name/i)
    ).toBeInTheDocument();
  });
});
