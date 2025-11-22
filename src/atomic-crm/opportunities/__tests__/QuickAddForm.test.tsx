import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickAddForm } from "../QuickAddForm";
import { useQuickAdd } from "../hooks/useQuickAdd";
import { useGetList } from "ra-core";

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
      if (key === "last_campaign") return "Test Campaign";
      if (key === "last_principal") return "1";
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
    expect(screen.getByText(/principal \*/i)).toBeInTheDocument();

    // Contact section
    expect(screen.getByLabelText(/first name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();

    // Organization section
    expect(screen.getByLabelText(/organization name \*/i)).toBeInTheDocument();
    expect(screen.getByText(/city \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state \*/i)).toBeInTheDocument();

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

  it(
    "validates phone OR email requirement",
    async () => {
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
      await user.type(screen.getByLabelText(/first name \*/i), "John");
      await user.type(screen.getByLabelText(/last name \*/i), "Doe");
      await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");

      // City uses a combobox button - select a city
      const cityButton = screen.getByText("Select or type city...");
      await user.click(cityButton);
      const searchInput = await screen.findByPlaceholderText("Search cities...");
      await user.type(searchInput, "New York");
      const nyOption = await screen.findByText("New York");
      await user.click(nyOption);

      // State should auto-fill when city is selected
      await waitFor(() => {
        expect(screen.getByLabelText(/state \*/i)).toHaveValue("NY");
      });

      // Try to submit without phone or email
      await user.click(screen.getByRole("button", { name: /save & close/i }));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/phone or email required/i)).toBeInTheDocument();
      });
    },
    10000
  );

  it(
    "handles Save & Add Another correctly",
    async () => {
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
      await user.type(screen.getByLabelText(/first name \*/i), "John");
      await user.type(screen.getByLabelText(/last name \*/i), "Doe");
      await user.type(screen.getByLabelText(/^email$/i), "john@example.com");
      await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");

      // City field uses Combobox - find by placeholder text on trigger button
      const cityCombobox = screen.getByText("Select or type city...");
      await user.click(cityCombobox);

      // Type in the search input and select a city
      const searchInput = await screen.findByPlaceholderText("Search cities...");
      await user.type(searchInput, "Los Angeles");
      const laOption = await screen.findByText("Los Angeles");
      await user.click(laOption);

      // State should auto-fill when city is selected
      await waitFor(() => {
        expect(screen.getByLabelText(/state \*/i)).toHaveValue("CA");
      });

      // Click Save & Add Another
      await user.click(screen.getByRole("button", { name: /save & add another/i }));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled(); // Should not close dialog

        // Form should be reset except campaign and principal
        const firstNameInput = screen.getByLabelText(/first name \*/i) as HTMLInputElement;
        expect(firstNameInput.value).toBe("");

        const campaignInput = screen.getByLabelText(/campaign/i) as HTMLInputElement;
        expect(campaignInput.value).toBe("Test Campaign"); // Should persist
      });
    },
    10000
  );

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
    await user.type(screen.getByLabelText(/first name \*/i), "John");
    await user.type(screen.getByLabelText(/last name \*/i), "Doe");
    await user.type(screen.getByLabelText(/^phone$/i), "555-1234");
    await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");

    // City field uses Combobox - find by placeholder text on trigger button
    const cityCombobox = screen.getByText("Select or type city...");
    await user.click(cityCombobox);

    // Type in the search input and select a city
    const searchInput = await screen.findByPlaceholderText("Search cities...");
    await user.type(searchInput, "Chicago");
    const chicagoOption = await screen.findByText("Chicago");
    await user.click(chicagoOption);

    // State should auto-fill when city is selected
    await waitFor(() => {
      expect(screen.getByLabelText(/state \*/i)).toHaveValue("IL");
    });

    // Click Save & Close
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled(); // Should close dialog
    });
  });

  it("filters products by selected principal", async () => {
    userEvent.setup();

    // Mock no principal selected initially
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "last_campaign") return "Test Campaign";
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

    // TODO: Test principal selection and product filtering
    // This would require more complex mocking of Select component interactions
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
      // Check for at least some key validation messages
      expect(screen.getByText(/first name required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name required/i)).toBeInTheDocument();
      expect(screen.getByText(/organization name required/i)).toBeInTheDocument();
    });
  });

  it("clears phone/email validation when either field is filled", async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <QuickAddForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    // Fill required fields except phone/email
    await user.type(screen.getByLabelText(/first name \*/i), "John");
    await user.type(screen.getByLabelText(/last name \*/i), "Doe");
    await user.type(screen.getByLabelText(/organization name \*/i), "Acme Corp");
    await user.type(screen.getByLabelText(/state \*/i), "CA");

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
  });

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
