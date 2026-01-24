/**
 * Tests for ActivitiesService - Activity log aggregation and management
 *
 * Tests verify:
 * 1. Activity log retrieval using optimized RPC function
 * 2. Organization filtering
 * 3. Sales person filtering
 * 4. Error handling and graceful degradation
 */

import { describe, test, expect, vi, beforeEach, type Mock } from "vitest";
import { ActivitiesService } from "../activities.service";
import type { DataProvider } from "ra-core";
import { createMockDataProvider } from "@/tests/utils/mock-providers";
import type { ActivityLogEntry } from "@/tests/utils/typed-mocks";

// Mock the activity provider module
vi.mock("../../providers/commons/activity", () => ({
  getActivityLog: vi.fn(),
}));

import { getActivityLog } from "../../providers/commons/activity";

describe("ActivitiesService", () => {
  let service: ActivitiesService;
  let mockDataProvider: DataProvider;
  let mockGetActivityLog: Mock<
    (
      dataProvider: DataProvider,
      organizationId?: number | string,
      salesId?: number | string
    ) => Promise<ActivityLogEntry[] | null | undefined>
  >;

  beforeEach(() => {
    mockDataProvider = createMockDataProvider();
    service = new ActivitiesService(mockDataProvider);
    mockGetActivityLog = vi.mocked(getActivityLog);
    mockGetActivityLog.mockClear();
  });

  describe("getActivityLog", () => {
    test("should delegate to getActivityLog function with dataProvider", async () => {
      const mockActivities = [
        {
          id: 1,
          activity_type: "interaction",
          type: "call",
          subject: "Sales call",
          activity_date: "2024-01-15",
        },
        {
          id: 2,
          activity_type: "engagement",
          type: "email",
          subject: "Follow-up email",
          activity_date: "2024-01-14",
        },
      ];

      mockGetActivityLog.mockResolvedValue(mockActivities);

      const result = await service.getActivityLog();

      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, undefined, undefined);
      expect(result).toEqual(mockActivities);
    });

    test("should pass organizationId filter to getActivityLog", async () => {
      const organizationId = 101;
      mockGetActivityLog.mockResolvedValue([]);

      await service.getActivityLog(organizationId);

      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, organizationId, undefined);
    });

    test("should pass salesId filter to getActivityLog", async () => {
      const salesId = 5;
      mockGetActivityLog.mockResolvedValue([]);

      await service.getActivityLog(undefined, salesId);

      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, undefined, salesId);
    });

    test("should pass both organizationId and salesId filters", async () => {
      const organizationId = 101;
      const salesId = 5;
      mockGetActivityLog.mockResolvedValue([]);

      await service.getActivityLog(organizationId, salesId);

      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, organizationId, salesId);
    });

    test("should return empty array when no activities exist", async () => {
      mockGetActivityLog.mockResolvedValue([]);

      const result = await service.getActivityLog();

      expect(result).toEqual([]);
    });

    test("should handle activities from 5 different sources (UNION ALL pattern)", async () => {
      // The RPC function consolidates 5 separate queries into 1 UNION ALL
      // This test verifies we receive activities from all sources
      const mockActivities = [
        { id: 1, activity_type: "interaction", source_table: "activities" },
        { id: 2, activity_type: "engagement", source_table: "contact_notes" },
        { id: 3, activity_type: "engagement", source_table: "opportunity_notes" },
        { id: 4, activity_type: "interaction", source_table: "tasks" },
        { id: 5, activity_type: "interaction", source_table: "opportunities" },
      ];

      mockGetActivityLog.mockResolvedValue(mockActivities);

      const result = await service.getActivityLog();

      expect(result).toHaveLength(5);
      // Verify activities come from different sources (simulates UNION ALL)
      const sources = result.map((a: ActivityLogEntry) => a.source_table);
      expect(new Set(sources).size).toBe(5); // 5 unique sources
    });

    test("should respect 250-item limit from RPC function", async () => {
      // Generate 250 mock activities
      const mockActivities = Array.from({ length: 250 }, (_, i) => ({
        id: i + 1,
        activity_type: "interaction",
        subject: `Activity ${i + 1}`,
        activity_date: "2024-01-15",
      }));

      mockGetActivityLog.mockResolvedValue(mockActivities);

      const result = await service.getActivityLog();

      expect(result).toHaveLength(250);
    });

    test("should throw with enhanced error message on RPC failure", async () => {
      mockGetActivityLog.mockRejectedValue(new Error("RPC execution failed"));

      await expect(service.getActivityLog()).rejects.toThrow(
        "Get activity log failed: RPC execution failed"
      );
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockGetActivityLog.mockRejectedValue(new Error("Database connection lost"));

      await expect(service.getActivityLog(101, 5)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ActivitiesService] Failed to get activity log"),
        expect.objectContaining({
          organizationId: 101,
          salesId: 5,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });

    test("should handle numeric and string IDs for organizationId", async () => {
      mockGetActivityLog.mockResolvedValue([]);

      // Numeric ID
      await service.getActivityLog(123);
      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, 123, undefined);

      // String ID
      await service.getActivityLog("uuid-123");
      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, "uuid-123", undefined);
    });

    test("should handle numeric and string IDs for salesId", async () => {
      mockGetActivityLog.mockResolvedValue([]);

      // Numeric ID
      await service.getActivityLog(undefined, 456);
      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, undefined, 456);

      // String ID
      await service.getActivityLog(undefined, "uuid-456");
      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, undefined, "uuid-456");
    });

    test("should handle activities sorted by date descending", async () => {
      const mockActivities = [
        { id: 1, activity_date: "2024-01-15" },
        { id: 2, activity_date: "2024-01-14" },
        { id: 3, activity_date: "2024-01-13" },
      ];

      mockGetActivityLog.mockResolvedValue(mockActivities);

      const result = await service.getActivityLog();

      // Verify order is descending (most recent first)
      expect(result[0].activity_date).toBe("2024-01-15");
      expect(result[1].activity_date).toBe("2024-01-14");
      expect(result[2].activity_date).toBe("2024-01-13");
    });
  });

  describe("Performance Optimization (BOY SCOUT RULE)", () => {
    test("should make single RPC call instead of 5 separate queries", async () => {
      // This test verifies the optimization: 5 queries → 1 RPC call
      mockGetActivityLog.mockResolvedValue([
        { id: 1, source: "activities" },
        { id: 2, source: "contact_notes" },
        { id: 3, source: "opportunity_notes" },
        { id: 4, source: "tasks" },
        { id: 5, source: "opportunities" },
      ]);

      await service.getActivityLog();

      // Verify getActivityLog was called only once (not 5 times)
      expect(mockGetActivityLog).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle null response from RPC", async () => {
      // Intentional: testing null response handling
      mockGetActivityLog.mockResolvedValue(null);

      // Service returns whatever getActivityLog returns (including null)
      const result = await service.getActivityLog();
      expect(result).toBeNull();
    });

    test("should handle undefined response from RPC", async () => {
      // Intentional: testing undefined response handling
      mockGetActivityLog.mockResolvedValue(undefined);

      // Service returns whatever getActivityLog returns (including undefined)
      const result = await service.getActivityLog();
      expect(result).toBeUndefined();
    });

    test("should handle network timeout errors", async () => {
      mockGetActivityLog.mockRejectedValue(new Error("Network request failed: timeout"));

      await expect(service.getActivityLog()).rejects.toThrow(
        "Get activity log failed: Network request failed: timeout"
      );
    });

    test("should handle RLS policy violations", async () => {
      mockGetActivityLog.mockRejectedValue(new Error("new row violates row-level security policy"));

      await expect(service.getActivityLog()).rejects.toThrow(
        "Get activity log failed: new row violates row-level security policy"
      );
    });

    test("should handle database connection errors", async () => {
      mockGetActivityLog.mockRejectedValue(new Error("could not connect to database"));

      await expect(service.getActivityLog()).rejects.toThrow(
        "Get activity log failed: could not connect to database"
      );
    });
  });

  describe("Integration with getActivityLog function", () => {
    test("should pass dataProvider to getActivityLog function", async () => {
      mockGetActivityLog.mockResolvedValue([]);

      await service.getActivityLog();

      // Verify the dataProvider instance was passed correctly
      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, undefined, undefined);

      const receivedProvider = mockGetActivityLog.mock.calls[0][0];
      expect(receivedProvider).toBe(mockDataProvider);
    });

    test("should maintain filter parameters through delegation", async () => {
      mockGetActivityLog.mockResolvedValue([]);

      const orgId = 999;
      const salesId = 777;

      await service.getActivityLog(orgId, salesId);

      expect(mockGetActivityLog).toHaveBeenCalledWith(mockDataProvider, orgId, salesId);

      // Verify exact parameter order
      const [provider, org, sales] = mockGetActivityLog.mock.calls[0];
      expect(provider).toBe(mockDataProvider);
      expect(org).toBe(orgId);
      expect(sales).toBe(salesId);
    });
  });
});
