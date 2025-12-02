import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TasksIconRail } from "../TasksIconRail";
import { TooltipProvider } from "@/components/ui/tooltip";

// Wrap component with TooltipProvider for testing
function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe("TasksIconRail", () => {
  it("renders a 48px wide rail", () => {
    renderWithTooltip(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    const rail = screen.getByRole("complementary");
    expect(rail).toHaveClass("w-12"); // 48px
  });

  it("displays task count badge when count > 0", () => {
    renderWithTooltip(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not display badge when count is 0", () => {
    renderWithTooltip(<TasksIconRail taskCount={0} onExpand={vi.fn()} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("displays 99+ for counts over 99", () => {
    renderWithTooltip(<TasksIconRail taskCount={150} onExpand={vi.fn()} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("calls onExpand when clicked", () => {
    const onExpand = vi.fn();
    renderWithTooltip(<TasksIconRail taskCount={3} onExpand={onExpand} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("has accessible label", () => {
    renderWithTooltip(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    expect(screen.getByLabelText(/expand tasks/i)).toBeInTheDocument();
  });

  it("meets 44px minimum touch target", () => {
    renderWithTooltip(<TasksIconRail taskCount={5} onExpand={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-11"); // 44px minimum
  });
});
