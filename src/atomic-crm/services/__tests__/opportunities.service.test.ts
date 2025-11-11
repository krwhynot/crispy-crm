/**
 * Tests for OpportunitiesService - Core business logic for opportunity management
 *
 * Tests verify:
 * 1. Archive operations (soft delete with cascading to related records)
 * 2. Unarchive operations (restore soft-deleted opportunities)
 * 3. RPC function invocation correctness
 * 4. Error handling and logging
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { OpportunitiesService } from "../opportunities.service";
import type { DataProvider } from "ra-core";
import type { Opportunity } from "../../types";
import { createMockDataProvider, createMockOpportunity } from "@/tests/utils/mock-providers";

describe("OpportunitiesService", () => {
  let service: OpportunitiesService;
  let mockDataProvider: DataProvider & { rpc?: any };
  let mockOpportunity: Opportunity;

  beforeEach(() => {
    mockDataProvider = createMockDataProvider() as any;
    mockDataProvider.rpc = vi.fn();
    service = new OpportunitiesService(mockDataProvider);

    mockOpportunity = createMockOpportunity({
      id: 1,
      name: "Test Opportunity",
      deleted_at: null,
    });
  });

  describe("archiveOpportunity", () => {
    test("should call archive RPC function with opportunity ID", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.archiveOpportunity(mockOpportunity);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: mockOpportunity.id,
      });
    });

    test("should cascade to related records (activities, notes, participants, tasks)", async () => {
      // This test verifies the RPC function name matches the expected cascade behavior
      // The actual cascade logic is in the database RPC function
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.archiveOpportunity(mockOpportunity);

      // Verify we're calling the correct RPC function that handles cascades
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "archive_opportunity_with_relations", // "with_relations" indicates cascade
        expect.any(Object)
      );
    });

    test("should return RPC response", async () => {
      const mockResponse = {
        success: true,
        archived_count: 1,
        related_records: { activities: 5, notes: 3, participants: 2, tasks: 4 },
      };
      mockDataProvider.rpc = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.archiveOpportunity(mockOpportunity);

      expect(result).toEqual(mockResponse);
    });

    test("should throw with enhanced error message on RPC failure", async () => {
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("RPC execution failed"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: RPC execution failed"
      );
    });

    test("should handle database constraint errors gracefully", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("violates foreign key constraint"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: violates foreign key constraint"
      );
    });

    test("should work with numeric and string IDs", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Numeric ID
      await service.archiveOpportunity({ ...mockOpportunity, id: 123 });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: 123,
      });

      // String ID
      await service.archiveOpportunity({ ...mockOpportunity, id: "uuid-123" });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: "uuid-123",
      });
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("Database connection lost"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[OpportunitiesService] Failed to archive opportunity"),
        expect.objectContaining({
          opportunityId: mockOpportunity.id,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("unarchiveOpportunity", () => {
    beforeEach(() => {
      // Set opportunity as archived
      mockOpportunity.deleted_at = new Date().toISOString();
    });

    test("should call unarchive RPC function with opportunity ID", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.unarchiveOpportunity(mockOpportunity);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("unarchive_opportunity_with_relations", {
        opp_id: mockOpportunity.id,
      });
    });

    test("should cascade to related records (activities, notes, participants, tasks)", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.unarchiveOpportunity(mockOpportunity);

      // Verify we're calling the correct RPC function that handles cascades
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "unarchive_opportunity_with_relations", // "with_relations" indicates cascade
        expect.any(Object)
      );
    });

    test("should return RPC response", async () => {
      const mockResponse = {
        success: true,
        unarchived_count: 1,
        related_records: { activities: 5, notes: 3, participants: 2, tasks: 4 },
      };
      mockDataProvider.rpc = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.unarchiveOpportunity(mockOpportunity);

      expect(result).toEqual(mockResponse);
    });

    test("should throw with enhanced error message on RPC failure", async () => {
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("RPC execution failed"));

      await expect(service.unarchiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Unarchive opportunity failed: RPC execution failed"
      );
    });

    test("should handle already unarchived opportunities gracefully", async () => {
      // RPC function should be idempotent
      mockDataProvider.rpc = vi.fn().mockResolvedValue({
        success: true,
        unarchived_count: 0, // No records updated
      });

      const result = await service.unarchiveOpportunity({
        ...mockOpportunity,
        deleted_at: null, // Already unarchived
      });

      expect(result.success).toBe(true);
    });

    test("should work with numeric and string IDs", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Numeric ID
      await service.unarchiveOpportunity({ ...mockOpportunity, id: 456 });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("unarchive_opportunity_with_relations", {
        opp_id: 456,
      });

      // String ID
      await service.unarchiveOpportunity({ ...mockOpportunity, id: "uuid-456" });
      expect(mockDataProvider.rpc).toHaveBeenCalledWith("unarchive_opportunity_with_relations", {
        opp_id: "uuid-456",
      });
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("Database connection lost"));

      await expect(service.unarchiveOpportunity(mockOpportunity)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[OpportunitiesService] Failed to unarchive opportunity"),
        expect.objectContaining({
          opportunityId: mockOpportunity.id,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Archive/Unarchive Integration", () => {
    test("should support archive -> unarchive workflow", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockResolvedValueOnce({ success: true, archived_count: 1 })
        .mockResolvedValueOnce({ success: true, unarchived_count: 1 });

      // Archive
      await service.archiveOpportunity(mockOpportunity);
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "archive_opportunity_with_relations",
        expect.any(Object)
      );

      // Unarchive
      await service.unarchiveOpportunity(mockOpportunity);
      expect(mockDataProvider.rpc).toHaveBeenCalledWith(
        "unarchive_opportunity_with_relations",
        expect.any(Object)
      );

      expect(mockDataProvider.rpc).toHaveBeenCalledTimes(2);
    });

    test("should handle multiple archive operations (idempotency)", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Archive twice
      await service.archiveOpportunity(mockOpportunity);
      await service.archiveOpportunity(mockOpportunity);

      // Both should succeed (RPC should be idempotent)
      expect(mockDataProvider.rpc).toHaveBeenCalledTimes(2);
    });

    test("should handle multiple unarchive operations (idempotency)", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      // Unarchive twice
      await service.unarchiveOpportunity(mockOpportunity);
      await service.unarchiveOpportunity(mockOpportunity);

      // Both should succeed (RPC should be idempotent)
      expect(mockDataProvider.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle null RPC response gracefully", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue(null);

      const result = await service.archiveOpportunity(mockOpportunity);
      expect(result).toBeNull();
    });

    test("should handle undefined opportunity ID", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.archiveOpportunity({ ...mockOpportunity, id: undefined as any });

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: undefined,
      });
    });

    test("should handle network timeout errors", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("Network request failed: timeout"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: Network request failed: timeout"
      );
    });

    test("should handle RLS policy violations", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("new row violates row-level security policy"));

      await expect(service.archiveOpportunity(mockOpportunity)).rejects.toThrow(
        "Archive opportunity failed: new row violates row-level security policy"
      );
    });
  });
});
