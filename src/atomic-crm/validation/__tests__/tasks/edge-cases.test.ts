/**
 * Tests for task edge cases and error handling
 * Focus: Business rules, workflows, and error messages
 */

import { describe, it, expect } from "vitest";
import { taskSchema, createTaskSchema, updateTaskSchema } from "../../task";
import { z } from "zod";

describe("Task Edge Cases and Business Rules", () => {
  describe("Business Rules", () => {
    it("should enforce required contact association", () => {
      const taskWithoutContact = {
        title: "Orphan task",
        type: "Call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };

      expect(() => taskSchema.parse(taskWithoutContact)).toThrow(z.ZodError);
    });

    it("should enforce sales assignment", () => {
      const unassignedTask = {
        title: "Unassigned task",
        contact_id: "contact-123",
        type: "Email",
        due_date: "2024-12-31T10:00:00Z",
      };

      expect(() => taskSchema.parse(unassignedTask)).toThrow(z.ZodError);
    });

    it("should handle task completion workflow", () => {
      // Create task
      const newTask = {
        title: "Task to complete",
        contact_id: "contact-123",
        type: "None",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };

      const created = createTaskSchema.parse(newTask);
      expect(created.completed_at).toBeUndefined();

      // Mark as complete
      const completeUpdate = {
        id: "task-123",
        completed_at: "2024-12-20T10:00:00Z",
      };

      const completed = updateTaskSchema.parse(completeUpdate);
      expect(completed.completed_at).toBe("2024-12-20T10:00:00Z");

      // Reopen task
      const reopenUpdate = {
        id: "task-123",
        completed_at: null,
      };

      const reopened = updateTaskSchema.parse(reopenUpdate);
      expect(reopened.completed_at).toBeNull();
    });

    it("should support various task types", () => {
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
        const task = {
          title: `${type} task`,
          contact_id: "contact-123",
          type,
          due_date: "2024-12-31T10:00:00Z",
          sales_id: "user-456",
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
          contact_id: "c-1",
          type: "Call",
          due_date: "2024-12-31",
          sales_id: "u-1",
        })
      ).toThrow(z.ZodError);

      // Empty contact_id
      expect(() =>
        taskSchema.parse({
          title: "Test",
          contact_id: "",
          type: "Call",
          due_date: "2024-12-31",
          sales_id: "u-1",
        })
      ).toThrow(z.ZodError);

      // Empty due_date
      expect(() =>
        taskSchema.parse({
          title: "Test",
          contact_id: "c-1",
          type: "Call",
          due_date: "",
          sales_id: "u-1",
        })
      ).toThrow(z.ZodError);
    });

    it("should reject invalid task type enum", () => {
      const invalidType = {
        title: "Test",
        contact_id: "c-1",
        type: "invalid-type",
        due_date: "2024-12-31",
        sales_id: "u-1",
      };

      expect(() => taskSchema.parse(invalidType)).toThrow(z.ZodError);
    });
  });
});
