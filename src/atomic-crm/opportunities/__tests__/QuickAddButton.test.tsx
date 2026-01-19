import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickAddButton } from "../quick-add/QuickAddButton";

// Mock dependencies
vi.mock("../hooks/useQuickAdd", () => ({
  useQuickAdd: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("ra-core", () => ({
  useGetList: vi.fn(() => ({
    data: [
      { id: 1, name: "Principal A" },
      { id: 2, name: "Principal B" },
    ],
    isLoading: false,
  })),
  useGetIdentity: vi.fn(() => ({
    data: { id: 100, fullName: "John Sales" },
    isLoading: false,
  })),
  useDataProvider: vi.fn(() => ({
    create: vi.fn().mockResolvedValue({ data: { id: 1, name: "Test" } }),
  })),
  useNotify: vi.fn(() => vi.fn()),
}));

// Mock useFilteredProducts - required when dialog opens and form renders
vi.mock("../hooks/useFilteredProducts", () => ({
  useFilteredProducts: vi.fn(() => ({
    products: [],
    isLoading: false,
    error: null,
    isReady: false,
    isEmpty: true,
  })),
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
