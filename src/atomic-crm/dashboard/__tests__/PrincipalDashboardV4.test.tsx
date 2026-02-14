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
  // 1. Renders all 5 key sections
  it("renders KPISummaryRow", () => {
    renderDashboard();
    expect(screen.getByTestId("kpi-summary-row")).toBeInTheDocument();
  });

  it("renders PrincipalPipelineTable inside a Card", () => {
    renderDashboard();
    const pipeline = screen.getByTestId("pipeline-table");
    expect(pipeline).toBeInTheDocument();
    // The pipeline stub should be wrapped in a Card (rendered as a div with Card classes)
    const cardParent = pipeline.closest(".lg\\:col-span-6");
    expect(cardParent).not.toBeNull();
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

  // 4. Layout structure
  it("uses a 12-column grid layout", () => {
    const { container } = renderDashboard();
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.classList.contains("lg:grid-cols-12")).toBe(true);
  });

  // 5. Obsolete V3/V4 artifacts absent
  it("does not render obsolete tab or widget-row artifacts", () => {
    const { container } = renderDashboard();
    expect(container.querySelector('[data-tutorial="dashboard-tabs"]')).toBeNull();
    expect(container.querySelector('[data-tutorial="dashboard-widget-row"]')).toBeNull();
  });

  // 6. RecentItemsWidget intentionally dropped
  it("does not render RecentItemsWidget", () => {
    renderDashboard();
    expect(screen.queryByTestId("recent-items-widget")).not.toBeInTheDocument();
  });

  // 7. TaskCompleteSheet dead code removed
  it("does not render TaskCompleteSheet", () => {
    renderDashboard();
    expect(screen.queryByTestId("task-complete-sheet")).not.toBeInTheDocument();
  });

  // 8. Tutorial selector integrity
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
