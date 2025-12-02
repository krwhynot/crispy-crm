import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResponsiveTasksPanel } from "../ResponsiveTasksPanel";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock the breakpoint hook
const mockUseBreakpoint = vi.fn();
vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: () => mockUseBreakpoint(),
}));

// Mock child components
vi.mock("../TasksKanbanPanel", () => ({
  TasksKanbanPanel: () => <div data-testid="inline-tasks">Inline Tasks</div>,
}));
vi.mock("../TasksIconRail", () => ({
  TasksIconRail: ({ onExpand }: { onExpand: () => void }) => (
    <button data-testid="icon-rail" onClick={onExpand}>Rail</button>
  ),
}));
vi.mock("../TasksDrawer", () => ({
  TasksDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="tasks-drawer">Drawer</div> : null,
}));

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("ResponsiveTasksPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders inline TasksKanbanPanel on desktop", () => {
    mockUseBreakpoint.mockReturnValue("desktop");
    renderWithTooltip(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.getByTestId("inline-tasks")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-rail")).not.toBeInTheDocument();
  });

  it("renders icon rail on laptop", () => {
    mockUseBreakpoint.mockReturnValue("laptop");
    renderWithTooltip(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.getByTestId("icon-rail")).toBeInTheDocument();
    expect(screen.queryByTestId("inline-tasks")).not.toBeInTheDocument();
  });

  it("renders nothing on mobile (handled by MobileQuickActionBar)", () => {
    mockUseBreakpoint.mockReturnValue("mobile");
    renderWithTooltip(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.queryByTestId("inline-tasks")).not.toBeInTheDocument();
    expect(screen.queryByTestId("icon-rail")).not.toBeInTheDocument();
  });

  it("renders nothing on tablet-portrait (handled by header icon)", () => {
    mockUseBreakpoint.mockReturnValue("tablet-portrait");
    renderWithTooltip(<ResponsiveTasksPanel taskCount={5} />);

    expect(screen.queryByTestId("inline-tasks")).not.toBeInTheDocument();
  });

  it("uses external drawer state when provided", () => {
    mockUseBreakpoint.mockReturnValue("tablet-landscape");
    renderWithTooltip(
      <ResponsiveTasksPanel
        taskCount={5}
        externalDrawerOpen={true}
        onExternalDrawerChange={vi.fn()}
      />
    );

    expect(screen.getByTestId("tasks-drawer")).toBeInTheDocument();
  });
});
