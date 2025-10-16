/**
 * Tests for contact validation schemas
 * Focus: Core validation rules and schema behavior
 * Per "UI as source of truth" principle: only validates fields with UI inputs in ContactInputs.tsx
 */

import { describe, it, expect } from "vitest";
import {
  contactSchema,
  createContactSchema,
  updateContactSchema,
} from "../../contacts";
import { z } from "zod";

describe("Contact Validation Schemas", () => {

  describe("contactSchema", () => {
    const validContact = {
      first_name: "John",
      last_name: "Doe",
      email_object: { primary: "john.doe@example.com" },
      phone_number: { mobile: "555-123-4567" },
      // status field removed - no UI input per 'UI as truth' principle
      sales_id: 1,
    };

    it("should accept valid contact data", () => {
      const result = contactSchema.parse(validContact);
      expect(result).toBeDefined();
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
      // Email is transformed to array format
      expect(result.email).toHaveLength(1);
      expect(result.email[0].email).toBe("john.doe@example.com");
    });

    it("should compute full name from first and last name", () => {
      const contact = {
        first_name: "Jane",
        last_name: "Smith",
        email_object: { primary: "jane@example.com" },
        sales_id: 1,
      };

      const result = contactSchema.parse(contact);
      expect(result.first_name).toBe("Jane");
      expect(result.last_name).toBe("Smith");
      expect(result.name).toBe("Jane Smith"); // Auto-computed
    });

    // Test removed - status, country, has_newsletter fields have no UI inputs per 'UI as truth' principle
    // it("should provide default values", () => { ... });

    it("should reject contact without any name fields", () => {
      const invalidData = {
        email_object: { primary: "test@example.com" },
        sales_id: 1
      };
      expect(() => contactSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should accept empty strings for optional fields", () => {
      const validData = { ...validContact, first_name: "", last_name: "", name: "John Doe" };
      expect(() => contactSchema.parse(validData)).not.toThrow();
    });

    // Test removed - middle_name field has no UI input per 'UI as truth' principle
    // it("should handle optional middle name", () => { ... });

    it("should validate LinkedIn URL", () => {
      // Valid LinkedIn URLs
      expect(() =>
        contactSchema.parse({
          ...validContact,
          linkedin_url: "https://www.linkedin.com/in/johndoe",
        }),
      ).not.toThrow();

      expect(() =>
        contactSchema.parse({
          ...validContact,
          linkedin_url: "https://linkedin.com/in/jane-smith",
        }),
      ).not.toThrow();

      // Invalid LinkedIn URLs
      expect(() =>
        contactSchema.parse({
          ...validContact,
          linkedin_url: "https://facebook.com/johndoe",
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        contactSchema.parse({
          ...validContact,
          linkedin_url: "not-a-url",
        }),
      ).toThrow(z.ZodError);
    });

    it("should handle organization association", () => {
      const contactWithOrg = {
        ...validContact,
        organization_id: "org-1", // Single org via UI input, not arrays
      };

      const result = contactSchema.parse(contactWithOrg);
      expect(result.organization_id).toBe("org-1");
    });

    it("should accept both string and number IDs", () => {
      expect(() =>
        contactSchema.parse({
          ...validContact,
          id: "string-id",
        }),
      ).not.toThrow();

      expect(() =>
        contactSchema.parse({
          ...validContact,
          id: 12345,
        }),
      ).not.toThrow();

      expect(() =>
        contactSchema.parse({
          ...validContact,
          organization_id: 123, // Single org via UI input
        }),
      ).not.toThrow();
    });

    it("should handle nullable fields", () => {
      const dataWithNulls = {
        ...validContact,
        // middle_name and background removed - no UI inputs
        avatar: null, // Avatar field still exists via ImageEditorField
        deleted_at: null, // System field
      };

      expect(() => contactSchema.parse(dataWithNulls)).not.toThrow();
    });

    // Test removed - tags field has no UI input per 'UI as truth' principle
    // it("should handle tags array", () => { ... });

    it("should handle JSONB fields for email and phone", () => {
      const complexEmail = {
        primary: "primary@example.com",
        work: "work@company.com",
        personal: "personal@gmail.com",
      };

      const complexPhone = {
        mobile: "+1-555-123-4567",
        office: "555-987-6543",
        home: "555-456-7890",
      };

      const contactWithComplex = {
        ...validContact,
        email_object: complexEmail,
        phone_number: complexPhone,
      };

      const result = contactSchema.parse(contactWithComplex);
      // Emails are transformed to array format
      expect(result.email).toHaveLength(3);
      expect(result.email.some(e => e.email === "primary@example.com")).toBe(true);
      // Phones are transformed to array format
      expect(result.phone).toHaveLength(3);
      expect(result.phone.some(p => p.number === "+1-555-123-4567")).toBe(true);
    });
  });

  describe("createContactSchema", () => {
    it("should require essential fields for creation", () => {
      const validCreate = {
        first_name: "Jane",
        last_name: "Smith",
        email_object: { primary: "jane@example.com" },
        sales_id: 1,
      };

      expect(() => createContactSchema.parse(validCreate)).not.toThrow();
    });

    it("should reject creation without required fields", () => {
      expect(() => createContactSchema.parse({})).toThrow(z.ZodError);
      expect(() => createContactSchema.parse({ first_name: "John" })).toThrow(
        z.ZodError,
      );
      expect(() =>
        createContactSchema.parse({
          first_name: "John",
          last_name: "Doe",
        }),
      ).toThrow(z.ZodError); // Missing sales_id
    });

    it("should not allow id field on creation", () => {
      const dataWithId = {
        id: "should-not-be-here",
        first_name: "Jane",
        last_name: "Smith",
        email_object: { primary: "jane@example.com" },
        sales_id: 1,
      };

      const result = createContactSchema.parse(dataWithId);
      expect("id" in result).toBe(false);
    });

    it("should apply defaults on creation", () => {
      const minimalCreate = {
        first_name: "John",
        last_name: "Doe",
        email_object: { primary: "john@example.com" },
        sales_id: 1,
      };

      const result = createContactSchema.parse(minimalCreate);
      expect(result.email).toEqual([{ email: "john@example.com", type: "Work" }]); // Default type from schema
      // status field removed - no UI input per 'UI as truth' principle
    });
  });

  describe("updateContactSchema", () => {
    it("should allow updates with id", () => {
      const validUpdate = {
        id: "contact-123",
        first_name: "Updated Name",
      };

      expect(() => updateContactSchema.parse(validUpdate)).not.toThrow();
    });

    it("should allow updates without id", () => {
      // ID is typically passed in params.id, not in data
      const validUpdate = {
        first_name: "Updated Name",
      };

      expect(() => updateContactSchema.parse(validUpdate)).not.toThrow();
    });

    it("should allow partial updates", () => {
      expect(() =>
        updateContactSchema.parse({ id: "c-1", first_name: "New Name" }),
      ).not.toThrow();
      expect(() =>
        updateContactSchema.parse({ id: "c-1", last_name: "New Last" }),
      ).not.toThrow();
      // status field removed - no UI input per 'UI as truth' principle
      expect(() =>
        updateContactSchema.parse({
          id: "c-1",
          email_object: { work: "new@work.com" },
        }),
      ).not.toThrow();
      expect(() => updateContactSchema.parse({ id: "c-1" })).not.toThrow();
    });

    it("should validate updated fields", () => {
      // status field removed - no UI input per 'UI as truth' principle

      // Email validation when using array format
      expect(() =>
        updateContactSchema.parse({
          id: "c-1",
          email: [{ email: "not-an-email", type: "Work" }],
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        updateContactSchema.parse({
          id: "c-1",
          linkedin_url: "https://facebook.com/user",
        }),
      ).toThrow(z.ZodError);
    });
  });
});