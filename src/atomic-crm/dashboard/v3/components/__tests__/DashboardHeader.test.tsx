import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DashboardHeader } from "../DashboardHeader";

describe("DashboardHeader", () => {
  it("should render the title", () => {
    render(<DashboardHeader title="Principal Dashboard" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Principal Dashboard");
  });

  it("should render optional subtitle", () => {
    render(
      <DashboardHeader
        title="Principal Dashboard"
        subtitle="Track your pipeline"
      />
    );
    expect(screen.getByText("Track your pipeline")).toBeInTheDocument();
  });

  it("should render children in actions slot", () => {
    render(
      <DashboardHeader title="Test">
        <button>Action</button>
      </DashboardHeader>
    );
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  it("should use semantic header element", () => {
    const { container } = render(<DashboardHeader title="Test" />);
    expect(container.querySelector("header")).toBeInTheDocument();
  });

  it("should apply consistent spacing with border-b", () => {
    const { container } = render(<DashboardHeader title="Test" />);
    const header = container.querySelector("header");
    expect(header).toHaveClass("border-b", "border-border");
  });
});
