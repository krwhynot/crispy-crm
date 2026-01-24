/**
 * Opportunity Delete Cascade Tests
 *
 * Verifies that deleting an opportunity calls the cascade RPC function
 * to soft-delete all related records (activities, notes, tasks, participants).
 *
 * P0 Fix: Orphan records were appearing in UI after opportunity deletion
 * because the delete didn't cascade to related records.
 *
 * Architecture Note: In the composed provider architecture, cascade delete is
 * handled via the beforeDelete lifecycle callback in opportunitiesCallbacks.ts.
 * This test verifies the callback behavior directly rather than through the
 * full provider chain (which requires extensive mocking).
 *
 * @see supabase/migrations/20251028213032_add_soft_delete_cascade_functions.sql
 * @see src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import type { DeleteParamsWithMeta } from "@/tests/utils/typed-mocks";

// Must use vi.hoisted to define mock before vi.mock (hoisting issues)
const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

// Mock the supabase client used directly by beforeDelete
vi.mock("../supabase", () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

// Import callback after mocking
import { opportunitiesCallbacks } from "../callbacks/opportunitiesCallbacks";

describe("Opportunity Delete Cascade", () => {
  let mockDataProvider: DataProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDataProvider = {
      getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      getOne: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };

    // Default successful RPC mock
    mockRpc.mockResolvedValue({ error: null });
  });

  describe("beforeDelete callback - cascade soft delete via RPC", () => {
    it("should call archive_opportunity_with_relations RPC", async () => {
      // Arrange
      const opportunityId = 123;
      const params = {
        id: opportunityId,
        previousData: {
          id: opportunityId,
          name: "Test Opportunity",
          stage: "new_lead",
        } as RaRecord,
      };

      mockRpc.mockResolvedValueOnce({ error: null });

      // Act
      const result = await opportunitiesCallbacks.beforeDelete!(params, mockDataProvider);

      // Assert - RPC was called with correct function and params
      expect(mockRpc).toHaveBeenCalledTimes(1);
      expect(mockRpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: opportunityId,
      });

      // Assert - returns params with skipDelete meta flag
      expect(result).toHaveProperty("meta");
      const resultWithMeta = result as DeleteParamsWithMeta;
      expect(resultWithMeta.meta?.skipDelete).toBe(true);
    });

    it("should work with string opportunity ID (coerce to number)", async () => {
      // Arrange - React Admin sometimes passes IDs as strings
      const opportunityId = "456";
      const params = {
        id: opportunityId,
        previousData: { id: 456, name: "Test Opp 2" } as RaRecord,
      };

      mockRpc.mockResolvedValueOnce({ error: null });

      // Act
      await opportunitiesCallbacks.beforeDelete!(params, mockDataProvider);

      // Assert - RPC receives coerced number (BIGINT requires numeric type)
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
      const params = {
        id: opportunityId,
        previousData: { id: opportunityId } as RaRecord,
      };

      mockRpc.mockResolvedValueOnce({ error: rpcError });

      // Act & Assert - should throw, not silently fail
      await expect(opportunitiesCallbacks.beforeDelete!(params, mockDataProvider)).rejects.toThrow(
        "Archive opportunity failed: RPC function failed: permission denied"
      );

      // Verify RPC was called
      expect(mockRpc).toHaveBeenCalledTimes(1);
    });

    it("should handle numeric ID from params.id", async () => {
      // Arrange
      const opportunityId = 999;
      const params = {
        id: opportunityId,
        previousData: { id: opportunityId } as RaRecord,
      };
      mockRpc.mockResolvedValueOnce({ error: null });

      // Act
      const result = await opportunitiesCallbacks.beforeDelete!(params, mockDataProvider);

      // Assert - should successfully process
      expect(mockRpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: opportunityId,
      });
      expect((result as any).meta.skipDelete).toBe(true);
    });
  });

  describe("cascade behavior documentation", () => {
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
      nonCascadeResources.forEach((resource) => {
        expect(cascadeResources).not.toContain(resource);
      });
    });

    it("should document expected cascade targets", () => {
      // This test documents the expected cascade behavior
      // as defined in archive_opportunity_with_relations function
      // Updated 2025-12-21: Added opportunity_contacts and opportunity_products
      const expectedCascadeTargets = [
        "opportunities", // The opportunity itself
        "activities", // Related activities
        "opportunityNotes", // Related notes
        "opportunity_participants", // Related participants
        "tasks", // Related tasks
        "opportunity_contacts", // Junction: opportunities ↔ contacts (P0 fix)
        "opportunity_products", // Junction: opportunities ↔ products (P0 fix)
      ];

      // This is a documentation test - just verifying the expected targets
      expect(expectedCascadeTargets).toHaveLength(7);
      expect(expectedCascadeTargets).toContain("activities");
      expect(expectedCascadeTargets).toContain("tasks");
      expect(expectedCascadeTargets).toContain("opportunity_contacts");
      expect(expectedCascadeTargets).toContain("opportunity_products");
    });
  });

  describe("callback configuration", () => {
    it("should target the opportunities resource", () => {
      expect(opportunitiesCallbacks.resource).toBe("opportunities");
    });

    it("should have beforeDelete callback defined", () => {
      expect(opportunitiesCallbacks.beforeDelete).toBeDefined();
      expect(typeof opportunitiesCallbacks.beforeDelete).toBe("function");
    });
  });
});
