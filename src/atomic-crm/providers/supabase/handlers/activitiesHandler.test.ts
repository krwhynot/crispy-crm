/**
 * Tests for activitiesHandler
 *
 * TDD: These tests verify the composed activities DataProvider handler
 * which combines:
 * 1. Base Supabase provider operations
 * 2. withLifecycleCallbacks for resource-specific logic (soft delete, computed fields)
 * 3. withValidation for Zod schema validation
 * 4. withErrorLogging for structured error handling
 *
 * Note: activitiesCallbacks uses the createResourceCallbacks factory pattern,
 * but the handler composition is identical to all other resources.
 *
 * Engineering Constitution: Composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createActivitiesHandler } from "./activitiesHandler";

describe("activitiesHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, type: "Call", date: "2024-01-15" }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, type: "Call", date: "2024-01-15" },
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
      const handler = createActivitiesHandler(mockBaseProvider);

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
      const handler = createActivitiesHandler(mockBaseProvider);

      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composition verification", () => {
    it("should apply lifecycle callbacks (soft delete filter)", async () => {
      const handler = createActivitiesHandler(mockBaseProvider);

      await handler.getList("activities", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "date", order: "DESC" },
        filter: {},
      });

      // The lifecycle callback should add deleted_at@is: null filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should delegate to base provider for operations", async () => {
      const handler = createActivitiesHandler(mockBaseProvider);

      await handler.getOne("activities", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("activities", { id: 1 });
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createActivitiesHandler(mockBaseProvider);

      await expect(handler.getOne("activities", { id: 1 })).rejects.toThrow();
    });
  });

  describe("handler is minimal composition code", () => {
    it("should be a simple factory function", () => {
      // Handler composition is identical regardless of whether
      // callbacks use factory pattern or manual implementation
      expect(typeof createActivitiesHandler).toBe("function");
      expect(createActivitiesHandler.length).toBe(1);
    });
  });
});
