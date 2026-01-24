/**
 * Tests for ProductsService - Product management with distributor relationships
 *
 * Tests verify:
 * 1. createWithDistributors - Product creation with atomic distributor junction records
 * 2. updateWithDistributors - Product update with distributor sync (delete + insert pattern)
 * 3. getOneWithDistributors - JOIN fetching with distributor transformation
 * 4. softDelete / softDeleteMany - RPC-based soft delete (bypasses RLS SELECT policy)
 * 5. Error handling and logging
 *
 * Engineering Constitution: Service Layer orchestration (Principle #14)
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { ProductsService } from "../products.service";
import type {
  ProductWithDistributors,
  ProductCreateInput,
  ProductDistributorInput,
} from "../products.service";
import { createMockDataProvider, createMockProduct } from "@/tests/utils/mock-providers";
import { createMockDataProviderWithRpc, type DataProviderWithRpc } from "@/tests/utils/typed-mocks";

describe("ProductsService", () => {
  let service: ProductsService;
  let mockDataProvider: DataProviderWithRpc;

  beforeEach(() => {
    mockDataProvider = createMockDataProviderWithRpc(createMockDataProvider());
    service = new ProductsService(mockDataProvider);
  });

  describe("getOneWithDistributors", () => {
    test("should fetch product with distributor relationships", async () => {
      const mockProduct: ProductWithDistributors = {
        id: 1,
        name: "Test Product",
        principal_id: 10,
        pack_size: "12oz",
        distributor_ids: [100, 200],
        product_distributors: {
          100: { vendor_item_number: "VIN-100" },
          200: { vendor_item_number: null },
        },
      };

      mockDataProvider.getOne = vi.fn().mockResolvedValue({ data: mockProduct });

      const result = await service.getOneWithDistributors(1);

      expect(mockDataProvider.getOne).toHaveBeenCalledWith("products", { id: 1 });
      expect(result).toEqual(mockProduct);
      expect(result.distributor_ids).toEqual([100, 200]);
    });

    test("should throw enhanced error on failure", async () => {
      mockDataProvider.getOne = vi.fn().mockRejectedValue(new Error("Product not found"));

      await expect(service.getOneWithDistributors(999)).rejects.toThrow(
        "Get product with distributors failed: Product not found"
      );
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.getOne = vi.fn().mockRejectedValue(new Error("Database error"));

      await expect(service.getOneWithDistributors(1)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ProductsService]",
        "Failed to get product with distributors",
        expect.objectContaining({
          id: 1,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("createWithDistributors", () => {
    const mockProductInput: ProductCreateInput = {
      name: "New Product",
      principal_id: 10,
      pack_size: "24oz",
      upc: "123456789012",
    };

    test("should create product without distributors when none provided", async () => {
      const mockCreatedProduct = {
        ...createMockProduct(),
        ...mockProductInput,
        id: 1,
      };

      mockDataProvider.create = vi.fn().mockResolvedValue({ data: mockCreatedProduct });

      const result = await service.createWithDistributors(mockProductInput);

      expect(mockDataProvider.create).toHaveBeenCalledWith("products", {
        data: mockProductInput,
      });
      expect(result.distributor_ids).toEqual([]);
      expect(result.product_distributors).toEqual({});
    });

    test("should create product with distributors (transaction pattern)", async () => {
      const distributors: ProductDistributorInput[] = [
        { distributor_id: 100, vendor_item_number: "VIN-A" },
        { distributor_id: 200, vendor_item_number: null },
      ];

      const mockCreatedProduct = {
        ...mockProductInput,
        id: 42,
      };

      mockDataProvider.create = vi.fn().mockResolvedValue({ data: mockCreatedProduct });

      const result = await service.createWithDistributors(mockProductInput, distributors);

      // Verify product was created first
      expect(mockDataProvider.create).toHaveBeenNthCalledWith(1, "products", {
        data: mockProductInput,
      });

      // Verify junction records were created
      expect(mockDataProvider.create).toHaveBeenNthCalledWith(2, "product_distributors", {
        data: expect.objectContaining({
          product_id: 42,
          distributor_id: 100,
          vendor_item_number: "VIN-A",
          status: "active",
        }),
      });

      expect(mockDataProvider.create).toHaveBeenNthCalledWith(3, "product_distributors", {
        data: expect.objectContaining({
          product_id: 42,
          distributor_id: 200,
          vendor_item_number: null,
          status: "active",
        }),
      });

      // Verify returned shape
      expect(result.id).toBe(42);
      expect(result.distributor_ids).toEqual([100, 200]);
      expect(result.product_distributors).toEqual({
        100: { vendor_item_number: "VIN-A" },
        200: { vendor_item_number: null },
      });
    });

    test("should include valid_from timestamp in junction records", async () => {
      const distributors: ProductDistributorInput[] = [{ distributor_id: 100 }];

      mockDataProvider.create = vi.fn().mockResolvedValue({
        data: { ...mockProductInput, id: 1 },
      });

      await service.createWithDistributors(mockProductInput, distributors);

      // Verify valid_from was set (ISO string format)
      expect(mockDataProvider.create).toHaveBeenCalledWith(
        "product_distributors",
        expect.objectContaining({
          data: expect.objectContaining({
            valid_from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          }),
        })
      );
    });

    test("should throw enhanced error on product creation failure", async () => {
      mockDataProvider.create = vi.fn().mockRejectedValue(new Error("Duplicate name"));

      await expect(service.createWithDistributors(mockProductInput)).rejects.toThrow(
        "Create product with distributors failed: Duplicate name"
      );
    });

    test("should throw enhanced error if junction creation fails", async () => {
      const distributors: ProductDistributorInput[] = [{ distributor_id: 999 }];

      mockDataProvider.create = vi
        .fn()
        .mockResolvedValueOnce({ data: { ...mockProductInput, id: 1 } }) // Product succeeds
        .mockRejectedValueOnce(new Error("Foreign key violation")); // Junction fails

      await expect(service.createWithDistributors(mockProductInput, distributors)).rejects.toThrow(
        "Create product with distributors failed: Foreign key violation"
      );
    });
  });

  describe("updateWithDistributors", () => {
    const mockUpdateData = {
      name: "Updated Product",
      pack_size: "32oz",
    };

    test("should update product without distributor sync when not provided", async () => {
      const mockUpdatedProduct = {
        id: 1,
        ...mockUpdateData,
      };

      mockDataProvider.update = vi.fn().mockResolvedValue({ data: mockUpdatedProduct });

      const result = await service.updateWithDistributors(1, mockUpdateData);

      expect(mockDataProvider.update).toHaveBeenCalledWith("products", {
        id: 1,
        data: mockUpdateData,
        previousData: { id: 1 },
      });
      expect(result.distributor_ids).toEqual([]);
    });

    test("should sync distributors using delete + insert pattern", async () => {
      const newDistributors: ProductDistributorInput[] = [
        { distributor_id: 300, vendor_item_number: "NEW-VIN" },
      ];

      // Mock existing distributors
      const existingDistributors = [
        { id: "1-100", product_id: 1, distributor_id: 100 },
        { id: "1-200", product_id: 1, distributor_id: 200 },
      ];

      mockDataProvider.update = vi.fn().mockResolvedValue({
        data: { id: 1, ...mockUpdateData },
      });
      mockDataProvider.getList = vi.fn().mockResolvedValue({
        data: existingDistributors,
        total: 2,
      });
      mockDataProvider.delete = vi.fn().mockResolvedValue({});
      mockDataProvider.create = vi.fn().mockResolvedValue({});

      await service.updateWithDistributors(1, mockUpdateData, newDistributors);

      // Verify existing records were deleted
      expect(mockDataProvider.delete).toHaveBeenCalledTimes(2);
      expect(mockDataProvider.delete).toHaveBeenCalledWith("product_distributors", {
        id: "1-100",
        previousData: existingDistributors[0],
      });

      // Verify new record was created
      expect(mockDataProvider.create).toHaveBeenCalledWith("product_distributors", {
        data: expect.objectContaining({
          product_id: 1,
          distributor_id: 300,
          vendor_item_number: "NEW-VIN",
        }),
      });
    });

    test("should handle empty distributor array (removes all)", async () => {
      const existingDistributors = [{ id: "1-100", product_id: 1, distributor_id: 100 }];

      mockDataProvider.update = vi.fn().mockResolvedValue({ data: { id: 1 } });
      mockDataProvider.getList = vi.fn().mockResolvedValue({
        data: existingDistributors,
        total: 1,
      });
      mockDataProvider.delete = vi.fn().mockResolvedValue({});
      mockDataProvider.create = vi.fn().mockResolvedValue({});

      const result = await service.updateWithDistributors(1, mockUpdateData, []);

      // Should delete existing but not create any new junction records
      expect(mockDataProvider.delete).toHaveBeenCalledTimes(1);
      // create() is only called for products, not for product_distributors when empty
      expect(mockDataProvider.create).not.toHaveBeenCalled();
      expect(result.distributor_ids).toEqual([]);
    });

    test("should throw enhanced error on update failure", async () => {
      mockDataProvider.update = vi.fn().mockRejectedValue(new Error("RLS violation"));

      await expect(service.updateWithDistributors(1, mockUpdateData)).rejects.toThrow(
        "Update product with distributors failed: RLS violation"
      );
    });
  });

  describe("softDelete", () => {
    test("should call RPC function with product_id parameter", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.softDelete(42);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("soft_delete_product", {
        product_id: 42,
      });
    });

    test("should convert string ID to number", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.softDelete("123");

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("soft_delete_product", {
        product_id: 123,
      });
    });

    test("should reject invalid ID (non-integer)", async () => {
      await expect(service.softDelete(3.14)).rejects.toThrow("Invalid product ID: 3.14");
    });

    test("should reject invalid ID (zero)", async () => {
      await expect(service.softDelete(0)).rejects.toThrow("Invalid product ID: 0");
    });

    test("should reject invalid ID (negative)", async () => {
      await expect(service.softDelete(-5)).rejects.toThrow("Invalid product ID: -5");
    });

    test("should throw enhanced error on RPC failure", async () => {
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("RPC execution failed"));

      await expect(service.softDelete(1)).rejects.toThrow(
        "Soft delete product failed: RPC execution failed"
      );
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("Database error"));

      await expect(service.softDelete(1)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ProductsService]",
        "Failed to soft delete product",
        expect.objectContaining({
          id: 1,
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("softDeleteMany", () => {
    test("should call RPC function with product_ids array", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true, deleted_count: 3 });

      await service.softDeleteMany([1, 2, 3]);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("soft_delete_products", {
        product_ids: [1, 2, 3],
      });
    });

    test("should convert string IDs to numbers", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true });

      await service.softDeleteMany(["10", "20", "30"]);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("soft_delete_products", {
        product_ids: [10, 20, 30],
      });
    });

    test("should reject if any ID is invalid", async () => {
      await expect(service.softDeleteMany([1, 0, 3])).rejects.toThrow("Invalid product ID: 0");
    });

    test("should handle empty array", async () => {
      mockDataProvider.rpc = vi.fn().mockResolvedValue({ success: true, deleted_count: 0 });

      await service.softDeleteMany([]);

      expect(mockDataProvider.rpc).toHaveBeenCalledWith("soft_delete_products", {
        product_ids: [],
      });
    });

    test("should throw enhanced error on RPC failure", async () => {
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("Batch delete failed"));

      await expect(service.softDeleteMany([1, 2])).rejects.toThrow(
        "Soft delete products failed: Batch delete failed"
      );
    });

    test("should log error details on failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockDataProvider.rpc = vi.fn().mockRejectedValue(new Error("Database error"));

      await expect(service.softDeleteMany([1, 2, 3])).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ProductsService]",
        "Failed to soft delete products",
        expect.objectContaining({
          ids: [1, 2, 3],
          error: expect.any(Error),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Error Handling Edge Cases", () => {
    test("should handle RLS policy violation errors", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("new row violates row-level security policy"));

      await expect(service.softDelete(1)).rejects.toThrow(
        "Soft delete product failed: new row violates row-level security policy"
      );
    });

    test("should handle network timeout errors", async () => {
      mockDataProvider.rpc = vi
        .fn()
        .mockRejectedValue(new Error("Network request failed: timeout"));

      await expect(service.softDelete(1)).rejects.toThrow(
        "Soft delete product failed: Network request failed: timeout"
      );
    });

    test("should handle non-Error thrown values", async () => {
      mockDataProvider.rpc = vi.fn().mockRejectedValue("String error");

      await expect(service.softDelete(1)).rejects.toThrow(
        "Soft delete product failed: Unknown error"
      );
    });
  });

  describe("Performance - Parallel Distributor Creation", () => {
    const mockProductInput: ProductCreateInput = {
      name: "Test Product",
      principal_id: 10,
      pack_size: "24oz",
    };

    test("should create distributor relationships in parallel", async () => {
      const distributors: ProductDistributorInput[] = [
        { distributor_id: 1 },
        { distributor_id: 2 },
        { distributor_id: 3 },
        { distributor_id: 4 },
        { distributor_id: 5 },
      ];

      mockDataProvider.create = vi.fn().mockImplementation((resource) => {
        if (resource === "products") {
          return Promise.resolve({ data: { ...mockProductInput, id: 42 } });
        }
        return new Promise((resolve) => setTimeout(() => resolve({ data: { id: 1 } }), 100));
      });

      const startTime = Date.now();

      await service.createWithDistributors(mockProductInput, distributors);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(250);
    });
  });
});
