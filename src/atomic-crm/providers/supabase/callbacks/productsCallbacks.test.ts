/**
 * Tests for productsCallbacks
 *
 * TDD: These tests define the expected behavior for products-specific lifecycle callbacks.
 * Products lifecycle logic:
 * 1. Soft delete (deleted_at timestamp)
 * 2. Filter cleaning with soft delete exclusion
 * 3. Computed fields from products_summary view (principal_name)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import { productsCallbacks, COMPUTED_FIELDS } from "./productsCallbacks";

describe("productsCallbacks", () => {
  let mockDataProvider: DataProvider;

  beforeEach(() => {
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
  });

  describe("resource configuration", () => {
    it("should target the products resource", () => {
      expect(productsCallbacks.resource).toBe("products");
    });
  });

  describe("beforeDelete - soft delete", () => {
    it("should perform soft delete via update instead of hard delete", async () => {
      const params = {
        id: 1,
        previousData: { id: 1, name: "Widget X", sku: "WX-001" } as RaRecord,
      };

      const result = await productsCallbacks.beforeDelete!(params, mockDataProvider);

      // Should call update with deleted_at
      expect(mockDataProvider.update).toHaveBeenCalledWith("products", {
        id: 1,
        data: expect.objectContaining({
          deleted_at: expect.any(String),
        }),
        previousData: params.previousData,
      });

      // Should return modified params to skip actual delete
      expect(result).toHaveProperty("meta");
      expect((result as any).meta.skipDelete).toBe(true);
    });

    it("should set deleted_at to ISO timestamp", async () => {
      const params = {
        id: 1,
        previousData: { id: 1 } as RaRecord,
      };

      await productsCallbacks.beforeDelete!(params, mockDataProvider);

      const updateCall = (mockDataProvider.update as any).mock.calls[0];
      const deletedAt = updateCall[1].data.deleted_at;

      // Should be valid ISO string
      expect(new Date(deletedAt).toISOString()).toBe(deletedAt);
    });
  });

  describe("beforeGetList - filter cleaning", () => {
    it("should add soft delete filter by default", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" as const },
        filter: { category: "Electronics" },
      };

      const result = await productsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });

    it("should not add soft delete filter when includeDeleted is true", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" as const },
        filter: { category: "Electronics", includeDeleted: true },
      };

      const result = await productsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).not.toHaveProperty("deleted_at@is");
      // Should strip the includeDeleted flag
      expect(result.filter).not.toHaveProperty("includeDeleted");
    });

    it("should preserve existing filters", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" as const },
        filter: { category: "Electronics", status: "active", principal_id: 123 },
      };

      const result = await productsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter.category).toBe("Electronics");
      expect(result.filter.status).toBe("active");
      expect(result.filter.principal_id).toBe(123);
    });

    it("should handle empty filter", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" as const },
        filter: {},
      };

      const result = await productsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });

    it("should support full-text search filter (q parameter)", async () => {
      const params = {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" as const },
        filter: { q: "widget" },
      };

      const result = await productsCallbacks.beforeGetList!(params, mockDataProvider);

      expect(result.filter.q).toBe("widget");
      expect(result.filter).toHaveProperty("deleted_at@is", null);
    });
  });

  describe("no beforeSave - products has no computed fields", () => {
    it("should not have beforeSave callback since no computed fields to strip", () => {
      // Products don't have computed fields from views
      // The factory should not add beforeSave when computedFields is empty/undefined
      expect(productsCallbacks.beforeSave).toBeUndefined();
    });
  });
});
