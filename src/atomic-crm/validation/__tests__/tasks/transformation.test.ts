/**
 * Tests for task data transformation utilities
 * Focus: Date transformations and data formatting
 */

import { describe, it, expect } from "vitest";
import {
  validateTaskForSubmission,
  transformTaskDate,
} from "../../tasks";

describe("Task Transformation Utilities", () => {
  describe("validateTaskForSubmission", () => {
    it("should validate and transform task data", () => {
      const inputData = {
        text: "Task for submission",
        contact_id: "contact-123",
        type: "meeting",
        due_date: "2024-12-31T15:30:45Z",
        sales_id: "user-456",
      };

      const result = validateTaskForSubmission(inputData);
      expect(result.text).toBe("Task for submission");
      // Date should be transformed to start of day
      expect(result.due_date).toMatch(/T00:00:00\.000Z$/);
    });

    it("should transform done_date if present", () => {
      const dataWithDoneDate = {
        text: "Completed task",
        contact_id: "contact-123",
        type: "call",
        due_date: "2024-12-31T15:30:00Z",
        sales_id: "user-456",
        done_date: "2024-12-20T18:45:30Z",
      };

      const result = validateTaskForSubmission(dataWithDoneDate);
      // Both dates should be transformed to start of day
      expect(result.due_date).toMatch(/T00:00:00\.000Z$/);
      expect(result.done_date).toMatch(/T00:00:00\.000Z$/);
    });
  });

  describe("transformTaskDate", () => {
    it("should transform date to start of day", () => {
      const testCases = [
        {
          input: "2024-12-31T15:30:45Z",
          expected: "2024-12-31T00:00:00.000Z",
        },
        {
          input: "2024-01-15T23:59:59Z",
          expected: "2024-01-15T00:00:00.000Z",
        },
        {
          input: "2024-06-15T12:00:00Z",
          expected: "2024-06-15T00:00:00.000Z",
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = transformTaskDate(input);
        expect(result).toBe(expected);
      });
    });
  });
});