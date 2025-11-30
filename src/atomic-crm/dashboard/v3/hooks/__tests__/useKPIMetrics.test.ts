/**
 * useKPIMetrics Hook Test Suite
 *
 * Tests the KPI metrics hook for the Dashboard Summary Header (PRD v1.9).
 * Critical behaviors tested:
 * - All 4 KPI calculations (open opportunities, overdue tasks, activities, stale deals)
 * - Promise.allSettled partial failure handling
 * - Loading states and refetch behavior
 * - Edge cases: null total, undefined data, logged out user
 * - Per-stage stale thresholds (7d/14d/21d)
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useKPIMetrics } from "../useKPIMetrics";

// Create stable mock functions
const mockGetList = vi.fn();

const stableDataProvider = {
  getList: mockGetList,
};

vi.mock("react-admin", () => ({
  useDataProvider: () => stableDataProvider,
}));

// Mock useCurrentSale hook
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

// Helper to create mock opportunities with different stages and activity dates
const createMockOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Test Opportunity",
  stage: "prospect",
  amount: 10000,
  last_activity_date: new Date().toISOString(),
  ...overrides,
});

describe("useKPIMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSaleState.salesId = 42;
    currentSaleState.loading = false;
    currentSaleState.error = null;
  });

  describe("Initial Loading State", () => {
    it("should show loading state initially", async () => {
      mockGetList.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useKPIMetrics());

      expect(result.current.loading).toBe(true);
      expect(result.current.metrics.openOpportunitiesCount).toBe(0);
    });

    it("should wait for sales loading to complete", async () => {
      currentSaleState.loading = true;
      currentSaleState.salesId = null;

      const { result } = renderHook(() => useKPIMetrics());

      expect(result.current.loading).toBe(true);
      expect(mockGetList).not.toHaveBeenCalled();
    });
  });

  describe("KPI Calculations", () => {
    it("should calculate open opportunities count", async () => {
      const opportunities = [
        createMockOpportunity({ id: 1, stage: "prospect" }),
        createMockOpportunity({ id: 2, stage: "qualified" }),
        createMockOpportunity({ id: 3, stage: "proposal" }),
      ];

      mockGetList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return Promise.resolve({ data: opportunities, total: 3 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics.openOpportunitiesCount).toBe(3);
    });

    it("should calculate overdue tasks count from total", async () => {
      mockGetList.mockImplementation((resource: string) => {
        if (resource === "tasks") {
          return Promise.resolve({ data: [], total: 5 }); // 5 overdue tasks
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics.overdueTasksCount).toBe(5);
    });

    it("should calculate activities this week from total", async () => {
      mockGetList.mockImplementation((resource: string) => {
        if (resource === "activities") {
          return Promise.resolve({ data: [], total: 12 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics.activitiesThisWeek).toBe(12);
    });

    it("should calculate stale deals based on stage thresholds", async () => {
      const now = new Date();
      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const twentyTwoDaysAgo = new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000);

      const opportunities = [
        // new_lead with 8 days no activity (stale - threshold is 7)
        createMockOpportunity({ id: 1, stage: "new_lead", last_activity_date: eightDaysAgo.toISOString() }),
        // initial_outreach with 15 days (stale - threshold is 14)
        createMockOpportunity({ id: 2, stage: "initial_outreach", last_activity_date: fifteenDaysAgo.toISOString() }),
        // feedback_logged with 22 days (stale - threshold is 21)
        createMockOpportunity({ id: 3, stage: "feedback_logged", last_activity_date: twentyTwoDaysAgo.toISOString() }),
        // prospect with recent activity (not stale)
        createMockOpportunity({ id: 4, stage: "prospect", last_activity_date: now.toISOString() }),
      ];

      mockGetList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return Promise.resolve({ data: opportunities, total: 4 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should count 3 stale deals (those exceeding their stage thresholds)
      expect(result.current.metrics.staleDealsCount).toBe(3);
    });
  });

  describe("Promise.allSettled Handling", () => {
    it("should handle partial API failures gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockGetList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return Promise.resolve({ data: [createMockOpportunity()], total: 1 });
        }
        if (resource === "tasks") {
          return Promise.reject(new Error("Tasks API failed"));
        }
        if (resource === "activities") {
          return Promise.resolve({ data: [], total: 8 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still have data from successful calls
      expect(result.current.metrics.openOpportunitiesCount).toBe(1);
      expect(result.current.metrics.activitiesThisWeek).toBe(8);
      // Failed call should default to 0
      expect(result.current.metrics.overdueTasksCount).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    it("should handle all APIs failing", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockGetList.mockRejectedValue(new Error("All APIs failed"));

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // All metrics should be 0
      expect(result.current.metrics.openOpportunitiesCount).toBe(0);
      expect(result.current.metrics.overdueTasksCount).toBe(0);
      expect(result.current.metrics.activitiesThisWeek).toBe(0);
      expect(result.current.metrics.staleDealsCount).toBe(0);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null salesId", async () => {
      currentSaleState.salesId = null;

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetList).not.toHaveBeenCalled();
      expect(result.current.metrics.openOpportunitiesCount).toBe(0);
    });

    it("should handle undefined total in response", async () => {
      mockGetList.mockImplementation((resource: string) => {
        if (resource === "tasks") {
          return Promise.resolve({ data: [], total: undefined });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics.overdueTasksCount).toBe(0);
    });

    it("should handle null last_activity_date", async () => {
      const opportunities = [
        createMockOpportunity({ id: 1, stage: "new_lead", last_activity_date: null }),
      ];

      mockGetList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return Promise.resolve({ data: opportunities, total: 1 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Null last_activity_date should be considered stale
      expect(result.current.metrics.staleDealsCount).toBe(1);
    });

    it("should handle empty data array", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics.openOpportunitiesCount).toBe(0);
      expect(result.current.metrics.staleDealsCount).toBe(0);
    });
  });

  describe("Refetch Behavior", () => {
    it("should refetch data when refetch is called", async () => {
      mockGetList.mockResolvedValue({ data: [], total: 0 });

      const { result } = renderHook(() => useKPIMetrics());

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

  describe("Stale Thresholds by Stage (PRD Section 6.3)", () => {
    it("should use 7-day threshold for new_lead stage", async () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

      const opportunities = [
        createMockOpportunity({ id: 1, stage: "new_lead", last_activity_date: sixDaysAgo.toISOString() }),
        createMockOpportunity({ id: 2, stage: "new_lead", last_activity_date: eightDaysAgo.toISOString() }),
      ];

      mockGetList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return Promise.resolve({ data: opportunities, total: 2 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Only the 8-day old one should be stale (threshold is 7)
      expect(result.current.metrics.staleDealsCount).toBe(1);
    });

    it("should use 14-day threshold for initial_outreach stage", async () => {
      const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

      const opportunities = [
        createMockOpportunity({ id: 1, stage: "initial_outreach", last_activity_date: thirteenDaysAgo.toISOString() }),
        createMockOpportunity({ id: 2, stage: "initial_outreach", last_activity_date: fifteenDaysAgo.toISOString() }),
      ];

      mockGetList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return Promise.resolve({ data: opportunities, total: 2 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Only the 15-day old one should be stale
      expect(result.current.metrics.staleDealsCount).toBe(1);
    });

    it("should use 21-day threshold for feedback_logged stage", async () => {
      const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      const twentyTwoDaysAgo = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000);

      const opportunities = [
        createMockOpportunity({ id: 1, stage: "feedback_logged", last_activity_date: twentyDaysAgo.toISOString() }),
        createMockOpportunity({ id: 2, stage: "feedback_logged", last_activity_date: twentyTwoDaysAgo.toISOString() }),
      ];

      mockGetList.mockImplementation((resource: string) => {
        if (resource === "opportunities") {
          return Promise.resolve({ data: opportunities, total: 2 });
        }
        return Promise.resolve({ data: [], total: 0 });
      });

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Only the 22-day old one should be stale
      expect(result.current.metrics.staleDealsCount).toBe(1);
    });
  });
});
