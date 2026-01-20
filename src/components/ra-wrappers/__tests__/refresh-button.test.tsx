import { describe, test, expect } from "vitest";
import { screen } from "@testing-library/react";
import { RefreshButton } from "../refresh-button";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

describe("RefreshButton", () => {
  test("has aria-label for accessibility", () => {
    renderWithAdminContext(<RefreshButton />);

    const button = screen.getByRole("button", { name: "Refresh" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", "Refresh");
  });

  test("renders with ghost variant and icon size", () => {
    renderWithAdminContext(<RefreshButton />);

    const button = screen.getByRole("button", { name: "Refresh" });
    expect(button).toHaveClass("hover:bg-accent");
    expect(button).toHaveClass("hover:text-accent-foreground");
  });

  test("is hidden on mobile screens", () => {
    renderWithAdminContext(<RefreshButton />);

    const button = screen.getByRole("button", { name: "Refresh" });
    expect(button).toHaveClass("hidden");
    expect(button).toHaveClass("sm:inline-flex");
  });
});
