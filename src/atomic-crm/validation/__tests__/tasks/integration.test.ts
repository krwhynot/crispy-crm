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
      title: "API created task",
      contact_id: "contact-123",
      type: "Call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: "user-456",
      extra_field: "should be ignored",
    };

    const result = validateCreateTask(apiPayload);
    expect(result.title).toBe("API created task");
    expect("extra_field" in result).toBe(false);
  });

  it("should handle type coercion at boundary", () => {
    const apiPayload = {
      title: "Coerced task",
      contact_id: 123, // Number instead of string
      type: "Call",
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
      title: "Updated via API",
      completed_at: "2024-12-20T10:00:00Z",
      malicious_field: "should be ignored",
    };

    const result = validateUpdateTask(apiPayload);
    expect(result.id).toBe("task-123");
    expect(result.title).toBe("Updated via API");
    expect("malicious_field" in result).toBe(false);
  });

  it("should handle date transformation at submission", () => {
    const apiPayload = {
      title: "Task with dates",
      contact_id: "contact-123",
      type: "Meeting",
      due_date: "2024-12-31T15:30:45.123Z", // With milliseconds and time
      sales_id: "user-456",
      completed_at: "2024-12-20T18:45:30.456Z",
    };

    const result = validateTaskForSubmission(apiPayload);
    // Dates should be normalized to start of day
    expect(result.due_date).toBe("2024-12-31T00:00:00.000Z");
    expect(result.completed_at).toBe("2024-12-20T00:00:00.000Z");
  });
});
