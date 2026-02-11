import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { StageStatusDot } from "../StageStatusDot";

describe("StageStatusDot", () => {
  it("renders with accessible role", () => {
    renderWithAdminContext(<StageStatusDot status="healthy" daysSinceLastActivity={3} daysInStage={3} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays days in stage text", () => {
    renderWithAdminContext(<StageStatusDot status="healthy" daysSinceLastActivity={5} daysInStage={5} />);
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("renders red dot for rotting status", () => {
    renderWithAdminContext(<StageStatusDot status="rotting" daysSinceLastActivity={15} daysInStage={15} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-destructive");
  });

  it("renders red dot for expired status", () => {
    renderWithAdminContext(<StageStatusDot status="expired" daysSinceLastActivity={5} daysInStage={5} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-destructive");
  });

  it("renders yellow dot for warning status", () => {
    renderWithAdminContext(<StageStatusDot status="warning" daysSinceLastActivity={6} daysInStage={6} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-warning");
  });

  it("renders green dot for healthy status", () => {
    renderWithAdminContext(<StageStatusDot status="healthy" daysSinceLastActivity={2} daysInStage={2} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-success");
  });

  it("renders gray dot for closed status", () => {
    renderWithAdminContext(<StageStatusDot status="closed" daysSinceLastActivity={100} daysInStage={100} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-muted-foreground");
  });

  it("has appropriate aria-label for screen readers", () => {
    renderWithAdminContext(<StageStatusDot status="rotting" daysSinceLastActivity={12} daysInStage={12} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", expect.stringContaining("12 days"));
  });

  it("shows singular 'day' for 1 day", () => {
    renderWithAdminContext(<StageStatusDot status="healthy" daysSinceLastActivity={1} daysInStage={1} />);
    expect(screen.getByText("1 day")).toBeInTheDocument();
  });
});
