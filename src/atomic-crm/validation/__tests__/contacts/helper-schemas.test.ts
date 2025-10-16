/**
 * Tests for contact helper schemas
 * Focus: Email and phone validation schemas for JSONB arrays
 * Per "UI as source of truth" principle: only validates fields with UI inputs in ContactInputs.tsx
 */

import { describe, it, expect } from "vitest";
import {
  emailAndTypeSchema,
  phoneNumberAndTypeSchema,
  personalInfoTypeSchema,
} from "../../contacts";
import { z } from "zod";

describe("Contact Helper Schemas", () => {
  describe("emailAndTypeSchema", () => {
    it("should accept valid email with type", () => {
      const validEmails = [
        { email: "user@example.com", type: "Work" as const },
        { email: "john.doe@company.org", type: "Home" as const },
        { email: "contact@business.co.uk", type: "Other" as const },
      ];

      validEmails.forEach((emailData) => {
        expect(() => emailAndTypeSchema.parse(emailData)).not.toThrow();
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        { email: "not-an-email", type: "Work" as const },
        { email: "@example.com", type: "Work" as const },
        { email: "user@", type: "Work" as const },
      ];

      invalidEmails.forEach((emailData) => {
        expect(() => emailAndTypeSchema.parse(emailData)).toThrow(z.ZodError);
      });
    });

    it("should provide default type", () => {
      const emailWithoutType = { email: "user@example.com" };
      const result = emailAndTypeSchema.parse(emailWithoutType);
      expect(result.type).toBe("Work");
    });
  });

  describe("phoneNumberAndTypeSchema", () => {
    it("should accept valid phone numbers with type", () => {
      const validPhones = [
        { number: "+1-555-123-4567", type: "Work" as const },
        { number: "555-123-4567", type: "Home" as const },
        { number: "(555) 123-4567", type: "Other" as const },
      ];

      validPhones.forEach((phone) => {
        expect(() => phoneNumberAndTypeSchema.parse(phone)).not.toThrow();
      });
    });

    it("should provide default type", () => {
      const phoneWithoutType = { number: "555-123-4567" };
      const result = phoneNumberAndTypeSchema.parse(phoneWithoutType);
      expect(result.type).toBe("Work");
    });

    it("should accept any phone number format", () => {
      // Phone numbers are not validated for format, just stored as strings
      const phones = [
        { number: "1234567890" },
        { number: "+44 20 1234 5678" },
        { number: "555.123.4567" },
        { number: "ext. 123" },
      ];

      phones.forEach((phone) => {
        expect(() => phoneNumberAndTypeSchema.parse(phone)).not.toThrow();
      });
    });
  });

  describe("personalInfoTypeSchema", () => {
    it("should accept valid types", () => {
      const validTypes = ["Work", "Home", "Other"];

      validTypes.forEach((type) => {
        expect(() => personalInfoTypeSchema.parse(type)).not.toThrow();
      });
    });

    it("should reject invalid types", () => {
      expect(() => personalInfoTypeSchema.parse("Office")).toThrow(z.ZodError);
      expect(() => personalInfoTypeSchema.parse("Mobile")).toThrow(z.ZodError);
      expect(() => personalInfoTypeSchema.parse("Personal")).toThrow(z.ZodError);
    });
  });

  // Note: phoneNumberSchema and emailSchema are legacy backward-compatibility helpers
  // They're simple z.record(z.string()).optional() schemas for old object format
  // New code should use emailAndTypeSchema and phoneNumberAndTypeSchema arrays

  // contactStatusSchema tests removed - schema no longer exists per 'UI as truth' principle
  // Status field has no UI input in ContactInputs.tsx, so validation was removed
});