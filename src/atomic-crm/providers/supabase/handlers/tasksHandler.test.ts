/**
 * Tests for tasksHandler (STI Pattern)
 *
 * TDD: These tests verify the tasksHandler which wraps activitiesHandler
 * to provide backwards-compatible task operations after the STI migration.
 *
 * Key behaviors:
 * 1. Routes all calls to 'activities' resource (not 'tasks')
 * 2. Auto-filters to activity_type = 'task' on reads
 * 3. Auto-sets activity_type = 'task' on creates
 * 4. Maps title ↔ subject for field compatibility
 * 5. Maps task_type ↔ interaction_type for type compatibility
 *
 * Engineering Constitution: Composition over inheritance, STI pattern
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { DataProvider } from "ra-core";
import { createTasksHandler } from "./tasksHandler";

describe("tasksHandler (STI wrapper)", () => {
  let mockBaseProvider: DataProvider;

  beforeEach(() => {
    // Mock returns data in the activities schema (subject, not title)
    mockBaseProvider = {
      getList: vi.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            subject: "Call John",
            activity_type: "task",
            type: "call",
            completed: false,
            due_date: "2024-01-15",
            sales_id: 1,
          },
        ],
        total: 1,
      }),
      getOne: vi.fn().mockResolvedValue({
        data: {
          id: 1,
          subject: "Call John",
          activity_type: "task",
          type: "call",
          completed: false,
          due_date: "2024-01-15",
          sales_id: 1,
        },
      }),
      getMany: vi.fn().mockResolvedValue({
        data: [{ id: 1, subject: "Call John", type: "call" }],
      }),
      getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
      create: vi.fn().mockResolvedValue({
        data: { id: 1, subject: "New Task", activity_type: "task" },
      }),
      update: vi.fn().mockResolvedValue({
        data: { id: 1, subject: "Updated Task", activity_type: "task" },
      }),
      updateMany: vi.fn().mockResolvedValue({ data: [1] }),
      delete: vi.fn().mockResolvedValue({
        data: { id: 1, subject: "Deleted Task" },
      }),
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

  describe("STI routing (tasks → activities)", () => {
    it("should route getList to activities resource with activity_type filter", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.getList("tasks", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "due_date", order: "ASC" },
        filter: {},
      });

      // Should call activities (not tasks) with activity_type filter
      expect(mockBaseProvider.getList).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          filter: expect.objectContaining({
            activity_type: "task",
          }),
        })
      );
    });

    it("should route getOne to activities resource", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.getOne("tasks", { id: 1 });

      expect(mockBaseProvider.getOne).toHaveBeenCalledWith("activities", {
        id: 1,
      });
    });

    it("should route getMany to activities resource", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.getMany("tasks", { ids: [1, 2, 3] });

      expect(mockBaseProvider.getMany).toHaveBeenCalledWith("activities", {
        ids: [1, 2, 3],
      });
    });

    it("should route getManyReference to activities with activity_type filter", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.getManyReference("tasks", {
        target: "contact_id",
        id: 1,
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      expect(mockBaseProvider.getManyReference).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({
          filter: expect.objectContaining({
            activity_type: "task",
          }),
        })
      );
    });
  });

  describe("field mapping (title ↔ subject)", () => {
    it("should map subject to title in getList response", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      const result = await handler.getList("tasks", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // Response should have title (mapped from subject)
      expect(result.data[0].title).toBe("Call John");
    });

    it("should map subject to title in getOne response", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      const result = await handler.getOne("tasks", { id: 1 });

      expect(result.data.title).toBe("Call John");
    });

    it("should map title to subject in create request", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.create("tasks", {
        data: {
          title: "New Follow-up",
          type: "Call",
          due_date: "2024-01-20",
          sales_id: 1,
          contact_id: 1,
        },
      });

      const createCall = mockBaseProvider.create as ReturnType<typeof vi.fn>;
      const passedData = createCall.mock.calls[0][1].data;
      expect(passedData.subject).toBe("New Follow-up");
      expect(passedData.title).toBeUndefined();
      expect(passedData.activity_type).toBe("task");
    });

    it("should map title to subject in update request", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.update("tasks", {
        id: 1,
        data: { title: "Updated Title", contact_id: 1 },
        previousData: { id: 1, title: "Old Title" },
      });

      const updateCall = mockBaseProvider.update as ReturnType<typeof vi.fn>;
      const passedData = updateCall.mock.calls[0][1].data;
      expect(passedData.subject).toBe("Updated Title");
      expect(passedData.title).toBeUndefined();
    });
  });

  describe("type mapping (Title Case ↔ snake_case)", () => {
    it("should map snake_case type to Title Case in response", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      const result = await handler.getList("tasks", {
        pagination: { page: 1, perPage: 10 },
        sort: { field: "id", order: "ASC" },
        filter: {},
      });

      // call → Call
      expect(result.data[0].type).toBe("Call");
    });

    it("should map Title Case type to snake_case in create", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.create("tasks", {
        data: {
          title: "Demo call",
          type: "Follow-up",
          due_date: "2024-01-20",
          sales_id: 1,
          contact_id: 1,
        },
      });

      const createCall = mockBaseProvider.create as ReturnType<typeof vi.fn>;
      const passedData = createCall.mock.calls[0][1].data;
      // Follow-up → follow_up
      expect(passedData.type).toBe("follow_up");
    });
  });

  describe("activity_type injection", () => {
    it("should set activity_type to task on create", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.create("tasks", {
        data: {
          title: "New Task",
          type: "Call",
          due_date: "2024-01-20",
          sales_id: 1,
          contact_id: 1,
        },
      });

      const createCall = mockBaseProvider.create as ReturnType<typeof vi.fn>;
      const passedData = createCall.mock.calls[0][1].data;
      expect(passedData.activity_type).toBe("task");
    });

    it("should set activity_type to task on update", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.update("tasks", {
        id: 1,
        data: { completed: true, contact_id: 1 },
        previousData: { id: 1 },
      });

      const updateCall = mockBaseProvider.update as ReturnType<typeof vi.fn>;
      const passedData = updateCall.mock.calls[0][1].data;
      expect(passedData.activity_type).toBe("task");
    });
  });

  describe("delete operations", () => {
    it("should route delete to activities resource", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.delete("tasks", { id: 1, previousData: { id: 1 } });

      expect(mockBaseProvider.delete).toHaveBeenCalledWith(
        "activities",
        expect.objectContaining({ id: 1 })
      );
    });

    it("should route deleteMany to activities resource", async () => {
      const handler = createTasksHandler(mockBaseProvider);

      await handler.deleteMany("tasks", { ids: [1, 2] });

      expect(mockBaseProvider.deleteMany).toHaveBeenCalledWith("activities", {
        ids: [1, 2],
      });
    });
  });

  describe("error handling", () => {
    it("should propagate errors from base provider", async () => {
      const error = new Error("Database connection failed");
      mockBaseProvider.getOne = vi.fn().mockRejectedValue(error);

      const handler = createTasksHandler(mockBaseProvider);

      await expect(handler.getOne("tasks", { id: 1 })).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("handler structure", () => {
    it("should be a simple factory function", () => {
      expect(typeof createTasksHandler).toBe("function");
      expect(createTasksHandler.length).toBe(1);
    });
  });
});
