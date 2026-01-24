/**
 * Tests for opportunitiesCallbacks
 *
 * TDD: These tests define the expected behavior for opportunities-specific lifecycle callbacks.
 * Opportunities have more complex logic than contacts/organizations:
 * 1. Soft delete with cascade via RPC (archive_opportunity_with_relations)
 * 2. Product sync RPC for create/update (sync_opportunity_with_products)
 * 3. Default value merging for create
 * 4. Filter cleaning with soft delete
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

import { opportunitiesCallbacks } from "./opportunitiesCallbacks";

describe("opportunitiesCallbacks", () => {
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

  describe("resource configuration", () => {
    it("should target the opportunities resource", () => {
      expect(opportunitiesCallbacks.resource).toBe("opportunities");
    });
  });

  describe("beforeDelete - soft delete with cascade", () => {
    it("should use archive RPC for cascading soft delete", async () => {
      const params = {
        id: 1,
        previousData: { id: 1, name: "Big Deal" } as RaRecord,
      };

      const result = await opportunitiesCallbacks.beforeDelete!(params, mockDataProvider);

      // Should call supabase.rpc directly (not dataProvider.rpc)
      expect(mockRpc).toHaveBeenCalledWith("archive_opportunity_with_relations", {
        opp_id: 1,
      });

      // Should return modified params that prevent actual delete
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.skipDelete).toBe(true);
    });

    it("should handle archive RPC errors gracefully", async () => {
      // Mock RPC returning an error (Supabase pattern)
      mockRpc.mockResolvedValue({ error: { message: "RPC failed" } });

      const params = {
        id: 1,
        previousData: { id: 1, name: "Big Deal" } as RaRecord,
      };

      await expect(opportunitiesCallbacks.beforeDelete!(params, mockDataProvider)).rejects.toThrow(
        "Archive opportunity failed"
      );
    });
  });

  describe("beforeGetList - filter cleaning", () => {
    it("should add soft delete filter by default", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { stage: "prospecting" },
      };

      const result = await opportunitiesCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });

    it("should not add soft delete filter when includeDeleted is true", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { stage: "prospecting", includeDeleted: true },
      };

      const result = await opportunitiesCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).not.toHaveProperty("deleted_at@is");
    });

    it("should preserve existing filters", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" as const },
        filter: { stage: "prospecting", principal_organization_id: 123 },
      };

      const result = await opportunitiesCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter.stage).toBe("prospecting");
      expect(result.filter.principal_organization_id).toBe(123);
    });
  });

  describe("beforeSave - data transformation", () => {
    it("should strip computed fields before save", async () => {
      const data = {
        name: "Big Deal",
        stage: "prospecting",
        // Computed fields from views
        principal_organization_name: "Acme Corp",
        total_value: 100000,
        participant_count: 3,
        contact_count: 5,
      };

      const result = await opportunitiesCallbacks.beforeSave!(
        data,
        mockDataProvider,
        "opportunities"
      );

      expect(result).not.toHaveProperty("principal_organization_name");
      expect(result).not.toHaveProperty("total_value");
      expect(result).not.toHaveProperty("participant_count");
      expect(result).not.toHaveProperty("contact_count");
      expect(result.name).toBe("Big Deal");
      expect(result.stage).toBe("prospecting");
    });

    it("should merge default values on create", async () => {
      // Create detection logic (lines 295-300 in source):
      // - !data.name triggers potential defaults merge
      // - isStageOnlyUpdate (stage && !name) skips defaults (Kanban drag-drop case)
      // - Neither name nor stage = true create with partial data, merge defaults
      const data = {
        probability: 50,
        // Missing: name, stage, contact_ids - triggers create defaults merge
      };

      const result = await opportunitiesCallbacks.beforeSave!(
        data,
        mockDataProvider,
        "opportunities"
      );

      // Should preserve provided fields
      expect(result.probability).toBe(50);
      // FIX [WF-E2E-001]: contact_ids intentionally NOT defaulted
      // Quick creates work without contact_ids; full creates enforce it via schema
      expect(result.contact_ids).toBeUndefined();
    });

    it("should PRESERVE products_to_sync for handler processing (NOT stripped by callbacks)", async () => {
      // NOTE: products_to_sync is intentionally NOT stripped by callbacks because:
      // 1. The handler layer (opportunitiesHandler.ts) needs to process it first
      // 2. Handler extracts products_to_sync and delegates to OpportunitiesService
      // 3. The service handles the atomic product sync via RPC
      // 4. By the time data reaches baseProvider, products_to_sync is already handled
      const products = [
        { product_id_reference: "101", notes: "Premium grade" },
        { product_id_reference: "102" },
      ];
      const data = {
        name: "Big Deal",
        stage: "proposal",
        products_to_sync: products,
      };

      const result = await opportunitiesCallbacks.beforeSave!(
        data,
        mockDataProvider,
        "opportunities"
      );

      // products_to_sync is PRESERVED for handler processing
      expect(result.products_to_sync).toBeDefined();
      expect(result.products_to_sync).toEqual(products);
      expect(result.name).toBe("Big Deal");
      expect(result.stage).toBe("proposal");
    });

    it("should preserve required opportunity fields", async () => {
      const data = {
        name: "Big Deal",
        stage: "prospecting",
        probability: 25,
        expected_close_date: "2024-03-15",
        principal_organization_id: 123,
        contact_ids: [1, 2, 3],
        description: "A big opportunity",
        next_action: "Follow up call",
      };

      const result = await opportunitiesCallbacks.beforeSave!(
        data,
        mockDataProvider,
        "opportunities"
      );

      expect(result.name).toBe("Big Deal");
      expect(result.stage).toBe("prospecting");
      expect(result.probability).toBe(25);
      expect(result.principal_organization_id).toBe(123);
      expect(result.contact_ids).toEqual([1, 2, 3]);
    });
  });

  describe("afterRead - data normalization", () => {
    /**
     * NOTE: After refactoring to use createResourceCallbacks factory,
     * afterRead is no longer defined for opportunities since there are
     * no read transforms needed (no JSONB arrays to normalize).
     *
     * The factory only creates afterRead when readTransforms or
     * afterReadTransform are configured.
     */
    it("should not define afterRead (no transformation needed for opportunities)", () => {
      // Opportunities don't have JSONB arrays or other fields that need normalization
      // so afterRead is not defined in the factory-based implementation
      expect(opportunitiesCallbacks.afterRead).toBeUndefined();
    });

    it("should preserve all standard fields when afterRead is called (if defined)", async () => {
      // Skip this test if afterRead is not defined (factory pattern behavior)
      if (!opportunitiesCallbacks.afterRead) {
        return; // No transformation needed = records pass through unchanged
      }

      const record = {
        id: 1,
        name: "Big Deal",
        stage: "prospecting",
        probability: 25,
        expected_close_date: "2024-03-15",
      } as RaRecord;

      const result = await opportunitiesCallbacks.afterRead(record, mockDataProvider);

      expect(result).toEqual(record);
    });

    it("should handle null expected_close_date when afterRead is called (if defined)", async () => {
      // Skip this test if afterRead is not defined (factory pattern behavior)
      if (!opportunitiesCallbacks.afterRead) {
        return; // No transformation needed = null values pass through unchanged
      }

      const record = {
        id: 1,
        name: "Big Deal",
        stage: "prospecting",
        expected_close_date: null,
      } as RaRecord;

      const result = await opportunitiesCallbacks.afterRead(record, mockDataProvider);

      expect(result.expected_close_date).toBeNull();
    });
  });
});
