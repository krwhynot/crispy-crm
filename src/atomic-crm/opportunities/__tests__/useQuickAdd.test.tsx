import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useQuickAdd } from "../useQuickAdd";
import type { QuickAddInput } from "@/atomic-crm/validation/quickAdd";

// Mock React Admin hooks
vi.mock("ra-core", () => ({
  useDataProvider: vi.fn(),
  useNotify: vi.fn(),
}));

// Import mocked modules
import { useDataProvider, useNotify } from "ra-core";

describe("useQuickAdd", () => {
  let mockDataProvider: any;
  let mockNotify: ReturnType<typeof vi.fn>;
  let queryClient: QueryClient;

  // Test data with new required account_manager_id field
  const testFormData: QuickAddInput = {
    first_name: "John",
    last_name: "Doe",
    phone: "555-1234",
    email: "john@example.com",
    org_name: "Acme Corp",
    city: "New York",
    state: "NY",
    campaign: "Trade Show 2025",
    principal_id: 1,
    account_manager_id: 5,
    product_ids: [101, 102],
    quick_note: "Interested in enterprise plan",
  };

  // Test data with organization_id instead of org_name
  const testFormDataWithOrgId: QuickAddInput = {
    organization_id: 10,
    first_name: "Jane",
    last_name: "Smith",
    principal_id: 2,
    account_manager_id: 6,
    product_ids: [],
  };

  const successResult = {
    data: {
      contact_id: 1,
      organization_id: 2,
      opportunity_id: 3,
    },
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Setup mocks
    mockNotify = vi.fn();
    mockDataProvider = {
      createBoothVisitor: vi.fn(),
    };

    (useDataProvider as any).mockReturnValue(mockDataProvider);
    (useNotify as any).mockReturnValue(mockNotify);

    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Wrapper component for providing QueryClient context
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test("successful creation updates localStorage including account_manager", async () => {
    // Setup successful response
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(testFormData);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify localStorage was updated (secureStorage JSON-stringifies values)
    expect(JSON.parse(localStorage.getItem("last_campaign") ?? "null")).toBe("Trade Show 2025");
    expect(JSON.parse(localStorage.getItem("last_principal") ?? "null")).toBe("1");
    expect(JSON.parse(localStorage.getItem("last_account_manager") ?? "null")).toBe("5");
  });

  test("successful creation shows success toast with new format", async () => {
    // Setup successful response
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(testFormData);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify success toast was shown with new message format: "Created opportunity for {contact} at {org}"
    expect(mockNotify).toHaveBeenCalledWith("Created opportunity for John Doe at Acme Corp", {
      type: "success",
      autoHideDuration: 2000,
    });
  });

  test("successful creation without contact name shows org-only message", async () => {
    // Setup successful response
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const dataWithoutContactName: QuickAddInput = {
      org_name: "Tech Corp",
      principal_id: 1,
      account_manager_id: 5,
      product_ids: [],
    };

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(dataWithoutContactName);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify success toast shows org-only message when no contact name
    expect(mockNotify).toHaveBeenCalledWith("Created opportunity for Tech Corp", {
      type: "success",
      autoHideDuration: 2000,
    });
  });

  test("successful creation with organization_id uses fallback org name", async () => {
    // Setup successful response
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation with organization_id (no org_name)
    result.current.mutate(testFormDataWithOrgId);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify success toast uses "Organization" as fallback when no org_name
    expect(mockNotify).toHaveBeenCalledWith("Created opportunity for Jane Smith at Organization", {
      type: "success",
      autoHideDuration: 2000,
    });
  });

  test("error shows error toast with new message format", async () => {
    // Setup error response
    const errorMessage = "Database connection failed";
    mockDataProvider.createBoothVisitor.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(testFormData);

    // Wait for mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error toast uses "opportunity" instead of "booth visitor"
    expect(mockNotify).toHaveBeenCalledWith(`Failed to create opportunity: ${errorMessage}`, {
      type: "error",
    });

    // Verify localStorage was NOT updated on error
    expect(localStorage.getItem("last_campaign")).toBeNull();
    expect(localStorage.getItem("last_principal")).toBeNull();
    expect(localStorage.getItem("last_account_manager")).toBeNull();
  });

  test("error preserves form data (no automatic retry)", async () => {
    // Setup error response
    mockDataProvider.createBoothVisitor.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(testFormData);

    // Wait for mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify that createBoothVisitor was called only once (no retry)
    expect(mockDataProvider.createBoothVisitor).toHaveBeenCalledTimes(1);

    // The mutation should be in error state but not retrying
    expect(result.current.isError).toBe(true);
    expect(result.current.failureCount).toBe(1);
  });

  test("mutation calls dataProvider with correct data", async () => {
    // Setup successful response
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(testFormData);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify dataProvider was called with correct data including account_manager_id
    expect(mockDataProvider.createBoothVisitor).toHaveBeenCalledWith(testFormData);
  });

  test("returns mutation object with expected properties", () => {
    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Verify mutation object has expected properties
    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
    expect(result.current).toHaveProperty("isError");
    expect(result.current).toHaveProperty("isSuccess");
    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("reset");
  });

  test("handles minimal form data correctly (no optional fields)", async () => {
    // Test with minimal required data - campaign is now optional
    const minimalData: QuickAddInput = {
      org_name: "Tech Inc",
      principal_id: 2,
      account_manager_id: 7,
      product_ids: [],
    };

    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation with minimal data
    result.current.mutate(minimalData);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify localStorage was updated - campaign should NOT be set since it's undefined
    expect(localStorage.getItem("last_campaign")).toBeNull();
    expect(JSON.parse(localStorage.getItem("last_principal") ?? "null")).toBe("2");
    expect(JSON.parse(localStorage.getItem("last_account_manager") ?? "null")).toBe("7");

    // Verify success toast with minimal data (no contact name)
    expect(mockNotify).toHaveBeenCalledWith("Created opportunity for Tech Inc", {
      type: "success",
      autoHideDuration: 2000,
    });
  });

  test("handles partial contact name (first_name only)", async () => {
    const dataWithFirstNameOnly: QuickAddInput = {
      first_name: "Jane",
      org_name: "Tech Inc",
      principal_id: 2,
      account_manager_id: 7,
      product_ids: [],
    };

    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    result.current.mutate(dataWithFirstNameOnly);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should show just first name
    expect(mockNotify).toHaveBeenCalledWith("Created opportunity for Jane at Tech Inc", {
      type: "success",
      autoHideDuration: 2000,
    });
  });

  test("handles partial contact name (last_name only)", async () => {
    const dataWithLastNameOnly: QuickAddInput = {
      last_name: "Smith",
      org_name: "Tech Inc",
      principal_id: 2,
      account_manager_id: 7,
      product_ids: [],
    };

    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    result.current.mutate(dataWithLastNameOnly);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should show just last name
    expect(mockNotify).toHaveBeenCalledWith("Created opportunity for Smith at Tech Inc", {
      type: "success",
      autoHideDuration: 2000,
    });
  });

  test("mutateAsync returns result on success", async () => {
    // Setup successful response
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation with async
    const response = await result.current.mutateAsync(testFormData);

    // Verify response matches expected result
    expect(response).toEqual(successResult);

    // Verify localStorage was still updated (secureStorage JSON-stringifies values)
    expect(JSON.parse(localStorage.getItem("last_campaign") ?? "null")).toBe("Trade Show 2025");
    expect(JSON.parse(localStorage.getItem("last_principal") ?? "null")).toBe("1");
    expect(JSON.parse(localStorage.getItem("last_account_manager") ?? "null")).toBe("5");
  });

  test("mutateAsync throws on error", async () => {
    // Setup error response
    const error = new Error("Validation failed");
    mockDataProvider.createBoothVisitor.mockRejectedValue(error);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation with async and expect rejection
    await expect(result.current.mutateAsync(testFormData)).rejects.toThrow("Validation failed");

    // Verify error toast uses new "opportunity" wording
    expect(mockNotify).toHaveBeenCalledWith("Failed to create opportunity: Validation failed", {
      type: "error",
    });
  });

  test("does not persist campaign to localStorage when campaign is undefined", async () => {
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const dataWithoutCampaign: QuickAddInput = {
      org_name: "No Campaign Corp",
      principal_id: 3,
      account_manager_id: 8,
      product_ids: [],
    };

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    result.current.mutate(dataWithoutCampaign);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Campaign should not be set since it wasn't provided
    expect(localStorage.getItem("last_campaign")).toBeNull();
    // But principal and account_manager should still be set
    expect(JSON.parse(localStorage.getItem("last_principal") ?? "null")).toBe("3");
    expect(JSON.parse(localStorage.getItem("last_account_manager") ?? "null")).toBe("8");
  });
});
