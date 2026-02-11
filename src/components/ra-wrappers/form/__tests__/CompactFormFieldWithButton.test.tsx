import { screen } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect } from "vitest";
import { CompactFormFieldWithButton } from "../CompactFormFieldWithButton";

describe("CompactFormFieldWithButton", () => {
  it("renders field and button in grid layout", () => {
    renderWithAdminContext(
      <CompactFormFieldWithButton button={<button data-testid="btn">Create</button>}>
        <input data-testid="field" />
      </CompactFormFieldWithButton>
    );

    expect(screen.getByTestId("field")).toBeInTheDocument();
    expect(screen.getByTestId("btn")).toBeInTheDocument();
  });

  it("renders placeholder when no button provided", () => {
    const { container } = renderWithAdminContext(
      <CompactFormFieldWithButton>
        <input data-testid="field" />
      </CompactFormFieldWithButton>
    );

    // Placeholder should have aria-hidden and invisible class
    const placeholder = container.querySelector('[aria-hidden="true"]');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass("invisible");
  });

  it("renders footer content below the grid", () => {
    renderWithAdminContext(
      <CompactFormFieldWithButton footer={<span data-testid="footer">Warning</span>}>
        <input />
      </CompactFormFieldWithButton>
    );

    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("uses items-end for vertical alignment", () => {
    const { container } = renderWithAdminContext(
      <CompactFormFieldWithButton>
        <input />
      </CompactFormFieldWithButton>
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("items-end");
  });

  it("uses grid-cols-[1fr_auto] for field/button layout", () => {
    const { container } = renderWithAdminContext(
      <CompactFormFieldWithButton>
        <input />
      </CompactFormFieldWithButton>
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-[1fr_auto]");
  });

  it("wraps field in min-w-0 container to prevent overflow", () => {
    const { container: _container } = renderWithAdminContext(
      <CompactFormFieldWithButton>
        <input data-testid="field" />
      </CompactFormFieldWithButton>
    );

    const fieldContainer = screen.getByTestId("field").parentElement;
    expect(fieldContainer).toHaveClass("min-w-0");
  });

  it("accepts custom className", () => {
    const { container } = renderWithAdminContext(
      <CompactFormFieldWithButton className="custom-class">
        <input />
      </CompactFormFieldWithButton>
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
