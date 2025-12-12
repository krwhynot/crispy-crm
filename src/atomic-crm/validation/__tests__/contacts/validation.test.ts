import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  contactSchema,
  createContactSchema,
  updateContactSchema,
  emailAndTypeSchema,
  phoneNumberAndTypeSchema,
} from "../../contacts";

describe("Contact Validation - UI as Source of Truth", () => {
  describe("contactSchema", () => {
    it("should accept valid contact data matching UI inputs", () => {
      const validContact = {
        first_name: "John",
        last_name: "Doe",
        email: [{ value: "john@example.com", type: "work" }],
        phone: [{ value: "555-1234", type: "work" }],
        title: "CTO",
        department: "Engineering",
        linkedin_url: "https://linkedin.com/in/johndoe",
        sales_id: "1",
        organization_id: "123",
      };

      const result = contactSchema.parse(validContact);
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
    });

    it("should compute name from first_name and last_name", () => {
      const contact = {
        first_name: "Jane",
        last_name: "Smith",
      };

      const result = contactSchema.parse(contact);
      expect(result.name).toBe("Jane Smith");
    });

    it("should require at least name or first_name/last_name", () => {
      expect(() => contactSchema.parse({})).toThrow(z.ZodError);
    });

    it("should validate email format in array", () => {
      const invalidContact = {
        first_name: "John",
        last_name: "Doe",
        email: [{ value: "invalid-email", type: "work" }],
      };

      expect(() => contactSchema.parse(invalidContact)).toThrow(z.ZodError);
    });

    it("should validate LinkedIn URL format", () => {
      const invalidLinkedIn = {
        first_name: "John",
        last_name: "Doe",
        linkedin_url: "https://twitter.com/johndoe",
      };

      expect(() => contactSchema.parse(invalidLinkedIn)).toThrow(z.ZodError);
    });
  });

  describe("createContactSchema", () => {
    it("should require first_name and last_name", () => {
      expect(() => createContactSchema.parse({})).toThrow(z.ZodError);
    });

    it("should require sales_id", () => {
      const contact = {
        first_name: "John",
        last_name: "Doe",
      };

      expect(() => createContactSchema.parse(contact)).toThrow(z.ZodError);
    });
  });

  describe("updateContactSchema", () => {
    it("should allow partial updates", () => {
      const update = {
        title: "Senior Engineer",
      };

      expect(() => updateContactSchema.parse(update)).not.toThrow();
    });
  });

  describe("Email and Phone Type Schemas", () => {
    it("should validate email with type", () => {
      const email = { value: "test@example.com", type: "work" };
      expect(() => emailAndTypeSchema.parse(email)).not.toThrow();
    });

    it("should validate phone with type", () => {
      const phone = { value: "555-1234", type: "home" };
      expect(() => phoneNumberAndTypeSchema.parse(phone)).not.toThrow();
    });

    it("should default type to work", () => {
      const email = { value: "test@example.com" };
      const result = emailAndTypeSchema.parse(email);
      expect(result.type).toBe("work");
    });
  });
});
