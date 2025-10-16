/**
 * Tests for organization business rules and edge cases
 * Focus: Business logic, hierarchies, and special scenarios
 */

import { describe, it, expect } from "vitest";
import {
  organizationSchema,
} from "../../organizations";

describe("Organization Business Rules and Edge Cases", () => {
  describe("Business Rules", () => {
    it("should handle organization hierarchies", () => {
      const childOrganization = {
        name: "Child Organization",
        parent_id: "parent-123",
        type: "customer",
      };

      const result = organizationSchema.parse(childOrganization);
      expect(result.parent_id).toBe("parent-123");
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
        type: "customer",
        country: "United Kingdom",
        timezone: "Europe/London",
        currency: "GBP",
        language: "en-GB",
      };

      expect(() => organizationSchema.parse(internationalOrg)).not.toThrow();
    });

    // Financial metrics (annual_revenue) removed from validation
    // These fields exist in DB but are not validated as they're not user-editable via forms

    it("should handle organization relationships", () => {
      const orgWithRelationships = {
        name: "Connected Org",
        type: "partner",
        partner_level: "Gold",
        referral_source: "existing_customer",
        account_manager: "user-123",
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
        const org = { name };
        expect(() => organizationSchema.parse(org)).not.toThrow();
      });
    });

    it("should handle organizations with very long names", () => {
      const maxLengthName = "A".repeat(255); // Assuming 255 is max
      const org = { name: maxLengthName };

      expect(() => organizationSchema.parse(org)).not.toThrow();
    });

    it("should handle organizations with minimal data", () => {
      const minimalOrg = {
        name: "Minimal",
      };

      const result = organizationSchema.parse(minimalOrg);
      expect(result.name).toBe("Minimal");
      expect(result.organization_type).toBe("unknown"); // Should have default
      expect(result.priority).toBe("C"); // Should have default
    });

    it("should handle organizations with maximum data", () => {
      const maximalOrg = {
        name: "Maximal Organization",
        organization_type: "customer",
        description: "A".repeat(1000),
        website: "https://example.com",
        linkedin_url: "https://linkedin.com/company/maximal",
        segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
        // annual_revenue, employee_count, founded_year removed - not validated
        parent_id: "parent-123",
        address: "123 Main St",
        city: "Cityville",
        state: "CA",
        postal_code: "12345",
        phone: "555-1234",
        priority: "A",
      };

      expect(() => organizationSchema.parse(maximalOrg)).not.toThrow();
    });

    it("should handle circular parent references gracefully", () => {
      // Note: Actual circular reference prevention would be in business logic
      const org = {
        id: "org-123",
        name: "Self Reference Test",
        parent_id: "org-123", // Same as own ID
      };

      // Schema should accept it, business logic should prevent it
      expect(() => organizationSchema.parse(org)).not.toThrow();
    });
  });
});