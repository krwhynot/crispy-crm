import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ButtonPlaceholder } from "../ButtonPlaceholder";

describe("ButtonPlaceholder", () => {
  it("is invisible but takes space", () => {
    const { container } = render(<ButtonPlaceholder />);
    const element = container.firstChild as HTMLElement;

    expect(element).toHaveClass("invisible");
    expect(element).toHaveClass("h-9"); // 36px button height
    expect(element).toHaveClass("w-[120px]");
  });

  it("has aria-hidden for accessibility", () => {
    const { container } = render(<ButtonPlaceholder />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("accepts custom className", () => {
    const { container } = render(<ButtonPlaceholder className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has shrink-0 to prevent shrinking in flex layouts", () => {
    const { container } = render(<ButtonPlaceholder />);
    expect(container.firstChild).toHaveClass("shrink-0");
  });
});
