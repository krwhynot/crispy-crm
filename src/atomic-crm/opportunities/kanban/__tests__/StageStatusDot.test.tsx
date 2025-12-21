import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StageStatusDot } from "../StageStatusDot";

describe("StageStatusDot", () => {
  it("renders with accessible role", () => {
    render(<StageStatusDot status="healthy" daysSinceLastActivity={3} daysInStage={3} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("displays days in stage text", () => {
    render(<StageStatusDot status="healthy" daysInStage={5} />);
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("renders red dot for rotting status", () => {
    render(<StageStatusDot status="rotting" daysInStage={15} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-destructive");
  });

  it("renders red dot for expired status", () => {
    render(<StageStatusDot status="expired" daysInStage={5} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-destructive");
  });

  it("renders yellow dot for warning status", () => {
    render(<StageStatusDot status="warning" daysInStage={6} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-warning");
  });

  it("renders green dot for healthy status", () => {
    render(<StageStatusDot status="healthy" daysInStage={2} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-success");
  });

  it("renders gray dot for closed status", () => {
    render(<StageStatusDot status="closed" daysInStage={100} />);
    const dot = screen.getByTestId("status-dot");
    expect(dot).toHaveClass("bg-muted-foreground");
  });

  it("has appropriate aria-label for screen readers", () => {
    render(<StageStatusDot status="rotting" daysInStage={12} />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", expect.stringContaining("12 days"));
  });

  it("shows singular 'day' for 1 day", () => {
    render(<StageStatusDot status="healthy" daysInStage={1} />);
    expect(screen.getByText("1 day")).toBeInTheDocument();
  });
});
