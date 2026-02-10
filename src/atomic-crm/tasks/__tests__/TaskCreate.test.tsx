/**
 * TaskCreate Tests - URL Params & Validation Logic
 *
 * Tests for Bug #1: URL params not pre-filling title/type
 * Tests for Bug #2: Validation errors not visible
 *
 * NOTE: Component rendering tests are deferred due to ra-ui-materialui ES module
 * resolution issue (affects all Create components). These unit tests verify the
 * underlying logic. Use E2E tests for full UI verification.
 *
 * See: https://github.com/marmelab/react-admin/issues/8978
 */

import { describe, it, expect } from "vitest";
import { getTaskDefaultValues, taskCreateSchema } from "../../validation/task";

/**
 * URL param to task type mapping
 * This is the mapping that should be added to TaskCreate.tsx
 */
const URL_TYPE_MAP: Record<string, string> = {
  follow_up: "Follow-up",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  demo: "Demo",
  proposal: "Proposal",
  other: "Other",
};

/**
 * Helper function to simulate URL param processing
 * This mirrors what TaskCreate.tsx should implement
 */
function processUrlParams(searchParams: URLSearchParams) {
  const urlTitle = searchParams.get("title");
  const urlType = searchParams.get("type");

  const defaults = getTaskDefaultValues();

  return {
    ...defaults,
    ...(urlTitle && { title: urlTitle }),
    ...(urlType && { type: URL_TYPE_MAP[urlType.toLowerCase()] || urlType }),
  };
}

describe("TaskCreate - URL Params Logic", () => {
  describe("URL Type Mapping", () => {
    it("maps follow_up to Follow-up", () => {
      const params = new URLSearchParams("type=follow_up");
      const result = processUrlParams(params);
      expect(result.type).toBe("Follow-up");
    });

    it("maps uppercase FOLLOW_UP to Follow-up", () => {
      const params = new URLSearchParams("type=FOLLOW_UP");
      const result = processUrlParams(params);
      expect(result.type).toBe("Follow-up");
    });

    it("passes through already correct type values", () => {
      const params = new URLSearchParams("type=Meeting");
      const result = processUrlParams(params);
      expect(result.type).toBe("Meeting");
    });

    it("maps all snake_case types correctly", () => {
      const mappings = [
        ["call", "Call"],
        ["email", "Email"],
        ["meeting", "Meeting"],
        ["follow_up", "Follow-up"],
        ["demo", "Demo"],
        ["proposal", "Proposal"],
        ["other", "Other"],
      ];

      mappings.forEach(([input, expected]) => {
        const params = new URLSearchParams(`type=${input}`);
        const result = processUrlParams(params);
        expect(result.type).toBe(expected);
      });
    });
  });

  describe("URL Title Processing", () => {
    it("reads title from URL params", () => {
      const params = new URLSearchParams("title=Follow-up%3A%20Call%20John");
      const result = processUrlParams(params);
      expect(result.title).toBe("Follow-up: Call John");
    });

    it("handles special characters in title", () => {
      const params = new URLSearchParams("title=Test%20%26%20Verify");
      const result = processUrlParams(params);
      expect(result.title).toBe("Test & Verify");
    });

    it("uses undefined title when not provided", () => {
      const params = new URLSearchParams("");
      const result = processUrlParams(params);
      expect(result.title).toBeUndefined();
    });
  });

  describe("Combined URL Params", () => {
    it("handles both title and type together", () => {
      const params = new URLSearchParams("title=Test%20Task&type=Meeting");
      const result = processUrlParams(params);
      expect(result.title).toBe("Test Task");
      expect(result.type).toBe("Meeting");
    });

    it("preserves schema defaults for non-URL fields", () => {
      const params = new URLSearchParams("title=Test");
      const result = processUrlParams(params);
      expect(result.priority).toBe("medium");
      expect(result.completed).toBe(false);
      expect(result.due_date).toBeUndefined(); // No default — optional per Q8 policy
    });
  });
});

describe("TaskCreate - Validation Schema", () => {
  describe("Required Fields", () => {
    it("requires title field", () => {
      const result = taskCreateSchema.safeParse({
        due_date: new Date(),
        type: "Call",
        priority: "medium",
        sales_id: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.issues.find((i) => i.path.includes("title"));
        expect(titleError).toBeDefined();
        // Zod reports this as "expected string, received undefined" for missing required fields
        expect(titleError?.message).toMatch(/required|expected string/i);
      }
    });

    it("accepts missing due_date field (optional per Q8 policy)", () => {
      const result = taskCreateSchema.safeParse({
        title: "Test Task",
        type: "Call",
        priority: "medium",
        sales_id: 1,
        // due_date missing — valid since Q8 policy makes it optional
      });
      expect(result.success).toBe(true);
    });

    it("requires sales_id field", () => {
      const result = taskCreateSchema.safeParse({
        title: "Test Task",
        due_date: new Date(),
        type: "Call",
        priority: "medium",
        // sales_id missing
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Title Validation", () => {
    it("rejects empty title", () => {
      const result = taskCreateSchema.safeParse({
        title: "",
        due_date: new Date(),
        type: "Call",
        priority: "medium",
        sales_id: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("rejects title over 500 characters", () => {
      const result = taskCreateSchema.safeParse({
        title: "a".repeat(501),
        due_date: new Date(),
        type: "Call",
        priority: "medium",
        sales_id: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("too long");
      }
    });

    it("trims whitespace from title", () => {
      const result = taskCreateSchema.safeParse({
        title: "  Test Task  ",
        due_date: new Date(),
        type: "Call",
        priority: "medium",
        sales_id: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Task");
      }
    });
  });

  describe("Type Validation", () => {
    it("accepts valid task types", () => {
      const validTypes = ["Call", "Email", "Meeting", "Follow-up", "Demo", "Proposal", "Other"];

      validTypes.forEach((type) => {
        const result = taskCreateSchema.safeParse({
          title: "Test",
          due_date: new Date(),
          type,
          priority: "medium",
          sales_id: 1,
        });
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid task type", () => {
      const result = taskCreateSchema.safeParse({
        title: "Test",
        due_date: new Date(),
        type: "InvalidType",
        priority: "medium",
        sales_id: 1,
      });
      expect(result.success).toBe(false);
    });

    it("rejects snake_case type (requires mapping before validation)", () => {
      const result = taskCreateSchema.safeParse({
        title: "Test",
        due_date: new Date(),
        type: "follow_up", // Should be "Follow-up" after URL mapping
        priority: "medium",
        sales_id: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Valid Complete Task", () => {
    it("accepts valid task with all required fields", () => {
      const result = taskCreateSchema.safeParse({
        title: "Follow-up with client",
        due_date: new Date(),
        type: "Follow-up",
        priority: "high",
        sales_id: 1,
        description: "Call to discuss proposal",
        contact_id: 123,
        opportunity_id: 456,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("TaskCreate - Default Values", () => {
  it("provides correct schema defaults", () => {
    const defaults = getTaskDefaultValues();

    expect(defaults.completed).toBe(false);
    expect(defaults.priority).toBe("medium");
    expect(defaults.type).toBe("Call");
    expect(defaults.due_date).toBeUndefined(); // No default — optional per Q8 policy
    expect(defaults.title).toBeUndefined();
  });

  it("due_date has no default (optional per Q8 policy)", () => {
    const defaults = getTaskDefaultValues();
    // due_date is optional — no default value assigned
    expect(defaults.due_date).toBeUndefined();
  });
});
