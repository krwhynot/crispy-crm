/**
 * Tests for contact business rules and edge cases
 * Focus: Business logic, relationships, and special scenarios
 * Per "UI as source of truth" principle: only validates fields with UI inputs in ContactInputs.tsx
 */

import { describe, it, expect } from "vitest";
import {
  contactSchema,
} from "../../contacts";

describe("Contact Business Rules and Edge Cases", () => {
  describe("Business Rules", () => {
    it("should handle contact-organization relationship", () => {
      const contactWithOrg = {
        first_name: "John",
        last_name: "Doe",
        email: [{ email: "john@example.com", type: "Work" }],
        organization_id: "org-1", // Single org via UI input, not arrays
      };

      const result = contactSchema.parse(contactWithOrg);
      expect(result.organization_id).toBe("org-1");
    });

    // Test removed - status field has no UI input per 'UI as truth' principle
    // it("should validate contact lifecycle status", () => { ... });

    it("should handle contact with multiple emails and phones", () => {
      const contactWithMultiple = {
        first_name: "John",
        last_name: "Doe",
        email: [
          { email: "john@example.com", type: "Work" },
          { email: "john@personal.com", type: "Home" },
        ],
        phone: [
          { number: "555-123-4567", type: "Work" },
          { number: "555-987-6543", type: "Home" },
        ],
        // preferred_contact_method and do_not_contact fields removed - no UI inputs
      };

      expect(() => contactSchema.parse(contactWithMultiple)).not.toThrow();
    });

    // Test removed - gdpr_consent, marketing_consent, data_retention_date fields have no UI inputs per 'UI as truth' principle
    // it("should validate contact data privacy fields", () => { ... });
  });
});