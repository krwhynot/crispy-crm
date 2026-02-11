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
import { startOfDay, subDays } from "date-fns";
import type * as ReactAdmin from "react-admin";
import { useKPIMetrics } from "../useKPIMetrics";

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
// IMPORTANT: Default stage "new_lead" is a valid active pipeline stage
const createMockOpportunity = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Test Opportunity",
  stage: "new_lead", // Must be a valid active stage for staleness tests
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
      // G1 guardrail: initial state is null (unknown), not 0
      expect(result.current.metrics.openOpportunitiesCount).toBeNull();
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
      // Use startOfDay and subDays for consistent day calculations
      // The staleness utility compares using startOfDay, so we must do the same
      const today = startOfDay(new Date());
      const eightDaysAgo = subDays(today, 8); // 8 > 7 threshold for new_lead
      const fifteenDaysAgo = subDays(today, 15); // 15 > 14 threshold for initial_outreach
      const twentyTwoDaysAgo = subDays(today, 22); // 22 > 21 threshold for feedback_logged

      const opportunities = [
        // new_lead with 8 days no activity (stale - threshold is 7)
        createMockOpportunity({
          id: 1,
          stage: "new_lead",
          last_activity_date: eightDaysAgo.toISOString(),
        }),
        // initial_outreach with 15 days (stale - threshold is 14)
        createMockOpportunity({
          id: 2,
          stage: "initial_outreach",
          last_activity_date: fifteenDaysAgo.toISOString(),
        }),
        // feedback_logged with 22 days (stale - threshold is 21)
        createMockOpportunity({
          id: 3,
          stage: "feedback_logged",
          last_activity_date: twentyTwoDaysAgo.toISOString(),
        }),
        // demo_scheduled with recent activity (not stale - valid active stage)
        createMockOpportunity({
          id: 4,
          stage: "demo_scheduled",
          last_activity_date: today.toISOString(),
        }),
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
      // G1 guardrail: failed call returns null (unknown), not 0
      expect(result.current.metrics.overdueTasksCount).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it("should handle all APIs failing", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockGetList.mockRejectedValue(new Error("All APIs failed"));

      const { result } = renderHook(() => useKPIMetrics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // G1 guardrail: all failed metrics are null (unknown), not 0
      expect(result.current.metrics.openOpportunitiesCount).toBeNull();
      expect(result.current.metrics.overdueTasksCount).toBeNull();
      expect(result.current.metrics.activitiesThisWeek).toBeNull();
      expect(result.current.metrics.staleDealsCount).toBeNull();

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
      // No user = no queries fired, metrics stay at default (null)
      expect(result.current.metrics.openOpportunitiesCount).toBeNull();
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
    // Use startOfDay and subDays for all date calculations to match hook behavior
    // The staleness utility uses Math.floor for day calculation, so we need exact day boundaries

    it("should use 7-day threshold for new_lead stage", async () => {
      const today = startOfDay(new Date());
      // 7 days ago = NOT stale (exactly at threshold, condition is > not >=)
      const sevenDaysAgo = subDays(today, 7);
      // 8 days ago = stale (8 > 7)
      const eightDaysAgo = subDays(today, 8);

      const opportunities = [
        createMockOpportunity({
          id: 1,
          stage: "new_lead",
          last_activity_date: sevenDaysAgo.toISOString(),
        }),
        createMockOpportunity({
          id: 2,
          stage: "new_lead",
          last_activity_date: eightDaysAgo.toISOString(),
        }),
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

      // Only the 8-day old one should be stale (threshold is 7, condition is >)
      expect(result.current.metrics.staleDealsCount).toBe(1);
    });

    it("should use 14-day threshold for initial_outreach stage", async () => {
      const today = startOfDay(new Date());
      // 14 days ago = NOT stale (exactly at threshold)
      const fourteenDaysAgo = subDays(today, 14);
      // 15 days ago = stale (15 > 14)
      const fifteenDaysAgo = subDays(today, 15);

      const opportunities = [
        createMockOpportunity({
          id: 1,
          stage: "initial_outreach",
          last_activity_date: fourteenDaysAgo.toISOString(),
        }),
        createMockOpportunity({
          id: 2,
          stage: "initial_outreach",
          last_activity_date: fifteenDaysAgo.toISOString(),
        }),
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
      const today = startOfDay(new Date());
      // 21 days ago = NOT stale (exactly at threshold)
      const twentyOneDaysAgo = subDays(today, 21);
      // 22 days ago = stale (22 > 21)
      const twentyTwoDaysAgo = subDays(today, 22);

      const opportunities = [
        createMockOpportunity({
          id: 1,
          stage: "feedback_logged",
          last_activity_date: twentyOneDaysAgo.toISOString(),
        }),
        createMockOpportunity({
          id: 2,
          stage: "feedback_logged",
          last_activity_date: twentyTwoDaysAgo.toISOString(),
        }),
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
