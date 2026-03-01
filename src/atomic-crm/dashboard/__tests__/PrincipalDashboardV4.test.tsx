import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect, vi } from "vitest";
import { PrincipalDashboardV4 } from "../PrincipalDashboardV4";

// ---------- Mock child components ----------

vi.mock("../KPISummaryRow", () => ({
  KPISummaryRow: () => <div data-testid="kpi-summary-row">KPISummaryRow</div>,
}));

vi.mock("../PrincipalPipelineTable", () => ({
  __esModule: true,
  default: () => <div data-testid="pipeline-table">PipelineTable</div>,
}));

vi.mock("../DashboardTasksList", () => ({
  __esModule: true,
  default: () => <div data-testid="tasks-list">TasksList</div>,
}));

vi.mock("../CompactActivityWidget", () => ({
  __esModule: true,
  default: () => <div data-testid="compact-activity">Activity</div>,
}));

vi.mock("../CompactPerformanceWidget", () => ({
  __esModule: true,
  default: () => <div data-testid="compact-performance">Performance</div>,
}));

// ---------- Helper ----------

function renderDashboard() {
  return renderWithAdminContext(<PrincipalDashboardV4 />);
}

// ---------- Tests ----------

describe("PrincipalDashboardV4", () => {
  it("renders Dashboard page heading", () => {
    renderDashboard();
    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
  });

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

  // 2. Layout structure
  it("uses a 12-column grid layout", () => {
    const { container } = renderDashboard();
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.classList.contains("lg:grid-cols-12")).toBe(true);
  });

  // 3. RecentItemsWidget intentionally dropped
  it("does not render RecentItemsWidget", () => {
    renderDashboard();
    expect(screen.queryByTestId("recent-items-widget")).not.toBeInTheDocument();
  });

  // 4. TaskCompleteSheet dead code removed
  it("does not render TaskCompleteSheet", () => {
    renderDashboard();
    expect(screen.queryByTestId("task-complete-sheet")).not.toBeInTheDocument();
  });
});
