/**
 * Tests for organization business rules and edge cases
 * Focus: Business logic, hierarchies, and special scenarios
 */

import { describe, it, expect } from "vitest";
import { organizationSchema } from "../../organizations";

describe("Organization Business Rules and Edge Cases", () => {
  // After audit fix (commit 4f0245d2b): Schema no longer provides silent defaults
  // All tests must include required fields: organization_type, priority, status
  const requiredFields = {
    organization_type: "customer" as const,
    priority: "B" as const,
    status: "active" as const,
  };

  describe("Business Rules", () => {
    it("should handle organization hierarchies", () => {
      // Use numeric IDs since schema uses z.coerce.number()
      const childOrganization = {
        name: "Child Organization",
        parent_organization_id: 456,
        ...requiredFields,
      };

      const result = organizationSchema.parse(childOrganization);
      expect(result.parent_organization_id).toBe(456);
      expect(result.name).toBe("Child Organization");
    });

    // Organization lifecycle/status field does not exist in current schema
    // Tests removed as they reference non-existent fields

    // Multi-sector organizations test removed - 'sectors' field does not exist in schema
    // Schema uses 'segment_id' for single segment classification

    // Organization size metrics (employee_count) removed from validation
    // These fields exist in DB but are not validated as they're not user-editable via forms

    it("should handle international organizations", () => {
      const internationalOrg = {
        name: "Global Corp Ltd.",
        ...requiredFields,
        // Note: z.strictObject() rejects unrecognized keys for mass assignment prevention
        // Country/timezone/currency/language would be additional fields not in current schema
      };

      expect(() => organizationSchema.parse(internationalOrg)).not.toThrow();
    });

    // Financial metrics (annual_revenue) removed from validation
    // These fields exist in DB but are not validated as they're not user-editable via forms

    it("should handle organization relationships", () => {
      const orgWithRelationships = {
        name: "Connected Org",
        ...requiredFields,
        organization_type: "principal", // Override default
        // Note: z.strictObject() rejects unrecognized keys for mass assignment prevention
        // Relationships like referral_source and account_manager would be separate tables/fields
      };

      expect(() => organizationSchema.parse(orgWithRelationships)).not.toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle organizations with special characters in names", () => {
      const specialNames = [
        "O'Reilly Media",
        "Barnes & Noble",
        "PricewaterhouseCoopers (PwC)",
        "3M Company",
        "E*TRADE",
        "Yahoo!",
      ];

      specialNames.forEach((name) => {
        const org = { name, ...requiredFields };
        expect(() => organizationSchema.parse(org)).not.toThrow();
      });
    });

    it("should handle organizations with very long names", () => {
      const maxLengthName = "A".repeat(255); // Assuming 255 is max
      const org = { name: maxLengthName, ...requiredFields };

      expect(() => organizationSchema.parse(org)).not.toThrow();
    });

    it("should require organization_type, priority, and status explicitly (no silent defaults)", () => {
      // Per audit fix (commit 4f0245d2b): Schema no longer provides silent defaults
      const minimalOrg = {
        name: "Minimal",
      };

      // Should throw without required fields
      expect(() => organizationSchema.parse(minimalOrg)).toThrow();

      // Should pass with required fields
      const completeOrg = {
        name: "Minimal",
        ...requiredFields,
      };
      const result = organizationSchema.parse(completeOrg);
      expect(result.name).toBe("Minimal");
      expect(result.organization_type).toBe("customer");
      expect(result.priority).toBe("B");
      expect(result.status).toBe("active");
    });

    it("should handle organizations with maximum data", () => {
      // Use numeric IDs since schema uses z.coerce.number()
      const maximalOrg = {
        name: "Maximal Organization",
        ...requiredFields,
        description: "A".repeat(1000),
        website: "https://example.com",
        linkedin_url: "https://linkedin.com/company/maximal",
        segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
        // annual_revenue, employee_count, founded_year removed - not validated
        parent_organization_id: 456, // Numeric ID
        address: "123 Main St",
        city: "Cityville",
        state: "CA",
        postal_code: "12345",
        phone: "555-123-4567", // Must have at least 10 digits
        priority: "A", // Override default
      };

      expect(() => organizationSchema.parse(maximalOrg)).not.toThrow();
    });

    it("should handle circular parent references gracefully", () => {
      // Note: Actual circular reference prevention would be in business logic
      // Use numeric IDs since schema uses z.coerce.number()
      const org = {
        id: 123,
        name: "Self Reference Test",
        parent_organization_id: 123, // Same as own ID
        ...requiredFields,
      };

      // Schema should accept it, business logic should prevent it
      expect(() => organizationSchema.parse(org)).not.toThrow();
    });
  });
});
