import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { ReportPageShell } from "./ReportPageShell";

describe("ReportPageShell", () => {
  it("renders breadcrumbs with Reports root link", () => {
    render(
      <MemoryRouter>
        <ReportPageShell
          title="Weekly Activity"
          breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Weekly Activity" }]}
        >
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getAllByText("Weekly Activity").length).toBeGreaterThan(0);
  });

  it("renders title with semantic heading", () => {
    render(
      <MemoryRouter>
        <ReportPageShell title="Campaign Activity" breadcrumbs={[]}>
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { level: 1, name: "Campaign Activity" })).toBeInTheDocument();
  });

  it("renders actions slot when provided", () => {
    render(
      <MemoryRouter>
        <ReportPageShell
          title="Test"
          breadcrumbs={[]}
          actions={<button>Export</button>}
        >
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("uses semantic spacing tokens", () => {
    const { container } = render(
      <MemoryRouter>
        <ReportPageShell title="Test" breadcrumbs={[]}>
          <div>Content</div>
        </ReportPageShell>
      </MemoryRouter>
    );

    const shell = container.firstChild;
    expect(shell).toHaveClass("p-content");
    expect(shell).toHaveClass("lg:p-widget");
  });
});
