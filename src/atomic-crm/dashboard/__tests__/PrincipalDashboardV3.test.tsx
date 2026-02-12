import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrincipalDashboardV3 } from "../PrincipalDashboardV3";

// ---------- Stub child components ----------

vi.mock("../KPISummaryRow", () => ({
  KPISummaryRow: () => <div data-testid="kpi-summary-row">KPISummaryRow</div>,
}));

vi.mock("../DashboardTabPanel", () => ({
  DashboardTabPanel: () => <div data-testid="dashboard-tab-panel">DashboardTabPanel</div>,
}));

let capturedTaskSheetProps: Record<string, unknown> = {};
vi.mock("../TaskCompleteSheet", () => ({
  TaskCompleteSheet: (props: Record<string, unknown>) => {
    capturedTaskSheetProps = props;
    return <div data-testid="task-complete-sheet">TaskCompleteSheet</div>;
  },
}));

vi.mock("../DashboardTutorial", () => ({
  DashboardTutorial: () => <div data-testid="dashboard-tutorial">DashboardTutorial</div>,
}));

// ---------- Helpers ----------

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

function renderDashboard() {
  const queryClient = createTestQueryClient();
  capturedTaskSheetProps = {};
  return renderWithAdminContext(
    <QueryClientProvider client={queryClient}>
      <PrincipalDashboardV3 />
    </QueryClientProvider>
  );
}

// ---------- Tests ----------

describe("PrincipalDashboardV3", () => {
  it("renders a vertical flex-col layout with a main element", () => {
    const { container } = renderDashboard();

    const rootDiv = container.firstElementChild as HTMLElement;
    expect(rootDiv).not.toBeNull();
    expect(rootDiv.classList.contains("flex")).toBe(true);
    expect(rootDiv.classList.contains("flex-col")).toBe(true);

    const mainEl = rootDiv.querySelector("main");
    expect(mainEl).toBeInTheDocument();
    expect(mainEl?.classList.contains("flex-1")).toBe(true);
    expect(mainEl?.classList.contains("flex-col")).toBe(true);
  });

  it("renders the KPISummaryRow child component", () => {
    renderDashboard();
    expect(screen.getByTestId("kpi-summary-row")).toBeInTheDocument();
  });

  it("renders the DashboardTabPanel child component", () => {
    renderDashboard();
    expect(screen.getByTestId("dashboard-tab-panel")).toBeInTheDocument();
  });

  it("renders the TaskCompleteSheet child component", () => {
    renderDashboard();
    expect(screen.getByTestId("task-complete-sheet")).toBeInTheDocument();
  });

  it("renders the DashboardTutorial child component", () => {
    renderDashboard();
    expect(screen.getByTestId("dashboard-tutorial")).toBeInTheDocument();
  });

  it("passes open=false to TaskCompleteSheet initially", () => {
    renderDashboard();
    expect(capturedTaskSheetProps.open).toBe(false);
  });

  it("passes onOpenChange and onRefresh callbacks to TaskCompleteSheet", () => {
    renderDashboard();
    expect(typeof capturedTaskSheetProps.onOpenChange).toBe("function");
    expect(typeof capturedTaskSheetProps.onRefresh).toBe("function");
  });

  it("calls queryClient.invalidateQueries when onRefresh is invoked", () => {
    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    capturedTaskSheetProps = {};
    renderWithAdminContext(
      <QueryClientProvider client={queryClient}>
        <PrincipalDashboardV3 />
      </QueryClientProvider>
    );

    const onRefresh = capturedTaskSheetProps.onRefresh as () => void;
    expect(onRefresh).toBeDefined();
    onRefresh();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(["dashboard"]) })
    );

    invalidateSpy.mockRestore();
  });

  it("wraps KPISummaryRow in a shrink-0 container", () => {
    renderDashboard();

    const kpiStub = screen.getByTestId("kpi-summary-row");
    const wrapper = kpiStub.parentElement;
    expect(wrapper?.classList.contains("shrink-0")).toBe(true);
  });
});
