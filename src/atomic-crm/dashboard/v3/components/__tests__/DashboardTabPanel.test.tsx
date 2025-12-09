import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardTabPanel } from "../DashboardTabPanel";

// Mock the hooks
vi.mock("../../hooks/useTaskCount", () => ({
  useTaskCount: () => ({ pendingCount: 3, isLoading: false }),
}));

// Mock lazy-loaded components
vi.mock("../TasksKanbanPanel", () => ({
  default: () => <div data-testid="tasks-panel">Tasks Content</div>,
}));

vi.mock("../MyPerformanceWidget", () => ({
  default: () => <div data-testid="performance-widget">Performance Content</div>,
}));

vi.mock("../ActivityFeedPanel", () => ({
  default: () => <div data-testid="activity-feed">Activity Content</div>,
}));

describe("DashboardTabPanel", () => {
  it("renders all three tabs", () => {
    render(<DashboardTabPanel />);

    expect(screen.getByRole("tab", { name: /my tasks/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /performance/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /team activity/i })).toBeInTheDocument();
  });

  it("shows task count badge", () => {
    render(<DashboardTabPanel />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("defaults to tasks tab and loads content", async () => {
    render(<DashboardTabPanel />);

    const tasksTab = screen.getByRole("tab", { name: /my tasks/i });
    expect(tasksTab).toHaveAttribute("data-state", "active");

    // Wait for lazy-loaded content (Suspense boundary)
    await waitFor(() => {
      expect(screen.getByTestId("tasks-panel")).toBeInTheDocument();
    });
  });

  it("switches to performance tab on click", async () => {
    const user = userEvent.setup();
    render(<DashboardTabPanel />);

    // Wait for initial content
    await screen.findByTestId("tasks-panel");

    await user.click(screen.getByRole("tab", { name: /performance/i }));

    const performanceTab = screen.getByRole("tab", { name: /performance/i });
    expect(performanceTab).toHaveAttribute("data-state", "active");

    // Wait for lazy-loaded performance content
    await waitFor(() => {
      expect(screen.getByTestId("performance-widget")).toBeInTheDocument();
    });

    // With forceMount, tasks content should still be in DOM (hidden)
    expect(screen.getByTestId("tasks-panel")).toBeInTheDocument();
  });

  it("has accessible touch targets (44px)", () => {
    render(<DashboardTabPanel />);

    const tabs = screen.getAllByRole("tab");
    tabs.forEach((tab) => {
      // h-11 = 44px
      expect(tab).toHaveClass("h-11");
    });
  });

  it("supports keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<DashboardTabPanel />);

    // Focus first tab
    const tasksTab = screen.getByRole("tab", { name: /my tasks/i });
    tasksTab.focus();

    // Arrow right to next tab
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /performance/i })).toHaveFocus();

    // Enter to activate
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: /performance/i })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});
