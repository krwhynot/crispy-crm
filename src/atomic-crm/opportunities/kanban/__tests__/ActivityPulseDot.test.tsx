import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityPulseDot } from "../ActivityPulseDot";

describe("ActivityPulseDot", () => {
  it("renders green dot for recent activity (<7 days)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={3} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-success");
    expect(dot).toHaveAttribute("aria-label", "Last activity 3 days ago");
  });

  it("renders yellow dot for moderate activity (7-14 days)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={10} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-warning");
    expect(dot).toHaveAttribute("aria-label", "Last activity 10 days ago");
  });

  it("renders red dot for stale activity (>14 days)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={21} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-destructive");
    expect(dot).toHaveAttribute("aria-label", "Last activity 21 days ago");
  });

  it("renders gray dot for no activity (null)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={null} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-muted-foreground");
    expect(dot).toHaveAttribute("aria-label", "No activity recorded");
  });

  it("renders gray dot for undefined activity", () => {
    render(<ActivityPulseDot daysSinceLastActivity={undefined} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-muted-foreground");
    expect(dot).toHaveAttribute("aria-label", "No activity recorded");
  });

  it("handles new opportunity with null activity gracefully", () => {
    render(<ActivityPulseDot daysSinceLastActivity={null} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-muted-foreground");
  });

  it("treats exactly 7 days as yellow (boundary)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={7} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-warning");
  });

  it("treats exactly 14 days as yellow (boundary)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={14} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-warning");
  });

  it("treats 15 days as red (boundary)", () => {
    render(<ActivityPulseDot daysSinceLastActivity={15} />);

    const dot = screen.getByRole("status");
    expect(dot).toHaveClass("bg-destructive");
  });
});
