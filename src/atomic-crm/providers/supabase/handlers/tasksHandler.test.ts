/**
 * Tests for tasksHandler
 *
 * TDD: These tests verify the composed tasks DataProvider handler
 * which combines:
 * 1. Base Supabase provider operations
 * 2. withLifecycleCallbacks for resource-specific logic (soft delete, completion, snooze)
 * 3. withValidation for Zod schema validation
 * 4. withErrorLogging for structured error handling + Sentry
 *
 * Engineering Constitution: Composition over inheritance
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createTasksHandler } from "./tasksHandler";

describe("tasksHandler", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [{ id: 1, title: "Call John", completed: false }],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: { id: 1, title: "Call John", completed: false },
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
      const handler = createTasksHandler(mockBaseProvider);

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
      const handler = createTasksHandler(mockBaseProvider);

      const dp: DataProvider = handler;
      expect(dp).toBeDefined();
    });
  });

  describe("composition verification", () => {
    it("should apply lifecycle callbacks (soft delete filter)", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.getList("tasks", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "due_date", order: "ASC" },
        filter: {},
      });

      // The lifecycle callback should add deleted_at@is: null filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "tasks",
        expect.objectContaining({
          filter: expect.objectContaining({
            "deleted_at@is": null,
          }),
        })
      );
    });

    it("should delegate to base provider for operations", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.getOne("tasks", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("tasks", { id: 1 });
    });

    it("should strip computed fields before save", async () => {
      const handler = createTasksHandler(mockBaseProvider);
      // Computed fields come from database views when reading existing records
      // They appear on UPDATE (editing existing task), not CREATE (new task from form)
      const dataWithComputedFields = {
        id: 1,
        title: "Follow up",
        assignee_name: "John Smith", // computed field from view - should be stripped
        contact_name: "Jane Doe", // computed field from view - should be stripped
      };

      await handler.update("tasks", {
        id: 1,
        data: dataWithComputedFields,
        previousData: { id: 1, title: "Original" },
      });

      // Computed fields should be stripped before save
      const updateCall = mockBaseProvider.update as ReturnType<typeof vi.fn>;
      const passedData = updateCall.mock.calls[0][1].data;
      expect(passedData.assignee_name).toBeUndefined();
      expect(passedData.contact_name).toBeUndefined();
      expect(passedData.title).toBe("Follow up");
    });
  });

  describe("completion timestamp handling", () => {
    it("should set completed_at when task is marked complete", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.update("tasks", {
        id: 1,
        data: { completed: true },
        previousData: { id: 1, completed: false },
      });

      const updateCall = mockBaseProvider.update as ReturnType<typeof vi.fn>;
      const passedData = updateCall.mock.calls[0][1].data;
      expect(passedData.completed_at).toBeDefined();
      expect(typeof passedData.completed_at).toBe("string");
    });

    it("should clear completed_at when task is uncompleted", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.update("tasks", {
        id: 1,
        data: { completed: false },
        previousData: { id: 1, completed: true, completed_at: "2024-01-01T00:00:00Z" },
      });

      const updateCall = mockBaseProvider.update as ReturnType<typeof vi.fn>;
      const passedData = updateCall.mock.calls[0][1].data;
      expect(passedData.completed_at).toBeNull();
    });
  });

  describe("snooze date normalization", () => {
    it("should normalize valid snooze_until date", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.update("tasks", {
        id: 1,
        data: { snooze_until: "2024-12-31" },
        previousData: { id: 1 },
      });

      const updateCall = mockBaseProvider.update as ReturnType<typeof vi.fn>;
      const passedData = updateCall.mock.calls[0][1].data;
      expect(passedData.snooze_until).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should convert empty snooze_until to null", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.update("tasks", {
        id: 1,
        data: { snooze_until: "" },
        previousData: { id: 1 },
      });

      const updateCall = mockBaseProvider.update as ReturnType<typeof vi.fn>;
      const passedData = updateCall.mock.calls[0][1].data;
      expect(passedData.snooze_until).toBeNull();
    });
  });

  describe("error handling integration", () => {
    it("should catch and transform errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createTasksHandler(mockBaseProvider);

      await expect(handler.getOne("tasks", { id: 1 })).rejects.toThrow();
    });
  });

  describe("handler is minimal composition code", () => {
    it("should be a simple factory function", () => {
      expect(typeof createTasksHandler).toBe("function");
      expect(createTasksHandler.length).toBe(1);
    });
  });
});
