/**
 * Unit Tests for Zod Error Formatting Utilities
 *
 * Tests the createFormResolver function and related error formatting utilities
 * to ensure they transform Zod validation errors into user-friendly messages
 * with proper React Hook Form structure.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  createFormResolver,
  zodErrorToFormErrors,
  getFieldError,
  hasFieldError,
  getAllErrorMessages,
  createValidationError,
} from "../zodErrorFormatting";

describe("createFormResolver", () => {
  it("should return friendly errors for missing required fields", async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver({}, undefined, { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" });

    expect(result.errors).toBeDefined();
    expect(result.errors.name?.message).toBe("This field is required.");
    expect(result.errors.email?.message).toBe("This field is required.");
    expect(result.values).toEqual({});
  });

  it("should return friendly errors for invalid enum values", async () => {
    const schema = z.object({
      status: z.enum(["active", "inactive"]),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { status: "pending" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.status?.message).toBe("Please select a valid option.");
    expect(result.values).toEqual({});
  });

  it("should handle nested object paths with proper error structure", async () => {
    const schema = z.object({
      contact: z.object({
        email: z.string().email(),
        phone: z.string().min(1),
      }),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { contact: { email: "invalid", phone: "" } },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    // Type assertion for nested error structure
    const contactErrors = result.errors.contact as Record<string, { message: string }>;
    expect(contactErrors?.email?.message).toBe("Please enter a valid email address.");
    expect(contactErrors?.phone?.message).toBe("This field is required.");
    expect(result.values).toEqual({});
  });

  it("should return validated data with empty errors on successful validation", async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number(),
    });
    const resolver = createFormResolver(schema);
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    };
    const result = await resolver(
      validData,
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toEqual({});
    expect(result.values).toEqual(validData);
  });

  it("should handle array field errors with proper nested structure", async () => {
    const schema = z.object({
      emails: z.array(z.string().email()),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { emails: ["valid@example.com", "invalid-email", "another@example.com"] },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.emails?.[1]?.message).toBe("Please enter a valid email address.");
    expect(result.values).toEqual({});
  });

  it("should return friendly error for email validation", async () => {
    const schema = z.object({
      email: z.string().email(),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { email: "not-an-email" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.email?.message).toBe("Please enter a valid email address.");
    expect(result.values).toEqual({});
  });

  it("should handle string length validation errors", async () => {
    const schema = z.object({
      shortText: z.string().min(5),
      longText: z.string().max(10),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { shortText: "abc", longText: "this is way too long" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.shortText?.message).toBe("Please enter at least 5 characters.");
    expect(result.errors.longText?.message).toBe("Please keep this under 10 characters.");
    expect(result.values).toEqual({});
  });

  it("should handle number range validation errors", async () => {
    const schema = z.object({
      min: z.number().min(10),
      max: z.number().max(100),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { min: 5, max: 150 },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.min?.message).toBe("Value must be at least 10.");
    expect(result.errors.max?.message).toBe("Value must be at most 100.");
    expect(result.values).toEqual({});
  });

  it("should handle date validation errors", async () => {
    const schema = z.object({
      birthdate: z.date(),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { birthdate: "not-a-date" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.birthdate?.message).toBe("Please select a valid date.");
    expect(result.values).toEqual({});
  });

  it("should handle URL validation errors", async () => {
    const schema = z.object({
      website: z.string().url(),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { website: "not-a-url" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.website?.message).toBe("Please enter a valid URL.");
    expect(result.values).toEqual({});
  });

  it("should handle array minimum length validation", async () => {
    const schema = z.object({
      tags: z.array(z.string()).min(2),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { tags: ["one"] },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.tags?.message).toBe("Please select at least 2 items.");
    expect(result.values).toEqual({});
  });

  it("should handle deeply nested object structures", async () => {
    const schema = z.object({
      company: z.object({
        address: z.object({
          street: z.string().min(1),
          city: z.string().min(1),
        }),
      }),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { company: { address: { street: "", city: "" } } },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.company?.address?.street?.message).toBe("This field is required.");
    expect(result.errors.company?.address?.city?.message).toBe("This field is required.");
    expect(result.values).toEqual({});
  });

  it("should handle optional fields that are provided but invalid", async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email().optional(),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { name: "John", email: "invalid" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toBeDefined();
    expect(result.errors.email?.message).toBe("Please enter a valid email address.");
    expect(result.values).toEqual({});
  });

  it("should allow optional fields to be omitted", async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email().optional(),
    });
    const resolver = createFormResolver(schema);
    const result = await resolver(
      { name: "John" },
      undefined,
      { fields: {}, shouldUseNativeValidation: false, criteriaMode: "firstError" }
    );

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ name: "John" });
  });
});

describe("zodErrorToFormErrors", () => {
  it("should transform ZodError to flat record of field paths", () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const parseResult = schema.safeParse({ name: "", email: "invalid" });
    if (!parseResult.success) {
      const errors = zodErrorToFormErrors(parseResult.error);

      expect(errors).toHaveProperty("name");
      expect(errors).toHaveProperty("email");
      expect(errors.name).toBe("This field is required.");
      expect(errors.email).toBe("Please enter a valid email address.");
    } else {
      throw new Error("Expected validation to fail");
    }
  });

  it("should handle nested paths with dot notation", () => {
    const schema = z.object({
      contact: z.object({
        phone: z.string().min(1),
      }),
    });

    const parseResult = schema.safeParse({ contact: { phone: "" } });
    if (!parseResult.success) {
      const errors = zodErrorToFormErrors(parseResult.error);

      expect(errors).toHaveProperty("contact.phone");
      expect(errors["contact.phone"]).toBe("This field is required.");
    } else {
      throw new Error("Expected validation to fail");
    }
  });

  it("should handle array indices in paths", () => {
    const schema = z.object({
      emails: z.array(z.string().email()),
    });

    const parseResult = schema.safeParse({ emails: ["valid@example.com", "invalid"] });
    if (!parseResult.success) {
      const errors = zodErrorToFormErrors(parseResult.error);

      expect(errors).toHaveProperty("emails.1");
      expect(errors["emails.1"]).toBe("Please enter a valid email address.");
    } else {
      throw new Error("Expected validation to fail");
    }
  });
});

describe("getFieldError", () => {
  it("should extract specific field error", () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const parseResult = schema.safeParse({ name: "", email: "invalid" });
    if (!parseResult.success) {
      const nameError = getFieldError(parseResult.error, "name");
      const emailError = getFieldError(parseResult.error, "email");

      expect(nameError).toBe("This field is required.");
      expect(emailError).toBe("Please enter a valid email address.");
    } else {
      throw new Error("Expected validation to fail");
    }
  });

  it("should return undefined for field without error", () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const parseResult = schema.safeParse({ name: "", email: "valid@example.com" });
    if (!parseResult.success) {
      const emailError = getFieldError(parseResult.error, "email");
      expect(emailError).toBeUndefined();
    } else {
      throw new Error("Expected validation to fail");
    }
  });
});

describe("hasFieldError", () => {
  it("should return true when field has error", () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const parseResult = schema.safeParse({ name: "", email: "valid@example.com" });
    if (!parseResult.success) {
      expect(hasFieldError(parseResult.error, "name")).toBe(true);
      expect(hasFieldError(parseResult.error, "email")).toBe(false);
    } else {
      throw new Error("Expected validation to fail");
    }
  });
});

describe("getAllErrorMessages", () => {
  it("should return array of formatted error messages", () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const parseResult = schema.safeParse({ name: "", email: "invalid" });
    if (!parseResult.success) {
      const messages = getAllErrorMessages(parseResult.error);

      expect(messages).toHaveLength(2);
      expect(messages).toContain("name: This field is required.");
      expect(messages).toContain("email: Please enter a valid email address.");
    } else {
      throw new Error("Expected validation to fail");
    }
  });
});

describe("createValidationError", () => {
  it("should create React Admin compatible error", () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const parseResult = schema.safeParse({ name: "", email: "invalid" });
    if (!parseResult.success) {
      const error = createValidationError(parseResult.error);

      expect(error).toHaveProperty("message", "Validation failed");
      expect(error).toHaveProperty("body");
      expect(error.body).toHaveProperty("errors");
      expect(error.body.errors).toHaveProperty("name");
      expect(error.body.errors).toHaveProperty("email");
    } else {
      throw new Error("Expected validation to fail");
    }
  });

  it("should accept custom error message", () => {
    const schema = z.object({
      name: z.string().min(1),
    });

    const parseResult = schema.safeParse({ name: "" });
    if (!parseResult.success) {
      const error = createValidationError(parseResult.error, "Custom error message");

      expect(error.message).toBe("Custom error message");
    } else {
      throw new Error("Expected validation to fail");
    }
  });
});
