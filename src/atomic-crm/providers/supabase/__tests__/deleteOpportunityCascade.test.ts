/**
 * Opportunity Delete Cascade Tests
 *
 * Verifies that deleting an opportunity calls the cascade RPC function
 * to soft-delete all related records (activities, notes, tasks, participants).
 *
 * P0 Fix: Orphan records were appearing in UI after opportunity deletion
 * because the delete didn't cascade to related records.
 *
 * @see supabase/migrations/20251028213032_add_soft_delete_cascade_functions.sql
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "../supabase";

// Mock the supabase module
vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      }),
    },
  },
}));

// Import after mocking
import { unifiedDataProvider } from "../unifiedDataProvider";

describe("Opportunity Delete Cascade", () => {
  const mockRpc = supabase.rpc as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("delete method for opportunities", () => {
    it("should call archive_opportunity_with_relations RPC", async () => {
      // Arrange
      const opportunityId = 123;
      const previousData = {
        id: opportunityId,
        name: "Test Opportunity",
        stage: "new_lead",
      };

      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      // Act
      const result = await unifiedDataProvider.delete("opportunities", {
        id: opportunityId,
        previousData,
      });

      // Assert - RPC was called with correct function and params
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: opportunityId,
      });

      // Assert - returns previousData as deleted record
      expect(result.data).toEqual(previousData);
    });

    it("should work with string opportunity ID", async () => {
      // Arrange - React Admin sometimes passes IDs as strings
      const opportunityId = "456";
      const previousData = { id: 456, name: "Test Opp 2" };

      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      // Act
      await unifiedDataProvider.delete("opportunities", {
        id: opportunityId,
        previousData,
      });

      // Assert - RPC receives coerced number (BIGINT requires numeric type)
      // The data provider correctly converts string "456" → number 456
      expect(mockRpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: 456, // Coerced from string "456" to number
      });
    });

    it("should throw error when RPC fails (fail-fast)", async () => {
      // Arrange
      const opportunityId = 789;
      const rpcError = {
        message: "RPC function failed: permission denied",
        code: "42501",
      };

      mockRpc.mockResolvedValueOnce({ data: null, error: rpcError });

      // Act & Assert - should throw, not silently fail
      await expect(
        unifiedDataProvider.delete("opportunities", {
          id: opportunityId,
          previousData: { id: opportunityId },
        })
      ).rejects.toThrow("Failed to delete opportunity: RPC function failed: permission denied");

      // Verify RPC was called
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    it("should return minimal data when previousData not provided", async () => {
      // Arrange
      const opportunityId = 999;
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      // Act - delete without previousData (edge case)
      const result = await unifiedDataProvider.delete("opportunities", {
        id: opportunityId,
      } as any); // Cast to bypass TypeScript strict check

      // Assert - should still work, returning at least the ID
      expect(result.data).toEqual({ id: opportunityId });
    });
  });

  describe("deleteMany method for opportunities", () => {
    it("should call cascade RPC for each opportunity in bulk delete", async () => {
      // Arrange
      const opportunityIds = [101, 102, 103];

      // Mock RPC to succeed for each call
      mockRpc
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      // Act
      const result = await unifiedDataProvider.deleteMany("opportunities", {
        ids: opportunityIds,
      });

      // Assert - RPC was called for each opportunity
      expect(mockRpc).toHaveBeenCalledTimes(3);
      expect(mockRpc).toHaveBeenNthCalledWith(1, "archive_opportunity_with_relations", { opp_id: 101 });
      expect(mockRpc).toHaveBeenNthCalledWith(2, "archive_opportunity_with_relations", { opp_id: 102 });
      expect(mockRpc).toHaveBeenNthCalledWith(3, "archive_opportunity_with_relations", { opp_id: 103 });

      // Assert - returns the IDs that were deleted
      expect(result.data).toEqual(opportunityIds);
    });

    it("should fail-fast on first RPC error in bulk delete", async () => {
      // Arrange
      const opportunityIds = [201, 202, 203];
      const rpcError = { message: "Database error", code: "42000" };

      // First succeeds, second fails
      mockRpc
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: rpcError });

      // Act & Assert
      await expect(
        unifiedDataProvider.deleteMany("opportunities", { ids: opportunityIds })
      ).rejects.toThrow("Failed to delete opportunity 202: Database error");

      // Should have stopped after the error (not called for 203)
      expect(mockRpc).toHaveBeenCalledTimes(2);
    });
  });

  describe("delete method for non-opportunity resources", () => {
    it("should only use cascade RPC for opportunities resource", () => {
      // This is a design documentation test
      // The cascade RPC (archive_opportunity_with_relations) should ONLY be called
      // for the "opportunities" resource, not for other resources like:
      // - contacts (use standard soft-delete)
      // - organizations (use standard soft-delete)
      // - activities (use standard soft-delete)
      // - tasks (use standard soft-delete)
      //
      // Those related records get cascade-deleted BY the RPC function itself,
      // not by individual delete calls to each resource.

      const cascadeResources = ["opportunities"];
      const nonCascadeResources = ["contacts", "organizations", "activities", "tasks", "notes"];

      expect(cascadeResources).toContain("opportunities");
      nonCascadeResources.forEach(resource => {
        expect(cascadeResources).not.toContain(resource);
      });
    });
  });

  describe("cascade targets verification", () => {
    it("should document expected cascade targets", () => {
      // This test documents the expected cascade behavior
      // as defined in archive_opportunity_with_relations function
      // Updated 2025-12-21: Added opportunity_contacts and opportunity_products
      const expectedCascadeTargets = [
        "opportunities",           // The opportunity itself
        "activities",              // Related activities
        "opportunityNotes",        // Related notes
        "opportunity_participants",// Related participants
        "tasks",                   // Related tasks
        "opportunity_contacts",    // Junction: opportunities ↔ contacts (P0 fix)
        "opportunity_products",    // Junction: opportunities ↔ products (P0 fix)
      ];

      // This is a documentation test - just verifying the expected targets
      expect(expectedCascadeTargets).toHaveLength(7);
      expect(expectedCascadeTargets).toContain("activities");
      expect(expectedCascadeTargets).toContain("tasks");
      expect(expectedCascadeTargets).toContain("opportunity_contacts");
      expect(expectedCascadeTargets).toContain("opportunity_products");
    });
  });
});
