import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AdminButton } from "./AdminButton";

describe("AdminButton", () => {
  it("renders children correctly", () => {
    render(<AdminButton>Save</AdminButton>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("forwards onClick handler", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<AdminButton onClick={handleClick}>Click me</AdminButton>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("shows loading spinner when isLoading is true", () => {
    render(<AdminButton isLoading>Save</AdminButton>);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button).toHaveTextContent("Save");
  });

  it("shows custom loadingText when provided", () => {
    render(
      <AdminButton isLoading loadingText="Saving...">
        Save
      </AdminButton>
    );

    expect(screen.getByRole("button")).toHaveTextContent("Saving...");
  });

  it("is disabled when isLoading is true", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <AdminButton isLoading onClick={handleClick}>
        Save
      </AdminButton>
    );

    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("forwards variant prop to Button", () => {
    render(<AdminButton variant="destructive">Delete</AdminButton>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-destructive");
  });

  it("forwards disabled prop correctly", () => {
    render(<AdminButton disabled>Disabled</AdminButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("merges className with base classes", () => {
    render(<AdminButton className="custom-class">Styled</AdminButton>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("maintains minimum touch target height (h-12 = 48px)", () => {
    render(<AdminButton>Touch Target</AdminButton>);
    const button = screen.getByRole("button");
    // Base Button uses h-12 by default
    expect(button).toHaveClass("h-12");
  });
});
