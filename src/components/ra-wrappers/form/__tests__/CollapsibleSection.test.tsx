import { screen, fireEvent } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import userEvent from "@testing-library/user-event";
import { CollapsibleSection } from "../CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders collapsed by default", () => {
    renderWithAdminContext(
      <CollapsibleSection title="Additional Details">
        <input data-testid="hidden-input" />
      </CollapsibleSection>
    );

    expect(screen.getByRole("button", { name: /additional details/i })).toBeInTheDocument();
    // When collapsed, Radix Collapsible removes content from DOM entirely
    expect(screen.queryByTestId("hidden-input")).not.toBeInTheDocument();
  });

  it("expands when trigger clicked", () => {
    renderWithAdminContext(
      <CollapsibleSection title="Additional Details">
        <input data-testid="hidden-input" />
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByRole("button", { name: /additional details/i }));
    expect(screen.getByTestId("hidden-input")).toBeVisible();
  });

  it("supports defaultOpen prop", () => {
    renderWithAdminContext(
      <CollapsibleSection title="Details" defaultOpen>
        <input data-testid="visible-input" />
      </CollapsibleSection>
    );

    expect(screen.getByTestId("visible-input")).toBeVisible();
  });

  it("has 44px minimum touch target", () => {
    renderWithAdminContext(
      <CollapsibleSection title="Test">
        <div />
      </CollapsibleSection>
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveClass("h-11");
  });

  it("rotates chevron when expanded", () => {
    renderWithAdminContext(
      <CollapsibleSection title="Test">
        <div />
      </CollapsibleSection>
    );

    const chevron = screen.getByTestId("collapsible-chevron");
    expect(chevron).not.toHaveClass("rotate-180");

    fireEvent.click(screen.getByRole("button"));
    expect(chevron).toHaveClass("rotate-180");
  });

  it("toggles on Enter key", async () => {
    const user = userEvent.setup();
    renderWithAdminContext(
      <CollapsibleSection title="Details">
        <p>Content</p>
      </CollapsibleSection>
    );
    const button = screen.getByRole("button", { name: /details/i });
    button.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("toggles on Space key", async () => {
    const user = userEvent.setup();
    renderWithAdminContext(
      <CollapsibleSection title="Details">
        <p>Content</p>
      </CollapsibleSection>
    );
    const button = screen.getByRole("button", { name: /details/i });
    button.focus();
    await user.keyboard(" ");
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("has correct aria-expanded state", () => {
    renderWithAdminContext(
      <CollapsibleSection title="Details">
        <p>Content</p>
      </CollapsibleSection>
    );
    const button = screen.getByRole("button", { name: /details/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("has aria-controls linked to content id", () => {
    renderWithAdminContext(
      <CollapsibleSection title="Details">
        <p>Content</p>
      </CollapsibleSection>
    );
    const button = screen.getByRole("button", { name: /details/i });
    fireEvent.click(button); // Expand to render content
    const contentId = button.getAttribute("aria-controls");
    expect(contentId).toBeTruthy();
    expect(document.getElementById(contentId!)).toBeInTheDocument();
  });
});
