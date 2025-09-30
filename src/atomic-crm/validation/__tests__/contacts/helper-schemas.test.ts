/**
 * Tests for contact helper schemas
 * Focus: Email, phone, and status validation
 */

import { describe, it, expect } from "vitest";
import {
  phoneNumberSchema,
  emailSchema,
  contactStatusSchema,
} from "../../contacts";
import { z } from "zod";

describe("Contact Helper Schemas", () => {
  describe("phoneNumberSchema", () => {
    it("should accept valid phone numbers", () => {
      const validPhones = [
        { mobile: "+1-555-123-4567" },
        { office: "555-123-4567" },
        { home: "(555) 123-4567" },
        { mobile: "+44 20 1234 5678" },
        { office: "1234567890" },
      ];

      validPhones.forEach((phone) => {
        expect(() => phoneNumberSchema.parse(phone)).not.toThrow();
      });
    });

    it("should handle multiple phone types", () => {
      const multiplePhones = {
        mobile: "+1-555-123-4567",
        office: "555-987-6543",
        home: "555-456-7890",
        fax: "555-111-2222",
      };

      const result = phoneNumberSchema.parse(multiplePhones);
      expect(result.mobile).toBe("+1-555-123-4567");
      expect(result.office).toBe("555-987-6543");
      expect(result.home).toBe("555-456-7890");
    });

    it("should allow optional phone fields", () => {
      const minimalPhone = {
        mobile: "555-123-4567",
      };

      const result = phoneNumberSchema.parse(minimalPhone);
      expect(result.mobile).toBe("555-123-4567");
      expect(result.office).toBeUndefined();
    });

    it("should handle empty object", () => {
      expect(() => phoneNumberSchema.parse({})).not.toThrow();
    });
  });

  describe("emailSchema", () => {
    it("should accept valid email addresses", () => {
      const validEmails = [
        { primary: "user@example.com" },
        { primary: "john.doe@company.org" },
        { work: "contact@business.co.uk" },
        { personal: "user+tag@example.com" },
      ];

      validEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it("should reject invalid email formats", () => {
      const invalidEmails = [
        { primary: "not-an-email" },
        { primary: "@example.com" },
        { primary: "user@" },
        { work: "user @example.com" },
      ];

      invalidEmails.forEach((email) => {
        expect(() => emailSchema.parse(email)).toThrow(z.ZodError);
      });
    });

    it("should handle multiple email types", () => {
      const multipleEmails = {
        primary: "primary@example.com",
        work: "work@company.com",
        personal: "personal@gmail.com",
      };

      const result = emailSchema.parse(multipleEmails);
      expect(result.primary).toBe("primary@example.com");
      expect(result.work).toBe("work@company.com");
      expect(result.personal).toBe("personal@gmail.com");
    });

    it("should allow optional email fields", () => {
      const minimalEmail = {
        primary: "user@example.com",
      };

      const result = emailSchema.parse(minimalEmail);
      expect(result.primary).toBe("user@example.com");
      expect(result.work).toBeUndefined();
    });
  });

  describe("contactStatusSchema", () => {
    it("should accept valid statuses", () => {
      const validStatuses = ["active", "inactive", "blocked", "pending"];

      validStatuses.forEach((status) => {
        expect(() => contactStatusSchema.parse(status)).not.toThrow();
      });
    });

    it("should reject invalid statuses", () => {
      expect(() => contactStatusSchema.parse("enabled")).toThrow(z.ZodError);
      expect(() => contactStatusSchema.parse("disabled")).toThrow(z.ZodError);
      expect(() => contactStatusSchema.parse("archived")).toThrow(z.ZodError);
    });
  });
});