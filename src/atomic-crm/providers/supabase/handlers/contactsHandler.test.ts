/**
 * Tests for contactsHandler
 *
 * TDD: These tests verify the composed contacts DataProvider handler
 * which combines:
 * 1. Base Supabase provider operations
 * 2. withLifecycleCallbacks for resource-specific logic (soft delete, JSONB)
 * 3. withValidation for Zod schema validation
 * 4. withErrorLogging for structured error handling
 *
 * Engineering Constitution: Composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createContactsHandler } from "./contactsHandler";

describe("contactsHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, first_name: "John", last_name: "Doe" }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, first_name: "John", last_name: "Doe" },
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
      const handler = createContactsHandler(mockBaseProvider);

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
      const handler = createContactsHandler(mockBaseProvider);

      // Type check - handler should be DataProvider
      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composition verification", () => {
    it("should apply lifecycle callbacks (soft delete filter)", async () => {
      const handler = createContactsHandler(mockBaseProvider);

      await handler.getList("contacts", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // The lifecycle callback should add deleted_at@is: null filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "contacts",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should delegate to base provider for operations", async () => {
      const handler = createContactsHandler(mockBaseProvider);

      await handler.getOne("contacts", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("contacts", { id: 1 });
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createContactsHandler(mockBaseProvider);

      // withErrorLogging should log and re-throw
      await expect(handler.getOne("contacts", { id: 1 })).rejects.toThrow();
    });
  });

  describe("handler is minimal composition code", () => {
    it("should be a simple factory function", () => {
      // The handler itself should be ~20 lines or less
      // This test documents the design constraint
      expect(typeof createContactsHandler).toBe("function");
      expect(createContactsHandler.length).toBe(1); // Takes 1 argument (baseProvider)
    });
  });
});
