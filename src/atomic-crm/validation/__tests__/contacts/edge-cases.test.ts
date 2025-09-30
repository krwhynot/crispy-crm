/**
 * Tests for contact business rules and edge cases
 * Focus: Business logic, relationships, and special scenarios
 */

import { describe, it, expect } from "vitest";
import {
  contactSchema,
} from "../../contacts";

describe("Contact Business Rules and Edge Cases", () => {
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
});