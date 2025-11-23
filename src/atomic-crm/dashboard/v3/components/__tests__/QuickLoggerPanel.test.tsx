import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuickLoggerPanel } from "../QuickLoggerPanel";

// Mock QuickLogForm to avoid React Admin dependency in tests
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

  it("should show form when New Activity is clicked", () => {
    render(<QuickLoggerPanel />);

    const button = screen.getByRole("button", { name: /new activity/i });
    fireEvent.click(button);

    expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
  });
});
