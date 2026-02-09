/**
 * Gate 2: Activity Type Contract Tests
 *
 * Verifies activity_type contract is consistent across layers.
 * The Zod schema must match what UI components use.
 *
 * Valid values: 'activity' | 'task'
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { activityTypeSchema, activitiesSchema, baseActivitiesSchema } from "../activities";

describe("activity_type contract", () => {
  describe("activityTypeSchema enum values", () => {
    it("should define exactly 'activity' and 'task' as valid values", () => {
      const validValues = activityTypeSchema.options;

      expect(validValues).toHaveLength(2);
      expect(validValues).toContain("activity");
      expect(validValues).toContain("task");
    });

    it("should accept 'activity' as valid", () => {
      expect(() => activityTypeSchema.parse("activity")).not.toThrow();
      expect(activityTypeSchema.parse("activity")).toBe("activity");
    });

    it("should accept 'task' as valid", () => {
      expect(() => activityTypeSchema.parse("task")).not.toThrow();
      expect(activityTypeSchema.parse("task")).toBe("task");
    });
  });

  describe("activityTypeSchema rejects invalid values", () => {
    const invalidValues = [
      "engagement",
      "interaction",
      "note",
      "call",
      "meeting",
      "todo",
      "action",
      "event",
      "",
      "ACTIVITY",
      "Task",
      "TASK",
      null,
      undefined,
      123,
      {},
      [],
    ];

    it.each(invalidValues)("should reject invalid activity_type: %s", (invalidValue) => {
      expect(() => activityTypeSchema.parse(invalidValue)).toThrow(z.ZodError);
    });
  });

  describe("baseActivitiesSchema activity_type integration", () => {
    const validActivityBase = {
      subject: "Test activity",
      type: "call" as const,
      contact_id: 1,
    };

    it("should accept activity_type 'activity' in full schema", () => {
      const data = { ...validActivityBase, activity_type: "activity" as const };
      expect(() => baseActivitiesSchema.parse(data)).not.toThrow();
    });

    it("should accept activity_type 'task' in full schema", () => {
      const data = { ...validActivityBase, activity_type: "task" as const };
      expect(() => baseActivitiesSchema.parse(data)).not.toThrow();
    });

    it("should reject invalid activity_type in full schema", () => {
      const data = { ...validActivityBase, activity_type: "engagement" };
      expect(() => baseActivitiesSchema.parse(data)).toThrow(z.ZodError);
    });

    it("should default activity_type to 'activity' when not provided", () => {
      const data = { ...validActivityBase };
      const result = baseActivitiesSchema.parse(data);
      expect(result.activity_type).toBe("activity");
    });
  });

  describe("activitiesSchema with refinements", () => {
    it("should allow 'activity' type with contact relationship", () => {
      const data = {
        subject: "Test activity",
        activity_type: "activity" as const,
        type: "call" as const,
        contact_id: 1,
      };
      expect(() => activitiesSchema.parse(data)).not.toThrow();
    });

    it("should allow 'task' type without entity relationships (standalone task)", () => {
      const data = {
        subject: "Standalone task",
        activity_type: "task" as const,
        type: "administrative" as const,
      };
      expect(() => activitiesSchema.parse(data)).not.toThrow();
    });

    it("should require entity relationship for 'activity' type", () => {
      const data = {
        subject: "Activity without contact",
        activity_type: "activity" as const,
        type: "call" as const,
      };
      expect(() => activitiesSchema.parse(data)).toThrow(z.ZodError);
    });
  });

  describe("type inference alignment", () => {
    it("should infer ActivityType as union of 'activity' | 'task'", () => {
      type InferredType = z.infer<typeof activityTypeSchema>;

      const activity: InferredType = "activity";
      const task: InferredType = "task";

      expect(activity).toBe("activity");
      expect(task).toBe("task");
    });
  });
});
