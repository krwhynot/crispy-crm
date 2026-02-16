import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect, vi } from "vitest";
import { PrincipalDashboardV4 } from "../PrincipalDashboardV4";

// ---------- Mock child components ----------

vi.mock("../KPISummaryRow", () => ({
  KPISummaryRow: () => (
    <div data-testid="kpi-summary-row" data-tutorial="dashboard-kpi-row">
      KPISummaryRow
    </div>
  ),
}));

vi.mock("../PrincipalPipelineTable", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="pipeline-table" data-tutorial="dashboard-pipeline-table">
      PipelineTable
    </div>
  ),
}));

vi.mock("../DashboardTasksList", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="tasks-list" data-tutorial="dashboard-tasks-list">
      TasksList
    </div>
  ),
}));

vi.mock("../CompactActivityWidget", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="compact-activity" data-tutorial="dashboard-compact-activity">
      Activity
    </div>
  ),
}));

vi.mock("../CompactPerformanceWidget", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="compact-performance" data-tutorial="dashboard-compact-performance">
      Performance
    </div>
  ),
}));

vi.mock("../RecentItemsWidget", () => ({
  RecentItemsWidget: ({ compact }: { compact?: boolean }) => (
    <div
      data-testid="recent-items-widget"
      data-tutorial="dashboard-recent-items-widget"
      data-compact={compact}
    >
      RecentItems
    </div>
  ),
}));

// Capture tutorial props to verify V4 steps are passed
let capturedTutorialProps: Record<string, unknown> = {};
vi.mock("../DashboardTutorial", () => ({
  DashboardTutorial: (props: Record<string, unknown>) => {
    capturedTutorialProps = props;
    return <div data-testid="dashboard-tutorial">Tutorial</div>;
  },
}));

// Mock the V4 tutorial steps import
vi.mock("../dashboardTutorialStepsV4", () => ({
  DASHBOARD_TUTORIAL_STEPS_V4: [
    { popover: { title: "Welcome" } },
    { element: '[data-tutorial="dashboard-kpi-row"]', popover: { title: "KPIs" } },
    { element: '[data-tutorial="dashboard-pipeline-table"]', popover: { title: "Pipeline" } },
    { element: '[data-tutorial="dashboard-tasks-list"]', popover: { title: "Tasks" } },
    {
      element: '[data-tutorial="dashboard-compact-performance"]',
      popover: { title: "Performance" },
    },
    {
      element: '[data-tutorial="dashboard-compact-activity"]',
      popover: { title: "Activity" },
    },
    {
      element: '[data-tutorial="dashboard-recent-items-widget"]',
      popover: { title: "Recently Viewed" },
    },
    { popover: { title: "Done" } },
  ],
}));

// ---------- Helper ----------

function renderDashboard() {
  capturedTutorialProps = {};
  return renderWithAdminContext(<PrincipalDashboardV4 />);
}

// ---------- Tests ----------

describe("PrincipalDashboardV4", () => {
  // 1. Renders all 6 key sections
  it("renders KPISummaryRow", () => {
    renderDashboard();
    expect(screen.getByTestId("kpi-summary-row")).toBeInTheDocument();
  });

  it("renders PrincipalPipelineTable", () => {
    renderDashboard();
    expect(screen.getByTestId("pipeline-table")).toBeInTheDocument();
  });

  it("renders DashboardTasksList", () => {
    renderDashboard();
    expect(screen.getByTestId("tasks-list")).toBeInTheDocument();
  });

  it("renders CompactActivityWidget", () => {
    renderDashboard();
    expect(screen.getByTestId("compact-activity")).toBeInTheDocument();
  });

  it("renders CompactPerformanceWidget", () => {
    renderDashboard();
    expect(screen.getByTestId("compact-performance")).toBeInTheDocument();
  });

  it("renders RecentItemsWidget with compact prop", () => {
    renderDashboard();
    const recentItems = screen.getByTestId("recent-items-widget");
    expect(recentItems).toBeInTheDocument();
    expect(recentItems).toHaveAttribute("data-compact", "true");
  });

  // 2. Renders tutorial
  it("renders DashboardTutorial", () => {
    renderDashboard();
    expect(screen.getByTestId("dashboard-tutorial")).toBeInTheDocument();
  });

  // 3. Passes V4 tutorial steps
  it("passes V4 steps to DashboardTutorial", () => {
    renderDashboard();
    expect(capturedTutorialProps.steps).toBeDefined();
    expect(Array.isArray(capturedTutorialProps.steps)).toBe(true);
  });

  // 4. Layout structure — primary + secondary 12-column grid rows
  it("uses primary and secondary 12-column grid rows", () => {
    const { container } = renderDashboard();
    const grids = container.querySelectorAll(".lg\\:grid-cols-12");
    expect(grids.length).toBe(2);
  });

  // 5. Obsolete V3 artifacts absent
  it("does not render obsolete tab or widget-row artifacts", () => {
    const { container } = renderDashboard();
    expect(container.querySelector('[data-tutorial="dashboard-tabs"]')).toBeNull();
    expect(container.querySelector('[data-tutorial="dashboard-widget-row"]')).toBeNull();
  });

  // 6. TaskCompleteSheet dead code removed
  it("does not render TaskCompleteSheet", () => {
    renderDashboard();
    expect(screen.queryByTestId("task-complete-sheet")).not.toBeInTheDocument();
  });

  // 7. Tutorial selector integrity
  it("has matching DOM elements for all V4 tutorial steps with element selectors", () => {
    renderDashboard();
    const steps = capturedTutorialProps.steps as Array<{ element?: string }>;
    const stepsWithElements = steps.filter((step) => step.element);
    expect(stepsWithElements.length).toBeGreaterThan(0);
    for (const step of stepsWithElements) {
      const el = document.querySelector(step.element!);
      expect(el, `Missing element for selector: ${step.element}`).not.toBeNull();
    }
  });
});
