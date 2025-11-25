import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuickLoggerPanel } from "../QuickLoggerPanel";

// Mock QuickLogForm to avoid React Admin dependency in tests
// Uses default export pattern to work with lazy() dynamic import
vi.mock("../QuickLogForm", () => ({
  QuickLogForm: ({ onComplete }: any) => (
    <div data-testid="quick-log-form">
      <label htmlFor="activity-type">Activity Type</label>
      <select id="activity-type">
        <option>Call</option>
      </select>
      <button onClick={onComplete}>Cancel</button>
    </div>
  ),
}));

describe("QuickLoggerPanel", () => {
  it("should render panel headers", () => {
    render(<QuickLoggerPanel />);

    expect(screen.getByText("Log Activity")).toBeInTheDocument();
    expect(screen.getByText("Quick capture for calls, meetings, and notes")).toBeInTheDocument();
  });

  it("should show New Activity button when not logging", () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole("button", { name: /new activity/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-11"); // 44px touch target
  });

  it("should show skeleton while lazy loading, then form", async () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole("button", { name: /new activity/i });
    fireEvent.click(button);

    // Initially shows skeleton while lazy component loads
    expect(screen.getByTestId("quick-log-form-skeleton")).toBeInTheDocument();

    // Wait for lazy component to resolve
    await waitFor(() => {
      expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
    });
  });

  it("should show form when New Activity is clicked", async () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole("button", { name: /new activity/i });
    fireEvent.click(button);

    // Wait for lazy component to resolve (Suspense boundary)
    await waitFor(() => {
      expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
    });
  });
});
