import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickAddDialog } from "../QuickAddDialog";

// Mock QuickAddForm since it's created in Task 5
vi.mock("../QuickAddForm", () => ({
  QuickAddForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="quick-add-form">
      <button onClick={onSuccess}>Submit Form</button>
    </div>
  ),
}));

describe("QuickAddDialog", () => {
  it("renders dialog when open is true", () => {
    const onOpenChange = vi.fn();
    render(<QuickAddDialog open={true} onOpenChange={onOpenChange} />);

    // Dialog should be visible
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog when open is false", () => {
    const onOpenChange = vi.fn();
    render(<QuickAddDialog open={false} onOpenChange={onOpenChange} />);

    // Dialog should not be visible
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders correct title and description", () => {
    const onOpenChange = vi.fn();
    render(<QuickAddDialog open={true} onOpenChange={onOpenChange} />);

    // Check title and description (updated for opportunity-focused flow)
    expect(screen.getByText("Quick Add Opportunity")).toBeInTheDocument();
    expect(
      screen.getByText("Create a new opportunity with optional contact details")
    ).toBeInTheDocument();
  });

  it("passes onOpenChange to close the dialog", () => {
    const onOpenChange = vi.fn();
    render(<QuickAddDialog open={true} onOpenChange={onOpenChange} />);

    // Find and click the form submit button
    const submitButton = screen.getByText("Submit Form");
    submitButton.click();

    // Should call onOpenChange with false to close dialog
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("includes QuickAddForm component", () => {
    const onOpenChange = vi.fn();
    render(<QuickAddDialog open={true} onOpenChange={onOpenChange} />);

    // Check that the form is rendered
    expect(screen.getByTestId("quick-add-form")).toBeInTheDocument();
  });

  it("has responsive dialog content classes", () => {
    const onOpenChange = vi.fn();
    render(<QuickAddDialog open={true} onOpenChange={onOpenChange} />);

    // Find the dialog content by its data-slot attribute
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).toHaveClass("max-w-2xl");
    expect(dialogContent).toHaveClass("max-h-[90vh]");
    expect(dialogContent).toHaveClass("overflow-y-auto");
  });

  it("has proper accessibility attributes", () => {
    const onOpenChange = vi.fn();
    render(<QuickAddDialog open={true} onOpenChange={onOpenChange} />);

    // Check aria-describedby attribute
    const dialogContent = document.querySelector('[data-slot="dialog-content"]');
    expect(dialogContent).toHaveAttribute("aria-describedby", "quick-add-description");

    // Check that description has correct id (updated for opportunity-focused flow)
    const description = screen.getByText("Create a new opportunity with optional contact details");
    expect(description).toHaveAttribute("id", "quick-add-description");
  });
});
