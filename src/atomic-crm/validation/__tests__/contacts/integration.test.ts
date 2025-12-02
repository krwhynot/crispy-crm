import { describe, it, expect } from "vitest";
import { validateContactForm, validateCreateContact, validateUpdateContact } from "../../contacts";

describe("Contact Validation Functions - UI as Source of Truth", () => {
  describe("validateContactForm", () => {
    it("should accept valid contact form data", async () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        email: [{ email: "john@example.com", type: "Work" }],
        sales_id: "1",
      };

      await expect(validateContactForm(validData)).resolves.toBeUndefined();
    });

    it("should reject invalid email format", async () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: [{ email: "invalid-email", type: "Work" }],
      };

      await expect(validateContactForm(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should reject missing name fields", async () => {
      const invalidData = {
        email: [{ email: "john@example.com", type: "Work" }],
      };

      await expect(validateContactForm(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("validateCreateContact", () => {
    it("should require email for creation", async () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        sales_id: "1",
        organization_id: "1", // Required per PRD: contacts cannot exist without organization
      };

      await expect(validateCreateContact(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should require sales_id for creation", async () => {
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: [{ email: "john@example.com", type: "Work" }],
        organization_id: "1", // Required per PRD
      };

      await expect(validateCreateContact(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should require organization_id for creation", async () => {
      // PRD: "Contact requires organization" - no orphan contacts allowed
      const invalidData = {
        first_name: "John",
        last_name: "Doe",
        email: [{ email: "john@example.com", type: "Work" }],
        sales_id: "1",
        // Missing organization_id
      };

      await expect(validateCreateContact(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });

    it("should accept valid creation data", async () => {
      const validData = {
        first_name: "John",
        last_name: "Doe",
        email: [{ email: "john@example.com", type: "Work" }],
        sales_id: "1",
        organization_id: "1", // Required per PRD: contacts cannot exist without organization
      };

      await expect(validateCreateContact(validData)).resolves.toBeUndefined();
    });
  });

  describe("validateUpdateContact", () => {
    it("should allow partial updates", async () => {
      const updateData = {
        title: "Senior Engineer",
      };

      await expect(validateUpdateContact(updateData)).resolves.toBeUndefined();
    });

    it("should validate updated fields", async () => {
      const invalidData = {
        linkedin_url: "https://twitter.com/user",
      };

      await expect(validateUpdateContact(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });
});
