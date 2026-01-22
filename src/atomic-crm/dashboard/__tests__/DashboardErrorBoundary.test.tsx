import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DashboardErrorBoundary } from "../DashboardErrorBoundary";

const ThrowError = () => {
  throw new Error("Test error");
};

const WorkingComponent = () => <div>Working content</div>;

describe("DashboardErrorBoundary", () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("should render children when there is no error", () => {
    render(
      <DashboardErrorBoundary>
        <WorkingComponent />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText("Working content")).toBeInTheDocument();
  });

  it("should render error UI when child throws error", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("should show reload button in error state", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
  });

  it("should show go home button in error state", () => {
    render(
      <DashboardErrorBoundary>
        <ThrowError />
      </DashboardErrorBoundary>
    );

    expect(screen.getByRole("button", { name: /go home/i })).toBeInTheDocument();
  });
});
