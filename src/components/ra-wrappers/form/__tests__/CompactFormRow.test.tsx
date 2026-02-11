import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { CompactFormRow } from "../CompactFormRow";

describe("CompactFormRow", () => {
  it("renders children in a grid", () => {
    renderWithAdminContext(
      <CompactFormRow>
        <input data-testid="input-1" />
        <input data-testid="input-2" />
      </CompactFormRow>
    );

    expect(screen.getByTestId("input-1")).toBeInTheDocument();
    expect(screen.getByTestId("input-2")).toBeInTheDocument();
  });

  it("applies 2-column grid by default on md+", () => {
    const { container } = renderWithAdminContext(
      <CompactFormRow>
        <div />
        <div />
      </CompactFormRow>
    );

    expect(container.firstChild).toHaveClass("md:grid-cols-2");
  });

  it("supports custom column configuration", () => {
    const { container } = renderWithAdminContext(
      <CompactFormRow columns="grid-cols-[1fr_1fr_auto]">
        <div />
        <div />
        <div />
      </CompactFormRow>
    );

    expect(container.firstChild).toHaveClass("grid-cols-[1fr_1fr_auto]");
  });

  it("uses gap-3 for spacing", () => {
    const { container } = renderWithAdminContext(
      <CompactFormRow>
        <div />
      </CompactFormRow>
    );

    expect(container.firstChild).toHaveClass("gap-3");
  });

  it("aligns items to end by default", () => {
    const { container } = renderWithAdminContext(
      <CompactFormRow>
        <div />
      </CompactFormRow>
    );

    expect(container.firstChild).toHaveClass("items-end");
  });

  it("supports custom alignment", () => {
    const { container } = renderWithAdminContext(
      <CompactFormRow alignItems="center">
        <div />
      </CompactFormRow>
    );

    expect(container.firstChild).toHaveClass("items-center");
  });
});
