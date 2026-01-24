/**
 * Tests for productsCallbacks
 *
 * TDD: These tests define the expected behavior for products-specific lifecycle callbacks.
 * Products lifecycle logic:
 * 1. Soft delete (deleted_at timestamp)
 * 2. Filter cleaning with soft delete exclusion
 * 3. Computed fields from products_summary view (principal_name)
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { DataProvider, RaRecord } from "ra-core";
import type { DeleteParamsWithMeta } from "@/tests/utils/typed-mocks";
import {
  productsCallbacks,
  COMPUTED_FIELDS,
  sparseArrayToRecordTransform,
} from "./productsCallbacks";

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

  describe("beforeSave - computed fields stripping", () => {
    it("should export COMPUTED_FIELDS for reference", () => {
      expect(COMPUTED_FIELDS).toContain("principal_name");
    });

    it("should have beforeSave callback to strip computed fields", () => {
      expect(productsCallbacks.beforeSave).toBeDefined();
    });

    it("should strip principal_name computed field before save", async () => {
      const data = {
        id: 1,
        name: "Widget X",
        sku: "WX-001",
        principal_name: "ACME Corp", // This comes from products_summary view JOIN
      } as RaRecord;

      const result = await productsCallbacks.beforeSave!(data, mockDataProvider, "products");

      expect(result).not.toHaveProperty("principal_name");
      expect(result).toHaveProperty("name", "Widget X");
      expect(result).toHaveProperty("sku", "WX-001");
    });
  });

  describe("sparseArrayToRecordTransform", () => {
    it("should convert sparse array to record object", () => {
      // Simulate what React Hook Form sends with large numeric IDs
      const sparseArray: Array<{ vendor_item_number: string | null } | null> = [];
      sparseArray[10335] = { vendor_item_number: "DOT-001" };
      sparseArray[10338] = { vendor_item_number: "DOT-002" };

      const record = {
        id: 1,
        name: "Test Product",
        product_distributors: sparseArray,
      } as RaRecord;

      const result = sparseArrayToRecordTransform.apply(record);

      // Should be converted to record object with string keys
      expect(Array.isArray(result.product_distributors)).toBe(false);
      expect(result.product_distributors).toEqual({
        "10335": { vendor_item_number: "DOT-001" },
        "10338": { vendor_item_number: "DOT-002" },
      });
    });

    it("should handle null entries in sparse array", () => {
      const sparseArray: Array<{ vendor_item_number: string | null } | null> = [];
      sparseArray[100] = null;
      sparseArray[200] = { vendor_item_number: "DOT-123" };
      sparseArray[300] = undefined as unknown as null;

      const record = {
        id: 1,
        product_distributors: sparseArray,
      } as RaRecord;

      const result = sparseArrayToRecordTransform.apply(record);

      // Should only include valid entries
      expect(result.product_distributors).toEqual({
        "200": { vendor_item_number: "DOT-123" },
      });
    });

    it("should pass through if product_distributors is already an object", () => {
      const record = {
        id: 1,
        product_distributors: {
          "123": { vendor_item_number: "DOT-456" },
        },
      } as RaRecord;

      const result = sparseArrayToRecordTransform.apply(record);

      expect(result.product_distributors).toEqual({
        "123": { vendor_item_number: "DOT-456" },
      });
    });

    it("should pass through if product_distributors is not present", () => {
      const record = {
        id: 1,
        name: "Test Product",
      } as RaRecord;

      const result = sparseArrayToRecordTransform.apply(record);

      expect(result).not.toHaveProperty("product_distributors");
    });

    it("should handle empty array", () => {
      const record = {
        id: 1,
        product_distributors: [],
      } as RaRecord;

      const result = sparseArrayToRecordTransform.apply(record);

      // Empty array should become undefined (no distributors selected)
      expect(result.product_distributors).toBeUndefined();
    });

    it("should handle vendor_item_number with null value", () => {
      const sparseArray: Array<{ vendor_item_number: string | null } | null> = [];
      sparseArray[500] = { vendor_item_number: null }; // User didn't enter DOT#

      const record = {
        id: 1,
        product_distributors: sparseArray,
      } as RaRecord;

      const result = sparseArrayToRecordTransform.apply(record);

      expect(result.product_distributors).toEqual({
        "500": { vendor_item_number: null },
      });
    });
  });
});
