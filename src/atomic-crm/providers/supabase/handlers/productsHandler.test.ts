/**
 * Tests for productsHandler
 *
 * TDD: These tests verify the composed products DataProvider handler
 * which combines:
 * 1. Base Supabase provider operations
 * 2. withLifecycleCallbacks for resource-specific logic (soft delete only)
 * 3. withValidation for Zod schema validation
 * 4. withErrorLogging for structured error handling
 *
 * Note: productsCallbacks uses the createResourceCallbacks factory pattern
 * with soft delete only (no computed fields), but handler composition
 * remains identical to all other resources.
 *
 * Engineering Constitution: Composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createProductsHandler } from "./productsHandler";

describe("productsHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, name: "Widget X", sku: "WX-001" }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, name: "Widget X", sku: "WX-001" },
      }),
      getMany: vi.fn().mockResolvedValue({ data: [] }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      deleteMany: vi.fn().mockResolvedValue({ data: [1, 2] }),
    };
  });

  describe("factory function", () => {
    it("should create a DataProvider with all standard methods", () => {
      const handler = createProductsHandler(mockBaseProvider);

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
      const handler = createProductsHandler(mockBaseProvider);

      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composition verification", () => {
    it("should apply lifecycle callbacks (soft delete filter)", async () => {
      const handler = createProductsHandler(mockBaseProvider);

      await handler.getList("products", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" },
        filter: {},
      });

      // The lifecycle callback should add deleted_at@is: null filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "products",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should delegate to base provider for operations", async () => {
      const handler = createProductsHandler(mockBaseProvider);

      await handler.getOne("products", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("products", { id: 1 });
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createProductsHandler(mockBaseProvider);

      await expect(handler.getOne("products", { id: 1 })).rejects.toThrow();
    });

    it("should propagate delete errors through withErrorLogging", async () => {
      // Spy on console.error to verify withErrorLogging is invoked
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Create a mock provider with RPC that throws
      const mockProviderWithRpc = {
        ...mockBaseProvider,
        rpc: vi
          .fn()
          .mockRejectedValue(new Error("RPC soft_delete_product failed: Product not found")),
      };

      const handler = createProductsHandler(mockProviderWithRpc);

      // Attempt delete - should throw and be logged
      await expect(
        handler.delete("products", {
          id: 999,
          previousData: { id: 999, name: "Test Product" },
        })
      ).rejects.toThrow();

      // Verify withErrorLogging caught and logged the error with structured format
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("DataProvider operation failed"),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should propagate deleteMany errors through withErrorLogging", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const mockProviderWithRpc = {
        ...mockBaseProvider,
        rpc: vi.fn().mockRejectedValue(new Error("RPC soft_delete_products failed: Invalid IDs")),
      };

      const handler = createProductsHandler(mockProviderWithRpc);

      await expect(handler.deleteMany("products", { ids: [997, 998, 999] })).rejects.toThrow();

      // Verify withErrorLogging caught and logged the error with structured format
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("DataProvider operation failed"),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("handler is minimal composition code", () => {
    it("should be a simple factory function", () => {
      // Handler composition is identical regardless of callback complexity
      // productsCallbacks is the simplest (soft delete only, no computed fields)
      expect(typeof createProductsHandler).toBe("function");
      expect(createProductsHandler.length).toBe(1);
    });
  });
});
