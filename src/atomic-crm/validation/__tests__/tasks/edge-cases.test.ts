/**
 * Tests for task edge cases and error handling
 * Focus: Business rules, workflows, and error messages
 */

import { describe, it, expect } from "vitest";
import {
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
} from "../../tasks";
import { z } from "zod";

describe("Task Edge Cases and Business Rules", () => {
  describe("Business Rules", () => {
    it("should enforce required contact association", () => {
      const taskWithoutContact = {
        text: "Orphan task",
        type: "call",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };

      expect(() => taskSchema.parse(taskWithoutContact)).toThrow(z.ZodError);
    });

    it("should enforce sales assignment", () => {
      const unassignedTask = {
        text: "Unassigned task",
        contact_id: "contact-123",
        type: "email",
        due_date: "2024-12-31T10:00:00Z",
      };

      expect(() => taskSchema.parse(unassignedTask)).toThrow(z.ZodError);
    });

    it("should handle task completion workflow", () => {
      // Create task
      const newTask = {
        text: "Task to complete",
        contact_id: "contact-123",
        type: "todo",
        due_date: "2024-12-31T10:00:00Z",
        sales_id: "user-456",
      };

      const created = createTaskSchema.parse(newTask);
      expect(created.done_date).toBeUndefined();

      // Mark as complete
      const completeUpdate = {
        id: "task-123",
        done_date: "2024-12-20T10:00:00Z",
      };

      const completed = updateTaskSchema.parse(completeUpdate);
      expect(completed.done_date).toBe("2024-12-20T10:00:00Z");

      // Reopen task
      const reopenUpdate = {
        id: "task-123",
        done_date: null,
      };

      const reopened = updateTaskSchema.parse(reopenUpdate);
      expect(reopened.done_date).toBeNull();
    });

    it("should support various task types", () => {
      const taskTypes = [
        "call",
        "email",
        "meeting",
        "todo",
        "follow-up",
        "reminder",
        "deadline",
        "milestone",
        "review",
        "approval",
      ];

      taskTypes.forEach((type) => {
        const task = {
          text: `${type} task`,
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
    it("should provide clear error messages", () => {
      const testCases = [
        {
          data: {
            text: "",
            contact_id: "c-1",
            type: "call",
            due_date: "2024-12-31",
            sales_id: "u-1",
          },
          expectedError: "Description is required",
        },
        {
          data: {
            text: "Test",
            contact_id: "",
            type: "call",
            due_date: "2024-12-31",
            sales_id: "u-1",
          },
          expectedError: "Contact is required",
        },
        {
          data: {
            text: "Test",
            contact_id: "c-1",
            type: "",
            due_date: "2024-12-31",
            sales_id: "u-1",
          },
          expectedError: "Type is required",
        },
        {
          data: {
            text: "Test",
            contact_id: "c-1",
            type: "call",
            due_date: "",
            sales_id: "u-1",
          },
          expectedError: "Due date is required",
        },
      ];

      testCases.forEach(({ data, expectedError }) => {
        try {
          taskSchema.parse(data);
          expect.fail("Should have thrown error");
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.errors[0].message;
            expect(message).toBe(expectedError);
          }
        }
      });
    });
  });
});