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
} from "../../task";

describe("Task API Boundary Integration", () => {
  it("should validate at creation boundary", () => {
    const apiPayload = {
      title: "API created task",
      contact_id: 123,
      type: "Call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: 456,
    };

    const result = validateCreateTask(apiPayload);
    expect(result.title).toBe("API created task");
  });

  it("should reject extra fields at creation (z.strictObject security)", () => {
    const apiPayload = {
      title: "API created task",
      contact_id: 123,
      type: "Call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: 456,
      extra_field: "should be rejected",
    };

    // z.strictObject() rejects unrecognized keys (mass assignment prevention)
    expect(() => validateCreateTask(apiPayload)).toThrow();
  });

  it("should handle type coercion at boundary", () => {
    // String numeric IDs get coerced to numbers (React Admin compatibility)
    const apiPayload = {
      title: "Coerced task",
      contact_id: "123", // String gets coerced to number
      type: "Call",
      due_date: "2024-12-31T10:00:00Z",
      sales_id: "456", // String gets coerced to number
    };

    const result = taskSchema.parse(apiPayload);
    expect(result.contact_id).toBe(123);
    expect(result.sales_id).toBe(456);
  });

  it("should validate at update boundary", () => {
    const apiPayload = {
      id: 123,
      title: "Updated via API",
      completed_at: "2024-12-20T10:00:00Z",
    };

    const result = validateUpdateTask(apiPayload);
    expect(result.id).toBe(123);
    expect(result.title).toBe("Updated via API");
  });

  it("should allow extra fields at update (passthrough for computed DB fields)", () => {
    // taskUpdateSchema uses .passthrough() intentionally to allow computed fields
    // from database views (assignee_name, contact_name, etc.) through validation.
    // These are stripped by lifecycle callbacks in beforeSave, not by Zod.
    //
    // Security note: This is safe because:
    // 1. The base taskSchema uses z.strictObject() for CREATE operations
    // 2. Extra fields on UPDATE are stripped by beforeSave callbacks before DB write
    // 3. RLS policies provide the actual security boundary
    const apiPayload = {
      id: 123,
      title: "Updated via API",
      assignee_name: "John Doe", // Computed field from view - allowed through, stripped by callback
    };

    // Should NOT throw - passthrough allows extra fields
    const result = validateUpdateTask(apiPayload);
    expect(result.id).toBe(123);
    expect(result.title).toBe("Updated via API");
    // Extra field passes through (will be stripped by lifecycle callback)
    expect(result.assignee_name).toBe("John Doe");
  });

  // NOTE: Date transformation test removed per Engineering Constitution
  // (over-engineering - dates are passed through as-is, no complex transforms)
  it("should pass dates through without transformation", () => {
    const apiPayload = {
      title: "Task with dates",
      contact_id: 123,
      type: "Meeting",
      due_date: "2024-12-31T15:30:45.123Z",
      sales_id: 456,
      completed_at: "2024-12-20T18:45:30.456Z",
    };

    const result = validateTaskForSubmission(apiPayload);
    // z.coerce.date() converts strings to Date objects (per schema design)
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date.toISOString()).toBe("2024-12-31T15:30:45.123Z");
    expect(result.completed_at).toBe("2024-12-20T18:45:30.456Z"); // completed_at is string, not coerced
  });
});
