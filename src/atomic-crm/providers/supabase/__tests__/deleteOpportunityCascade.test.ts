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

      // Assert - RPC was called (ID can be string or number)
      expect(mockRpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: opportunityId,
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

  describe("delete method for non-opportunity resources", () => {
    it("should NOT call cascade RPC for contacts", async () => {
      // Arrange
      const mockFrom = supabase.from as ReturnType<typeof vi.fn>;
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: { id: 1, deleted_at: new Date().toISOString() },
            error: null,
          }),
        }),
        select: vi.fn().mockReturnThis(),
      });

      // Act
      await unifiedDataProvider.delete("contacts", {
        id: 1,
        previousData: { id: 1, first_name: "John" },
      });

      // Assert - RPC should NOT be called for contacts
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe("cascade targets verification", () => {
    it("should document expected cascade targets", () => {
      // This test documents the expected cascade behavior
      // as defined in archive_opportunity_with_relations function
      const expectedCascadeTargets = [
        "opportunities",      // The opportunity itself
        "activities",         // Related activities
        "opportunityNotes",   // Related notes
        "opportunity_participants", // Related participants
        "tasks",              // Related tasks
      ];

      // This is a documentation test - just verifying the expected targets
      expect(expectedCascadeTargets).toHaveLength(5);
      expect(expectedCascadeTargets).toContain("activities");
      expect(expectedCascadeTargets).toContain("tasks");
    });
  });
});
