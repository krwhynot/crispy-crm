/**
 * Tests for task API boundary integration
 * Focus: API payload validation, type coercion, and security
 */

import { describe, it, expect } from "vitest";
import {
  taskSchema,
  validateCreateTask,
  validateUpdateTask,
  validateTaskForSubmission,
} from "../../tasks";

describe("Task API Boundary Integration", () => {
  it("should validate at creation boundary", () => {
    const apiPayload = {
      text: "API created task",
      contact_id: "contact-123",
      type: "api-call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: "user-456",
      extra_field: "should be ignored",
    };

    const result = validateCreateTask(apiPayload);
    expect(result.text).toBe("API created task");
    expect("extra_field" in result).toBe(false);
  });

  it("should handle type coercion at boundary", () => {
    const apiPayload = {
      text: "Coerced task",
      contact_id: 123, // Number instead of string
      type: "call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: 456, // Number instead of string
    };

    const result = taskSchema.parse(apiPayload);
    expect(result.contact_id).toBe(123);
    expect(result.sales_id).toBe(456);
  });

  it("should validate at update boundary", () => {
    const apiPayload = {
      id: "task-123",
      text: "Updated via API",
      done_date: "2024-12-20T10:00:00Z",
      malicious_field: "should be ignored",
    };

    const result = validateUpdateTask(apiPayload);
    expect(result.id).toBe("task-123");
    expect(result.text).toBe("Updated via API");
    expect("malicious_field" in result).toBe(false);
  });

  it("should handle date transformation at submission", () => {
    const apiPayload = {
      text: "Task with dates",
      contact_id: "contact-123",
      type: "meeting",
      due_date: "2024-12-31T15:30:45.123Z", // With milliseconds and time
      sales_id: "user-456",
      done_date: "2024-12-20T18:45:30.456Z",
    };

    const result = validateTaskForSubmission(apiPayload);
    // Dates should be normalized to start of day
    expect(result.due_date).toBe("2024-12-31T00:00:00.000Z");
    expect(result.done_date).toBe("2024-12-20T00:00:00.000Z");
  });
});