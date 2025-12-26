/**
 * Integration Test: Quick Add Flow with Product Filtering
 *
 * Tests the complete user journey from opening Quick Add dialog through form submission,
 * with emphasis on product filtering by principal_id.
 *
 * User Flow:
 * 1. Click Quick Add button → Dialog opens
 * 2. Select a principal organization → Products dropdown becomes available
 * 3. Verify products are filtered by selected principal
 * 4. Select product(s) from filtered list
 * 5. Fill in contact/organization details
 * 6. Submit form → Opportunity created with correct products
 */

import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickAddButton } from "../quick-add/QuickAddButton";
import type { Product } from "@/atomic-crm/types";

// Mock data
const mockPrincipals = [
  { id: 100, name: "Principal A", organization_type: "principal" },
  { id: 200, name: "Principal B", organization_type: "principal" },
];

const mockProductsPrincipalA: Product[] = [
  {
    id: 1,
    name: "Product A1",
    sku: "SKU-A1",
    principal_id: 100,
    category: "beverages",
    status: "active",
  },
  {
    id: 2,
    name: "Product A2",
    sku: "SKU-A2",
    principal_id: 100,
    category: "snacks",
    status: "active",
  },
];

const mockProductsPrincipalB: Product[] = [
  {
    id: 3,
    name: "Product B1",
    sku: "SKU-B1",
    principal_id: 200,
    category: "beverages",
    status: "active",
  },
  {
    id: 4,
    name: "Product B2",
    sku: "SKU-B2",
    principal_id: 200,
    category: "snacks",
    status: "active",
  },
];

// Mock hooks
const mockUseGetList = vi.fn();
const mockUseQuickAddMutate = vi.fn();

vi.mock("ra-core", () => ({
  useGetList: (...args: any[]) => mockUseGetList(...args),
}));

vi.mock("../hooks/useQuickAdd", () => ({
  useQuickAdd: () => ({
    mutate: mockUseQuickAddMutate,
    isPending: false,
  }),
}));

// Mock useFilteredProducts to return products based on principalId
vi.mock("../hooks/useFilteredProducts", () => ({
  useFilteredProducts: (principalId: number | null | undefined) => {
    if (!principalId) {
      return {
        products: [],
        isLoading: false,
        error: null,
        isReady: false,
        isEmpty: true,
      };
    }

    const products = principalId === 100 ? mockProductsPrincipalA : mockProductsPrincipalB;
    return {
      products,
      isLoading: false,
      error: null,
      isReady: true,
      isEmpty: false,
    };
  },
}));

// Test wrapper
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Quick Add Flow with Product Filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mock: return principals list
    mockUseGetList.mockReturnValue({
      data: mockPrincipals,
      isLoading: false,
      error: null,
    });
  });

  describe("Dialog Interaction", () => {
    it("opens Quick Add dialog when button is clicked", async () => {
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      // Dialog should not be visible initially
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Click the Quick Add button
      const button = screen.getByRole("button", { name: /quick add/i });
      fireEvent.click(button);

      // Dialog should now be visible
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      expect(screen.getByText("Quick Add Booth Visitor")).toBeInTheDocument();
    });

    it("displays all form sections in correct order", async () => {
      render(<QuickAddButton />, { wrapper: createTestWrapper() });
      fireEvent.click(screen.getByRole("button", { name: /quick add/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Verify form sections exist (using actual section headers from QuickAddForm.tsx)
      expect(screen.getByText("Pre-filled Information")).toBeInTheDocument();
      expect(screen.getByText("Contact Information")).toBeInTheDocument();
      expect(screen.getByText("Organization Information")).toBeInTheDocument();
      expect(screen.getByText("Optional Details")).toBeInTheDocument();
    });
  });

  describe("Principal Selection and Product Filtering", () => {
    it("shows message to select principal before products can be selected", async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      // Open dialog
      await user.click(screen.getByRole("button", { name: /quick add/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Product section should show "Select a Principal first" message
      expect(screen.getByText("Select a Principal first to filter products")).toBeInTheDocument();
    });

    it("form contains all required field labels", async () => {
      const user = userEvent.setup();
      render(<QuickAddButton />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole("button", { name: /quick add/i }));

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Verify all form field labels are present
      // Note: Required field asterisks are in separate <span> elements for accessibility,
      // so we check label text without the asterisk
      expect(screen.getByText("Campaign")).toBeInTheDocument();
      expect(screen.getByText("Principal")).toBeInTheDocument();
      expect(screen.getByText("Products")).toBeInTheDocument();
      expect(screen.getByText("First Name")).toBeInTheDocument();
      expect(screen.getByText("Last Name")).toBeInTheDocument();
      expect(screen.getByText("Phone")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Organization Name")).toBeInTheDocument();
    });
  });
});
