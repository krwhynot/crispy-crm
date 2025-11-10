import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnCustomizationMenu } from "../ColumnCustomizationMenu";
import { describe, it, expect, vi } from "vitest";

describe("ColumnCustomizationMenu", () => {
  const mockProps = {
    visibleStages: ["new_lead", "initial_outreach"],
    toggleVisibility: vi.fn(),
    collapseAll: vi.fn(),
    expandAll: vi.fn(),
  };

  it("renders customization button", () => {
    render(<ColumnCustomizationMenu {...mockProps} />);

    expect(screen.getByRole("button", { name: /customize/i })).toBeInTheDocument();
  });

  it("shows menu on button click", () => {
    render(<ColumnCustomizationMenu {...mockProps} />);

    fireEvent.click(screen.getByRole("button", { name: /customize/i }));

    expect(screen.getByText("Collapse All")).toBeInTheDocument();
    expect(screen.getByText("Expand All")).toBeInTheDocument();
  });

  it("calls collapseAll when clicked", () => {
    render(<ColumnCustomizationMenu {...mockProps} />);

    fireEvent.click(screen.getByRole("button", { name: /customize/i }));
    fireEvent.click(screen.getByText("Collapse All"));

    expect(mockProps.collapseAll).toHaveBeenCalled();
  });
});
