/**
 * Tests for task validation schemas
 * Focus: Core validation rules and schema behavior
 */

import { describe, it, expect } from "vitest";
import {
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
  taskWithReminderSchema,
  validateCreateTask,
  validateUpdateTask,
  validateTaskWithReminder,
} from "../../tasks";
import { z } from "zod";

describe("Task Validation Schemas", () => {
  describe("taskSchema", () => {
    const validTask = {
      text: "Follow up with client",
      contact_id: "contact-123",
      type: "call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: "user-456",
    };

    it("should accept valid task data", () => {
      const result = taskSchema.parse(validTask);
      expect(result).toBeDefined();
      expect(result.text).toBe("Follow up with client");
      expect(result.type).toBe("call");
      expect(result.contact_id).toBe("contact-123");
    });

    it("should reject empty text", () => {
      const invalidData = { ...validTask, text: "" };
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
        text: "Task without contact",
        type: "call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };
      expect(() => taskSchema.parse(withoutContact)).toThrow(z.ZodError);
    });

    it("should require sales_id", () => {
      const withoutSalesId = {
        text: "Task without sales",
        contact_id: "contact-123",
        type: "call",
        due_date: "2024-12-31T10:00:00Z",
      };
      expect(() => taskSchema.parse(withoutSalesId)).toThrow(z.ZodError);
    });

    it("should accept both string and number IDs", () => {
      expect(() => taskSchema.parse(validTask)).not.toThrow();

      const withNumberIds = {
        text: "Task with number IDs",
        contact_id: 123,
        type: "email",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
      };
      expect(() => taskSchema.parse(withNumberIds)).not.toThrow();

      expect(() =>
        taskSchema.parse({ ...validTask, id: "task-123" }),
      ).not.toThrow();
      expect(() => taskSchema.parse({ ...validTask, id: 789 })).not.toThrow();
    });

    it("should handle done_date field", () => {
      const completedTask = {
        ...validTask,
        done_date: "2024-12-20T10:00:00Z",
      };

      const result = taskSchema.parse(completedTask);
      expect(result.done_date).toBe("2024-12-20T10:00:00Z");

      const taskWithNullDone = {
        ...validTask,
        done_date: null,
      };
      expect(() => taskSchema.parse(taskWithNullDone)).not.toThrow();

      expect(() => taskSchema.parse(validTask)).not.toThrow();
    });

    it("should validate different task types", () => {
      const taskTypes = [
        "call",
        "email",
        "meeting",
        "todo",
        "follow-up",
        "reminder",
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
        text: "New Task",
        contact_id: "contact-123",
        type: "call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };

      expect(() => createTaskSchema.parse(validCreate)).not.toThrow();
    });

    it("should reject creation without required fields", () => {
      expect(() => createTaskSchema.parse({})).toThrow(z.ZodError);

      expect(() =>
        createTaskSchema.parse({
          text: "Test",
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        createTaskSchema.parse({
          text: "Test",
          contact_id: "contact-123",
          type: "call",
        }),
      ).toThrow(z.ZodError);
    });

    it("should not allow id field on creation", () => {
      const dataWithId = {
        id: "should-not-be-here",
        text: "New Task",
        contact_id: "contact-123",
        type: "call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };

      const result = createTaskSchema.parse(dataWithId);
      expect("id" in result).toBe(false);
    });

    it("should not allow done_date on creation", () => {
      const dataWithDoneDate = {
        text: "New Task",
        contact_id: "contact-123",
        type: "call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
        done_date: "2024-12-30T10:00:00Z",
      };

      const result = createTaskSchema.parse(dataWithDoneDate);
      expect("done_date" in result).toBe(false);
    });
  });

  describe("updateTaskSchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: "task-123",
        text: "Updated Text",
      };

      expect(() => updateTaskSchema.parse(validUpdate)).not.toThrow();
    });

    it("should reject updates without id", () => {
      const invalidUpdate = {
        text: "Updated Text",
      };

      expect(() => updateTaskSchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });

    it("should allow partial updates", () => {
      expect(() =>
        updateTaskSchema.parse({ id: "t-1", text: "New text" }),
      ).not.toThrow();
      expect(() =>
        updateTaskSchema.parse({ id: "t-1", type: "email" }),
      ).not.toThrow();
      expect(() =>
        updateTaskSchema.parse({ id: "t-1", due_date: "2025-01-01T10:00:00Z" }),
      ).not.toThrow();
      expect(() =>
        updateTaskSchema.parse({
          id: "t-1",
          done_date: "2024-12-31T10:00:00Z",
        }),
      ).not.toThrow();
      expect(() => updateTaskSchema.parse({ id: "t-1" })).not.toThrow();
    });

    it("should allow marking task as done", () => {
      const markAsDone = {
        id: "task-123",
        done_date: "2024-12-20T10:00:00Z",
      };

      expect(() => updateTaskSchema.parse(markAsDone)).not.toThrow();
    });

    it("should allow clearing done_date", () => {
      const clearDone = {
        id: "task-123",
        done_date: null,
      };

      expect(() => updateTaskSchema.parse(clearDone)).not.toThrow();
    });
  });

  describe("taskWithReminderSchema", () => {
    it("should validate tasks with future due dates for reminders", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const validTaskWithReminder = {
        text: "Task with reminder",
        contact_id: "contact-123",
        type: "call",
        due_date: futureDate.toISOString(),
        sales_id: "user-456",
      };

      expect(() =>
        taskWithReminderSchema.parse(validTaskWithReminder),
      ).not.toThrow();
    });

    it("should reject tasks with past due dates for reminders", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const invalidTaskWithReminder = {
        text: "Task with past date",
        contact_id: "contact-123",
        type: "call",
        due_date: pastDate.toISOString(),
        sales_id: "user-456",
      };

      expect(() =>
        taskWithReminderSchema.parse(invalidTaskWithReminder),
      ).toThrow(z.ZodError);
    });

    it("should handle tasks without due dates", () => {
      const taskWithoutDueDate = {
        text: "Task without date",
        contact_id: "contact-123",
        type: "call",
        due_date: "",
        sales_id: "user-456",
      };

      expect(() => taskWithReminderSchema.parse(taskWithoutDueDate)).toThrow(
        z.ZodError,
      );
    });
  });

  describe("Validation Functions", () => {
    describe("validateCreateTask", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          text: "New Task",
          contact_id: "contact-123",
          type: "email",
          due_date: "2024-12-31T10:00:00Z",
          sales_id: "user-456",
        };

        const result = validateCreateTask(validData);
        expect(result.text).toBe("New Task");
        expect(result.contact_id).toBe("contact-123");
      });

      it("should throw for invalid creation data", () => {
        const invalidData = {
          text: "",
          contact_id: "contact-123",
          type: "call",
          due_date: "2024-12-31T10:00:00Z",
          sales_id: "user-456",
        };

        expect(() => validateCreateTask(invalidData)).toThrow(z.ZodError);
      });

      it("should reject incomplete creation data", () => {
        const incompleteData = {
          text: "New Task",
          type: "meeting",
        };

        expect(() => validateCreateTask(incompleteData)).toThrow(z.ZodError);
      });
    });

    describe("validateUpdateTask", () => {
      it("should validate and return parsed data", () => {
        const validData = {
          id: "task-123",
          text: "Updated Task",
          done_date: "2024-12-20T10:00:00Z",
        };

        const result = validateUpdateTask(validData);
        expect(result.id).toBe("task-123");
        expect(result.text).toBe("Updated Task");
        expect(result.done_date).toBe("2024-12-20T10:00:00Z");
      });

      it("should throw for update without id", () => {
        const invalidData = {
          text: "Updated Task",
        };

        expect(() => validateUpdateTask(invalidData)).toThrow(z.ZodError);
      });
    });

    describe("validateTaskWithReminder", () => {
      it("should validate tasks with reminders", () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);

        const validData = {
          text: "Important reminder",
          contact_id: "contact-123",
          type: "follow-up",
          due_date: futureDate.toISOString(),
          sales_id: "user-456",
        };

        const result = validateTaskWithReminder(validData);
        expect(result.text).toBe("Important reminder");
      });

      it("should reject reminders for past dates", () => {
        const pastData = {
          text: "Late reminder",
          contact_id: "contact-123",
          type: "call",
          due_date: "2020-01-01T10:00:00Z",
          sales_id: "user-456",
        };

        expect(() => validateTaskWithReminder(pastData)).toThrow(z.ZodError);
      });
    });
  });
});