/**
 * Tests for tagsHandler
 *
 * TDD: These tests verify the composed tags DataProvider handler
 * which combines:
 * 1. Base Supabase provider operations
 * 2. withLifecycleCallbacks for resource logic (soft delete since DI-002 audit fix)
 * 3. withValidation for Zod schema validation (color normalization)
 * 4. withErrorLogging for structured error handling + Sentry
 *
 * Tags use soft delete (deleted_at column exists in schema).
 *
 * Engineering Constitution: Composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createTagsHandler } from "./tagsHandler";

describe("tagsHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, name: "Hot Lead", color: "red" }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, name: "Hot Lead", color: "red" },
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
      const handler = createTagsHandler(mockBaseProvider);

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
      const handler = createTagsHandler(mockBaseProvider);

      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composition verification", () => {
    it("should NOT apply soft delete filter (tags use hard delete)", async () => {
      const handler = createTagsHandler(mockBaseProvider);

      await handler.getList("tags", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "name", order: "ASC" },
        filter: {},
      });

      // Tags do NOT have soft delete filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "tags",
        expect.objectContaining({
          filter: expect.not.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should delegate to base provider for operations", async () => {
      const handler = createTagsHandler(mockBaseProvider);

      await handler.getOne("tags", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("tags", { id: 1 });
    });

    it("should perform hard delete (not soft delete)", async () => {
      const handler = createTagsHandler(mockBaseProvider);

      await handler.delete("tags", { id: 1, previousData: { id: 1, name: "Old Tag" } });

      // For hard delete, the delete method is called directly (not converted to update)
      expect(mockBaseProvider.delete).toHaveBeenCalled();
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createTagsHandler(mockBaseProvider);

      await expect(handler.getOne("tags", { id: 1 })).rejects.toThrow();
    });
  });

  describe("handler is minimal composition code", () => {
    it("should be a simple factory function", () => {
      expect(typeof createTagsHandler).toBe("function");
      expect(createTagsHandler.length).toBe(1);
    });
  });
});
