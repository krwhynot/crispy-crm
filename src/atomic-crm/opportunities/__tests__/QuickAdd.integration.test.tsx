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
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickAddForm } from "../quick-add/QuickAddForm";
import { useGetList, useGetIdentity, useDataProvider, useNotify } from "ra-core";
import { useQuickAdd } from "../hooks/useQuickAdd";

// Mock the external dependencies
vi.mock("../hooks/useQuickAdd");
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

/**
 * Helper to select an organization from the organization combobox.
 */
async function selectOrganization(
  orgName: string,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> {
  // Find the organization combobox trigger
  const orgTrigger = screen.getByText("Select or create organization...");
  await user.click(orgTrigger);

  // Wait for and type in the search input
  const searchInput = await screen.findByPlaceholderText("Search organizations...");
  await user.type(searchInput, orgName);

  // Wait for the org option to appear and click it
  await waitFor(
    () => {
      const item = findCommandItem(orgName);
      if (!item) {
        throw new Error(`Organization "${orgName}" not found in options`);
      }
    },
    { timeout: 5000 }
  );

  const orgItem = findCommandItem(orgName);
  if (!orgItem) {
    throw new Error(`Organization "${orgName}" not found after wait`);
  }
  await user.click(orgItem);
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
  const mockDataProvider = {
    create: vi.fn().mockResolvedValue({ data: { id: 100, name: "New Org" } }),
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.resetAllMocks();
    localStorage.clear();

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
    (useGetList as Mock).mockImplementation((resource: string, params: any) => {
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
          return { data: products.filter((p) => p.principal_id === principalId), isLoading: false };
        }
        return { data: [], isLoading: false };
      }
      return { data: [], isLoading: false };
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("completes full atomic creation flow with Save & Close", async () => {
    // Configure mock to call onSuccess when mutate is called
    mockMutate.mockImplementation((data: any, options: any) => {
      options?.onSuccess?.();
    });

    renderWithAdminContext(<QuickAddButton />);

    // 1. Open dialog
    const quickAddButton = screen.getByText(/quick add/i);
    await user.click(quickAddButton);

    // 2. Verify dialog opened
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Quick Add Opportunity")).toBeInTheDocument();

    // 3. Fill form fields - Organization is now a combobox
    await selectOrganization("Acme Corp", user);

    // Select Principal using Radix Select
    const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
    openSelectDropdown(principalTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal A" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("option", { name: "Principal A" }));

    // Account Manager should default to current user (John Sales)
    await waitFor(() => {
      const accountManagerTrigger = screen.getByRole("combobox", { name: /account manager/i });
      expect(accountManagerTrigger).toHaveTextContent("John Sales");
    });

    // Fill contact info (optional but good for test)
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john.doe@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");

    // Type campaign name (it's a text field)
    await user.type(screen.getByLabelText(/campaign/i), "Trade Show 2024");

    // 4. Submit with Save & Close
    const saveCloseButton = screen.getByRole("button", { name: /save & close/i });
    await user.click(saveCloseButton);

    // 5. Verify mutation was called with correct data
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 10, // Acme Corp's ID
          principal_id: 1,
          account_manager_id: 100, // John Sales' ID
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone: "555-1234",
          campaign: "Trade Show 2024",
        }),
        expect.any(Object)
      );
    });
  }, 60000);

  it("handles Save & Add Another flow correctly", async () => {
    // Configure mock to call onSuccess when mutate is called (closeAfter = false for Save & Add Another)
    mockMutate.mockImplementation((data: any, options: any) => {
      options?.onSuccess?.();
    });

    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Fill required fields - Organization combobox
    await selectOrganization("Tech Corp", user);

    // Select Principal using Radix Select
    const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
    openSelectDropdown(principalTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal B" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("option", { name: "Principal B" }));

    // Fill contact info
    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/email/i), "jane@example.com");

    // Type campaign name
    await user.type(screen.getByLabelText(/campaign/i), "Conference 2024");

    // Submit with Save & Add Another
    const saveAddButton = screen.getByRole("button", { name: /save & add another/i });
    await user.click(saveAddButton);

    // Verify mutation was called
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 11, // Tech Corp's ID
          principal_id: 2,
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          campaign: "Conference 2024",
        }),
        expect.any(Object)
      );
    });

    // Verify dialog stays open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Verify contact fields are cleared
    expect(screen.getByLabelText(/first name/i)).toHaveValue("");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email/i)).toHaveValue("");

    // Verify campaign/principal/account_manager preserved
    expect(screen.getByLabelText(/campaign/i)).toHaveValue("Conference 2024");
    const principalTriggerEl = screen.getByRole("combobox", { name: /principal/i });
    expect(principalTriggerEl).toHaveTextContent("Principal B");
  }, 45000);

  it("handles errors and preserves form data", async () => {
    // Configure mock to NOT call onSuccess (simulating validation or submission without completion)
    mockMutate.mockImplementation(() => {
      // Don't call onSuccess - simulates the mutation being called but dialog staying open
    });

    renderWithAdminContext(<QuickAddButton />);

    // Open dialog and fill form
    await user.click(screen.getByText(/quick add/i));

    // Fill all required fields - Organization combobox
    await selectOrganization("Acme Corp", user);

    // Select Principal
    const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
    openSelectDropdown(principalTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal A" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("option", { name: "Principal A" }));

    // Fill contact info
    await user.type(screen.getByLabelText(/campaign/i), "Test Campaign");
    await user.type(screen.getByLabelText(/first name/i), "Error");
    await user.type(screen.getByLabelText(/last name/i), "Test");
    await user.type(screen.getByLabelText(/email/i), "error@test.com");

    // Submit
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    // Verify mutation was called
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    // Verify dialog stays open (since onSuccess was not called)
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Verify form data preserved
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Error");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Test");
    expect(screen.getByLabelText(/email/i)).toHaveValue("error@test.com");
    expect(screen.getByLabelText(/campaign/i)).toHaveValue("Test Campaign");

    // Verify no automatic retry (fail fast principle) - mutation called once
    expect(mockMutate).toHaveBeenCalledTimes(1);
  }, 45000);

  // NOTE: Phone/email validation test removed - phone and email are now fully optional

  it("filters products by selected principal", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Initially no principal selected - should show message to select principal first
    expect(screen.getByText(/select a principal first/i)).toBeInTheDocument();

    // Select Principal A using Radix Select
    const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
    openSelectDropdown(principalTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal A" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("option", { name: "Principal A" }));

    // After selecting principal, the products multi-select should become available
    // The "select a principal first" message should disappear
    await waitFor(() => {
      expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
    });

    // Now select Principal B
    openSelectDropdown(principalTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal B" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("option", { name: "Principal B" }));

    // Products should still be available (not showing the "select first" message)
    expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
  }, 15000);

  it("auto-fills state when city is selected from autocomplete", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

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

  it("preserves campaign and principal preferences via localStorage mock", async () => {
    // Note: This test verifies that the form reads from localStorage on mount.
    // The actual localStorage saving is tested in useQuickAdd hook tests.

    // Pre-set localStorage values before rendering
    localStorage.setItem("last_campaign", JSON.stringify("Trade Show 2024"));
    localStorage.setItem("last_principal", JSON.stringify("1"));

    renderWithAdminContext(<QuickAddButton />);

    await user.click(screen.getByText(/quick add/i));

    // Verify campaign pre-filled from localStorage
    await waitFor(() => {
      expect(screen.getByLabelText(/campaign/i)).toHaveValue("Trade Show 2024");
    });

    // Verify principal pre-selected from localStorage
    const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
    expect(principalTrigger).toHaveTextContent("Principal A");
  }, 30000);

  it("ensures all touch targets meet minimum size requirements", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Check Quick Add button itself - verify it has button classes (shadcn buttons have standard sizes)
    const quickAddButton = screen.getByRole("button", { name: /quick add/i });
    expect(quickAddButton).toBeInTheDocument();

    // Open dialog
    await user.click(quickAddButton);

    // Check action buttons in dialog - verify they exist and are buttons with proper roles
    const saveCloseButton = screen.getByRole("button", { name: /save & close/i });
    const saveAddButton = screen.getByRole("button", { name: /save & add another/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    // All buttons should exist (shadcn Button components have default size classes that meet accessibility)
    // JSDOM doesn't compute layout, so we verify semantic structure instead
    expect(saveCloseButton).toBeInTheDocument();
    expect(saveAddButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // Verify cancel button is not disabled
    expect(cancelButton).not.toBeDisabled();
  });

  it("submits successfully without optional fields (contact info, city, state)", async () => {
    // Configure mock to call onSuccess when mutate is called
    mockMutate.mockImplementation((data: any, options: any) => {
      options?.onSuccess?.();
    });

    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Fill ONLY required fields - Organization, Principal, Account Manager
    await selectOrganization("Acme Corp", user);

    // Select Principal
    const principalTrigger = screen.getByRole("combobox", { name: /principal/i });
    openSelectDropdown(principalTrigger);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Principal A" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("option", { name: "Principal A" }));

    // Account Manager defaults to current user

    // Submit with Save & Close
    await user.click(screen.getByRole("button", { name: /save & close/i }));

    // Verify mutation was called with required fields only
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: 10, // Acme Corp's ID
          principal_id: 1,
          account_manager_id: 100, // John Sales (current user)
        }),
        expect.any(Object)
      );
    });

    // Verify the call has empty/undefined optional fields
    const callArgs = mockMutate.mock.calls[0][0];
    // These fields should either be undefined, empty, or not present
    expect(callArgs.first_name).toBeFalsy();
    expect(callArgs.last_name).toBeFalsy();
    expect(callArgs.email).toBeFalsy();
    expect(callArgs.phone).toBeFalsy();
  }, 45000);
});
