/**
 * Tests for FloatingCreateButton component
 *
 * Tests the floating action button (FAB) for quick creation of records,
 * including positioning, styling, accessibility, and routing behavior.
 */

import { describe, test, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FloatingCreateButton } from "../FloatingCreateButton";
import { renderWithAdminContext } from "@/tests/utils/render-admin";

describe("FloatingCreateButton", () => {
  test("renders a floating action button with correct styling", () => {
    renderWithAdminContext(<FloatingCreateButton />, {
      resource: "opportunities",
    });

    const button = screen.getByRole("link", { name: /create/i });

    // Check button exists
    expect(button).toBeInTheDocument();

    // Check it contains a plus icon (svg element)
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();

    // Check positioning classes
    expect(button).toHaveClass("fixed");
    expect(button).toHaveClass("bottom-4"); // Mobile-first
    expect(button).toHaveClass("md:bottom-6"); // Desktop
    expect(button).toHaveClass("right-4"); // Mobile-first
    expect(button).toHaveClass("md:right-6"); // Desktop
    expect(button).toHaveClass("z-50");

    // Check size classes for FAB
    expect(button).toHaveClass("size-16"); // 64px diameter on mobile (mobile-first)
    expect(button).toHaveClass("md:size-14"); // 56px diameter on desktop

    // Check brand color usage (7:1+ contrast for accessibility)
    // Using semantic Tailwind utilities for design system compliance
    expect(button).toHaveClass("bg-primary");
    expect(button).toHaveClass("hover:bg-primary/90");

    // Check shape
    expect(button).toHaveClass("rounded-full");

    // Check shadow for elevation
    expect(button).toHaveClass("shadow-lg");
  });

  test("navigates to create route for current resource", () => {
    renderWithAdminContext(<FloatingCreateButton />, {
      resource: "contacts",
    });

    const button = screen.getByRole("link", { name: /create/i });

    // Check href points to correct create route
    expect(button).toHaveAttribute("href", "/contacts/create");
  });

  test("uses custom resource when provided", () => {
    renderWithAdminContext(<FloatingCreateButton resource="organizations" />, {
      resource: "contacts", // Current context is contacts
    });

    const button = screen.getByRole("link", { name: /create/i });

    // Should use provided resource instead of context
    expect(button).toHaveAttribute("href", "/organizations/create");
  });

  test("has proper ARIA attributes for accessibility", () => {
    renderWithAdminContext(<FloatingCreateButton />, {
      resource: "opportunities",
    });

    const button = screen.getByRole("link", { name: /create/i });

    // Check ARIA label for screen readers
    expect(button).toHaveAttribute("aria-label", "Create new opportunities");
  });

  test("stops event propagation when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderWithAdminContext(
      <div
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleClick();
        }}
        role="button"
        tabIndex={0}
      >
        <FloatingCreateButton />
      </div>,
      {
        resource: "opportunities",
      }
    );

    const button = screen.getByRole("link", { name: /create/i });

    await user.click(button);

    // Click should not bubble up to parent div
    expect(handleClick).not.toHaveBeenCalled();
  });

  test("is keyboard accessible via Tab navigation", async () => {
    const user = userEvent.setup();

    renderWithAdminContext(
      <>
        <button>Other button</button>
        <FloatingCreateButton />
      </>,
      {
        resource: "opportunities",
      }
    );

    // Tab to first button
    await user.tab();
    expect(screen.getByText("Other button")).toHaveFocus();

    // Tab to FAB
    await user.tab();
    const fab = screen.getByRole("link", { name: /create/i });
    expect(fab).toHaveFocus();
  });

  test("adapts size for mobile devices", () => {
    renderWithAdminContext(<FloatingCreateButton />, {
      resource: "opportunities",
    });

    const button = screen.getByRole("link", { name: /create/i });

    // Mobile-first: larger size by default
    expect(button).toHaveClass("size-16"); // 64px on mobile

    // Desktop: smaller size with md: prefix
    expect(button).toHaveClass("md:size-14"); // 56px on desktop

    // Position adjustments for mobile (closer to edges)
    expect(button).toHaveClass("bottom-4"); // 16px from bottom on mobile
    expect(button).toHaveClass("right-4"); // 16px from right on mobile
    expect(button).toHaveClass("md:bottom-6"); // 24px on desktop
    expect(button).toHaveClass("md:right-6"); // 24px on desktop
  });

  test("shows plus icon without text label", () => {
    renderWithAdminContext(<FloatingCreateButton />, {
      resource: "opportunities",
    });

    const button = screen.getByRole("link", { name: /create/i });

    // Should have icon
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();

    // Should not have visible text (icon-only)
    expect(button).not.toHaveTextContent(/create/i);
  });
});
