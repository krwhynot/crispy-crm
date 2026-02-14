import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { StageBadgeWithHealth } from "./StageBadgeWithHealth";

describe("StageBadgeWithHealth", () => {
  it("renders stage name", () => {
    renderWithAdminContext(<StageBadgeWithHealth stage="qualified" health="active" />);
    expect(screen.getByText("qualified")).toBeInTheDocument();
  });

  it("applies success border for active health", () => {
    const { container } = renderWithAdminContext(
      <StageBadgeWithHealth stage="qualified" health="active" />
    );
    const badge = container.querySelector(".border-success");
    expect(badge).toBeInTheDocument();
  });

  it("applies warning border for cooling health", () => {
    const { container } = renderWithAdminContext(
      <StageBadgeWithHealth stage="qualified" health="cooling" />
    );
    const badge = container.querySelector(".border-warning");
    expect(badge).toBeInTheDocument();
  });

  it("applies destructive border for at_risk health", () => {
    const { container } = renderWithAdminContext(
      <StageBadgeWithHealth stage="qualified" health="at_risk" />
    );
    const badge = container.querySelector(".border-destructive");
    expect(badge).toBeInTheDocument();
  });
});
