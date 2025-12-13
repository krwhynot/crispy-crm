/**
 * usePrincipalPipeline Hook Test Suite
 *
 * Tests the principal pipeline data hook for the PrincipalPipelineTable component.
 * Critical behaviors tested:
 * - Data fetching and mapping from principal_pipeline_summary view
 * - "My Principals Only" filter behavior
 * - Momentum type mapping (increasing, steady, decreasing, stale)
 * - Loading states and error handling
 * - Edge cases: empty data, null salesId, filter changes
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePrincipalPipeline } from "../usePrincipalPipeline";
import type { PipelineSummaryRow } from "../../types";

// Create stable mock functions
const mockGetList = vi.fn();

/**
 * Mock useGetList from ra-core to control responses in tests.
 */
vi.mock("ra-core", () => ({
  useGetList: (resource: string, params: any, options?: { enabled?: boolean; staleTime?: number }) => {
    const enabled = options?.enabled !== false;
    return mockGetList(resource, params, enabled);
  },
}));

// Mock useCurrentSale hook - mutable values stored in object
const currentSaleState = {
  salesId: null as number | null,
  loading: false,
  error: null as Error | null,
};

vi.mock("../useCurrentSale", () => ({
  useCurrentSale: () => ({
    salesId: currentSaleState.salesId,
    loading: currentSaleState.loading,
    error: currentSaleState.error,
  }),
}));

// Helper to create mock pipeline summary rows
const createMockPipelineRow = (
  overrides: Partial<PipelineSummaryRow> = {}
): PipelineSummaryRow => ({
  principal_id: 1,
  principal_name: "Test Principal",
  total_pipeline: 50000,
  active_this_week: 5,
  active_last_week: 3,
  momentum: "increasing",
  next_action_summary: "Follow up on pending proposals",
  sales_id: 42,
  ...overrides,
});

describe("usePrincipalPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSaleState.salesId = 42;
    currentSaleState.loading = false;
    currentSaleState.error = null;
  });

  describe("Data Fetching", () => {
    it("should fetch all principals without filter", async () => {
      const mockData = [
        createMockPipelineRow({ principal_id: 1, principal_name: "Acme Foods" }),
        createMockPipelineRow({ principal_id: 2, principal_name: "Global Meats" }),
      ];

      mockGetList.mockResolvedValueOnce({ data: mockData, total: 2 });

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "principal_pipeline_summary",
        expect.objectContaining({
          filter: {},
          sort: { field: "active_this_week", order: "DESC" },
          pagination: { page: 1, perPage: 100 },
        })
      );
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data[0].name).toBe("Acme Foods");
    });

    it("should filter by salesId when myPrincipalsOnly is true", async () => {
      const mockData = [createMockPipelineRow({ principal_id: 1, sales_id: 42 })];
      mockGetList.mockResolvedValueOnce({ data: mockData, total: 1 });

      const { result } = renderHook(() => usePrincipalPipeline({ myPrincipalsOnly: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "principal_pipeline_summary",
        expect.objectContaining({
          filter: { sales_id: 42 },
        })
      );
      expect(result.current.data).toHaveLength(1);
    });

    it("should return empty when myPrincipalsOnly is true but no salesId", async () => {
      currentSaleState.salesId = null;

      const { result } = renderHook(() => usePrincipalPipeline({ myPrincipalsOnly: true }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).not.toHaveBeenCalled();
      expect(result.current.data).toHaveLength(0);
    });

    it("should wait for salesId loading when myPrincipalsOnly is true", async () => {
      currentSaleState.salesId = null;
      currentSaleState.loading = true;

      const { result } = renderHook(() => usePrincipalPipeline({ myPrincipalsOnly: true }));

      // When salesIdLoading is true and myPrincipalsOnly is true, the query is disabled
      // The hook's loading state comes from useGetList's isPending, which is false when disabled
      expect(result.current.loading).toBe(false);
      expect(mockGetList).not.toHaveBeenCalled();
    });
  });

  describe("Data Mapping", () => {
    it("should correctly map PipelineSummaryRow to PrincipalPipelineRow", async () => {
      const mockData = [
        createMockPipelineRow({
          principal_id: 100,
          principal_name: "Premium Produce",
          total_pipeline: 75000,
          active_this_week: 10,
          active_last_week: 8,
          momentum: "increasing",
          next_action_summary: "Schedule demo",
        }),
      ];

      mockGetList.mockResolvedValueOnce({ data: mockData, total: 1 });

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const row = result.current.data[0];
      expect(row.id).toBe(100);
      expect(row.name).toBe("Premium Produce");
      expect(row.totalPipeline).toBe(75000);
      expect(row.activeThisWeek).toBe(10);
      expect(row.activeLastWeek).toBe(8);
      expect(row.momentum).toBe("increasing");
      expect(row.nextAction).toBe("Schedule demo");
    });

    it("should handle null next_action_summary", async () => {
      const mockData = [createMockPipelineRow({ next_action_summary: null })];
      mockGetList.mockResolvedValueOnce({ data: mockData, total: 1 });

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data[0].nextAction).toBeNull();
    });
  });

  describe("Momentum Types", () => {
    it("should handle all momentum types", async () => {
      const mockData = [
        createMockPipelineRow({ principal_id: 1, momentum: "increasing" }),
        createMockPipelineRow({ principal_id: 2, momentum: "steady" }),
        createMockPipelineRow({ principal_id: 3, momentum: "decreasing" }),
        createMockPipelineRow({ principal_id: 4, momentum: "stale" }),
      ];

      mockGetList.mockResolvedValueOnce({ data: mockData, total: 4 });

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data[0].momentum).toBe("increasing");
      expect(result.current.data[1].momentum).toBe("steady");
      expect(result.current.data[2].momentum).toBe("decreasing");
      expect(result.current.data[3].momentum).toBe("stale");
    });
  });

  describe("Loading States", () => {
    it("should show loading state initially", async () => {
      mockGetList.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => usePrincipalPipeline());

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toHaveLength(0);
    });

    it("should set loading to false after fetch completes", async () => {
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle fetch errors gracefully", async () => {
      const mockError = new Error("Network error");
      mockGetList.mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Network error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty data array", async () => {
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it("should fetch without sales_id filter when myPrincipalsOnly is false", async () => {
      currentSaleState.salesId = 42;
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => usePrincipalPipeline({ myPrincipalsOnly: false }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "principal_pipeline_summary",
        expect.objectContaining({
          filter: {},
        })
      );
    });

    it("should sort by active_this_week descending", async () => {
      mockGetList.mockResolvedValueOnce({ data: [], total: 0 });

      const { result } = renderHook(() => usePrincipalPipeline());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).toHaveBeenCalledWith(
        "principal_pipeline_summary",
        expect.objectContaining({
          sort: { field: "active_this_week", order: "DESC" },
        })
      );
    });
  });
});
