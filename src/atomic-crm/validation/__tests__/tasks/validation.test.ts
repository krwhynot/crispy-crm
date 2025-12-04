/**
 * Tests for task validation schemas
 * Focus: Core validation rules and schema behavior
 */

import { describe, it, expect } from "vitest";
import {
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
  validateCreateTask,
  validateUpdateTask,
} from "../../task";
import { z } from "zod";

describe("Task Validation Schemas", () => {
  describe("taskSchema", () => {
    const validTask = {
      title: "Follow up with client",
      contact_id: 123,
      type: "Call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: 456,
    };

    it("should accept valid task data", () => {
      const result = taskSchema.parse(validTask);
      expect(result).toBeDefined();
      expect(result.title).toBe("Follow up with client");
      expect(result.type).toBe("Call");
      expect(result.contact_id).toBe(123);
    });

    it("should reject empty title", () => {
      const invalidData = { ...validTask, title: "" };
      expect(() => taskSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should reject empty type", () => {
      const invalidData = { ...validTask, type: "" };
      expect(() => taskSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should reject empty due_date", () => {
      const invalidData = { ...validTask, due_date: "" };
      expect(() => taskSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should allow optional contact_id", () => {
      // Per schema design: tasks can be associated with contact, opportunity, or organization - all optional
      const withoutContact = {
        title: "Task without contact",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
      };
      const result = taskSchema.parse(withoutContact);
      expect(result.title).toBe("Task without contact");
      expect(result.contact_id).toBeUndefined();
    });

    it("should require sales_id", () => {
      const withoutSalesId = {
        title: "Task without sales",
        contact_id: 123,
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
      };
      expect(() => taskSchema.parse(withoutSalesId)).toThrow(z.ZodError);
    });

    it("should accept both string and number IDs via coercion", () => {
      // Number IDs work directly
      expect(() => taskSchema.parse(validTask)).not.toThrow();

      // String numeric IDs get coerced to numbers
      const withStringNumericIds = {
        title: "Task with string numeric IDs",
        contact_id: "123",
        type: "Email",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "456",
      };
      const result = taskSchema.parse(withStringNumericIds);
      expect(result.contact_id).toBe(123);
      expect(result.sales_id).toBe(456);

      // Optional id field also coerces
      expect(() => taskSchema.parse({ ...validTask, id: "789" })).not.toThrow();
      expect(() => taskSchema.parse({ ...validTask, id: 789 })).not.toThrow();
    });

    it("should handle completed_at field", () => {
      const completedTask = {
        ...validTask,
        completed_at: "2024-12-20T10:00:00Z",
      };

      const result = taskSchema.parse(completedTask);
      expect(result.completed_at).toBe("2024-12-20T10:00:00Z");

      const taskWithNullCompleted = {
        ...validTask,
        completed_at: null,
      };
      expect(() => taskSchema.parse(taskWithNullCompleted)).not.toThrow();

      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });

    it("should validate different task types", () => {
      const taskTypes = ["Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal", "Other"];

      taskTypes.forEach((type) => {
        const task = { ...validTask, type };
        expect(() => taskSchema.parse(task)).not.toThrow();
      });
    });
  });

  describe("createTaskSchema", () => {
    it("should require essential fields for creation", () => {
      const validCreate = {
        title: "New Task",
        contact_id: 123,
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
      };

      expect(() => createTaskSchema.parse(validCreate)).not.toThrow();
    });

    it("should reject creation without required fields", () => {
      expect(() => createTaskSchema.parse({})).toThrow(z.ZodError);

      expect(() =>
        createTaskSchema.parse({
          title: "Test",
        })
      ).toThrow(z.ZodError);

      expect(() =>
        createTaskSchema.parse({
          title: "Test",
          contact_id: 123,
          type: "Call",
        })
      ).toThrow(z.ZodError);
    });

    it("should reject id field on creation (z.strictObject security)", () => {
      const dataWithId = {
        id: 999,
        title: "New Task",
        contact_id: 123,
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
      };

      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      expect(() => createTaskSchema.parse(dataWithId)).toThrow(z.ZodError);
    });

    it("should allow completed_at on creation", () => {
      const dataWithCompletedAt = {
        title: "New Task",
        contact_id: 123,
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
        completed_at: "2024-12-30T10:00:00Z",
      };

      const result = createTaskSchema.parse(dataWithCompletedAt);
      expect(result.completed_at).toBe("2024-12-30T10:00:00Z");
    });
  });

  describe("updateTaskSchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: 123,
        title: "Updated Text",
      };

      expect(() => updateTaskSchema.parse(validUpdate)).not.toThrow();
    });

    it("should reject updates without id", () => {
      const invalidUpdate = {
        title: "Updated Text",
      };

      expect(() => updateTaskSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it("should allow partial updates", () => {
      expect(() => updateTaskSchema.parse({ id: 1, title: "New text" })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 1, type: "Email" })).not.toThrow();
      expect(() =>
        updateTaskSchema.parse({ id: 1, due_date: "2025-01-01T10:00:00Z" })
      ).not.toThrow();
      expect(() =>
        updateTaskSchema.parse({
          id: 1,
          completed_at: "2024-12-31T10:00:00Z",
        })
      ).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: 1 })).not.toThrow();
    });

    it("should allow marking task as done", () => {
      const markAsDone = {
        id: 123,
        completed_at: "2024-12-20T10:00:00Z",
      };

      expect(() => updateTaskSchema.parse(markAsDone)).not.toThrow();
    });

    it("should allow clearing completed_at", () => {
      const clearDone = {
        id: 123,
        completed_at: null,
      };

      expect(() => updateTaskSchema.parse(clearDone)).not.toThrow();
    });
  });

  // NOTE: taskWithReminderSchema was removed per Engineering Constitution
  // (over-engineering - complex date validation doesn't belong in validation layer)

  describe("Validation Functions", () => {
    describe("validateCreateTask", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          title: "New Task",
          contact_id: 123,
          type: "Email",
          due_date: "2024-12-31T10:00:00Z",
          sales_id: 456,
        };

        const result = validateCreateTask(validData);
        expect(result.title).toBe("New Task");
        expect(result.contact_id).toBe(123);
      });

      it("should throw for invalid creation data", () => {
        const invalidData = {
          title: "",
          contact_id: 123,
          type: "Call",
          due_date: "2024-12-31T10:00:00Z",
          sales_id: 456,
        };

        expect(() => validateCreateTask(invalidData)).toThrow(z.ZodError);
      });

      it("should reject incomplete creation data", () => {
        const incompleteData = {
          title: "New Task",
          type: "Meeting",
        };

        expect(() => validateCreateTask(incompleteData)).toThrow(z.ZodError);
      });
    });

    describe("validateUpdateTask", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          id: 123,
          title: "Updated Task",
          completed_at: "2024-12-20T10:00:00Z",
        };

        const result = validateUpdateTask(validData);
        expect(result.id).toBe(123);
        expect(result.title).toBe("Updated Task");
        expect(result.completed_at).toBe("2024-12-20T10:00:00Z");
      });

      it("should throw for update without id", () => {
        const invalidData = {
          title: "Updated Task",
        };

        expect(() => validateUpdateTask(invalidData)).toThrow(z.ZodError);
      });
    });

    // NOTE: validateTaskWithReminder was removed per Engineering Constitution
    // (over-engineering - complex date validation doesn't belong in validation layer)
  });
});
