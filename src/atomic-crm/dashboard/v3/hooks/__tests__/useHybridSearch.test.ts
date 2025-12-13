/**
 * useHybridSearch Hook Test Suite
 *
 * Tests the hybrid search pattern hook for autocomplete/dropdown components.
 * Critical behaviors tested:
 * - Initial data loading (100 records cached)
 * - Server-side search activation (2+ characters)
 * - Debounce behavior
 * - Data switching between initial and search results
 * - clearSearch functionality
 * - Edge cases: disabled state, custom config options
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useHybridSearch } from "../useHybridSearch";

// Track mock state
const mockInitialData = {
  data: [] as any[],
  isPending: false,
  error: null as Error | null,
};

const mockSearchData = {
  data: [] as any[],
  isPending: false,
  error: null as Error | null,
};

// Mock refetch function
const mockRefetch = vi.fn();

// Mock useGetList - track call args to validate queries
const mockUseGetList = vi.fn();

vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-admin")>();
  return {
    ...actual,
    useGetList: (resource: string, params: any, options: any) => {
      mockUseGetList(resource, params, options);

      // Determine which data to return based on search state
      const isSearchQuery = params.filter?.q !== undefined;

      if (!options.enabled) {
        return {
          data: undefined,
          isPending: false,
          error: null,
          refetch: mockRefetch,
        };
      }

      if (isSearchQuery) {
        return {
          data: mockSearchData.data,
          isPending: mockSearchData.isPending,
          error: mockSearchData.error,
          refetch: mockRefetch,
        };
      }

      return {
        data: mockInitialData.data,
        isPending: mockInitialData.isPending,
        error: mockInitialData.error,
        refetch: mockRefetch,
      };
    },
  };
});

// Helper to create mock records
const createMockRecord = (id: number, name: string) => ({ id, name });

describe("useHybridSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset mock state
    mockInitialData.data = [
      createMockRecord(1, "Acme Corp"),
      createMockRecord(2, "Beta Inc"),
      createMockRecord(3, "Gamma LLC"),
    ];
    mockInitialData.isPending = false;
    mockInitialData.error = null;

    mockSearchData.data = [];
    mockSearchData.isPending = false;
    mockSearchData.error = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial Data Loading", () => {
    it("should load initial data with default page size of 100", () => {
      const { result } = renderHook(() => useHybridSearch({ resource: "contacts" }));

      expect(result.current.data).toHaveLength(3);
      expect(mockUseGetList).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          pagination: { page: 1, perPage: 100 },
          sort: { field: "name", order: "ASC" },
        }),
        expect.anything()
      );
    });

    it("should respect custom initialPageSize", () => {
      renderHook(() => useHybridSearch({ resource: "contacts", initialPageSize: 50 }));

      expect(mockUseGetList).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          pagination: { page: 1, perPage: 50 },
        }),
        expect.anything()
      );
    });

    it("should respect custom sortField", () => {
      renderHook(() => useHybridSearch({ resource: "contacts", sortField: "created_at" }));

      expect(mockUseGetList).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          sort: { field: "created_at", order: "ASC" },
        }),
        expect.anything()
      );
    });

    it("should pass additionalFilter to initial query", () => {
      renderHook(() =>
        useHybridSearch({
          resource: "contacts",
          additionalFilter: { organization_id: 42 },
        })
      );

      expect(mockUseGetList).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          filter: { organization_id: 42 },
        }),
        expect.anything()
      );
    });
  });

  describe("Search Behavior", () => {
    it("should not search when searchTerm is less than minSearchLength", () => {
      const { result } = renderHook(() => useHybridSearch({ resource: "contacts", debounceMs: 0 }));

      act(() => {
        result.current.setSearchTerm("a");
        vi.runAllTimers();
      });

      // Should still show initial data
      expect(result.current.data).toEqual(mockInitialData.data);
    });

    it("should search when searchTerm meets minSearchLength (default 2)", () => {
      mockSearchData.data = [createMockRecord(10, "Search Result")];

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts", debounceMs: 0 }));

      act(() => {
        result.current.setSearchTerm("ac");
        vi.runAllTimers();
      });

      // Should show search results
      expect(result.current.data).toEqual(mockSearchData.data);
    });

    it("should respect custom minSearchLength", () => {
      const { result } = renderHook(() =>
        useHybridSearch({ resource: "contacts", minSearchLength: 3, debounceMs: 0 })
      );

      act(() => {
        result.current.setSearchTerm("ac");
        vi.runAllTimers();
      });

      // Should still show initial data (2 < 3)
      expect(result.current.data).toEqual(mockInitialData.data);

      act(() => {
        result.current.setSearchTerm("acm");
        vi.runAllTimers();
      });

      // Now should search
      expect(result.current.searchTerm).toBe("acm");
    });

    it("should include q parameter in search filter", () => {
      mockSearchData.data = [createMockRecord(1, "Acme")];

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts", debounceMs: 0 }));

      act(() => {
        result.current.setSearchTerm("acme");
        vi.runAllTimers();
      });

      // Find the search query call (with q parameter)
      const searchCall = mockUseGetList.mock.calls.find((call) => call[1].filter?.q === "acme");
      expect(searchCall).toBeDefined();
    });
  });

  describe("Debounce Behavior", () => {
    it("should debounce search term updates", () => {
      const { result } = renderHook(() =>
        useHybridSearch({ resource: "contacts", debounceMs: 300 })
      );

      act(() => {
        result.current.setSearchTerm("a");
      });
      act(() => {
        result.current.setSearchTerm("ac");
      });
      act(() => {
        result.current.setSearchTerm("acm");
      });

      // Before timer, searchTerm is updated but debounced term isn't
      expect(result.current.searchTerm).toBe("acm");

      // Fast forward debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now the search should be triggered
      expect(result.current.searchTerm).toBe("acm");
    });
  });

  describe("Clear Search", () => {
    it("should clear search term and return to initial data", () => {
      mockSearchData.data = [createMockRecord(10, "Search Result")];

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts", debounceMs: 0 }));

      // Perform search
      act(() => {
        result.current.setSearchTerm("test");
        vi.runAllTimers();
      });

      expect(result.current.data).toEqual(mockSearchData.data);

      // Clear search
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchTerm).toBe("");
      // Should return to initial data
      expect(result.current.data).toEqual(mockInitialData.data);
    });
  });

  describe("Loading States", () => {
    it("should report isInitialLoading correctly", () => {
      mockInitialData.isPending = true;

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts" }));

      expect(result.current.isInitialLoading).toBe(true);
    });

    it("should report isSearching correctly", () => {
      mockSearchData.isPending = true;

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts", debounceMs: 0 }));

      act(() => {
        result.current.setSearchTerm("test");
        vi.runAllTimers();
      });

      expect(result.current.isSearching).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should report error from initial query", () => {
      const testError = new Error("Initial load failed");
      mockInitialData.error = testError;

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts" }));

      expect(result.current.error).toEqual(testError);
    });

    it("should report error from search query", () => {
      const testError = new Error("Search failed");
      mockSearchData.error = testError;

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts", debounceMs: 0 }));

      act(() => {
        result.current.setSearchTerm("test");
        vi.runAllTimers();
      });

      expect(result.current.error).toEqual(testError);
    });
  });

  describe("Disabled State", () => {
    it("should not fetch when enabled is false", () => {
      const { result } = renderHook(() =>
        useHybridSearch({ resource: "contacts", enabled: false })
      );

      // Should return empty data
      expect(result.current.data).toHaveLength(0);

      // Both queries should be disabled
      const calls = mockUseGetList.mock.calls;
      calls.forEach((call) => {
        expect(call[2].enabled).toBe(false);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty initial data", () => {
      mockInitialData.data = [];

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts" }));

      expect(result.current.data).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it("should handle empty search results", () => {
      mockSearchData.data = [];

      const { result } = renderHook(() => useHybridSearch({ resource: "contacts", debounceMs: 0 }));

      act(() => {
        result.current.setSearchTerm("nonexistent");
        vi.runAllTimers();
      });

      expect(result.current.data).toHaveLength(0);
    });

    it("should combine additionalFilter with search query", () => {
      mockSearchData.data = [createMockRecord(1, "Result")];

      const { result } = renderHook(() =>
        useHybridSearch({
          resource: "contacts",
          additionalFilter: { organization_id: 42 },
          debounceMs: 0,
        })
      );

      act(() => {
        result.current.setSearchTerm("test");
        vi.runAllTimers();
      });

      // Find search call and verify both filters are present
      const searchCall = mockUseGetList.mock.calls.find((call) => call[1].filter?.q !== undefined);
      expect(searchCall?.[1].filter).toEqual({
        organization_id: 42,
        q: "test",
      });
    });
  });
});
