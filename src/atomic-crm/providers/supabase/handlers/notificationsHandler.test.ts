/**
 * Tests for notificationsHandler
 *
 * TDD: These tests verify the composed notifications DataProvider handler
 * which combines:
 * 1. Base Supabase provider operations
 * 2. withValidation for Zod schema validation
 * 3. withSkipDelete for intercepting delete on soft-delete resources
 * 4. withLifecycleCallbacks for resource logic (soft delete)
 * 5. withErrorLogging for structured error handling + Sentry
 *
 * Notifications use soft delete (deleted_at column).
 *
 * Engineering Constitution: Composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createNotificationsHandler } from "./notificationsHandler";

describe("notificationsHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, message: "New lead assigned", read: false }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, message: "New lead assigned", read: false },
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
      const handler = createNotificationsHandler(mockBaseProvider);

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
      const handler = createNotificationsHandler(mockBaseProvider);

      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composition verification", () => {
    it("should apply soft delete filter (notifications have deleted_at column)", async () => {
      const handler = createNotificationsHandler(mockBaseProvider);

      await handler.getList("notifications", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "created_at", order: "DESC" },
        filter: {},
      });

      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should delegate to base provider for operations", async () => {
      const handler = createNotificationsHandler(mockBaseProvider);

      await handler.getOne("notifications", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("notifications", {
        id: 1,
      });
    });

    it("should perform soft delete (not hard delete)", async () => {
      const handler = createNotificationsHandler(mockBaseProvider);

      await handler.delete("notifications", {
        id: 1,
        previousData: { id: 1, message: "Old notification" },
      });

      // For soft delete, update is called instead of delete
      // deleted_at is sent as ISO string, not Date object
      expect(mockBaseProvider.update).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          id: 1,
          data: expect.objectContaining({
            deleted_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          }),
        })
      );
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createNotificationsHandler(mockBaseProvider);

      await expect(handler.getOne("notifications", { id: 1 })).rejects.toThrow();
    });
  });

  describe("handler is minimal composition code", () => {
    it("should be a simple factory function", () => {
      expect(typeof createNotificationsHandler).toBe("function");
      expect(createNotificationsHandler.length).toBe(1);
    });
  });
});
