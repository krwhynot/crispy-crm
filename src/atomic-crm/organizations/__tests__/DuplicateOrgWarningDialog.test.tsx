/**
 * Tests for DuplicateOrgWarningDialog component
 *
 * Verifies the soft duplicate warning dialog behavior:
 * - Renders when open with duplicate name
 * - Does not render when closed
 * - Calls onViewExisting when "View Existing" clicked
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
    duplicateOrgId: 123,
    onCancel: vi.fn(),
    onProceed: vi.fn(),
    onViewExisting: vi.fn(),
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

  it("shows the explanation text about options", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} />);

    expect(
      screen.getByText(/Would you like to view the existing organization, change the name, or proceed anyway/i)
    ).toBeInTheDocument();
  });

  it("renders 'View Existing' button when onViewExisting and duplicateOrgId are provided", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: /View Existing/i })).toBeInTheDocument();
  });

  it("calls onViewExisting when 'View Existing' button is clicked", async () => {
    const user = userEvent.setup();
    const onViewExisting = vi.fn();

    render(<DuplicateOrgWarningDialog {...defaultProps} onViewExisting={onViewExisting} />);

    await user.click(screen.getByRole("button", { name: /View Existing/i }));

    expect(onViewExisting).toHaveBeenCalledTimes(1);
  });

  it("does not render 'View Existing' button when onViewExisting is not provided", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} onViewExisting={undefined} />);

    expect(screen.queryByRole("button", { name: /View Existing/i })).not.toBeInTheDocument();
  });

  it("does not render 'View Existing' button when duplicateOrgId is not provided", () => {
    render(<DuplicateOrgWarningDialog {...defaultProps} duplicateOrgId={undefined} />);

    expect(screen.queryByRole("button", { name: /View Existing/i })).not.toBeInTheDocument();
  });
});
