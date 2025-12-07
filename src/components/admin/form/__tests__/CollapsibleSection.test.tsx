import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "../CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders collapsed by default", () => {
    render(
      <CollapsibleSection title="Additional Details">
        <input data-testid="hidden-input" />
      </CollapsibleSection>
    );

    expect(screen.getByRole("button", { name: /additional details/i })).toBeInTheDocument();
    // When collapsed, Radix Collapsible removes content from DOM entirely
    // So we check the element is either absent OR not visible
    const hiddenInput = screen.queryByTestId("hidden-input");
    expect(hiddenInput === null || !hiddenInput.checkVisibility()).toBe(true);
  });

  it("expands when trigger clicked", () => {
    render(
      <CollapsibleSection title="Additional Details">
        <input data-testid="hidden-input" />
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByRole("button", { name: /additional details/i }));
    expect(screen.getByTestId("hidden-input")).toBeVisible();
  });

  it("supports defaultOpen prop", () => {
    render(
      <CollapsibleSection title="Details" defaultOpen>
        <input data-testid="visible-input" />
      </CollapsibleSection>
    );

    expect(screen.getByTestId("visible-input")).toBeVisible();
  });

  it("has 44px minimum touch target", () => {
    render(<CollapsibleSection title="Test"><div /></CollapsibleSection>);

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveClass("h-11");
  });

  it("rotates chevron when expanded", () => {
    render(<CollapsibleSection title="Test"><div /></CollapsibleSection>);

    const chevron = screen.getByTestId("collapsible-chevron");
    expect(chevron).not.toHaveClass("rotate-180");

    fireEvent.click(screen.getByRole("button"));
    expect(chevron).toHaveClass("rotate-180");
  });
});
