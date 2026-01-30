/**
 * Tests for validation/utils.ts - getFriendlyErrorMessage
 *
 * Ensures user-friendly error messages are correctly mapped from Zod error codes.
 * These messages appear in form validation UI to provide clear, actionable feedback.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { getFriendlyErrorMessage, formatZodErrors, zodErrorToReactAdminError } from "../utils";

describe("getFriendlyErrorMessage", () => {
  describe("invalid_type errors", () => {
    it("returns 'This field is required.' when input is undefined", () => {
      const issue = {
        code: "invalid_type",
        message: "Required",
        path: ["name"],
        input: undefined,
      };

      expect(getFriendlyErrorMessage(issue)).toBe("This field is required.");
    });

    it("returns 'This field is required.' when input is null", () => {
      const issue = {
        code: "invalid_type",
        message: "Required",
        path: ["name"],
        input: null,
      };

      expect(getFriendlyErrorMessage(issue)).toBe("This field is required.");
    });

    it("returns 'Please select a valid date.' when expected type is date", () => {
      const issue = {
        code: "invalid_type",
        message: "Expected date, received string",
        path: ["due_date"],
        expected: "date",
        input: "not-a-date",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Please select a valid date.");
    });

    it("falls back to issue.message for other type mismatches", () => {
      const issue = {
        code: "invalid_type",
        message: "Expected number, received string",
        path: ["count"],
        expected: "number",
        input: "not-a-number",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Expected number, received string");
    });

    it("returns 'Invalid value provided.' when no message and non-null/undefined input", () => {
      const issue = {
        code: "invalid_type",
        message: "",
        path: ["field"],
        expected: "number",
        input: "string-value",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Invalid value provided.");
    });
  });

  describe("invalid_enum_value errors (Zod v3)", () => {
    it("returns 'Please select a valid option.' for invalid enum value", () => {
      const issue = {
        code: "invalid_enum_value",
        message: "Invalid enum value",
        path: ["status"],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Please select a valid option.");
    });
  });

  describe("invalid_value errors (Zod v4)", () => {
    it("returns 'Please select a valid option.' for invalid value", () => {
      const issue = {
        code: "invalid_value",
        message: "Invalid value",
        path: ["priority"],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Please select a valid option.");
    });
  });

  describe("invalid_union errors", () => {
    it("returns 'Invalid value provided.' for union type mismatches", () => {
      const issue = {
        code: "invalid_union",
        message: "Invalid input",
        path: ["value"],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Invalid value provided.");
    });
  });

  describe("custom errors", () => {
    it("preserves custom error message", () => {
      const issue = {
        code: "custom",
        message: "Organization is required (either select existing or enter new name)",
        path: [],
      };

      expect(getFriendlyErrorMessage(issue)).toBe(
        "Organization is required (either select existing or enter new name)"
      );
    });

    it("returns 'Invalid value.' when custom error has no message", () => {
      const issue = {
        code: "custom",
        message: "",
        path: ["field"],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Invalid value.");
    });
  });

  describe("too_small errors", () => {
    describe("string type", () => {
      it("returns 'This field is required.' when min is 1", () => {
        const issue = {
          code: "too_small",
          message: "String must contain at least 1 character(s)",
          path: ["name"],
          minimum: 1,
          type: "string",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("This field is required.");
      });

      it("returns 'This field is required.' when min is 1 using origin (Zod v4)", () => {
        const issue = {
          code: "too_small",
          message: "String must contain at least 1 character(s)",
          path: ["name"],
          minimum: 1,
          origin: "string",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("This field is required.");
      });

      it("returns 'Please enter at least N characters.' when min > 1", () => {
        const issue = {
          code: "too_small",
          message: "String must contain at least 3 character(s)",
          path: ["username"],
          minimum: 3,
          type: "string",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please enter at least 3 characters.");
      });

      it("returns 'Please enter at least N characters.' when min > 1 using origin (Zod v4)", () => {
        const issue = {
          code: "too_small",
          message: "String must contain at least 10 character(s)",
          path: ["description"],
          minimum: 10,
          origin: "string",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please enter at least 10 characters.");
      });
    });

    describe("number type", () => {
      it("returns 'Value must be at least N.' for number minimum", () => {
        const issue = {
          code: "too_small",
          message: "Number must be greater than or equal to 0",
          path: ["quantity"],
          minimum: 0,
          type: "number",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value must be at least 0.");
      });

      it("returns 'Value must be at least N.' using origin (Zod v4)", () => {
        const issue = {
          code: "too_small",
          message: "Number must be greater than or equal to 5",
          path: ["rating"],
          minimum: 5,
          origin: "number",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value must be at least 5.");
      });
    });

    describe("array type", () => {
      it("returns 'At least one item is required.' when min is 1", () => {
        const issue = {
          code: "too_small",
          message: "Array must contain at least 1 element(s)",
          path: ["items"],
          minimum: 1,
          type: "array",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("At least one item is required.");
      });

      it("returns 'Please select at least N items.' when min > 1", () => {
        const issue = {
          code: "too_small",
          message: "Array must contain at least 2 element(s)",
          path: ["tags"],
          minimum: 2,
          type: "array",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please select at least 2 items.");
      });

      it("returns 'Please select at least N items.' using origin (Zod v4)", () => {
        const issue = {
          code: "too_small",
          message: "Array must contain at least 3 element(s)",
          path: ["products"],
          minimum: 3,
          origin: "array",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please select at least 3 items.");
      });
    });

    describe("unknown type", () => {
      it("falls back to issue.message when type is unknown", () => {
        const issue = {
          code: "too_small",
          message: "Value too small",
          path: ["field"],
          minimum: 1,
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value too small");
      });

      it("returns 'Value is too small.' when no message and unknown type", () => {
        const issue = {
          code: "too_small",
          message: "",
          path: ["field"],
          minimum: 1,
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value is too small.");
      });
    });
  });

  describe("too_big errors", () => {
    describe("string type", () => {
      it("returns 'Please keep this under N characters.'", () => {
        const issue = {
          code: "too_big",
          message: "String must contain at most 100 character(s)",
          path: ["name"],
          maximum: 100,
          type: "string",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please keep this under 100 characters.");
      });

      it("returns 'Please keep this under N characters.' using origin (Zod v4)", () => {
        const issue = {
          code: "too_big",
          message: "String must contain at most 255 character(s)",
          path: ["description"],
          maximum: 255,
          origin: "string",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please keep this under 255 characters.");
      });
    });

    describe("number type", () => {
      it("returns 'Value must be at most N.'", () => {
        const issue = {
          code: "too_big",
          message: "Number must be less than or equal to 100",
          path: ["percentage"],
          maximum: 100,
          type: "number",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value must be at most 100.");
      });

      it("returns 'Value must be at most N.' using origin (Zod v4)", () => {
        const issue = {
          code: "too_big",
          message: "Number must be less than or equal to 1000000",
          path: ["amount"],
          maximum: 1000000,
          origin: "number",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value must be at most 1000000.");
      });
    });

    describe("array type", () => {
      it("returns 'Please select no more than N items.'", () => {
        const issue = {
          code: "too_big",
          message: "Array must contain at most 5 element(s)",
          path: ["selections"],
          maximum: 5,
          type: "array",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please select no more than 5 items.");
      });

      it("returns 'Please select no more than N items.' using origin (Zod v4)", () => {
        const issue = {
          code: "too_big",
          message: "Array must contain at most 10 element(s)",
          path: ["products"],
          maximum: 10,
          origin: "array",
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Please select no more than 10 items.");
      });
    });

    describe("unknown type", () => {
      it("falls back to issue.message when type is unknown", () => {
        const issue = {
          code: "too_big",
          message: "Value too large",
          path: ["field"],
          maximum: 100,
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value too large");
      });

      it("returns 'Value is too large.' when no message and unknown type", () => {
        const issue = {
          code: "too_big",
          message: "",
          path: ["field"],
          maximum: 100,
        };

        expect(getFriendlyErrorMessage(issue)).toBe("Value is too large.");
      });
    });
  });

  describe("invalid_string errors (Zod v3)", () => {
    it("returns 'Please enter a valid email address.' for email validation", () => {
      const issue = {
        code: "invalid_string",
        message: "Invalid email",
        path: ["email"],
        validation: "email",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Please enter a valid email address.");
    });

    it("returns 'Please enter a valid URL.' for url validation", () => {
      const issue = {
        code: "invalid_string",
        message: "Invalid url",
        path: ["website"],
        validation: "url",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Please enter a valid URL.");
    });

    it("returns 'Invalid identifier format.' for uuid validation", () => {
      const issue = {
        code: "invalid_string",
        message: "Invalid uuid",
        path: ["id"],
        validation: "uuid",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Invalid identifier format.");
    });

    it("falls back to issue.message for unknown validation types", () => {
      const issue = {
        code: "invalid_string",
        message: "Invalid regex pattern",
        path: ["pattern"],
        validation: "regex",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Invalid regex pattern");
    });

    it("returns 'Invalid format.' when no message and unknown validation", () => {
      const issue = {
        code: "invalid_string",
        message: "",
        path: ["field"],
        validation: "custom",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Invalid format.");
    });
  });

  describe("invalid_format errors (Zod v4)", () => {
    it("returns 'Please enter a valid email address.' for email format", () => {
      const issue = {
        code: "invalid_format",
        message: "Invalid email",
        path: ["email"],
        format: "email",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Please enter a valid email address.");
    });

    it("returns 'Please enter a valid URL.' for url format", () => {
      const issue = {
        code: "invalid_format",
        message: "Invalid url",
        path: ["website"],
        format: "url",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Please enter a valid URL.");
    });

    it("returns 'Invalid identifier format.' for uuid format", () => {
      const issue = {
        code: "invalid_format",
        message: "Invalid uuid",
        path: ["id"],
        format: "uuid",
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Invalid identifier format.");
    });
  });

  describe("unrecognized_keys errors", () => {
    it("returns singular message for one unknown field", () => {
      const issue = {
        code: "unrecognized_keys",
        message: "Unrecognized keys",
        path: [],
        keys: ["admin"],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Unknown field 'admin' is not allowed");
    });

    it("returns plural message for multiple unknown fields", () => {
      const issue = {
        code: "unrecognized_keys",
        message: "Unrecognized keys",
        path: [],
        keys: ["admin", "role", "permissions"],
      };

      expect(getFriendlyErrorMessage(issue)).toBe(
        "Unknown fields 'admin', 'role', 'permissions' are not allowed"
      );
    });

    it("returns fallback message when keys array is empty", () => {
      const issue = {
        code: "unrecognized_keys",
        message: "Unrecognized keys",
        path: [],
        keys: [],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Unexpected fields provided.");
    });

    it("returns fallback message when keys is undefined", () => {
      const issue = {
        code: "unrecognized_keys",
        message: "Unrecognized keys",
        path: [],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Unexpected fields provided.");
    });
  });

  describe("unknown error codes", () => {
    it("falls back to issue.message for unhandled error codes", () => {
      const issue = {
        code: "some_future_error_code",
        message: "Some error occurred",
        path: ["field"],
      };

      expect(getFriendlyErrorMessage(issue)).toBe("Some error occurred");
    });
  });
});

describe("formatZodErrors", () => {
  it("maps multiple issues to field paths with friendly messages", () => {
    const error = {
      issues: [
        {
          code: "too_small",
          message: "String must contain at least 1 character(s)",
          path: ["name"],
          minimum: 1,
          type: "string",
        },
        {
          code: "invalid_string",
          message: "Invalid email",
          path: ["email"],
          validation: "email",
        },
      ],
    };

    const result = formatZodErrors(error);

    expect(result).toEqual({
      name: "This field is required.",
      email: "Please enter a valid email address.",
    });
  });

  it("handles nested paths with dot notation", () => {
    const error = {
      issues: [
        {
          code: "invalid_type",
          message: "Required",
          path: ["address", "city"],
          input: undefined,
        },
      ],
    };

    const result = formatZodErrors(error);

    expect(result).toEqual({
      "address.city": "This field is required.",
    });
  });

  it("handles array index paths", () => {
    const error = {
      issues: [
        {
          code: "too_small",
          message: "String must contain at least 1 character(s)",
          path: ["items", 0, "name"],
          minimum: 1,
          type: "string",
        },
      ],
    };

    const result = formatZodErrors(error);

    expect(result).toEqual({
      "items.0.name": "This field is required.",
    });
  });

  it("returns empty object for empty issues array", () => {
    const error = {
      issues: [],
    };

    const result = formatZodErrors(error);

    expect(result).toEqual({});
  });
});

describe("zodErrorToReactAdminError", () => {
  it("should transform missing required field to friendly message", () => {
    const schema = z.object({ name: z.string() });

    try {
      schema.parse({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const result = zodErrorToReactAdminError(error);

        expect(result.message).toBe("Validation failed");
        expect(result.body.errors.name).toBe("This field is required.");
        expect(result.body.errors.name).not.toContain("expected string");
      }
    }
  });

  it("should transform invalid type to friendly message", () => {
    const schema = z.object({ age: z.number() });

    try {
      schema.parse({ age: "not a number" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const result = zodErrorToReactAdminError(error);

        expect(result.body.errors.age).toContain("required");
        expect(result.body.errors.age).not.toContain("expected number");
      }
    }
  });

  it("should handle nested paths correctly", () => {
    const schema = z.object({
      contact: z.object({ email: z.string().email() }),
    });

    try {
      schema.parse({ contact: { email: "invalid" } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const result = zodErrorToReactAdminError(error);

        expect(result.body.errors["contact.email"]).toBe("Please enter a valid email address.");
      }
    }
  });

  it("should accept custom error message", () => {
    const schema = z.object({ name: z.string() });

    try {
      schema.parse({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const result = zodErrorToReactAdminError(error, "Custom validation error");

        expect(result.message).toBe("Custom validation error");
      }
    }
  });

  it("should transform enum errors to friendly message", () => {
    const schema = z.object({
      status: z.enum(["active", "inactive"]),
    });

    try {
      schema.parse({ status: "invalid" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const result = zodErrorToReactAdminError(error);

        expect(result.body.errors.status).toBe("Please select a valid option.");
        expect(result.body.errors.status).not.toContain("Invalid enum value");
      }
    }
  });

  it("should work with safeParse pattern", () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const result = schema.safeParse({ email: "invalid" });

    if (!result.success) {
      const reactAdminError = zodErrorToReactAdminError(result.error);

      expect(reactAdminError.message).toBe("Validation failed");
      expect(reactAdminError.body.errors.email).toBe("Please enter a valid email address.");
    }
  });
});
