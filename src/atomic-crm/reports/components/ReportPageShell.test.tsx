import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect } from "vitest";
import { ReportPageShell } from "./ReportPageShell";

describe("ReportPageShell", () => {
  it("renders breadcrumbs with Reports root link", () => {
    renderWithAdminContext(
      <ReportPageShell
        title="Weekly Activity"
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Weekly Activity" }]}
      >
        <div>Content</div>
      </ReportPageShell>
    );

    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getAllByText("Weekly Activity").length).toBeGreaterThan(0);
  });

  it("renders title with semantic heading", () => {
    renderWithAdminContext(
      <ReportPageShell title="Campaign Activity" breadcrumbs={[]}>
        <div>Content</div>
      </ReportPageShell>
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Campaign Activity" })
    ).toBeInTheDocument();
  });

  it("renders actions slot when provided", () => {
    renderWithAdminContext(
      <ReportPageShell title="Test" breadcrumbs={[]} actions={<button>Export</button>}>
        <div>Content</div>
      </ReportPageShell>
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("uses semantic spacing tokens", () => {
    const { container } = renderWithAdminContext(
      <ReportPageShell title="Test" breadcrumbs={[]}>
        <div>Content</div>
      </ReportPageShell>
    );

    const shell = container.firstChild;
    expect(shell).toHaveClass("p-content");
    expect(shell).toHaveClass("lg:p-widget");
  });
});
