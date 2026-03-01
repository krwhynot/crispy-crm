/**
 * Tests for productDistributorsHandler
 *
 * TDD: These tests verify the composed product_distributors DataProvider handler
 * which combines:
 * 1. Custom handler with composite key logic (product_id-distributor_id)
 * 2. withValidation for Zod schema validation
 * 3. withErrorLogging for structured error handling + Sentry
 *
 * Product distributors use HARD DELETE (not soft delete) — junction records
 * are truly removed. No withLifecycleCallbacks or withSkipDelete needed.
 *
 * Engineering Constitution: Service layer for composite key orchestration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createProductDistributorsHandler } from "./productDistributorsHandler";
import {
  parseCompositeId,
  createCompositeId,
} from "@/atomic-crm/services/productDistributors.service";

describe("productDistributorsHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [
          {
            product_id: 1,
            distributor_id: 2,
            vendor_item_number: "VIN-001",
            status: "active",
          },
        ],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: {
          product_id: 1,
          distributor_id: 2,
          vendor_item_number: "VIN-001",
          status: "active",
        },
      }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({
        data: { product_id: 1, distributor_id: 2 },
      }),
      update: vi.fn().mockResolvedValue({
        data: { product_id: 1, distributor_id: 2 },
      }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({
        data: { product_id: 1, distributor_id: 2 },
      }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };
  });

  describe("factory function", () => {
    it("should create a DataProvider with all standard methods", () => {
      const handler = createProductDistributorsHandler(mockBaseProvider);

      expect(handler.getList).toBeDefined();
      expect(handler.getOne).toBeDefined();
      expect(handler.getMany).toBeDefined();
      expect(handler.getManyReference).toBeDefined();
      expect(handler.create).toBeDefined();
      expect(handler.update).toBeDefined();
      expect(handler.updateMany).toBeDefined();
      expect(handler.delete).toBeDefined();
      expect(handler.deleteMany).toBeDefined();
    });

    it("should return a valid DataProvider type", () => {
      const handler = createProductDistributorsHandler(mockBaseProvider);

      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composite ID handling", () => {
    it("should parse composite IDs correctly", () => {
      const { product_id, distributor_id } = parseCompositeId("10-20");
      expect(product_id).toBe(10);
      expect(distributor_id).toBe(20);
    });

    it("should create composite IDs correctly", () => {
      const id = createCompositeId(10, 20);
      expect(id).toBe("10-20");
    });

    it("should round-trip composite IDs", () => {
      const originalProductId = 42;
      const originalDistributorId = 99;

      const compositeId = createCompositeId(originalProductId, originalDistributorId);
      const { product_id, distributor_id } = parseCompositeId(compositeId);

      expect(product_id).toBe(originalProductId);
      expect(distributor_id).toBe(originalDistributorId);
    });

    it("should throw on invalid composite ID format", () => {
      expect(() => parseCompositeId("invalid")).toThrow();
    });
  });

  describe("getList uses summary view", () => {
    it("should query product_distributors_summary instead of base table", async () => {
      const handler = createProductDistributorsHandler(mockBaseProvider);

      await handler.getList("product_distributors", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "product_id", order: "ASC" },
        filter: {},
      });

      // Should query the summary view, not the base table
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "product_distributors_summary",
        expect.objectContaining({
          pagination: { page: 1, perPage: 10 },
        })
      );
    });

    it("should add composite IDs to returned records", async () => {
      mockBaseProvider.getList = vi.fn().mockResolvedValue({
        data: [
          { product_id: 1, distributor_id: 2, status: "active" },
          { product_id: 3, distributor_id: 4, status: "pending" },
        ],
        total: 2,
      });

      const handler = createProductDistributorsHandler(mockBaseProvider);

      const result = await handler.getList("product_distributors", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "product_id", order: "ASC" },
        filter: {},
      });

      expect(result.data[0].id).toBe("1-2");
      expect(result.data[1].id).toBe("3-4");
    });
  });

  describe("HARD DELETE behavior", () => {
    it("should not inject soft delete filter on getList", async () => {
      const handler = createProductDistributorsHandler(mockBaseProvider);

      await handler.getList("product_distributors", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "product_id", order: "ASC" },
        filter: {},
      });

      // Hard delete: no deleted_at filter should be injected
      const callArgs = (mockBaseProvider.getList as ReturnType<typeof vi.fn>).mock.calls[0];
      const filter = callArgs[1].filter;
      expect(filter).not.toHaveProperty("deleted_at@is");
    });
  });

  describe("error handling integration", () => {
    it("should propagate errors through withErrorLogging", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getList = vi.fn().mockRejectedValue(error);

      const handler = createProductDistributorsHandler(mockBaseProvider);

      await expect(
        handler.getList("product_distributors", {
          pagination: { page: 1, perPage: 10 },
          sort: { field: "product_id", order: "ASC" },
          filter: {},
        })
      ).rejects.toThrow();
    });

    it("should catch errors from getOne operations", async () => {
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(new Error("Not found"));

      const handler = createProductDistributorsHandler(mockBaseProvider);

      await expect(handler.getOne("product_distributors", { id: "1-2" })).rejects.toThrow();
    });
  });
});
