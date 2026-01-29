import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFilteredProducts } from "../useFilteredProducts";
import type { Product } from "@/atomic-crm/types";

// Mock ra-core
const mockUseGetList = vi.fn();
vi.mock("ra-core", () => ({
  useGetList: (...args: unknown[]) => mockUseGetList(...args),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
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

// Mock product data
const mockProducts: Product[] = [
  {
    id: 1,
    name: "Product A",
    sku: "SKU-A",
    principal_id: 100,
    category: "beverages",
    status: "active",
  },
  {
    id: 2,
    name: "Product B",
    sku: "SKU-B",
    principal_id: 100,
    category: "beverages",
    status: "active",
  },
  {
    id: 3,
    name: "Product C",
    sku: "SKU-C",
    principal_id: 100,
    category: "snacks",
    status: "active",
  },
];

describe("useFilteredProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when principalId is not provided", () => {
    it("returns empty array when principalId is null", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.products).toEqual([]);
      expect(result.current.isReady).toBe(false);
      expect(result.current.isEmpty).toBe(true);
    });

    it("returns empty array when principalId is undefined", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.products).toEqual([]);
      expect(result.current.isReady).toBe(false);
      expect(result.current.isEmpty).toBe(true);
    });

    it("passes empty filter to useGetList when principalId is not provided", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useFilteredProducts(null), {
        wrapper: createWrapper(),
      });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "products",
        {
          filter: {},
          pagination: { page: 1, perPage: 200 },
          sort: { field: "name", order: "ASC" },
        },
        {
          enabled: false, // Should not fetch when no principal
        }
      );
    });

    it("sets enabled: false when principalId is not provided", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      renderHook(() => useFilteredProducts(null), {
        wrapper: createWrapper(),
      });

      // Verify enabled is false (third parameter)
      const callArgs = mockUseGetList.mock.calls[0];
      expect(callArgs[2]).toEqual({ enabled: false });
    });
  });

  describe("when principalId is provided", () => {
    it("returns products when data is available", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.isReady).toBe(true);
      expect(result.current.isEmpty).toBe(false);
    });

    it("passes correct filter to useGetList", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "products",
        {
          filter: { principal_id: 100 },
          pagination: { page: 1, perPage: 200 },
          sort: { field: "name", order: "ASC" },
        },
        {
          enabled: true,
        }
      );
    });

    it("sets enabled: true when principalId is provided", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      const callArgs = mockUseGetList.mock.calls[0];
      expect(callArgs[2]).toEqual({ enabled: true });
    });

    it("handles different principal IDs correctly", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      const { rerender } = renderHook(({ principalId }) => useFilteredProducts(principalId), {
        wrapper: createWrapper(),
        initialProps: { principalId: 100 },
      });

      // First call with principal 100
      expect(mockUseGetList).toHaveBeenCalledWith(
        "products",
        expect.objectContaining({
          filter: { principal_id: 100 },
        }),
        expect.any(Object)
      );

      vi.clearAllMocks();

      // Rerender with different principal
      rerender({ principalId: 200 });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "products",
        expect.objectContaining({
          filter: { principal_id: 200 },
        }),
        expect.any(Object)
      );
    });
  });

  describe("loading states", () => {
    it("returns isLoading: true when data is loading", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.products).toEqual([]);
    });

    it("returns isLoading: false when data has loaded", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.products).toEqual(mockProducts);
    });
  });

  describe("isEmpty flag", () => {
    it("sets isEmpty: true when no products are returned", () => {
      mockUseGetList.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isEmpty).toBe(true);
      expect(result.current.products).toEqual([]);
    });

    it("sets isEmpty: false when products are returned", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.products).toEqual(mockProducts);
    });

    it("sets isEmpty: false when loading", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      // Not empty while loading (to show loading state, not empty state)
      expect(result.current.isEmpty).toBe(false);
    });

    it("sets isEmpty: true when not loading and data is undefined", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isEmpty).toBe(true);
    });
  });

  describe("isReady flag", () => {
    it("sets isReady: true when principalId is provided", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.isReady).toBe(true);
    });

    it("sets isReady: false when principalId is null", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isReady).toBe(false);
    });

    it("sets isReady: false when principalId is undefined", () => {
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useFilteredProducts(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isReady).toBe(false);
    });
  });

  describe("error handling", () => {
    it("returns error when useGetList fails", () => {
      const mockError = new Error("Failed to fetch products");
      mockUseGetList.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBe(mockError);
      expect(result.current.products).toEqual([]);
    });
  });

  describe("pagination and sorting", () => {
    it("uses correct pagination settings (200 items per page)", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "products",
        expect.objectContaining({
          pagination: { page: 1, perPage: 200 },
        }),
        expect.any(Object)
      );
    });

    it("sorts products by name in ascending order", () => {
      mockUseGetList.mockReturnValue({
        data: mockProducts,
        isLoading: false,
        error: null,
      });

      renderHook(() => useFilteredProducts(100), {
        wrapper: createWrapper(),
      });

      expect(mockUseGetList).toHaveBeenCalledWith(
        "products",
        expect.objectContaining({
          sort: { field: "name", order: "ASC" },
        }),
        expect.any(Object)
      );
    });
  });
});
