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

    it("should validate organization lifecycle", () => {
      const statusTransitions = [
        { from: "pending", to: "active" },
        { from: "active", to: "inactive" },
        { from: "inactive", to: "active" },
        { from: "active", to: "suspended" },
        { from: "suspended", to: "active" },
      ];

      statusTransitions.forEach(({ from, to }) => {
        const org = {
          name: "Status Test Org",
          status: from,
        };

        const result = organizationSchema.parse(org);
        expect(result.status).toBe(from);

        const updated = { ...org, status: to };
        expect(() => organizationSchema.parse(updated)).not.toThrow();
      });
    });

    it("should handle multi-sector organizations", () => {
      const multiSectorOrg = {
        name: "Diversified Corp",
        type: "customer",
        segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
        sectors: ["technology", "finance", "healthcare", "retail"],
      };

      const result = organizationSchema.parse(multiSectorOrg);
      expect(result.sectors).toHaveLength(4);
      expect(result.segment_id).toBe("562062be-c15b-417f-b2a1-d4a643d69d52");
    });

    it("should validate organization size metrics", () => {
      const sizeCategories = [
        { employee_count: 5, size: "startup" },
        { employee_count: 50, size: "small" },
        { employee_count: 250, size: "medium" },
        { employee_count: 1000, size: "large" },
        { employee_count: 10000, size: "enterprise" },
      ];

      sizeCategories.forEach(({ employee_count }) => {
        const org = {
          name: `Org with ${employee_count} employees`,
          employee_count,
        };

        expect(() => organizationSchema.parse(org)).not.toThrow();
      });
    });

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

    it("should validate financial metrics", () => {
      const financialData = {
        name: "Financial Test Org",
        annual_revenue: 5000000,
        market_cap: 20000000,
        funding_stage: "Series B",
        total_funding: 15000000,
      };

      expect(() => organizationSchema.parse(financialData)).not.toThrow();
    });

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
      expect(result.type).toBeDefined(); // Should have default
      expect(result.status).toBeDefined(); // Should have default
    });

    it("should handle organizations with maximum data", () => {
      const maximalOrg = {
        name: "Maximal Organization",
        type: "customer",
        status: "active",
        description: "A".repeat(1000),
        website: "https://example.com",
        linkedin_url: "https://linkedin.com/company/maximal",
        segment_id: "562062be-c15b-417f-b2a1-d4a643d69d52",
        sectors: ["tech", "saas", "cloud", "ai", "ml"],
        annual_revenue: 1000000000,
        employee_count: 50000,
        founded_year: 1990,
        tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
        parent_id: "parent-123",
        logo: "https://example.com/logo.png",
        address: "123 Main St, City, State 12345",
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