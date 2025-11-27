import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PrincipalDashboardV3 } from "../PrincipalDashboardV3";

// Mock LogActivityFAB to avoid React Admin dependency in tests
vi.mock("../components/LogActivityFAB", () => ({
  LogActivityFAB: () => (
    <button aria-label="Log Activity">
      Log Activity FAB
    </button>
  ),
}));

// Mock the hooks
vi.mock("../hooks/usePrincipalPipeline", () => ({
  usePrincipalPipeline: () => ({
    data: [],
    loading: false,
    error: null,
  }),
}));

vi.mock("../hooks/useMyTasks", () => ({
  useMyTasks: () => ({
    tasks: [],
    loading: false,
    error: null,
    completeTask: vi.fn(),
    snoozeTask: vi.fn(),
  }),
}));

// Mock the usePrincipalOpportunities hook (used by PipelineDrillDownSheet)
vi.mock("../hooks/usePrincipalOpportunities", () => ({
  usePrincipalOpportunities: () => ({
    opportunities: [],
    loading: false,
    error: null,
  }),
}));

describe("PrincipalDashboardV3", () => {
  it("should render both panels (Pipeline and Tasks)", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByText("Pipeline by Principal")).toBeInTheDocument();
    expect(screen.getByText("My Tasks")).toBeInTheDocument();
  });

  it("should render the Log Activity FAB", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /log activity/i })).toBeInTheDocument();
  });

  it("should use CSS Grid layout with two columns on desktop", () => {
    const { container } = render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    // The grid container should have the responsive grid classes
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer).toHaveClass("grid-cols-1");
    expect(gridContainer).toHaveClass("lg:grid-cols-[2fr_3fr]");
  });

  it("should render dashboard header", () => {
    render(
      <MemoryRouter>
        <PrincipalDashboardV3 />
      </MemoryRouter>
    );

    expect(screen.getByText("Principal Dashboard")).toBeInTheDocument();
  });
});
