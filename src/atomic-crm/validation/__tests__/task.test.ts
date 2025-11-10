/**
 * Tests for task.ts validation schemas
 * These schemas are used by TaskCreate, TaskEdit, and other Task components
 *
 * Note: There's also a legacy tasks.ts file with separate tests.
 * This file tests the CURRENT validation schemas being used in production.
 */

import { describe, it, expect } from "vitest";
import {
  taskSchema,
  taskCreateSchema,
  taskUpdateSchema,
  taskTypeSchema,
  priorityLevelSchema,
  getTaskDefaultValues,
  type Task,
  type TaskType,
  type PriorityLevel,
} from "../task";

describe("Task Validation Schemas (task.ts)", () => {
  describe("taskTypeSchema", () => {
    it("should accept all valid task types", () => {
      const validTypes: TaskType[] = [
        "None",
        "Call",
        "Email",
        "Meeting",
        "Follow-up",
        "Proposal",
        "Discovery",
        "Administrative",
      ];

      validTypes.forEach((type) => {
        const result = taskTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid task types", () => {
      const invalidTypes = ["InvalidType", "call", "EMAIL", ""];

      invalidTypes.forEach((type) => {
        const result = taskTypeSchema.safeParse(type);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("priorityLevelSchema", () => {
    it("should accept all valid priority levels", () => {
      const validPriorities: PriorityLevel[] = [
        "low",
        "medium",
        "high",
        "critical",
      ];

      validPriorities.forEach((priority) => {
        const result = priorityLevelSchema.safeParse(priority);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid priority levels", () => {
      const invalidPriorities = ["Low", "MEDIUM", "urgent", ""];

      invalidPriorities.forEach((priority) => {
        const result = priorityLevelSchema.safeParse(priority);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("taskSchema", () => {
    const validTask: Task = {
      title: "Follow up with client",
      description: "Discuss Q1 pricing proposal",
      due_date: "2025-01-15",
      reminder_date: "2025-01-14",
      completed: false,
      priority: "high",
      type: "Call",
      contact_id: 123,
      opportunity_id: 456,
      sales_id: 789,
    };

    it("should accept valid complete task", () => {
      const result = taskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Follow up with client");
        expect(result.data.priority).toBe("high");
        expect(result.data.type).toBe("Call");
      }
    });

    it("should accept minimal task with only required fields", () => {
      const minimalTask = {
        title: "Quick task",
        due_date: "2025-01-15",
      };

      const result = taskSchema.safeParse(minimalTask);
      expect(result.success).toBe(true);
    });

    it("should reject task with empty title", () => {
      const invalidTask = { ...validTask, title: "" };
      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Title is required");
      }
    });

    it("should reject task with title exceeding 500 characters", () => {
      const longTitle = "a".repeat(501);
      const invalidTask = { ...validTask, title: longTitle };
      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Title too long");
      }
    });

    it("should accept task with title at 500 character limit", () => {
      const maxTitle = "a".repeat(500);
      const validMaxTask = { ...validTask, title: maxTitle };
      const result = taskSchema.safeParse(validMaxTask);
      expect(result.success).toBe(true);
    });

    it("should reject task with description exceeding 2000 characters", () => {
      const longDescription = "b".repeat(2001);
      const invalidTask = { ...validTask, description: longDescription };
      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Description too long");
      }
    });

    it("should accept null description", () => {
      const taskWithNullDesc = { ...validTask, description: null };
      const result = taskSchema.safeParse(taskWithNullDesc);
      expect(result.success).toBe(true);
    });

    it("should reject invalid due_date format", () => {
      const invalidTask = { ...validTask, due_date: "not-a-date" };
      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Due date must be a valid date");
      }
    });

    it("should accept valid ISO date formats", () => {
      const validDates = [
        "2025-01-15",
        "2025-12-31",
        "2024-02-29", // Leap year
      ];

      validDates.forEach((date) => {
        const task = { ...validTask, due_date: date };
        const result = taskSchema.safeParse(task);
        expect(result.success).toBe(true);
      });
    });

    it("should reject negative integer IDs", () => {
      const invalidIds = [-1, -999];

      invalidIds.forEach((id) => {
        const task = { ...validTask, contact_id: id };
        const result = taskSchema.safeParse(task);
        expect(result.success).toBe(false);
      });
    });

    it("should reject zero as ID", () => {
      const task = { ...validTask, contact_id: 0 };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it("should apply default values for priority and type", () => {
      const taskWithoutDefaults = {
        title: "Test",
        due_date: "2025-01-15",
      };

      const result = taskSchema.safeParse(taskWithoutDefaults);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("medium");
        expect(result.data.type).toBe("None");
      }
    });

    it("should accept boolean completed field", () => {
      const completedTask = { ...validTask, completed: true };
      const result = taskSchema.safeParse(completedTask);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completed).toBe(true);
      }
    });

    it("should accept datetime for completed_at", () => {
      const completedTask = {
        ...validTask,
        completed: true,
        completed_at: "2025-01-10T15:30:00Z",
      };
      const result = taskSchema.safeParse(completedTask);
      expect(result.success).toBe(true);
    });

    it("should accept null for nullable optional fields", () => {
      const taskWithNulls = {
        ...validTask,
        description: null,
        reminder_date: null,
        completed_at: null,
        contact_id: null,
        opportunity_id: null,
        sales_id: null,
      };

      const result = taskSchema.safeParse(taskWithNulls);
      expect(result.success).toBe(true);
    });
  });

  describe("taskCreateSchema", () => {
    it("should require title and due_date for creation", () => {
      const validCreate = {
        title: "New task",
        due_date: "2025-01-20",
      };

      const result = taskCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });

    it("should reject creation without title", () => {
      const invalid = {
        due_date: "2025-01-20",
      };

      const result = taskCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject creation without due_date", () => {
      const invalid = {
        title: "New task",
      };

      const result = taskCreateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should omit id field on creation", () => {
      const dataWithId = {
        id: 999,
        title: "New task",
        due_date: "2025-01-20",
      };

      const result = taskCreateSchema.safeParse(dataWithId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect("id" in result.data).toBe(false);
      }
    });

    it("should omit created_at on creation", () => {
      const dataWithTimestamp = {
        title: "New task",
        due_date: "2025-01-20",
        created_at: "2025-01-01T00:00:00Z",
      };

      const result = taskCreateSchema.safeParse(dataWithTimestamp);
      expect(result.success).toBe(true);
      if (result.success) {
        expect("created_at" in result.data).toBe(false);
      }
    });

    it("should omit updated_at on creation", () => {
      const dataWithTimestamp = {
        title: "New task",
        due_date: "2025-01-20",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const result = taskCreateSchema.safeParse(dataWithTimestamp);
      expect(result.success).toBe(true);
      if (result.success) {
        expect("updated_at" in result.data).toBe(false);
      }
    });

    it("should allow all optional fields on creation", () => {
      const fullCreate = {
        title: "Complete new task",
        due_date: "2025-01-20",
        description: "Full description",
        reminder_date: "2025-01-19",
        priority: "high" as const,
        type: "Meeting" as const,
        contact_id: 123,
        opportunity_id: 456,
        sales_id: 789,
        completed: false,
      };

      const result = taskCreateSchema.safeParse(fullCreate);
      expect(result.success).toBe(true);
    });
  });

  describe("taskUpdateSchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: 1,
        title: "Updated title",
      };

      const result = taskUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("should reject update without id", () => {
      const invalidUpdate = {
        title: "Updated title",
      };

      const result = taskUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("should allow partial updates (only id + one field)", () => {
      const partialUpdates = [
        { id: 1, title: "New title" },
        { id: 2, priority: "critical" as const },
        { id: 3, completed: true },
        { id: 4, completed_at: "2025-01-10T10:00:00Z" },
        { id: 5, type: "Email" as const },
      ];

      partialUpdates.forEach((update) => {
        const result = taskUpdateSchema.safeParse(update);
        expect(result.success).toBe(true);
      });
    });

    it("should allow update with only id (no changes)", () => {
      const idOnly = { id: 1 };
      const result = taskUpdateSchema.safeParse(idOnly);
      expect(result.success).toBe(true);
    });

    it("should allow marking task as completed", () => {
      const markComplete = {
        id: 1,
        completed: true,
        completed_at: "2025-01-10T15:30:00Z",
      };

      const result = taskUpdateSchema.safeParse(markComplete);
      expect(result.success).toBe(true);
    });

    it("should allow clearing completed_at (uncomplete task)", () => {
      const uncomplete = {
        id: 1,
        completed: false,
        completed_at: null,
      };

      const result = taskUpdateSchema.safeParse(uncomplete);
      expect(result.success).toBe(true);
    });

    it("should reject update with negative id", () => {
      const invalid = {
        id: -1,
        title: "Updated",
      };

      const result = taskUpdateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject update with zero id", () => {
      const invalid = {
        id: 0,
        title: "Updated",
      };

      const result = taskUpdateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("getTaskDefaultValues", () => {
    it("should return valid default values", () => {
      const defaults = getTaskDefaultValues();

      expect(defaults).toBeDefined();
      expect(typeof defaults).toBe("object");
    });

    it("should set completed to false by default", () => {
      const defaults = getTaskDefaultValues();
      expect(defaults.completed).toBe(false);
    });

    it("should set priority to medium by default", () => {
      const defaults = getTaskDefaultValues();
      expect(defaults.priority).toBe("medium");
    });

    it("should set type to None by default", () => {
      const defaults = getTaskDefaultValues();
      expect(defaults.type).toBe("None");
    });

    it("should set due_date to today", () => {
      const defaults = getTaskDefaultValues();
      const today = new Date().toISOString().slice(0, 10);

      expect(defaults.due_date).toBe(today);
    });

    it("should return object that passes partial schema validation", () => {
      const defaults = getTaskDefaultValues();
      const result = taskSchema.partial().safeParse(defaults);

      expect(result.success).toBe(true);
    });

    it("should not include fields not set by default", () => {
      const defaults = getTaskDefaultValues();

      expect("id" in defaults).toBe(false);
      expect("title" in defaults).toBe(false);
      expect("description" in defaults).toBe(false);
      expect("contact_id" in defaults).toBe(false);
      expect("opportunity_id" in defaults).toBe(false);
      expect("sales_id" in defaults).toBe(false);
      expect("completed_at" in defaults).toBe(false);
      expect("reminder_date" in defaults).toBe(false);
      expect("created_at" in defaults).toBe(false);
      expect("updated_at" in defaults).toBe(false);
    });
  });

  describe("Integration with React Hook Form", () => {
    it("should work with partial().parse({}) pattern for form defaults", () => {
      // This is the Engineering Constitution pattern for form state
      const formDefaults = taskSchema.partial().parse({
        completed: false,
        priority: "medium" as const,
        type: "None" as const,
        due_date: "2025-01-15",
      });

      expect(formDefaults.completed).toBe(false);
      expect(formDefaults.priority).toBe("medium");
      expect(formDefaults.type).toBe("None");
      expect(formDefaults.due_date).toBe("2025-01-15");
    });

    it("should validate form submission with full schema", () => {
      const formData = {
        title: "Task from form",
        due_date: "2025-01-20",
        priority: "high" as const,
        type: "Call" as const,
        description: "From React Hook Form",
        contact_id: 123,
      };

      const result = taskSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });
  });
});
