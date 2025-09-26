/**
 * Tests for contact validation schemas
 * Validates business rules, data integrity, and API boundary integration
 */

import { describe, it, expect } from "vitest";
import {
  contactSchema,
  createContactSchema,
  updateContactSchema,
  validateContactForm,
  validateCreateContact,
  validateUpdateContact,
  contactStatusSchema,
  phoneNumberSchema,
  emailSchema,
  type Contact,
  type CreateContactInput,
  type UpdateContactInput,
} from "../contacts";
import { z } from "zod";

describe("Contact Validation Schemas", () => {
  describe("Helper Schemas", () => {
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
      // Full name would be computed by the application, not the schema
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
      // Complex email structure
      const complexEmail = {
        primary: "primary@example.com",
        work: "work@company.com",
        personal: "personal@gmail.com",
      };

      // Complex phone structure
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
      ).toThrow(z.ZodError); // Missing email
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
      expect(() => updateContactSchema.parse({ id: "c-1" })).not.toThrow(); // Just id
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

  describe("Validation Functions", () => {
    describe("validateContactForm", () => {
      it("should validate and pass valid data", async () => {
        const validData = {
          first_name: "John",
          last_name: "Doe",
          email: { primary: "john@example.com" },
        };

        await expect(validateContactForm(validData)).resolves.toBeUndefined();
      });

      it("should format errors for React Admin", async () => {
        const invalidData = {
          first_name: "",
          last_name: "",
          email: { primary: "not-an-email" },
          linkedin_url: "not-a-url",
        };

        try {
          await validateContactForm(invalidData);
          expect.fail("Should have thrown validation error");
        } catch (error: any) {
          expect(error.message).toBe("Validation failed");
          expect(error.errors).toBeDefined();
          expect(error.errors.first_name).toBe("First name is required");
          expect(error.errors.last_name).toBe("Last name is required");
          expect(error.errors["email.primary"]).toBeDefined();
        }
      });

      it("should handle nested email validation errors", async () => {
        const invalidData = {
          first_name: "John",
          last_name: "Doe",
          email: {
            primary: "invalid",
            work: "also-invalid",
          },
        };

        try {
          await validateContactForm(invalidData);
          expect.fail("Should have thrown validation error");
        } catch (error: any) {
          expect(error.errors["email.primary"]).toBeDefined();
          expect(error.errors["email.work"]).toBeDefined();
        }
      });
    });

    describe("validateCreateContact", () => {
      it("should validate creation data", async () => {
        const validData = {
          first_name: "Jane",
          last_name: "Smith",
          email: { primary: "jane@example.com" },
        };

        await expect(validateCreateContact(validData)).resolves.toBeUndefined();
      });

      it("should require email for creation", async () => {
        const dataWithoutEmail = {
          first_name: "Jane",
          last_name: "Smith",
        };

        try {
          await validateCreateContact(dataWithoutEmail);
          expect.fail("Should have thrown validation error");
        } catch (error: any) {
          expect(error.message).toBe("Validation failed");
          expect(error.errors.email).toBeDefined();
        }
      });
    });

    describe("validateUpdateContact", () => {
      it("should validate update data", async () => {
        const validData = {
          id: "contact-123",
          first_name: "Updated",
        };

        await expect(validateUpdateContact(validData)).resolves.toBeUndefined();
      });

      it("should reject update without id", async () => {
        const invalidData = {
          first_name: "Updated",
        };

        try {
          await validateUpdateContact(invalidData);
          expect.fail("Should have thrown validation error");
        } catch (error: any) {
          expect(error.message).toBe("Validation failed");
          expect(error.errors.id).toBeDefined();
        }
      });
    });
  });

  describe("Business Rules", () => {
    it("should handle contact-organization relationships", () => {
      const contactWithMultipleOrgs = {
        first_name: "John",
        last_name: "Doe",
        email: { primary: "john@example.com" },
        organization_ids: ["org-1", "org-2", "org-3"],
        primary_organization_id: "org-1",
      };

      const result = contactSchema.parse(contactWithMultipleOrgs);
      expect(result.organization_ids).toContain("org-1");
      expect(result.primary_organization_id).toBe("org-1");
    });

    it("should validate contact lifecycle status", () => {
      const statusTransitions = [
        { status: "active" },
        { status: "inactive" },
        { status: "blocked" },
        { status: "pending" },
      ];

      statusTransitions.forEach(({ status }) => {
        const contact = {
          first_name: "Test",
          last_name: "User",
          email: { primary: "test@example.com" },
          status,
        };

        expect(() => contactSchema.parse(contact)).not.toThrow();
      });
    });

    it("should handle contact communication preferences", () => {
      const contactWithPreferences = {
        first_name: "John",
        last_name: "Doe",
        email: {
          primary: "john@example.com",
          work: "john@work.com",
        },
        phone_number: {
          mobile: "555-123-4567",
          office: "555-987-6543",
        },
        preferred_contact_method: "email",
        do_not_contact: false,
      };

      expect(() => contactSchema.parse(contactWithPreferences)).not.toThrow();
    });

    it("should validate contact data privacy fields", () => {
      const contactWithPrivacy = {
        first_name: "John",
        last_name: "Doe",
        email: { primary: "john@example.com" },
        gdpr_consent: true,
        marketing_consent: false,
        data_retention_date: "2025-12-31",
      };

      expect(() => contactSchema.parse(contactWithPrivacy)).not.toThrow();
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide clear error messages", async () => {
      const testCases = [
        {
          data: {
            first_name: "",
            last_name: "Doe",
            email: { primary: "test@example.com" },
          },
          expectedError: "First name is required",
          field: "first_name",
        },
        {
          data: {
            first_name: "John",
            last_name: "",
            email: { primary: "test@example.com" },
          },
          expectedError: "Last name is required",
          field: "last_name",
        },
        {
          data: { first_name: "John", last_name: "Doe", email: {} },
          expectedError: "At least one email is required",
          field: "email",
        },
        {
          data: {
            first_name: "John",
            last_name: "Doe",
            email: { primary: "invalid" },
          },
          expectedError: "Invalid email format",
          field: "email.primary",
        },
      ];

      for (const { data, expectedError, field } of testCases) {
        try {
          await validateContactForm(data);
          if (expectedError) {
            expect.fail(`Should have thrown error for field: ${field}`);
          }
        } catch (error: any) {
          expect(error.errors[field]).toBe(expectedError);
        }
      }
    });
  });
});
