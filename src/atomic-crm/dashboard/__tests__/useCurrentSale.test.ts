import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCurrentSale } from "../useCurrentSale";
import type { DataProvider } from "react-admin";
import type * as ReactAdmin from "react-admin";

// Mock Supabase - define inside factory to avoid hoisting issues
vi.mock("@/atomic-crm/providers/supabase/supabase", () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };

  return {
    supabase: mockSupabase,
  };
});

// Mock React Admin's useDataProvider - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useDataProvider: vi.fn(),
  };
});

// Import the mocks after vi.mock is set up
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import { useDataProvider } from "react-admin";
const mockSupabase = supabase as any;
const mockUseDataProvider = useDataProvider as ReturnType<typeof vi.fn>;

describe("useCurrentSale", () => {
  let mockDataProvider: Partial<DataProvider>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock data provider
    mockDataProvider = {
      getList: vi.fn(),
    };
    mockUseDataProvider.mockReturnValue(mockDataProvider);
  });

  it("should fetch sales ID using data provider", async () => {
    const mockUser = { id: "user-uuid-123", email: "test@example.com" };
    const mockSale = { id: 42, user_id: "user-uuid-123", email: "test@example.com" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (mockDataProvider.getList as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [mockSale],
      total: 1,
    });

    const { result } = renderHook(() => useCurrentSale());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.salesId).toBe(42);
    });

    // Verify it used data provider
    expect(mockDataProvider.getList).toHaveBeenCalledWith("sales", {
      filter: {
        "or@": `(user_id.eq.${mockUser.id},email.eq.${mockUser.email})`,
      },
      sort: { field: "id", order: "ASC" },
      pagination: { page: 1, perPage: 1 },
    });
  });

  it("should handle legacy users with NULL user_id by matching email", async () => {
    const mockUser = { id: "user-uuid-123", email: "legacy@example.com" };
    const mockSale = { id: 99, user_id: null, email: "legacy@example.com" };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (mockDataProvider.getList as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [mockSale],
      total: 1,
    });

    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.salesId).toBe(99);
    });

    // Should warn about NULL user_id
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("matched by email but has NULL user_id")
    );

    consoleWarnSpy.mockRestore();
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("Auth failed");

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: mockError,
    });

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    consoleErrorSpy.mockRestore();
  });
});
