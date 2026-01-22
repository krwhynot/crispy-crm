import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickAddButton } from "../QuickAddButton";

// Mock QuickAddForm to isolate button tests - form is tested separately in QuickAddForm.test.tsx
vi.mock("../QuickAddForm", () => ({
  QuickAddForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="quick-add-form-mock">
      <button type="button" onClick={onSuccess}>
        Mock Submit
      </button>
    </div>
  ),
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe("QuickAddButton", () => {
  it("renders button with correct text", () => {
    render(<QuickAddButton />, { wrapper: TestWrapper });
    // Button contains both emoji and text
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("⚡ Quick Add");
  });

  it("has correct variant and size", () => {
    render(<QuickAddButton />, { wrapper: TestWrapper });
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-background"); // outline variant includes bg-background
  });

  it("opens dialog when clicked", () => {
    render(<QuickAddButton />, { wrapper: TestWrapper });
    const button = screen.getByRole("button");

    // Dialog should not be visible initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click the button
    fireEvent.click(button);

    // Dialog should now be visible with new title
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Quick Add Opportunity")).toBeInTheDocument();
  });

  it("ensures minimum touch target size", () => {
    render(<QuickAddButton />, { wrapper: TestWrapper });
    const button = screen.getByRole("button");
    expect(button).toHaveClass("min-h-[44px]");
    expect(button).toHaveClass("min-w-[44px]");
  });
});
