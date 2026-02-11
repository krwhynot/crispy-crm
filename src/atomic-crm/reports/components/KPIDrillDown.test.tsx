import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect, vi } from "vitest";
import { KPIDrillDown } from "./KPIDrillDown";

describe("KPIDrillDown", () => {
  it("renders as a slide-over dialog", () => {
    renderWithAdminContext(
      <KPIDrillDown
        open={true}
        onClose={vi.fn()}
        title="Total Opportunities"
        children={<div>Details</div>}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has focus trap when open", () => {
    renderWithAdminContext(
      <KPIDrillDown open={true} onClose={vi.fn()} title="Test" children={<button>First</button>} />
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("data-focus-trap", "true");
  });

  it("closes on ESC key", () => {
    const onClose = vi.fn();
    renderWithAdminContext(
      <KPIDrillDown open={true} onClose={onClose} title="Test" children={<div>Content</div>} />
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders close button with accessible label", () => {
    renderWithAdminContext(
      <KPIDrillDown open={true} onClose={vi.fn()} title="Test" children={<div>Content</div>} />
    );

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it("renders title", () => {
    renderWithAdminContext(
      <KPIDrillDown
        open={true}
        onClose={vi.fn()}
        title="Test Title"
        children={<div>Content</div>}
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    renderWithAdminContext(
      <KPIDrillDown
        open={true}
        onClose={vi.fn()}
        title="Test"
        description="Test Description"
        children={<div>Content</div>}
      />
    );

    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders children content", () => {
    renderWithAdminContext(
      <KPIDrillDown
        open={true}
        onClose={vi.fn()}
        title="Test"
        children={<div data-testid="child-content">Child Content</div>}
      />
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithAdminContext(
      <KPIDrillDown open={false} onClose={vi.fn()} title="Test" children={<div>Content</div>} />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
