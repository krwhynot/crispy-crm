/**
 * Tests for salesHandler
 *
 * TDD: These tests verify the composed sales DataProvider handler
 * which combines:
 * 1. Base Supabase provider operations
 * 2. withLifecycleCallbacks for soft delete and computed field stripping
 * 3. withValidation for Zod schema validation
 * 4. withErrorLogging for structured error handling + Sentry
 *
 * Sales represents CRM users - read-heavy, admin-only writes via RLS.
 *
 * Engineering Constitution: Composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createSalesHandler } from "./salesHandler";

describe("salesHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, first_name: "John", last_name: "Smith", email: "john@test.com" }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, first_name: "John", last_name: "Smith", email: "john@test.com" },
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
      const handler = createSalesHandler(mockBaseProvider);

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
      const handler = createSalesHandler(mockBaseProvider);

      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composition verification", () => {
    it("should apply lifecycle callbacks (soft delete filter)", async () => {
      const handler = createSalesHandler(mockBaseProvider);

      await handler.getList("sales", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "last_name", order: "ASC" },
        filter: {},
      });

      // The lifecycle callback should add deleted_at@is: null filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "sales",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should delegate to base provider for operations", async () => {
      const handler = createSalesHandler(mockBaseProvider);

      await handler.getOne("sales", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("sales", { id: 1 });
    });

    it("should strip computed fields before save", async () => {
      const handler = createSalesHandler(mockBaseProvider);
      const dataWithComputedFields = {
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@test.com",
        administrator: true, // computed field - should be stripped
      };

      await handler.create("sales", { data: dataWithComputedFields });

      // Computed fields should be stripped
      const createCall = mockBaseProvider.create as ReturnType<typeof vi.fn>;
      const passedData = createCall.mock.calls[0][1].data;
      expect(passedData.administrator).toBeUndefined();
      expect(passedData.first_name).toBe("Jane");
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createSalesHandler(mockBaseProvider);

      await expect(handler.getOne("sales", { id: 1 })).rejects.toThrow();
    });
  });

  describe("handler is minimal composition code", () => {
    it("should be a simple factory function", () => {
      expect(typeof createSalesHandler).toBe("function");
      expect(createSalesHandler.length).toBe(1);
    });
  });
});
