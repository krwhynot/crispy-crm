import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickAddForm } from "../quick-add/QuickAddForm";
import { useQuickAdd } from "../hooks/useQuickAdd";
import { useGetList } from "ra-core";
import { selectCityAndVerifyState } from "@/tests/utils/combobox";

// Mock the external dependencies
vi.mock("../hooks/useQuickAdd");
vi.mock("ra-core", () => ({
  useGetList: vi.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe("QuickAddForm", () => {
  const mockOnSuccess = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (useQuickAdd as Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    (useGetList as Mock).mockImplementation((resource) => {
      if (resource === "organizations") {
        return {
          data: [
            { id: 1, name: "Principal A" },
            { id: 2, name: "Principal B" },
          ],
          isLoading: false,
        };
      }
      if (resource === "products") {
        return {
          data: [
            { id: 101, name: "Product 1" },
            { id: 102, name: "Product 2" },
          ],
          isLoading: false,
        };
      }
      return { data: [], isLoading: false };
    });

    mockLocalStorage.getItem.mockImplementation((key) => {
      // Return JSON-stringified values since getStorageItem uses JSON.parse
      if (key === "last_campaign") return JSON.stringify("Test Campaign");
      if (key === "last_principal") return JSON.stringify("1");
      return null;
    });
  });

  it("renders all form fields", () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Pre-filled section
    expect(screen.getByLabelText(/campaign/i)).toBeInTheDocument();
    expect(screen.getByText("Principal")).toBeInTheDocument();

    // Contact section
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();

    // Organization section
    expect(screen.getByLabelText(/organization name \*/i)).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();

    // Optional details
    expect(screen.getAllByText(/products/i)).toHaveLength(2); // Label and placeholder
    expect(screen.getByLabelText(/quick note/i)).toBeInTheDocument();

    // Footer buttons
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save & add another/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save & close/i })).toBeInTheDocument();
  });

  it("pre-fills from localStorage", () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const campaignInput = screen.getByLabelText(/campaign/i) as HTMLInputElement;
    expect(campaignInput.value).toBe("Test Campaign");
  });

  it("validates phone OR email requirement", async () => {
    const user = userEvent.setup({ delay: null }); // Speed up typing

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Clear pre-filled fields
    const campaignInput = screen.getByLabelText(/campaign/i);
    await user.clear(campaignInput);

    // Fill required fields except phone/email
    await user.type(campaignInput, "Test Campaign");
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");

    // City uses Combobox - use helper to select city and verify state auto-fill
    await selectCityAndVerifyState("New York", "NY", { user, timeout: 5000 });

    // Try to submit without phone or email
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/phone or email required/i)).toBeInTheDocument();
    });
  }, 15000);

  it("handles Save & Add Another correctly", async () => {
    const user = userEvent.setup({ delay: null }); // Speed up typing

    mockMutate.mockImplementation((data, options) => {
      options.onSuccess();
    });

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Fill form
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^email$/i), "john@example.com");
    await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");

    // City uses Combobox - use helper to select city and verify state auto-fill
    await selectCityAndVerifyState("Los Angeles", "CA", { user, timeout: 5000 });

    // Click Save & Add Another
    await user.click(screen.getByRole("button", { name: /save & add another/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled(); // Should not close dialog

      // Form should be reset except campaign and principal
      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      expect(firstNameInput.value).toBe("");

      const campaignInput = screen.getByLabelText(/campaign/i) as HTMLInputElement;
      expect(campaignInput.value).toBe("Test Campaign"); // Should persist
    });
  }, 15000);

  it("handles Save & Close correctly", async () => {
    const user = userEvent.setup({ delay: null }); // Speed up typing

    mockMutate.mockImplementation((data, options) => {
      options.onSuccess();
    });

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Fill form
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^phone$/i), "555-1234");
    await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");

    // City uses Combobox - use helper to select city and verify state auto-fill
    await selectCityAndVerifyState("Chicago", "IL", { user, timeout: 5000 });

    // Click Save & Close
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled(); // Should close dialog
    });
  }, 15000);

  it("shows 'Select a Principal first' when no principal is selected", async () => {
    // Mock no principal selected initially
    mockLocalStorage.getItem.mockImplementation((key) => {
      // Return JSON-stringified values since getStorageItem uses JSON.parse
      if (key === "last_campaign") return JSON.stringify("Test Campaign");
      if (key === "last_principal") return null;
      return null;
    });

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Initially should show message to select principal
    expect(screen.getByText(/select a principal first to filter products/i)).toBeInTheDocument();
  });

  it("validates all required fields", async () => {
    const user = userEvent.setup();

    // Set localStorage to have no pre-filled values
    mockLocalStorage.getItem.mockImplementation(() => null);

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Try to submit empty form
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    await waitFor(() => {
      // Check for required validation messages (first_name, last_name, city, state are now optional)
      expect(screen.getByText(/organization name required/i)).toBeInTheDocument();
    });
  });

  it("clears phone/email validation when either field is filled", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Fill required fields except phone/email
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");

    // City uses Combobox - use helper to select city and verify state auto-fill
    await selectCityAndVerifyState("Los Angeles", "CA", { user, timeout: 5000 });

    // Try to submit without phone or email
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/phone or email required/i)).toBeInTheDocument();
    });

    // Now fill email
    await user.type(screen.getByLabelText(/^email$/i), "john@example.com");

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/phone or email required/i)).not.toBeInTheDocument();
    });
  }, 15000);

  it("handles Cancel button correctly", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("disables buttons when mutation is pending", () => {
    (useQuickAdd as Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save & add another/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save & close/i })).toBeDisabled();
  });
});

/**
 * Principal Selection and Product Filtering Tests (TD-003)
 *
 * These tests verify the dependent dropdown behavior where:
 * 1. Principal dropdown shows available principals
 * 2. Selecting a principal enables the products dropdown
 * 3. Products are filtered by the selected principal
 * 4. Switching principals updates the products list
 *
 * Uses fireEvent.pointerDown for Radix UI Select compatibility
 * See: https://github.com/shadcn-ui/ui/discussions/4168
 */
describe("QuickAddForm - Principal Selection and Product Filtering", () => {
  const mockOnSuccess = vi.fn();
  const mockMutate = vi.fn();

  // Test data: Each principal has different products
  const principals = [
    { id: 1, name: "Acme Corp" },
    { id: 2, name: "Beta Industries" },
    { id: 3, name: "Empty Principal" }, // Has no products - edge case
  ];

  const productsForPrincipal1 = [
    { id: 101, name: "Widget A" },
    { id: 102, name: "Widget B" },
  ];

  const productsForPrincipal2 = [
    { id: 201, name: "Gadget X" },
    { id: 202, name: "Gadget Y" },
    { id: 203, name: "Gadget Z" },
  ];

  /**
   * Filter-aware mock that returns different products based on principal_id filter
   * This is critical for testing the actual filtering behavior, not just UI state
   */
  const setupFilterAwareMock = () => {
    (useGetList as Mock).mockImplementation((resource, params) => {
      if (resource === "organizations") {
        return {
          data: principals,
          isLoading: false,
        };
      }
      if (resource === "products") {
        const principalId = params?.filter?.principal_id;
        if (principalId === 1) {
          return { data: productsForPrincipal1, isLoading: false };
        }
        if (principalId === 2) {
          return { data: productsForPrincipal2, isLoading: false };
        }
        if (principalId === 3) {
          return { data: [], isLoading: false }; // Empty Principal has no products
        }
        // No principal selected = no products
        return { data: [], isLoading: false };
      }
      return { data: [], isLoading: false };
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useQuickAdd as Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    setupFilterAwareMock();

    // No pre-selected principal for these tests
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key) => {
          // Return JSON-stringified values since getStorageItem uses JSON.parse
          if (key === "last_campaign") return JSON.stringify("Q4 Campaign");
          if (key === "last_principal") return null; // No pre-selected principal
          return null;
        }),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
    });
  });

  /**
   * Helper to open a Radix UI Select dropdown
   * Uses pointerDown because Radix relies on PointerEvent, not click
   */
  const openSelectDropdown = (trigger: HTMLElement) => {
    fireEvent.pointerDown(trigger, {
      button: 0,
      pointerType: "mouse",
      pointerId: 1,
    });
  };

  it("displays principal dropdown with all available principals", async () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Find and open principal dropdown - it's the first combobox with "Select principal" text
    const principalTrigger = screen.getAllByRole("combobox")[0];
    openSelectDropdown(principalTrigger);

    // Verify all principals are shown in the dropdown
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Acme Corp" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Beta Industries" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Empty Principal" })).toBeInTheDocument();
    });
  });

  it("selects a principal and updates the form state", async () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Initially products should be disabled
    expect(screen.getByText(/select a principal first/i)).toBeInTheDocument();

    // Open principal dropdown and select "Acme Corp"
    const principalTrigger = screen.getAllByRole("combobox")[0];
    openSelectDropdown(principalTrigger);

    const acmeOption = await screen.findByRole("option", { name: "Acme Corp" });
    fireEvent.click(acmeOption);

    // Verify: "Select principal first" message should disappear
    await waitFor(() => {
      expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
    });

    // Verify: Principal trigger should show selected value
    await waitFor(() => {
      expect(principalTrigger).toHaveTextContent("Acme Corp");
    });
  });

  it("fetches products with correct filter after principal selection", async () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Open principal dropdown and select "Acme Corp" (id: 1)
    const principalTrigger = screen.getAllByRole("combobox")[0];
    openSelectDropdown(principalTrigger);

    const acmeOption = await screen.findByRole("option", { name: "Acme Corp" });
    fireEvent.click(acmeOption);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
    });

    // Verify useGetList was called with the correct filter
    expect(useGetList).toHaveBeenCalledWith(
      "products",
      expect.objectContaining({
        filter: { principal_id: 1 },
      }),
      expect.any(Object)
    );
  });

  it("shows correct products for selected principal", async () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Select "Beta Industries" (id: 2)
    const principalTrigger = screen.getAllByRole("combobox")[0];
    openSelectDropdown(principalTrigger);

    const betaOption = await screen.findByRole("option", { name: "Beta Industries" });
    fireEvent.click(betaOption);

    // Wait for products dropdown to be enabled
    await waitFor(() => {
      expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
    });

    // Verify the mock was called with principal_id: 2
    expect(useGetList).toHaveBeenCalledWith(
      "products",
      expect.objectContaining({
        filter: { principal_id: 2 },
      }),
      expect.any(Object)
    );
  });

  it("updates products when switching principals", async () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const principalTrigger = screen.getAllByRole("combobox")[0];

    // First: Select "Acme Corp"
    openSelectDropdown(principalTrigger);
    const acmeOption = await screen.findByRole("option", { name: "Acme Corp" });
    fireEvent.click(acmeOption);

    await waitFor(() => {
      expect(principalTrigger).toHaveTextContent("Acme Corp");
    });

    // Verify first call was for principal 1
    expect(useGetList).toHaveBeenCalledWith(
      "products",
      expect.objectContaining({
        filter: { principal_id: 1 },
      }),
      expect.any(Object)
    );

    // Clear mock call history to track new calls
    vi.clearAllMocks();
    setupFilterAwareMock(); // Re-setup the mock

    // Second: Switch to "Beta Industries"
    openSelectDropdown(principalTrigger);
    const betaOption = await screen.findByRole("option", { name: "Beta Industries" });
    fireEvent.click(betaOption);

    await waitFor(() => {
      expect(principalTrigger).toHaveTextContent("Beta Industries");
    });

    // Verify products were re-fetched for principal 2
    expect(useGetList).toHaveBeenCalledWith(
      "products",
      expect.objectContaining({
        filter: { principal_id: 2 },
      }),
      expect.any(Object)
    );
  });

  it("handles principal with no products gracefully", async () => {
    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Select "Empty Principal" (id: 3) which has no products
    const principalTrigger = screen.getAllByRole("combobox")[0];
    openSelectDropdown(principalTrigger);

    const emptyOption = await screen.findByRole("option", { name: "Empty Principal" });
    fireEvent.click(emptyOption);

    // Wait for products to be fetched (even though empty)
    await waitFor(() => {
      expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
    });

    // Products dropdown should be enabled but empty
    // The mock returns [] for principal_id: 3
    expect(useGetList).toHaveBeenCalledWith(
      "products",
      expect.objectContaining({
        filter: { principal_id: 3 },
      }),
      expect.any(Object)
    );
  });

  it("persists principal selection after Save & Add Another", async () => {
    const user = userEvent.setup({ delay: null });

    mockMutate.mockImplementation((_data, options) => {
      options.onSuccess();
    });

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Select principal
    const principalTrigger = screen.getAllByRole("combobox")[0];
    openSelectDropdown(principalTrigger);
    const acmeOption = await screen.findByRole("option", { name: "Acme Corp" });
    fireEvent.click(acmeOption);

    await waitFor(() => {
      expect(principalTrigger).toHaveTextContent("Acme Corp");
    });

    // Fill minimum required fields
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/^email$/i), "john@test.com");
    await user.type(screen.getByLabelText(/organization name \*/i), "Test Org");

    // Use the combobox helper for city
    const { selectCityAndVerifyState } = await import("@/tests/utils/combobox");
    await selectCityAndVerifyState("Denver", "CO", { user, timeout: 5000 });

    // Click Save & Add Another
    await user.click(screen.getByRole("button", { name: /save & add another/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    // Principal should still be selected after form reset
    await waitFor(() => {
      expect(principalTrigger).toHaveTextContent("Acme Corp");
    });

    // Other fields should be cleared
    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
    expect(firstNameInput.value).toBe("");
  }, 20000);
});
