/**
 * QuickAdd Integration Tests
 *
 * Tests the complete end-to-end flow of the Quick Add Opportunity feature,
 * including atomic transaction behavior, form validation, error handling,
 * and state management across multiple components.
 *
 * MANUAL QA CHECKLIST (iPad Testing):
 * [ ] Quick Add button visible in opportunities list header
 * [ ] Button opens dialog on click
 * [ ] Form fields render correctly on iPad
 * [ ] Campaign/Principal/Account Manager pre-fill from localStorage/identity
 * [ ] City autocomplete filters as typing
 * [ ] State auto-fills when city selected
 * [ ] Products filter by selected Principal
 * [ ] Organization autocomplete with inline creation works
 * [ ] Save & Close creates record and closes dialog
 * [ ] Save & Add Another creates record, clears form, keeps campaign/principal/account_manager
 * [ ] Success toast shows for 2 seconds
 * [ ] Error toast shows on failure, data preserved
 * [ ] Touch targets are 44x44px minimum
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import userEvent from "@testing-library/user-event";
import { QuickAddForm } from "../QuickAddForm";
import { useGetList, useGetIdentity, useDataProvider, useNotify } from "ra-core";
import { useQuickAdd } from "../useQuickAdd";

// Mock the external dependencies
vi.mock("../useQuickAdd");
vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useGetList: vi.fn(),
    useGetIdentity: vi.fn(),
    useDataProvider: vi.fn(),
    useNotify: vi.fn(),
  };
});

// renderWithAdminContext provides MemoryRouter and QueryClientProvider

/**
 * Helper to find a cmdk CommandItem by text content.
 * CommandItems have [data-slot="command-item"] attribute.
 */
function findCommandItem(text: string): HTMLElement | null {
  const items = document.querySelectorAll('[data-slot="command-item"]');
  for (const item of items) {
    if (item.textContent?.includes(text)) {
      return item as HTMLElement;
    }
  }
  return null;
}

/**
 * Helper to open a Radix UI Select dropdown.
 * Uses pointerDown because Radix relies on PointerEvent, not click.
 */
const openSelectDropdown = (trigger: HTMLElement) => {
  fireEvent.pointerDown(trigger, {
    button: 0,
    pointerType: "mouse",
    pointerId: 1,
  });
};

/**
 * Helper to select a city from the city combobox.
 * Handles the cmdk Command component pattern used by the Combobox.
 */
async function selectCity(
  cityName: string,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  // Find the city combobox trigger
  const cityTrigger = screen.getByText("Select or type city...");
  await user.click(cityTrigger);

  // Wait for and type in the search input
  const searchInput = await screen.findByPlaceholderText("Search cities...");
  await user.type(searchInput, cityName);

  // Wait for the city option to appear and click it
  await waitFor(
    () => {
      const item = findCommandItem(cityName);
      if (!item) {
        throw new Error(`City "${cityName}" not found in options`);
      }
    },
    { timeout: 5000 }
  );

  const cityItem = findCommandItem(cityName);
  if (!cityItem) {
    throw new Error(`City "${cityName}" not found after wait`);
  }
  await user.click(cityItem);
}

/**
 * Helper to change city selection when one is already selected.
 */
async function changeCity(
  currentCity: string,
  newCity: string,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  // Find the city combobox trigger (now shows current city)
  const cityTrigger = screen.getByText(currentCity);
  await user.click(cityTrigger);

  // Wait for and type in the search input
  const searchInput = await screen.findByPlaceholderText("Search cities...");
  await user.type(searchInput, newCity);

  // Wait for the city option to appear and click it
  await waitFor(
    () => {
      const item = findCommandItem(newCity);
      if (!item) {
        throw new Error(`City "${newCity}" not found in options`);
      }
    },
    { timeout: 5000 }
  );

  const cityItem = findCommandItem(newCity);
  if (!cityItem) {
    throw new Error(`City "${newCity}" not found after wait`);
  }
  await user.click(cityItem);
}

// Test data
const principals = [
  { id: 1, name: "Principal A", organization_type: "principal" },
  { id: 2, name: "Principal B", organization_type: "principal" },
];

const customerOrgs = [
  { id: 10, name: "Acme Corp", organization_type: "customer" },
  { id: 11, name: "Tech Corp", organization_type: "prospect" },
];

const salesList = [
  { id: 100, name: "John Sales", email: "john@sales.com" },
  { id: 101, name: "Jane Rep", email: "jane@sales.com" },
];

const products = [
  { id: 201, name: "Product 1", principal_id: 1 },
  { id: 202, name: "Product 2", principal_id: 2 },
  { id: 203, name: "Product 3", principal_id: 1 },
];

describe("QuickAdd Integration", () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockMutate = vi.fn();
  const mockNotify = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockDataProvider = {
    create: vi.fn().mockResolvedValue({ data: { id: 100, name: "New Org" } }),
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn((key) => {
          if (key === "last_campaign") return JSON.stringify("Test Campaign");
          if (key === "last_principal") return null; // No pre-selected principal
          if (key === "last_account_manager") return null;
          return null;
        }),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        key: vi.fn(),
      },
      writable: true,
    });

    // Setup default mocks
    (useQuickAdd as Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    // Mock useGetIdentity - returns current user
    (useGetIdentity as Mock).mockReturnValue({
      data: { id: 100, fullName: "John Sales" },
      isLoading: false,
    });

    // Mock useDataProvider for inline organization creation
    (useDataProvider as Mock).mockReturnValue(mockDataProvider);

    // Mock useNotify for toast notifications
    (useNotify as Mock).mockReturnValue(mockNotify);

    // Mock useGetList for organizations (principals and customers), sales, and products
    (useGetList as Mock).mockImplementation(
      (resource: string, params: { filter?: Record<string, unknown> }) => {
        if (resource === "organizations") {
          // Check filter to determine if this is principals or customers/prospects
          if (params?.filter?.organization_type === "principal") {
            return { data: principals, isLoading: false };
          }
          if (params?.filter?.["organization_type@in"]) {
            return { data: customerOrgs, isLoading: false };
          }
          return { data: [...principals, ...customerOrgs], isLoading: false };
        }
        if (resource === "sales") {
          return { data: salesList, isLoading: false };
        }
        if (resource === "products") {
          const principalId = params?.filter?.principal_id;
          if (principalId) {
            return {
              data: products.filter((p) => p.principal_id === principalId),
              isLoading: false,
            };
          }
          return { data: [], isLoading: false };
        }
        return { data: [], isLoading: false };
      }
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders all required form fields", async () => {
    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    // Verify all key form elements are present
    expect(screen.getByText("Organization")).toBeInTheDocument();
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Account Manager")).toBeInTheDocument();
    expect(screen.getByLabelText(/campaign/i)).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();

    // Contact section
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phone$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();

    // Location section
    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quick note/i)).toBeInTheDocument();

    // Buttons
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save & add another/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save & close/i })).toBeInTheDocument();
  });

  it("selects principal and enables products dropdown", async () => {
    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    // Initially should show message to select principal first for products
    expect(screen.getByText(/select a principal first/i)).toBeInTheDocument();

    // Select Principal A using Radix Select
    const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
    openSelectDropdown(principalTrigger);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal A" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("option", { name: "Principal A" }));

    // After selecting principal, the products multi-select should become available
    await waitFor(() => {
      expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
    });
  }, 15000);

  it("defaults account manager to current user", async () => {
    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    // Account Manager dropdown should show current user (from useGetIdentity mock)
    // The useGetIdentity returns { id: 100 } and salesList has { id: 100, name: "John Sales" }
    await waitFor(() => {
      const accountManagerTrigger = screen.getByRole("combobox", { name: /account manager/i });
      expect(accountManagerTrigger).toHaveTextContent("John Sales");
    });
  });

  it("handles Cancel button correctly", async () => {
    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("disables buttons when mutation is pending", () => {
    (useQuickAdd as Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save & add another/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /save & close/i })).toBeDisabled();
  });

  it("auto-fills state when city is selected from autocomplete", async () => {
    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    // City uses Combobox - use helper to select Chicago
    await selectCity("Chicago", user);

    // Verify state auto-filled with IL
    const stateField = screen.getByLabelText(/state/i);
    await waitFor(() => {
      expect(stateField).toHaveValue("IL");
    });

    // Test selecting another city to verify state updates - use changeCity helper
    await changeCity("Chicago", "Los Angeles", user);

    // Verify state updated to CA
    await waitFor(() => {
      expect(stateField).toHaveValue("CA");
    });
  }, 60000);

  it("pre-fills campaign from localStorage", async () => {
    // Note: This test verifies that the form reads from localStorage on mount.
    // The localStorage mock returns "Test Campaign" for last_campaign key

    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    // Verify campaign pre-filled from localStorage
    const campaignInput = screen.getByLabelText(/campaign/i) as HTMLInputElement;
    expect(campaignInput.value).toBe("Test Campaign");
  });

  it("shows opportunity name preview placeholder initially", () => {
    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    // Initially shows placeholder text when no org/principal selected
    expect(screen.getByText("Select organization and principal")).toBeInTheDocument();

    // The preview section exists
    expect(screen.getByText("Opportunity Name Preview")).toBeInTheDocument();
  });

  it("validates required fields on submit", async () => {
    // Identity must be provided so the form renders past the loading guard.
    // The component guards with `if (identityLoading || !identity?.id)` and
    // shows a skeleton if identity is missing. To test field validation we
    // need the form to render, so we provide a valid identity here.
    (useGetIdentity as Mock).mockReturnValue({
      data: { id: 100, fullName: "John Sales" },
      isLoading: false,
    });

    renderWithAdminContext(<QuickAddForm onSuccess={mockOnSuccess} />, {
      initialEntries: ["/opportunities"],
    });

    // Try to submit empty form (principal_id is required but not pre-selected)
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    await waitFor(() => {
      // Check for aria-invalid on required fields
      const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
      expect(principalTrigger).toHaveAttribute("aria-invalid", "true");
    });
  });
});
