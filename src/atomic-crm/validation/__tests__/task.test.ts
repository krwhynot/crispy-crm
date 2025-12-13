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
        "Call",
        "Email",
        "Meeting",
        "Follow-up",
        "Demo",
        "Proposal",
        "Other",
      ];

      validTypes.forEach((type) => {
        const result = taskTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid task types", () => {
      // Note: "None", "Discovery", "Administrative" removed from enum
      const invalidTypes = [
        "InvalidType",
        "call",
        "EMAIL",
        "",
        "None",
        "Discovery",
        "Administrative",
      ];

      invalidTypes.forEach((type) => {
        const result = taskTypeSchema.safeParse(type);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("priorityLevelSchema", () => {
    it("should accept all valid priority levels", () => {
      const validPriorities: PriorityLevel[] = ["low", "medium", "high", "critical"];

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
      // Per Engineering Constitution: tasks must be associated with contact and sales rep
      const minimalTask = {
        title: "Quick task",
        due_date: "2025-01-15",
        type: "Other" as const,
        contact_id: 1,
        sales_id: 1,
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

    it("should reject empty due_date", () => {
      // Per Engineering Constitution: fail fast, no complex transforms
      // z.coerce.date() rejects empty strings (creates invalid Date)
      const invalidTask = { ...validTask, due_date: "" };
      const result = taskSchema.safeParse(invalidTask);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Schema has custom message "Due date is required" for invalid dates
        expect(result.error.issues[0].message).toContain("Due date is required");
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

    it("should apply default values for priority and completed", () => {
      // Schema provides defaults for priority and completed
      // type, contact_id, sales_id are required (no defaults)
      const taskWithoutDefaults = {
        title: "Test",
        due_date: "2025-01-15",
        type: "Call" as const,
        contact_id: 1,
        sales_id: 1,
      };

      const result = taskSchema.safeParse(taskWithoutDefaults);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("medium");
        expect(result.data.completed).toBe(false);
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
      // Note: contact_id and sales_id are REQUIRED (not nullable)
      // Only description, reminder_date, completed_at, opportunity_id are nullable
      const taskWithNulls = {
        ...validTask,
        description: null,
        reminder_date: null,
        completed_at: null,
        opportunity_id: null,
      };

      const result = taskSchema.safeParse(taskWithNulls);
      expect(result.success).toBe(true);
    });

    // =========================================================================
    // created_by field tests (per migration 20251127054700)
    // =========================================================================
    describe("created_by field", () => {
      it("should accept number for created_by (matches sales.id)", () => {
        const taskWithCreatedBy = { ...validTask, created_by: 123 };
        const result = taskSchema.safeParse(taskWithCreatedBy);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.created_by).toBe(123);
        }
      });

      it("should accept string for created_by (React Admin compatibility)", () => {
        // React Admin may pass IDs as strings
        const taskWithCreatedBy = { ...validTask, created_by: "456" };
        const result = taskSchema.safeParse(taskWithCreatedBy);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.created_by).toBe("456");
        }
      });

      it("should accept null for created_by (optional)", () => {
        const taskWithNullCreator = { ...validTask, created_by: null };
        const result = taskSchema.safeParse(taskWithNullCreator);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.created_by).toBeNull();
        }
      });

      it("should accept undefined for created_by (optional)", () => {
        const taskWithoutCreator = { ...validTask };
        delete (taskWithoutCreator as any).created_by;
        const result = taskSchema.safeParse(taskWithoutCreator);
        expect(result.success).toBe(true);
      });
    });

    // =========================================================================
    // deleted_at field tests (per migration 20251127055705)
    // =========================================================================
    describe("deleted_at field (soft-delete)", () => {
      it("should accept ISO timestamp for deleted_at", () => {
        const deletedTask = { ...validTask, deleted_at: "2025-01-15T10:30:00Z" };
        const result = taskSchema.safeParse(deletedTask);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.deleted_at).toBe("2025-01-15T10:30:00Z");
        }
      });

      it("should accept null for deleted_at (active record)", () => {
        // Per soft-delete pattern: NULL = active record
        const activeTask = { ...validTask, deleted_at: null };
        const result = taskSchema.safeParse(activeTask);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.deleted_at).toBeNull();
        }
      });

      it("should accept undefined for deleted_at (active record)", () => {
        const taskWithoutDeleted = { ...validTask };
        delete (taskWithoutDeleted as any).deleted_at;
        const result = taskSchema.safeParse(taskWithoutDeleted);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("taskCreateSchema", () => {
    it("should require title, due_date, type, contact_id, and sales_id for creation", () => {
      const validCreate = {
        title: "New task",
        due_date: "2025-01-20",
        type: "Call" as const,
        contact_id: 1,
        sales_id: 1,
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

    it("should reject id field on creation (z.strictObject security)", () => {
      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      const dataWithId = {
        id: 999,
        title: "New task",
        due_date: "2025-01-20",
        type: "Call" as const,
        contact_id: 1,
        sales_id: 1,
      };

      expect(() => taskCreateSchema.parse(dataWithId)).toThrow();
    });

    it("should reject created_at on creation (z.strictObject security)", () => {
      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      const dataWithTimestamp = {
        title: "New task",
        due_date: "2025-01-20",
        type: "Call" as const,
        contact_id: 1,
        sales_id: 1,
        created_at: "2025-01-01T00:00:00Z",
      };

      expect(() => taskCreateSchema.parse(dataWithTimestamp)).toThrow();
    });

    it("should reject updated_at on creation (z.strictObject security)", () => {
      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      const dataWithTimestamp = {
        title: "New task",
        due_date: "2025-01-20",
        type: "Call" as const,
        contact_id: 1,
        sales_id: 1,
        updated_at: "2025-01-01T00:00:00Z",
      };

      expect(() => taskCreateSchema.parse(dataWithTimestamp)).toThrow();
    });

    // =========================================================================
    // Tests for new audit fields (per migrations 20251127054700/55705)
    // =========================================================================
    it("should reject created_by on creation (z.strictObject security)", () => {
      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      // Per migration: created_by is set by trigger_set_task_created_by
      const dataWithCreatedBy = {
        title: "New task",
        due_date: "2025-01-20",
        type: "Call" as const,
        contact_id: 1,
        sales_id: 1,
        created_by: 999, // Should be rejected - DB trigger handles this
      };

      expect(() => taskCreateSchema.parse(dataWithCreatedBy)).toThrow();
    });

    it("should reject deleted_at on creation (z.strictObject security)", () => {
      // z.strictObject() rejects unrecognized keys (mass assignment prevention)
      // Per soft-delete pattern: deleted_at should never be set at creation
      const dataWithDeletedAt = {
        title: "New task",
        due_date: "2025-01-20",
        type: "Call" as const,
        contact_id: 1,
        sales_id: 1,
        deleted_at: "2025-01-01T00:00:00Z", // Should be rejected
      };

      expect(() => taskCreateSchema.parse(dataWithDeletedAt)).toThrow();
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

    it("should set type to Call by default (meaningful default reduces cognitive load)", () => {
      const defaults = getTaskDefaultValues();
      expect(defaults.type).toBe("Call");
    });

    it("should set due_date to today", () => {
      const defaults = getTaskDefaultValues();
      const today = new Date();

      // z.coerce.date() returns a Date object, not a string
      expect(defaults.due_date).toBeInstanceOf(Date);
      // Check it's today (same date, ignoring time)
      expect(defaults.due_date?.toISOString().slice(0, 10)).toBe(today.toISOString().slice(0, 10));
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
      // New audit fields (per migrations 20251127054700/55705)
      expect("created_by" in defaults).toBe(false);
      expect("deleted_at" in defaults).toBe(false);
    });
  });

  describe("Integration with React Hook Form", () => {
    it("should work with partial().parse({}) pattern for form defaults", () => {
      // This is the Engineering Constitution pattern for form state
      const formDefaults = taskSchema.partial().parse({
        completed: false,
        priority: "medium" as const,
        type: "Call" as const,
        due_date: "2025-01-15",
      });

      expect(formDefaults.completed).toBe(false);
      expect(formDefaults.priority).toBe("medium");
      expect(formDefaults.type).toBe("Call");
      // z.coerce.date() converts string to Date object
      expect(formDefaults.due_date).toBeInstanceOf(Date);
      expect(formDefaults.due_date?.toISOString()).toBe("2025-01-15T00:00:00.000Z");
    });

    it("should validate form submission with full schema", () => {
      const formData = {
        title: "Task from form",
        due_date: "2025-01-20",
        priority: "high" as const,
        type: "Call" as const,
        description: "From React Hook Form",
        contact_id: 123,
        sales_id: 456, // Required field
      };

      const result = taskSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });
  });
});
