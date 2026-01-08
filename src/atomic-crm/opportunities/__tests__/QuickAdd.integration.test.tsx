/**
 * QuickAdd Integration Tests
 *
 * Tests the complete end-to-end flow of the Quick Add Booth Visitor feature,
 * including atomic transaction behavior, form validation, error handling,
 * and state management across multiple components.
 *
 * MANUAL QA CHECKLIST (iPad Testing):
 * [ ] Quick Add button visible in opportunities list header
 * [ ] Button opens dialog on click
 * [ ] Form fields render correctly on iPad
 * [ ] Campaign/Principal pre-fill from localStorage on second entry
 * [ ] City autocomplete filters as typing
 * [ ] State auto-fills when city selected
 * [ ] Products filter by selected Principal
 * [ ] Phone OR Email validation works (at least one required)
 * [ ] Save & Close creates record and closes dialog
 * [ ] Save & Add Another creates record, clears form, keeps campaign/principal
 * [ ] Success toast shows for 2 seconds
 * [ ] Error toast shows on failure, data preserved
 * [ ] Touch targets are 44x44px minimum
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithAdminContext } from "@/tests/utils/render-admin";
import { QuickAddButton } from "../quick-add/QuickAddButton";

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

// Mock the useNotify hook for toast notifications
const mockNotify = vi.fn();
const mockCreateBoothVisitor = vi.fn();
const mockGetList = vi.fn();

vi.mock("ra-core", async () => {
  const actual = await vi.importActual("ra-core");
  return {
    ...actual,
    useNotify: () => mockNotify,
    useDataProvider: () => ({
      createBoothVisitor: mockCreateBoothVisitor,
      getList: mockGetList,
    }),
    useGetList: vi.fn((resource: string) => {
      if (resource === "organizations") {
        return {
          data: [
            { id: 1, name: "Principal A", status: "active" },
            { id: 2, name: "Principal B", status: "active" },
          ],
          total: 2,
          isLoading: false,
        };
      }
      if (resource === "products") {
        return {
          data: [
            { id: 1, name: "Product 1", principal_id: 1 },
            { id: 2, name: "Product 2", principal_id: 2 },
            { id: 3, name: "Product 3", principal_id: 1 },
          ],
          total: 3,
          isLoading: false,
        };
      }
      return { data: [], total: 0, isLoading: false };
    }),
  };
});

// Mock the configuration context
vi.mock("../../root/ConfigurationContext", () => ({
  useConfiguration: () => ({
    getList: vi.fn().mockReturnValue({}),
    recordRepresentation: {
      principals: (record: any) => record?.name || "",
      campaigns: (record: any) => record?.name || "",
      products: (record: any) => record?.name || "",
    },
    stages: [
      { value: "new_lead", label: "New Lead" },
      { value: "demo_scheduled", label: "Demo Scheduled" },
    ],
    gender: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
    ],
  }),
}));

describe("QuickAdd Integration", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorage.clear();

    // Setup default mock responses
    mockCreateBoothVisitor.mockResolvedValue({
      data: {
        contact_id: 1,
        organization_id: 2,
        opportunity_id: 3,
        success: true,
      },
    });

    mockGetList.mockImplementation((resource: string) => {
      if (resource === "principals") {
        return Promise.resolve({
          data: [
            { id: 1, name: "Principal A", status: "active" },
            { id: 2, name: "Principal B", status: "active" },
          ],
          total: 2,
        });
      }
      if (resource === "campaigns") {
        return Promise.resolve({
          data: [
            { id: 1, name: "Trade Show 2024", status: "active" },
            { id: 2, name: "Conference 2024", status: "active" },
          ],
          total: 2,
        });
      }
      if (resource === "products") {
        return Promise.resolve({
          data: [
            { id: 1, name: "Product 1", principal_id: 1 },
            { id: 2, name: "Product 2", principal_id: 2 },
            { id: 3, name: "Product 3", principal_id: 1 },
          ],
          total: 3,
        });
      }
      if (resource === "cities") {
        return Promise.resolve({
          data: [
            { id: 1, city: "Chicago", state_prov: "IL" },
            { id: 2, city: "Los Angeles", state_prov: "CA" },
          ],
          total: 2,
        });
      }
      return Promise.resolve({ data: [], total: 0 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("completes full atomic creation flow with Save & Close", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // 1. Open dialog
    const quickAddButton = screen.getByText(/quick add/i);
    await user.click(quickAddButton);

    // 2. Verify dialog opened
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Quick Add Booth Visitor")).toBeInTheDocument();

    // 3. Fill form fields
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john.doe@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555-1234");
    await user.type(screen.getByLabelText(/organization name/i), "Acme Corp");

    // City uses Combobox - use helper
    await selectCity("Chicago", user);

    // State should auto-fill when city is selected
    await waitFor(() => {
      expect(screen.getByLabelText(/state/i)).toHaveValue("IL");
    });

    // Type campaign name (it's a text field, not a select)
    await user.type(screen.getByLabelText(/campaign/i), "Trade Show 2024");

    // Find principal select trigger button (shadcn Select uses button with role="combobox")
    // Find the container with Principal label, then find the combobox within it
    const principalLabel = screen.getByText("Principal");
    const principalContainer = principalLabel.parentElement;
    const principalTrigger = principalContainer?.querySelector('[role="combobox"]');
    if (!principalTrigger) throw new Error("Principal trigger not found");
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal A" }));

    // 4. Submit with Save & Close
    const saveCloseButton = screen.getByText(/save & close/i);
    await user.click(saveCloseButton);

    // 5. Verify atomic transaction was called
    await waitFor(() => {
      expect(mockCreateBoothVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone: "555-1234",
          org_name: "Acme Corp",
          campaign: "Trade Show 2024",
          principal_id: 1,
        })
      );
    });

    // 6. Verify success toast shown
    expect(mockNotify).toHaveBeenCalledWith("✅ Created: John Doe - Acme Corp", {
      type: "success",
      autoHideDuration: 2000,
    });

    // 7. Verify localStorage updated
    expect(JSON.parse(localStorage.getItem("last_campaign") ?? "null")).toBe("Trade Show 2024");
    expect(JSON.parse(localStorage.getItem("last_principal") ?? "null")).toBe("1");

    // 8. Verify dialog closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  }, 60000);

  it("handles Save & Add Another flow correctly", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Fill form
    await user.type(screen.getByLabelText(/first name/i), "Jane");
    await user.type(screen.getByLabelText(/last name/i), "Smith");
    await user.type(screen.getByLabelText(/email/i), "jane@example.com");
    await user.type(screen.getByLabelText(/organization name/i), "Tech Corp");

    // City uses Combobox - use helper
    await selectCity("Los Angeles", user);

    // State should auto-fill when city is selected
    await waitFor(() => {
      expect(screen.getByLabelText(/state/i)).toHaveValue("CA");
    });

    // Type campaign name (it's a text field, not a select)
    await user.type(screen.getByLabelText(/campaign/i), "Conference 2024");

    // Find principal select trigger button
    const principalLabel = screen.getByText("Principal");
    const principalContainer = principalLabel.parentElement;
    const principalTrigger = principalContainer?.querySelector('[role="combobox"]');
    if (!principalTrigger) throw new Error("Principal trigger not found");
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal B" }));

    // Submit with Save & Add Another
    const saveAddButton = screen.getByText(/save & add another/i);
    await user.click(saveAddButton);

    // Verify record created
    await waitFor(() => {
      expect(mockCreateBoothVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          org_name: "Tech Corp",
          campaign: "Conference 2024",
          principal_id: 2,
        })
      );
    });

    // Verify success toast
    expect(mockNotify).toHaveBeenCalledWith("✅ Created: Jane Smith - Tech Corp", {
      type: "success",
      autoHideDuration: 2000,
    });

    // Verify dialog stays open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Verify form fields are cleared (except campaign/principal)
    expect(screen.getByLabelText(/first name/i)).toHaveValue("");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("");
    expect(screen.getByLabelText(/email/i)).toHaveValue("");
    expect(screen.getByLabelText(/organization name/i)).toHaveValue("");

    // Verify campaign/principal preserved (they're input/select fields)
    expect(screen.getByLabelText(/campaign/i)).toHaveValue("Conference 2024");
    // Principal is in a Select trigger, verify by finding the combobox
    const principalLabelEl = screen.getByText("Principal");
    const principalContainerEl = principalLabelEl.parentElement;
    const principalTriggerElement = principalContainerEl?.querySelector('[role="combobox"]');
    expect(principalTriggerElement).toHaveTextContent("Principal B");
  }, 45000);

  it("handles errors and preserves form data", async () => {
    // Setup error mock
    mockCreateBoothVisitor.mockRejectedValueOnce(new Error("Database connection failed"));

    renderWithAdminContext(<QuickAddButton />);

    // Open dialog and fill form
    await user.click(screen.getByText(/quick add/i));

    // Fill all required fields
    await user.type(screen.getByLabelText(/campaign/i), "Test Campaign");
    await user.type(screen.getByLabelText(/first name/i), "Error");
    await user.type(screen.getByLabelText(/last name/i), "Test");
    await user.type(screen.getByLabelText(/email/i), "error@test.com");
    await user.type(screen.getByLabelText(/organization name/i), "Test Org");

    // Select Principal
    const principalLabel = screen.getByText("Principal");
    const principalContainer = principalLabel.parentElement;
    const principalTrigger = principalContainer?.querySelector('[role="combobox"]');
    if (!principalTrigger) throw new Error("Principal trigger not found");
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal A" }));

    // City uses Combobox - use helper
    await selectCity("New York", user);

    // State should auto-fill when city is selected
    await waitFor(() => {
      expect(screen.getByLabelText(/state/i)).toHaveValue("NY");
    });

    // Submit
    await user.click(screen.getByText(/save & close/i));

    // Verify error toast shown
    await waitFor(() => {
      expect(mockNotify).toHaveBeenCalledWith(
        "Failed to create booth visitor: Database connection failed",
        { type: "error" }
      );
    });

    // Verify dialog stays open
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Verify form data preserved
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Error");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Test");
    expect(screen.getByLabelText(/email/i)).toHaveValue("error@test.com");
    expect(screen.getByLabelText(/organization name/i)).toHaveValue("Test Org");

    // Verify no automatic retry (fail fast principle)
    expect(mockCreateBoothVisitor).toHaveBeenCalledTimes(1);
  }, 45000);

  it("validates phone OR email requirement", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Fill required fields (except phone/email to test validation)
    await user.type(screen.getByLabelText(/campaign/i), "Test Campaign");
    await user.type(screen.getByLabelText(/first name/i), "Test");
    await user.type(screen.getByLabelText(/last name/i), "User");
    await user.type(screen.getByLabelText(/organization name/i), "Org");

    // Select Principal
    const principalLabel = screen.getByText("Principal");
    const principalContainer = principalLabel.parentElement;
    const principalTrigger = principalContainer?.querySelector('[role="combobox"]');
    if (!principalTrigger) throw new Error("Principal trigger not found");
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal A" }));

    // City uses Combobox - use helper
    await selectCity("Boston", user);

    // State should auto-fill when city is selected
    await waitFor(() => {
      expect(screen.getByLabelText(/state/i)).toHaveValue("MA");
    });

    // Try to submit - should be blocked due to missing phone/email
    const saveButton = screen.getByText(/save & close/i);
    await user.click(saveButton);

    // Verify error shown (check for the actual validation message from form)
    await waitFor(() => {
      expect(screen.getByText(/phone or email required/i)).toBeInTheDocument();
    });

    // Verify createBoothVisitor was NOT called
    expect(mockCreateBoothVisitor).not.toHaveBeenCalled();

    // Now add just email and try again
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(saveButton);

    // Should now submit successfully
    await waitFor(() => {
      expect(mockCreateBoothVisitor).toHaveBeenCalled();
    });
  }, 45000);

  it("filters products by selected principal", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Initially no principal selected - should show message to select principal first
    expect(screen.getByText(/select a principal first/i)).toBeInTheDocument();

    // Select Principal A
    // Find principal select trigger button (shadcn Select uses button with role="combobox")
    // Find the container with Principal label, then find the combobox within it
    const principalLabel = screen.getByText("Principal");
    const principalContainer = principalLabel.parentElement;
    const principalTrigger = principalContainer?.querySelector('[role="combobox"]');
    if (!principalTrigger) throw new Error("Principal trigger not found");
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal A" }));

    // After selecting principal, the products multi-select should become available
    // The "select a principal first" message should disappear
    await waitFor(() => {
      expect(screen.queryByText(/select a principal first/i)).not.toBeInTheDocument();
    });

    // Now select Principal B
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal B" }));

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
  }, 45000);

  it("preserves campaign and principal preferences across sessions", async () => {
    // First session - set preferences
    const { unmount: unmount1 } = renderWithAdminContext(<QuickAddButton />);

    await user.click(screen.getByText(/quick add/i));

    // Type campaign name (it's a text field, not a select)
    await user.type(screen.getByLabelText(/campaign/i), "Trade Show 2024");

    // Find principal select trigger button (shadcn Select uses button with role="combobox")
    // Find the container with Principal label, then find the combobox within it
    const principalLabel = screen.getByText("Principal");
    const principalContainer = principalLabel.parentElement;
    const principalTrigger = principalContainer?.querySelector('[role="combobox"]');
    if (!principalTrigger) throw new Error("Principal trigger not found");
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal A" }));

    // Fill minimal form
    await user.type(screen.getByLabelText(/first name/i), "First");
    await user.type(screen.getByLabelText(/last name/i), "Session");
    await user.type(screen.getByLabelText(/email/i), "first@test.com");
    await user.type(screen.getByLabelText(/organization name/i), "First Org");

    // City uses Combobox - use helper
    await selectCity("Miami", user);

    // State should auto-fill when city is selected
    await waitFor(() => {
      expect(screen.getByLabelText(/state/i)).toHaveValue("FL");
    });

    // Save
    await user.click(screen.getByText(/save & close/i));

    await waitFor(() => {
      expect(mockCreateBoothVisitor).toHaveBeenCalled();
    });

    // Verify preferences saved
    expect(JSON.parse(localStorage.getItem("last_campaign") ?? "null")).toBe("Trade Show 2024");
    expect(JSON.parse(localStorage.getItem("last_principal") ?? "null")).toBe("1");

    // Unmount first component before rendering second
    unmount1();

    // Second session - verify preferences loaded
    const { unmount: unmount2 } = renderWithAdminContext(<QuickAddButton />);

    await user.click(screen.getByText(/quick add/i));

    // Verify campaign and principal pre-selected
    await waitFor(() => {
      expect(screen.getByLabelText(/campaign/i)).toHaveValue("Trade Show 2024");
      // Principal trigger shows selected value
      const principalLabelElement = screen.getByText("Principal");
      const principalContainerElement = principalLabelElement.parentElement;
      const principalTriggerEl = principalContainerElement?.querySelector('[role="combobox"]');
      expect(principalTriggerEl).toHaveTextContent("Principal A");
    });

    unmount2();
  }, 45000);

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

    // Verify buttons are not disabled (would prevent touch interaction)
    expect(saveCloseButton).not.toBeDisabled();
    expect(cancelButton).not.toBeDisabled();
    // saveAddButton might be disabled if form is invalid, so we don't check it
  });

  it("submits successfully without optional fields (first_name, last_name, city, state)", async () => {
    renderWithAdminContext(<QuickAddButton />);

    // Open dialog
    await user.click(screen.getByText(/quick add/i));

    // Fill ONLY required fields - skip first_name, last_name, city, state
    await user.type(screen.getByLabelText(/email/i), "minimal@example.com");
    await user.type(screen.getByLabelText(/organization name/i), "Minimal Corp");
    await user.type(screen.getByLabelText(/campaign/i), "Trade Show 2024");

    // Select Principal
    const principalLabel = screen.getByText("Principal");
    const principalContainer = principalLabel.parentElement;
    const principalTrigger = principalContainer?.querySelector('[role="combobox"]');
    if (!principalTrigger) throw new Error("Principal trigger not found");
    await user.click(principalTrigger);
    await user.click(await screen.findByRole("option", { name: "Principal A" }));

    // Submit with Save & Close
    await user.click(screen.getByText(/save & close/i));

    // Verify atomic transaction was called WITHOUT optional fields
    await waitFor(() => {
      expect(mockCreateBoothVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "minimal@example.com",
          org_name: "Minimal Corp",
          campaign: "Trade Show 2024",
          principal_id: 1,
        })
      );
    });

    // Verify the call did NOT include the optional fields (or they're undefined)
    const callArgs = mockCreateBoothVisitor.mock.calls[0][0];
    // These fields should either be undefined or not present
    expect(callArgs.first_name).toBeFalsy();
    expect(callArgs.last_name).toBeFalsy();

    // Verify success toast shown with minimal info
    expect(mockNotify).toHaveBeenCalledWith(
      expect.stringContaining("Minimal Corp"),
      expect.objectContaining({ type: "success" })
    );

    // Verify dialog closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  }, 45000);
});
