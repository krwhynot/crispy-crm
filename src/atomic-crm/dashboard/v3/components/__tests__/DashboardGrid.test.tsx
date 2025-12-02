import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardGrid } from "../DashboardGrid";

const mockUseBreakpoint = vi.fn();
vi.mock("@/hooks/useBreakpoint", () => ({
  useBreakpoint: () => mockUseBreakpoint(),
}));

describe("DashboardGrid", () => {
  it("renders children in a grid container", () => {
    mockUseBreakpoint.mockReturnValue("desktop");
    render(
      <DashboardGrid>
        <div data-testid="child">Content</div>
      </DashboardGrid>
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies 2-column grid for desktop", () => {
    mockUseBreakpoint.mockReturnValue("desktop");
    const { container } = render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid");
    // Desktop uses custom grid-cols with CSS variable
    expect(grid).toHaveClass("grid-cols-[1fr_var(--dashboard-tasks-width)]");
  });

  it("applies 2-column grid with icon rail for laptop", () => {
    mockUseBreakpoint.mockReturnValue("laptop");
    const { container } = render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("grid-cols-[1fr_var(--dashboard-icon-rail-width)]");
  });

  it("applies single column for tablet-landscape", () => {
    mockUseBreakpoint.mockReturnValue("tablet-landscape");
    const { container } = render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid-cols-1");
  });

  it("applies single column for mobile", () => {
    mockUseBreakpoint.mockReturnValue("mobile");
    const { container } = render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid-cols-1");
  });

  it("accepts custom className", () => {
    mockUseBreakpoint.mockReturnValue("desktop");
    const { container } = render(
      <DashboardGrid className="custom-class">
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("custom-class");
  });
});
