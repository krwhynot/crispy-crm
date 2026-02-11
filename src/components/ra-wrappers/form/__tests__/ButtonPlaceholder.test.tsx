import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { describe, it, expect } from "vitest";
import { ButtonPlaceholder } from "../ButtonPlaceholder";

describe("ButtonPlaceholder", () => {
  it("is invisible but takes space", () => {
    const { container } = renderWithAdminContext(<ButtonPlaceholder />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass("invisible");
    expect(element).toHaveClass("size-12"); // 48px touch target (meets 44px minimum)
  });

  it("has aria-hidden for accessibility", () => {
    const { container } = renderWithAdminContext(<ButtonPlaceholder />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts custom className", () => {
    const { container } = renderWithAdminContext(<ButtonPlaceholder className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has shrink-0 to prevent shrinking in flex layouts", () => {
    const { container } = renderWithAdminContext(<ButtonPlaceholder />);
    expect(container.firstChild).toHaveClass("shrink-0");
  });
});
