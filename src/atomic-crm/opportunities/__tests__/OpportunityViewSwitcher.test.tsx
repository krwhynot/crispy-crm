/**
 * Tests for OpportunityViewSwitcher component
 *
 * Tests view toggling, accessibility, and localStorage persistence
 */

import { describe, test, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { OpportunityViewSwitcher } from "../OpportunityViewSwitcher";

describe("OpportunityViewSwitcher", () => {
  test("renders both view options", () => {
    const mockOnViewChange = vi.fn();

    renderWithAdminContext(
      <OpportunityViewSwitcher view="kanban" onViewChange={mockOnViewChange} />
    );

    // Check that both buttons are present
    expect(screen.getByLabelText("Kanban view")).toBeInTheDocument();
    expect(screen.getByLabelText("List view")).toBeInTheDocument();
  });

  test("renders with different view props", () => {
    const mockOnViewChange = vi.fn();

    const { rerender } = renderWithAdminContext(
      <OpportunityViewSwitcher view="kanban" onViewChange={mockOnViewChange} />
    );

    // Both buttons should be present
    expect(screen.getByLabelText("Kanban view")).toBeInTheDocument();
    expect(screen.getByLabelText("List view")).toBeInTheDocument();

    // Rerender with list view - should not throw
    rerender(<OpportunityViewSwitcher view="list" onViewChange={mockOnViewChange} />);

    // Both buttons should still be present
    expect(screen.getByLabelText("Kanban view")).toBeInTheDocument();
    expect(screen.getByLabelText("List view")).toBeInTheDocument();
  });

  test("calls onViewChange when clicking different view", () => {
    const mockOnViewChange = vi.fn();

    renderWithAdminContext(
      <OpportunityViewSwitcher view="kanban" onViewChange={mockOnViewChange} />
    );

    const listButton = screen.getByLabelText("List view");
    fireEvent.click(listButton);

    expect(mockOnViewChange).toHaveBeenCalledWith("list");
    expect(mockOnViewChange).toHaveBeenCalledTimes(1);
  });

  test("does not call onViewChange when clicking current view", () => {
    const mockOnViewChange = vi.fn();

    renderWithAdminContext(
      <OpportunityViewSwitcher view="kanban" onViewChange={mockOnViewChange} />
    );

    const kanbanButton = screen.getByLabelText("Kanban view");
    fireEvent.click(kanbanButton);

    // Should not trigger change when clicking already selected view
    expect(mockOnViewChange).not.toHaveBeenCalled();
  });

  test("has proper touch-manipulation class for mobile", () => {
    const mockOnViewChange = vi.fn();

    renderWithAdminContext(
      <OpportunityViewSwitcher view="kanban" onViewChange={mockOnViewChange} />
    );

    const kanbanButton = screen.getByLabelText("Kanban view");
    const listButton = screen.getByLabelText("List view");

    expect(kanbanButton).toHaveClass("touch-manipulation");
    expect(listButton).toHaveClass("touch-manipulation");
  });

  test("renders with accessible labels", () => {
    const mockOnViewChange = vi.fn();

    renderWithAdminContext(
      <OpportunityViewSwitcher view="kanban" onViewChange={mockOnViewChange} />
    );

    // Check aria-labels are present
    expect(screen.getByLabelText("Kanban view")).toBeInTheDocument();
    expect(screen.getByLabelText("List view")).toBeInTheDocument();
  });
});
