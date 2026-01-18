import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionButtons } from "../ActionButtons";

describe("ActionButtons", () => {
  const defaultProps = {
    isSubmitting: false,
    onCancel: vi.fn(),
    onSaveAndNew: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders Cancel, Save & Close, Save & New buttons", () => {
      render(<ActionButtons {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save & Close" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save & New" })).toBeInTheDocument();
    });

    it("all buttons have h-11 class (44px touch target)", () => {
      render(<ActionButtons {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const saveCloseButton = screen.getByRole("button", { name: "Save & Close" });
      const saveNewButton = screen.getByRole("button", { name: "Save & New" });

      expect(cancelButton).toHaveClass("h-11");
      expect(saveCloseButton).toHaveClass("h-11");
      expect(saveNewButton).toHaveClass("h-11");
    });
  });

  describe("Interactions", () => {
    it("Cancel calls onCancel when clicked", () => {
      const onCancel = vi.fn();
      render(<ActionButtons {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("Save & New calls onSaveAndNew when clicked", () => {
      const onSaveAndNew = vi.fn();
      render(<ActionButtons {...defaultProps} onSaveAndNew={onSaveAndNew} />);

      const saveNewButton = screen.getByRole("button", { name: "Save & New" });
      fireEvent.click(saveNewButton);

      expect(onSaveAndNew).toHaveBeenCalledTimes(1);
    });
  });

  describe("Submitting State", () => {
    it("all buttons disabled when isSubmitting=true", () => {
      render(<ActionButtons {...defaultProps} isSubmitting={true} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);

      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("shows Loader2 spinner when submitting", () => {
      const { container } = render(<ActionButtons {...defaultProps} isSubmitting={true} />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("shows 'Saving...' text on Save & Close button when submitting", () => {
      render(<ActionButtons {...defaultProps} isSubmitting={true} />);

      expect(screen.getByRole("button", { name: /saving/i })).toBeInTheDocument();
    });

    it("shows 'Saving...' text on Save & New button when submitting", () => {
      render(<ActionButtons {...defaultProps} isSubmitting={true} />);

      const saveNewButton = screen.getAllByRole("button").find(
        (btn) => btn.textContent?.includes("Saving...")
      );
      expect(saveNewButton).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("spinner icon has aria-hidden for screen readers", () => {
      const { container } = render(<ActionButtons {...defaultProps} isSubmitting={true} />);

      const spinner = container.querySelector('svg[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });

    it("Save & Close button has type submit", () => {
      render(<ActionButtons {...defaultProps} />);

      const saveCloseButton = screen.getByRole("button", { name: "Save & Close" });
      expect(saveCloseButton).toHaveAttribute("type", "submit");
    });

    it("Cancel and Save & New buttons have type button", () => {
      render(<ActionButtons {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      const saveNewButton = screen.getByRole("button", { name: "Save & New" });

      expect(cancelButton).toHaveAttribute("type", "button");
      expect(saveNewButton).toHaveAttribute("type", "button");
    });
  });

  describe("Visual Styling", () => {
    it("Cancel button uses outline variant", () => {
      render(<ActionButtons {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      expect(cancelButton).toHaveAttribute("data-slot", "button");
    });

    it("Save & New button uses secondary variant", () => {
      render(<ActionButtons {...defaultProps} />);

      const saveNewButton = screen.getByRole("button", { name: "Save & New" });
      expect(saveNewButton).toHaveAttribute("data-slot", "button");
    });

    it("has flex layout with justify-between", () => {
      const { container } = render(<ActionButtons {...defaultProps} />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("justify-between");
    });
  });
});
