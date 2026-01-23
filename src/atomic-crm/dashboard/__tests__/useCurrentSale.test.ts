import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCurrentSale } from "../useCurrentSale";
import type * as ReactAdmin from "react-admin";

// Mock React Admin's useGetIdentity - use importOriginal to preserve all exports
vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useGetIdentity: vi.fn(),
  };
});

// Import the mocks after vi.mock is set up
import { useGetIdentity } from "react-admin";
const mockUseGetIdentity = useGetIdentity as ReturnType<typeof vi.fn>;

describe("useCurrentSale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return sales ID from identity", async () => {
    const mockIdentity = {
      id: 42,
      user_id: "user-uuid-123",
      fullName: "Test User",
      role: "rep",
    };

    mockUseGetIdentity.mockReturnValue({
      data: mockIdentity,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.salesId).toBe(42);
      expect(result.current.error).toBeNull();
    });
  });

  it("should handle loading state", () => {
    mockUseGetIdentity.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useCurrentSale());

    expect(result.current.loading).toBe(true);
    expect(result.current.salesId).toBeNull();
  });

  it("should handle no identity (not authenticated)", async () => {
    mockUseGetIdentity.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.salesId).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  it("should handle errors gracefully", async () => {
    const mockError = new Error("Auth failed");

    mockUseGetIdentity.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });
  });

  it("should convert string ID to number", async () => {
    const mockIdentity = {
      id: "99", // Sometimes identity.id may come as string
      user_id: "user-uuid-123",
      fullName: "Test User",
      role: "rep",
    };

    mockUseGetIdentity.mockReturnValue({
      data: mockIdentity,
      isLoading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useCurrentSale());

    await waitFor(() => {
      expect(result.current.salesId).toBe(99);
      expect(typeof result.current.salesId).toBe("number");
    });
  });
});
