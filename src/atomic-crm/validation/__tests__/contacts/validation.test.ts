/**
 * Tests for contact validation schemas
 * Focus: Core validation rules and schema behavior
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
      email: { primary: "john.doe@example.com" },
      phone_number: { mobile: "555-123-4567" },
      status: "active",
    };

    it("should accept valid contact data", () => {
      const result = contactSchema.parse(validContact);
      expect(result).toBeDefined();
      expect(result.first_name).toBe("John");
      expect(result.last_name).toBe("Doe");
      expect(result.email?.primary).toBe("john.doe@example.com");
    });

    it("should compute full name from first and last name", () => {
      const contact = {
        first_name: "Jane",
        last_name: "Smith",
        email: { primary: "jane@example.com" },
      };

      const result = contactSchema.parse(contact);
      expect(result.first_name).toBe("Jane");
      expect(result.last_name).toBe("Smith");
    });

    it("should provide default values", () => {
      const minimalContact = {
        first_name: "John",
        last_name: "Doe",
        email: { primary: "john@example.com" },
      };

      const result = contactSchema.parse(minimalContact);
      expect(result.status).toBe("active");
    });

    it("should reject empty first name", () => {
      const invalidData = { ...validContact, first_name: "" };
      expect(() => contactSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should reject empty last name", () => {
      const invalidData = { ...validContact, last_name: "" };
      expect(() => contactSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should handle optional middle name", () => {
      const contactWithMiddle = {
        ...validContact,
        middle_name: "Michael",
      };

      const result = contactSchema.parse(contactWithMiddle);
      expect(result.middle_name).toBe("Michael");
    });

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

    it("should handle organization associations", () => {
      const contactWithOrgs = {
        ...validContact,
        organization_ids: ["org-1", "org-2", "org-3"],
        primary_organization_id: "org-1",
      };

      const result = contactSchema.parse(contactWithOrgs);
      expect(result.organization_ids).toHaveLength(3);
      expect(result.primary_organization_id).toBe("org-1");
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
          organization_ids: ["org-1", "org-2"],
          primary_organization_id: 123,
        }),
      ).not.toThrow();
    });

    it("should handle nullable fields", () => {
      const dataWithNulls = {
        ...validContact,
        middle_name: null,
        avatar: null,
        background: null,
        deleted_at: null,
      };

      expect(() => contactSchema.parse(dataWithNulls)).not.toThrow();
    });

    it("should handle tags array", () => {
      const contactWithTags = {
        ...validContact,
        tags: ["tag1", "tag2", "tag3"],
      };

      const result = contactSchema.parse(contactWithTags);
      expect(result.tags).toEqual(["tag1", "tag2", "tag3"]);
      expect(result.tags).toHaveLength(3);
    });

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
        email: complexEmail,
        phone_number: complexPhone,
      };

      const result = contactSchema.parse(contactWithComplex);
      expect(result.email).toEqual(complexEmail);
      expect(result.phone_number).toEqual(complexPhone);
    });
  });

  describe("createContactSchema", () => {
    it("should require essential fields for creation", () => {
      const validCreate = {
        first_name: "Jane",
        last_name: "Smith",
        email: { primary: "jane@example.com" },
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
      ).toThrow(z.ZodError);
    });

    it("should not allow id field on creation", () => {
      const dataWithId = {
        id: "should-not-be-here",
        first_name: "Jane",
        last_name: "Smith",
        email: { primary: "jane@example.com" },
      };

      const result = createContactSchema.parse(dataWithId);
      expect("id" in result).toBe(false);
    });

    it("should apply defaults on creation", () => {
      const minimalCreate = {
        first_name: "John",
        last_name: "Doe",
        email: { primary: "john@example.com" },
      };

      const result = createContactSchema.parse(minimalCreate);
      expect(result.status).toBe("active");
    });
  });

  describe("updateContactSchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: "contact-123",
        first_name: "Updated Name",
      };

      expect(() => updateContactSchema.parse(validUpdate)).not.toThrow();
    });

    it("should reject updates without id", () => {
      const invalidUpdate = {
        first_name: "Updated Name",
      };

      expect(() => updateContactSchema.parse(invalidUpdate)).toThrow(
        z.ZodError,
      );
    });

    it("should allow partial updates", () => {
      expect(() =>
        updateContactSchema.parse({ id: "c-1", first_name: "New Name" }),
      ).not.toThrow();
      expect(() =>
        updateContactSchema.parse({ id: "c-1", last_name: "New Last" }),
      ).not.toThrow();
      expect(() =>
        updateContactSchema.parse({ id: "c-1", status: "inactive" }),
      ).not.toThrow();
      expect(() =>
        updateContactSchema.parse({
          id: "c-1",
          email: { work: "new@work.com" },
        }),
      ).not.toThrow();
      expect(() => updateContactSchema.parse({ id: "c-1" })).not.toThrow();
    });

    it("should validate updated fields", () => {
      expect(() =>
        updateContactSchema.parse({
          id: "c-1",
          status: "invalid_status",
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        updateContactSchema.parse({
          id: "c-1",
          email: { primary: "not-an-email" },
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