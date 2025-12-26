import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
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

  // Test data
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
    product_ids: [101, 102],
    quick_note: "Interested in enterprise plan",
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

  test("successful creation updates localStorage", async () => {
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
  });

  test("successful creation shows success toast", async () => {
    // Setup successful response
    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(testFormData);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify success toast was shown with correct message and duration
    expect(mockNotify).toHaveBeenCalledWith("✅ Created: John Doe - Acme Corp", {
      type: "success",
      autoHideDuration: 2000,
    });
  });

  test("error shows error toast", async () => {
    // Setup error response
    const errorMessage = "Database connection failed";
    mockDataProvider.createBoothVisitor.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation
    result.current.mutate(testFormData);

    // Wait for mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error toast was shown
    expect(mockNotify).toHaveBeenCalledWith(`Failed to create booth visitor: ${errorMessage}`, {
      type: "error",
    });

    // Verify localStorage was NOT updated on error
    expect(localStorage.getItem("last_campaign")).toBeNull();
    expect(localStorage.getItem("last_principal")).toBeNull();
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

    // Verify dataProvider was called with correct data
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

  test("handles partial form data correctly", async () => {
    // Test with minimal required data (no optional fields)
    const minimalData: QuickAddInput = {
      first_name: "Jane",
      last_name: "Smith",
      phone: "555-5678", // Only phone, no email
      org_name: "Tech Inc",
      city: "San Francisco",
      state: "CA",
      campaign: "Q1 Campaign",
      principal_id: 2,
      // No product_ids or quick_note
    };

    mockDataProvider.createBoothVisitor.mockResolvedValue(successResult);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation with minimal data
    result.current.mutate(minimalData);

    // Wait for mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify localStorage was updated with minimal data (secureStorage JSON-stringifies values)
    expect(JSON.parse(localStorage.getItem("last_campaign") ?? "null")).toBe("Q1 Campaign");
    expect(JSON.parse(localStorage.getItem("last_principal") ?? "null")).toBe("2");

    // Verify success toast with minimal data
    expect(mockNotify).toHaveBeenCalledWith("✅ Created: Jane Smith - Tech Inc", {
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
  });

  test("mutateAsync throws on error", async () => {
    // Setup error response
    const error = new Error("Validation failed");
    mockDataProvider.createBoothVisitor.mockRejectedValue(error);

    const { result } = renderHook(() => useQuickAdd(), { wrapper });

    // Execute mutation with async and expect rejection
    await expect(result.current.mutateAsync(testFormData)).rejects.toThrow("Validation failed");

    // Verify error toast was still shown
    expect(mockNotify).toHaveBeenCalledWith("Failed to create booth visitor: Validation failed", {
      type: "error",
    });
  });
});
