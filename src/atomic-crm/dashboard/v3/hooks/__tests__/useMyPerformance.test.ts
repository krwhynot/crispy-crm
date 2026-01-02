/**
 * useMyPerformance Hook Test Suite
 *
 * Tests the personal performance metrics hook for the dashboard widget.
 * Critical behaviors tested:
 * - All 4 performance metrics with week-over-week trends
 * - Trend calculation logic (up/down/flat, percentage)
 * - Promise.allSettled resilient parallel fetching
 * - Loading states and error handling
 * - Edge cases: null salesId, division by zero, partial failures
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type * as ReactAdmin from "react-admin";
import { useMyPerformance } from "../useMyPerformance";

// Create stable mock functions
const mockGetList = vi.fn();

const stableDataProvider = {
  getList: mockGetList,
};

vi.mock("react-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactAdmin>();
  return {
    ...actual,
    useDataProvider: () => stableDataProvider,
  };
});

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

/**
 * Helper to create mock response for getList
 * The hook makes 8 parallel calls for current and previous week data
 */
const createMockResponse = (total: number) => ({
  data: [],
  total,
});

describe("useMyPerformance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSaleState.salesId = 42;
    currentSaleState.loading = false;
    currentSaleState.error = null;
  });

  describe("Metric Fetching", () => {
    it("should fetch all 8 metric queries for current and previous week", async () => {
      // Mock all 8 queries (4 current week + 4 previous week)
      mockGetList.mockResolvedValue(createMockResponse(0));

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should make 8 calls: 4 current week + 4 previous week
      expect(mockGetList.mock.calls.length).toBe(8);

      // Verify activities query includes created_by filter (not sales_id)
      expect(mockGetList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          filter: expect.objectContaining({
            created_by: 42,
          }),
        })
      );
    });

    it("should return correct metric structure", async () => {
      // Mock: 10 activities this week, 5 last week
      mockGetList.mockImplementation((resource: string, params: any) => {
        const isThisWeek =
          params.filter["activity_date@gte"] !== undefined &&
          !params.filter["activity_date@gte"].includes("subWeeks");

        if (resource === "activities") {
          // This week = 10, last week = 5
          return Promise.resolve(createMockResponse(isThisWeek ? 10 : 5));
        }
        return Promise.resolve(createMockResponse(0));
      });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metric = result.current.metrics.activitiesThisWeek;
      expect(metric).toHaveProperty("value");
      expect(metric).toHaveProperty("previousValue");
      expect(metric).toHaveProperty("trend");
      expect(metric).toHaveProperty("direction");
    });
  });

  describe("Trend Calculations", () => {
    it("should calculate positive trend correctly", async () => {
      // Simulate: this week = 10, last week = 5 (100% increase)
      let callCount = 0;
      mockGetList.mockImplementation(() => {
        callCount++;
        // First 4 calls are current week, next 4 are previous week
        const isCurrentWeek = callCount <= 4;
        if (callCount === 1 || callCount === 5) {
          // Activities: 10 this week, 5 last week
          return Promise.resolve(createMockResponse(isCurrentWeek ? 10 : 5));
        }
        return Promise.resolve(createMockResponse(0));
      });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metric = result.current.metrics.activitiesThisWeek;
      expect(metric.value).toBe(10);
      expect(metric.previousValue).toBe(5);
      expect(metric.trend).toBe(100); // (10-5)/5 * 100 = 100%
      expect(metric.direction).toBe("up");
    });

    it("should calculate negative trend correctly", async () => {
      // Simulate: this week = 3, last week = 10 (70% decrease)
      let callCount = 0;
      mockGetList.mockImplementation(() => {
        callCount++;
        const isCurrentWeek = callCount <= 4;
        if (callCount === 1 || callCount === 5) {
          // Activities: 3 this week, 10 last week
          return Promise.resolve(createMockResponse(isCurrentWeek ? 3 : 10));
        }
        return Promise.resolve(createMockResponse(0));
      });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metric = result.current.metrics.activitiesThisWeek;
      expect(metric.value).toBe(3);
      expect(metric.previousValue).toBe(10);
      expect(metric.trend).toBe(-70); // (3-10)/10 * 100 = -70%
      expect(metric.direction).toBe("down");
    });

    it("should handle flat trend (no change)", async () => {
      // Simulate: this week = 5, last week = 5 (0% change)
      let callCount = 0;
      mockGetList.mockImplementation(() => {
        callCount++;
        if (callCount === 1 || callCount === 5) {
          return Promise.resolve(createMockResponse(5));
        }
        return Promise.resolve(createMockResponse(0));
      });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metric = result.current.metrics.activitiesThisWeek;
      expect(metric.trend).toBe(0);
      expect(metric.direction).toBe("flat");
    });

    it("should handle division by zero (previous = 0)", async () => {
      // Simulate: this week = 5, last week = 0
      let callCount = 0;
      mockGetList.mockImplementation(() => {
        callCount++;
        const isCurrentWeek = callCount <= 4;
        if (callCount === 1 || callCount === 5) {
          return Promise.resolve(createMockResponse(isCurrentWeek ? 5 : 0));
        }
        return Promise.resolve(createMockResponse(0));
      });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metric = result.current.metrics.activitiesThisWeek;
      expect(metric.value).toBe(5);
      expect(metric.previousValue).toBe(0);
      expect(metric.trend).toBe(100); // Special case: 100% when prev=0 but current>0
      expect(metric.direction).toBe("up");
    });

    it("should handle both values being zero", async () => {
      mockGetList.mockResolvedValue(createMockResponse(0));

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const metric = result.current.metrics.activitiesThisWeek;
      expect(metric.value).toBe(0);
      expect(metric.previousValue).toBe(0);
      expect(metric.trend).toBe(0);
      expect(metric.direction).toBe("flat");
    });
  });

  describe("Promise.allSettled Handling", () => {
    it("should handle partial API failures gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      let callCount = 0;
      mockGetList.mockImplementation(() => {
        callCount++;
        // Fail the first call (activities this week)
        if (callCount === 1) {
          return Promise.reject(new Error("Activities API failed"));
        }
        return Promise.resolve(createMockResponse(5));
      });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Activities should default to 0, other metrics should work
      expect(result.current.metrics.activitiesThisWeek.value).toBe(0);
      // Other metrics should still have values
      expect(result.current.metrics.tasksCompleted.value).toBe(5);

      consoleErrorSpy.mockRestore();
    });

    it("should handle all APIs failing", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockGetList.mockRejectedValue(new Error("All APIs failed"));

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // All metrics should be 0
      expect(result.current.metrics.activitiesThisWeek.value).toBe(0);
      expect(result.current.metrics.tasksCompleted.value).toBe(0);
      expect(result.current.metrics.dealsMoved.value).toBe(0);
      expect(result.current.metrics.openOpportunities.value).toBe(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Loading States", () => {
    it("should show loading state initially", async () => {
      mockGetList.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useMyPerformance());

      expect(result.current.loading).toBe(true);
      expect(result.current.metrics.activitiesThisWeek.value).toBe(0);
    });

    it("should wait for salesId loading to complete", async () => {
      currentSaleState.loading = true;
      currentSaleState.salesId = null;

      const { result } = renderHook(() => useMyPerformance());

      expect(result.current.loading).toBe(true);
      expect(mockGetList).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should return default metrics when salesId is null", async () => {
      currentSaleState.salesId = null;

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).not.toHaveBeenCalled();
      expect(result.current.metrics.activitiesThisWeek.value).toBe(0);
      expect(result.current.metrics.activitiesThisWeek.direction).toBe("flat");
    });

    it("should handle undefined total in response", async () => {
      mockGetList.mockResolvedValue({ data: [], total: undefined });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should treat undefined as 0
      expect(result.current.metrics.activitiesThisWeek.value).toBe(0);
    });
  });

  describe("Refetch Behavior", () => {
    it("should refetch data when refetch is called", async () => {
      mockGetList.mockResolvedValue(createMockResponse(5));

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialCallCount = mockGetList.mock.calls.length;

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockGetList.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe("All Metric Types", () => {
    it("should calculate all 4 metrics correctly", async () => {
      let callCount = 0;
      mockGetList.mockImplementation(() => {
        callCount++;
        // Return different values for each metric type
        // Query order: activities(cur), tasks(cur), deals(cur), open_opps(cur),
        //              activities(prev), tasks(prev), deals(prev), dashboard_snapshots
        switch (callCount) {
          case 1:
            return Promise.resolve(createMockResponse(10)); // activities this week
          case 2:
            return Promise.resolve(createMockResponse(8)); // tasks this week
          case 3:
            return Promise.resolve(createMockResponse(5)); // deals moved this week
          case 4:
            return Promise.resolve(createMockResponse(20)); // open opps this week
          case 5:
            return Promise.resolve(createMockResponse(5)); // activities last week
          case 6:
            return Promise.resolve(createMockResponse(4)); // tasks last week
          case 7:
            return Promise.resolve(createMockResponse(5)); // deals moved last week
          case 8:
            // dashboard_snapshots for open opps historical data
            return Promise.resolve({
              data: [{ open_opportunities_count: 15 }],
              total: 1,
            });
          default:
            return Promise.resolve(createMockResponse(0));
        }
      });

      const { result } = renderHook(() => useMyPerformance());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Activities: 10 this week, 5 last week = +100%
      expect(result.current.metrics.activitiesThisWeek.value).toBe(10);
      expect(result.current.metrics.activitiesThisWeek.trend).toBe(100);
      expect(result.current.metrics.activitiesThisWeek.direction).toBe("up");

      // Tasks: 8 this week, 4 last week = +100%
      expect(result.current.metrics.tasksCompleted.value).toBe(8);
      expect(result.current.metrics.tasksCompleted.trend).toBe(100);

      // Deals moved: 5 this week, 5 last week = 0%
      expect(result.current.metrics.dealsMoved.value).toBe(5);
      expect(result.current.metrics.dealsMoved.trend).toBe(0);
      expect(result.current.metrics.dealsMoved.direction).toBe("flat");

      // Open opportunities: 20 this week, 15 last week (from snapshot) = +33%
      expect(result.current.metrics.openOpportunities.value).toBe(20);
      expect(result.current.metrics.openOpportunities.trend).toBe(33); // Math.round(33.33)
      expect(result.current.metrics.openOpportunities.direction).toBe("up");
    });
  });
});
