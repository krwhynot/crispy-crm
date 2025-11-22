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
      contact_id: "contact-123",
      type: "Call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: "user-456",
    };

    it("should accept valid task data", () => {
      const result = taskSchema.parse(validTask);
      expect(result).toBeDefined();
      expect(result.title).toBe("Follow up with client");
      expect(result.type).toBe("Call");
      expect(result.contact_id).toBe("contact-123");
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

    it("should require contact_id", () => {
      const withoutContact = {
        title: "Task without contact",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };
      expect(() => taskSchema.parse(withoutContact)).toThrow(z.ZodError);
    });

    it("should require sales_id", () => {
      const withoutSalesId = {
        title: "Task without sales",
        contact_id: "contact-123",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
      };
      expect(() => taskSchema.parse(withoutSalesId)).toThrow(z.ZodError);
    });

    it("should accept both string and number IDs", () => {
      expect(() => taskSchema.parse(validTask)).not.toThrow();

      const withNumberIds = {
        title: "Task with number IDs",
        contact_id: 123,
        type: "Email",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
      };
      expect(() => taskSchema.parse(withNumberIds)).not.toThrow();

      expect(() => taskSchema.parse({ ...validTask, id: "task-123" })).not.toThrow();
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
      const taskTypes = [
        "Call",
        "Email",
        "Meeting",
        "Follow-up",
        "Proposal",
        "Discovery",
        "Administrative",
        "None",
      ];

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
        contact_id: "contact-123",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
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
          contact_id: "contact-123",
          type: "Call",
        })
      ).toThrow(z.ZodError);
    });

    it("should not allow id field on creation", () => {
      const dataWithId = {
        id: "should-not-be-here",
        title: "New Task",
        contact_id: "contact-123",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };

      const result = createTaskSchema.parse(dataWithId);
      expect("id" in result).toBe(false);
    });

    it("should allow completed_at on creation", () => {
      const dataWithCompletedAt = {
        title: "New Task",
        contact_id: "contact-123",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
        completed_at: "2024-12-30T10:00:00Z",
      };

      const result = createTaskSchema.parse(dataWithCompletedAt);
      expect(result.completed_at).toBe("2024-12-30T10:00:00Z");
    });
  });

  describe("updateTaskSchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: "task-123",
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
      expect(() => updateTaskSchema.parse({ id: "t-1", title: "New text" })).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: "t-1", type: "Email" })).not.toThrow();
      expect(() =>
        updateTaskSchema.parse({ id: "t-1", due_date: "2025-01-01T10:00:00Z" })
      ).not.toThrow();
      expect(() =>
        updateTaskSchema.parse({
          id: "t-1",
          completed_at: "2024-12-31T10:00:00Z",
        })
      ).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: "t-1" })).not.toThrow();
    });

    it("should allow marking task as done", () => {
      const markAsDone = {
        id: "task-123",
        completed_at: "2024-12-20T10:00:00Z",
      };

      expect(() => updateTaskSchema.parse(markAsDone)).not.toThrow();
    });

    it("should allow clearing completed_at", () => {
      const clearDone = {
        id: "task-123",
        completed_at: null,
      };

      expect(() => updateTaskSchema.parse(clearDone)).not.toThrow();
    });
  });

  describe("taskWithReminderSchema", () => {
    it("should validate tasks with future due dates for reminders", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const validTaskWithReminder = {
        title: "Task with reminder",
        contact_id: "contact-123",
        type: "Call",
        due_date: futureDate.toISOString(),
        sales_id: "user-456",
      };

      expect(() => taskWithReminderSchema.parse(validTaskWithReminder)).not.toThrow();
    });

    it("should reject tasks with past due dates for reminders", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const invalidTaskWithReminder = {
        title: "Task with past date",
        contact_id: "contact-123",
        type: "Call",
        due_date: pastDate.toISOString(),
        sales_id: "user-456",
      };

      expect(() => taskWithReminderSchema.parse(invalidTaskWithReminder)).toThrow(z.ZodError);
    });

    it("should handle tasks without due dates", () => {
      const taskWithoutDueDate = {
        title: "Task without date",
        contact_id: "contact-123",
        type: "Call",
        due_date: "",
        sales_id: "user-456",
      };

      expect(() => taskWithReminderSchema.parse(taskWithoutDueDate)).toThrow(z.ZodError);
    });
  });

  describe("Validation Functions", () => {
    describe("validateCreateTask", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          title: "New Task",
          contact_id: "contact-123",
          type: "Email",
          due_date: "2024-12-31T10:00:00Z",
          sales_id: "user-456",
        };

        const result = validateCreateTask(validData);
        expect(result.title).toBe("New Task");
        expect(result.contact_id).toBe("contact-123");
      });

      it("should throw for invalid creation data", () => {
        const invalidData = {
          title: "",
          contact_id: "contact-123",
          type: "Call",
          due_date: "2024-12-31T10:00:00Z",
          sales_id: "user-456",
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
          id: "task-123",
          title: "Updated Task",
          completed_at: "2024-12-20T10:00:00Z",
        };

        const result = validateUpdateTask(validData);
        expect(result.id).toBe("task-123");
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

    describe("validateTaskWithReminder", () => {
      it("should validate tasks with reminders", () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);

        const validData = {
          title: "Important reminder",
          contact_id: "contact-123",
          type: "Follow-up",
          due_date: futureDate.toISOString(),
          sales_id: "user-456",
        };

        const result = validateTaskWithReminder(validData);
        expect(result.title).toBe("Important reminder");
      });

      it("should reject reminders for past dates", () => {
        const pastData = {
          title: "Late reminder",
          contact_id: "contact-123",
          type: "Call",
          due_date: "2020-01-01T10:00:00Z",
          sales_id: "user-456",
        };

        expect(() => validateTaskWithReminder(pastData)).toThrow(z.ZodError);
      });
    });
  });
});
