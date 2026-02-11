/**
 * Tests for task edge cases and error handling
 * Focus: Business rules, workflows, and error messages
 */

import { describe, it, expect } from "vitest";
import { taskSchema, taskCreateSchema, taskUpdateSchema } from "../../task";
import { z } from "zod";

describe("Task Edge Cases and Business Rules", () => {
  describe("Business Rules", () => {
    it("should allow tasks without contact association", () => {
      // Tasks can be associated with contact, opportunity, or organization - all optional
      const taskWithoutContact = {
        title: "Orphan task",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
      };

      // Should parse successfully - contact_id is optional per schema design
      const result = taskSchema.parse(taskWithoutContact);
      expect(result.title).toBe("Orphan task");
      expect(result.contact_id).toBeUndefined();
    });

    it("should enforce sales assignment", () => {
      const unassignedTask = {
        title: "Unassigned task",
        contact_id: 123,
        type: "Email",
        due_date: "2024-12-31T10:00:00Z",
      };

      expect(() => taskSchema.parse(unassignedTask)).toThrow(z.ZodError);
    });

    it("should handle task completion workflow", () => {
      // Create task
      const newTask = {
        title: "Task to complete",
        contact_id: 123,
        type: "Other",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: 456,
      };

      const created = taskCreateSchema.parse(newTask);
      expect(created.completed_at).toBeUndefined();

      // Mark as complete
      const completeUpdate = {
        id: 123,
        completed_at: "2024-12-20T10:00:00Z",
      };

      const completed = taskUpdateSchema.parse(completeUpdate);
      expect(completed.completed_at).toBe("2024-12-20T10:00:00Z");

      // Reopen task
      const reopenUpdate = {
        id: 123,
        completed_at: null,
      };

      const reopened = taskUpdateSchema.parse(reopenUpdate);
      expect(reopened.completed_at).toBeNull();
    });

    it("should support various task types", () => {
      const taskTypes = ["Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal", "Other"];

      taskTypes.forEach((type) => {
        const task = {
          title: `${type} task`,
          contact_id: 123,
          type,
          due_date: "2024-12-31T10:00:00Z",
          sales_id: 456,
        };

        expect(() => taskSchema.parse(task)).not.toThrow();
      });
    });
  });

  describe("Error Message Formatting", () => {
    it("should reject tasks with empty required fields", () => {
      // Empty title
      expect(() =>
        taskSchema.parse({
          title: "",
          contact_id: 1,
          type: "Call",
          due_date: "2024-12-31",
          sales_id: 1,
        })
      ).toThrow(z.ZodError);

      // Missing contact_id (cannot be empty - must be positive number)
      expect(() =>
        taskSchema.parse({
          title: "Test",
          contact_id: 0, // Zero is not positive
          type: "Call",
          due_date: "2024-12-31",
          sales_id: 1,
        })
      ).toThrow(z.ZodError);
    });

    it("should treat empty due_date as undefined (preprocess strips empty strings)", () => {
      const result = taskSchema.parse({
        title: "Test",
        contact_id: 1,
        type: "Call",
        due_date: "",
        sales_id: 1,
      });
      expect(result.due_date).toBeUndefined();
    });

    it("should reject invalid task type enum", () => {
      const invalidType = {
        title: "Test",
        contact_id: 1,
        type: "invalid-type",
        due_date: "2024-12-31",
        sales_id: 1,
      };

      expect(() => taskSchema.parse(invalidType)).toThrow(z.ZodError);
    });
  });
});
