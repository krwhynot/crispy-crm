/**
 * Tests for filterRegistry
 * Coverage: filterable fields validation, operator handling, edge cases
 */

import { describe, it, expect } from "vitest";
import { filterableFields, isValidFilterField } from "./filterRegistry";

describe("filterRegistry", () => {
  describe("filterableFields", () => {
    it("should define filterable fields for all core resources", () => {
      const coreResources = [
        "contacts",
        "contacts_summary",
        "organizations",
        "opportunities",
        "activities",
        "tags",
        "sales",
        "tasks",
        "products",
        "notifications",
      ];

      coreResources.forEach((resource) => {
        const fields = filterableFields[resource as keyof typeof filterableFields];
        expect(fields).toBeDefined();
        expect(Array.isArray(fields)).toBe(true);
        expect(fields.length).toBeGreaterThan(0);
      });
    });

    it("should include common fields across resources", () => {
      // id should be filterable on most resources
      expect(filterableFields.contacts).toContain("id");
      expect(filterableFields.organizations).toContain("id");
      expect(filterableFields.opportunities).toContain("id");
      expect(filterableFields.activities).toContain("id");
    });

    it("should include soft delete field (deleted_at) on applicable resources", () => {
      // Resources with soft delete support
      expect(filterableFields.contacts).toContain("deleted_at");
      expect(filterableFields.organizations).toContain("deleted_at");
      expect(filterableFields.opportunities).toContain("deleted_at");
      expect(filterableFields.products).toContain("deleted_at");
    });

    it("should include timestamps (created_at, updated_at) on most resources", () => {
      expect(filterableFields.contacts).toContain("created_at");
      expect(filterableFields.contacts).toContain("updated_at");
      expect(filterableFields.organizations).toContain("created_at");
      expect(filterableFields.organizations).toContain("updated_at");
    });

    it("should include full-text search parameter (q) on searchable resources", () => {
      expect(filterableFields.contacts).toContain("q");
      expect(filterableFields.organizations).toContain("q");
      expect(filterableFields.opportunities).toContain("q");
      expect(filterableFields.products).toContain("q");
      expect(filterableFields.notifications).toContain("q");
    });

    it("should define principal-centric dashboard view fields", () => {
      const dashboardFields = filterableFields.dashboard_principal_summary;

      expect(dashboardFields).toContain("id");
      expect(dashboardFields).toContain("principal_name");
      expect(dashboardFields).toContain("account_manager_id");
      expect(dashboardFields).toContain("opportunity_count");
      expect(dashboardFields).toContain("status_indicator");
      expect(dashboardFields).toContain("is_stuck");
    });

    it("should include array fields on applicable resources", () => {
      // Contacts: tags (array), email (JSONB), phone (JSONB)
      expect(filterableFields.contacts).toContain("tags");
      expect(filterableFields.contacts).toContain("email");
      expect(filterableFields.contacts).toContain("phone");

      // Opportunities: contact_ids (array), tags (array)
      expect(filterableFields.opportunities).toContain("contact_ids");
      expect(filterableFields.opportunities).toContain("tags");
    });
  });

  describe("isValidFilterField", () => {
    describe("valid fields", () => {
      it("should return true for valid contact fields", () => {
        expect(isValidFilterField("contacts", "first_name")).toBe(true);
        expect(isValidFilterField("contacts", "last_name")).toBe(true);
        expect(isValidFilterField("contacts", "email")).toBe(true);
        expect(isValidFilterField("contacts", "city")).toBe(true);
        expect(isValidFilterField("contacts", "sales_id")).toBe(true);
      });

      it("should return true for valid organization fields", () => {
        expect(isValidFilterField("organizations", "name")).toBe(true);
        expect(isValidFilterField("organizations", "organization_type")).toBe(true);
        expect(isValidFilterField("organizations", "segment_id")).toBe(true);
        expect(isValidFilterField("organizations", "priority")).toBe(true);
      });

      it("should return true for valid opportunity fields", () => {
        expect(isValidFilterField("opportunities", "name")).toBe(true);
        expect(isValidFilterField("opportunities", "stage")).toBe(true);
        expect(isValidFilterField("opportunities", "status")).toBe(true);
        expect(isValidFilterField("opportunities", "principal_organization_id")).toBe(true);
        expect(isValidFilterField("opportunities", "account_manager_id")).toBe(true);
      });

      it("should return true for valid product fields", () => {
        expect(isValidFilterField("products", "name")).toBe(true);
        expect(isValidFilterField("products", "category")).toBe(true);
        expect(isValidFilterField("products", "status")).toBe(true);
      });
    });

    describe("invalid fields", () => {
      it("should return false for non-existent fields", () => {
        expect(isValidFilterField("contacts", "non_existent_field")).toBe(false);
        expect(isValidFilterField("organizations", "invalid_column")).toBe(false);
        expect(isValidFilterField("opportunities", "fake_field")).toBe(false);
      });

      it("should throw for unknown resources", () => {
        expect(() => isValidFilterField("unknown_resource", "id")).toThrow();
        expect(() => isValidFilterField("fake_table", "name")).toThrow();
        expect(() => isValidFilterField("", "field")).toThrow();
      });

      it("should return false for fields from wrong resource", () => {
        // "stage" is valid for opportunities but not contacts
        expect(isValidFilterField("contacts", "stage")).toBe(false);

        // "company_name" is valid for contacts but not organizations
        expect(isValidFilterField("organizations", "company_name")).toBe(false);

        // "category" is valid for products but not opportunities
        expect(isValidFilterField("opportunities", "category")).toBe(false);
      });
    });

    describe("React Admin filter operators", () => {
      it("should handle @gte (greater than or equal) operator", () => {
        expect(isValidFilterField("contacts", "created_at@gte")).toBe(true);
        expect(isValidFilterField("opportunities", "estimated_close_date@gte")).toBe(true);
        expect(isValidFilterField("activities", "activity_date@gte")).toBe(true);
      });

      it("should handle @lte (less than or equal) operator", () => {
        expect(isValidFilterField("contacts", "updated_at@lte")).toBe(true);
        expect(isValidFilterField("opportunities", "actual_close_date@lte")).toBe(true);
        expect(isValidFilterField("tasks", "due_date@lte")).toBe(true);
      });

      it("should handle @like (case-insensitive pattern match) operator", () => {
        expect(isValidFilterField("contacts", "first_name@like")).toBe(true);
        expect(isValidFilterField("organizations", "name@like")).toBe(true);
        expect(isValidFilterField("products", "description@like")).toBe(true);
      });

      it("should handle @ilike operator", () => {
        expect(isValidFilterField("contacts", "last_name@ilike")).toBe(true);
        expect(isValidFilterField("opportunities", "name@ilike")).toBe(true);
      });

      it("should handle @neq (not equal) operator", () => {
        expect(isValidFilterField("contacts", "sales_id@neq")).toBe(true);
        expect(isValidFilterField("opportunities", "status@neq")).toBe(true);
      });

      it("should handle @in (array contains) operator", () => {
        expect(isValidFilterField("opportunities", "stage@in")).toBe(true);
        expect(isValidFilterField("products", "status@in")).toBe(true);
      });

      it("should reject operators on invalid fields", () => {
        expect(isValidFilterField("contacts", "invalid_field@gte")).toBe(false);
        expect(isValidFilterField("organizations", "fake_column@lte")).toBe(false);
        expect(isValidFilterField("opportunities", "nonexistent@like")).toBe(false);
      });

      it("should handle multiple @ symbols correctly", () => {
        // Field name itself contains @, plus operator
        // Should extract base field before first @
        expect(isValidFilterField("contacts", "email@eq")).toBe(true);
        expect(isValidFilterField("contacts", "email@neq")).toBe(true);
      });
    });

    describe("logical operators", () => {
      // Both input ($or/$and/$not) and output (or/and/not) formats must be whitelisted
      // Input: MongoDB-style from components
      // Output: PostgREST format after transformOrFilter() conversion

      it("should allow MongoDB-style $or operator for valid resources", () => {
        expect(isValidFilterField("contacts", "$or")).toBe(true);
        expect(isValidFilterField("organizations", "$or")).toBe(true);
        expect(isValidFilterField("opportunities", "$or")).toBe(true);
      });

      it("should allow PostgREST or operator for valid resources", () => {
        expect(isValidFilterField("contacts", "or")).toBe(true);
        expect(isValidFilterField("organizations", "or")).toBe(true);
        expect(isValidFilterField("opportunities", "or")).toBe(true);
      });

      it("should allow MongoDB-style $and operator for valid resources", () => {
        expect(isValidFilterField("contacts", "$and")).toBe(true);
        expect(isValidFilterField("organizations", "$and")).toBe(true);
        expect(isValidFilterField("opportunities", "$and")).toBe(true);
      });

      it("should allow PostgREST and operator for valid resources", () => {
        expect(isValidFilterField("contacts", "and")).toBe(true);
        expect(isValidFilterField("organizations", "and")).toBe(true);
        expect(isValidFilterField("opportunities", "and")).toBe(true);
      });

      it("should allow MongoDB-style $not operator for valid resources", () => {
        expect(isValidFilterField("contacts", "$not")).toBe(true);
        expect(isValidFilterField("organizations", "$not")).toBe(true);
        expect(isValidFilterField("opportunities", "$not")).toBe(true);
      });

      it("should allow PostgREST not operator for valid resources", () => {
        expect(isValidFilterField("contacts", "not")).toBe(true);
        expect(isValidFilterField("organizations", "not")).toBe(true);
        expect(isValidFilterField("opportunities", "not")).toBe(true);
      });

      it("should throw for logical operators on unknown resources", () => {
        // Security: Unknown resources are blocked even for logical operators
        expect(() => isValidFilterField("unknown_resource", "$or")).toThrow();
        expect(() => isValidFilterField("unknown_resource", "or")).toThrow();
        expect(() => isValidFilterField("unknown_resource", "$and")).toThrow();
        expect(() => isValidFilterField("unknown_resource", "and")).toThrow();
        expect(() => isValidFilterField("unknown_resource", "$not")).toThrow();
        expect(() => isValidFilterField("unknown_resource", "not")).toThrow();
      });
    });

    describe("edge cases", () => {
      it("should handle empty filter key", () => {
        expect(isValidFilterField("contacts", "")).toBe(false);
      });

      it("should handle whitespace filter key", () => {
        expect(isValidFilterField("contacts", "   ")).toBe(false);
      });

      it("should handle operator without field name", () => {
        expect(isValidFilterField("contacts", "@gte")).toBe(false);
        expect(isValidFilterField("contacts", "@like")).toBe(false);
      });

      it("should be case-sensitive for field names", () => {
        // first_name is valid, but FIRST_NAME is not
        expect(isValidFilterField("contacts", "first_name")).toBe(true);
        expect(isValidFilterField("contacts", "FIRST_NAME")).toBe(false);
        expect(isValidFilterField("contacts", "First_Name")).toBe(false);
      });

      it("should handle special characters in field names", () => {
        // Field names with underscores (valid)
        expect(isValidFilterField("contacts", "first_name")).toBe(true);
        expect(isValidFilterField("contacts", "linkedin_url")).toBe(true);

        // Invalid special characters
        expect(isValidFilterField("contacts", "first-name")).toBe(false);
        expect(isValidFilterField("contacts", "first.name")).toBe(false);
      });

      it("should handle numeric field names if they exist", () => {
        // Most resources use "id" not numeric names
        // But check that registry doesn't break on unexpected input
        expect(isValidFilterField("contacts", "123")).toBe(false);
      });
    });

    describe("real-world scenarios", () => {
      it("should validate common filter combinations", () => {
        // Date range filters
        expect(isValidFilterField("contacts", "created_at@gte")).toBe(true);
        expect(isValidFilterField("contacts", "created_at@lte")).toBe(true);

        // Search filters
        expect(isValidFilterField("contacts", "first_name@like")).toBe(true);
        expect(isValidFilterField("organizations", "name@ilike")).toBe(true);

        // Equality filters
        expect(isValidFilterField("opportunities", "stage@eq")).toBe(true);
        expect(isValidFilterField("tasks", "completed@eq")).toBe(true);
      });

      it("should validate principal-centric dashboard filters", () => {
        // Dashboard filtering scenarios
        expect(isValidFilterField("dashboard_principal_summary", "account_manager_id")).toBe(true);
        expect(isValidFilterField("dashboard_principal_summary", "status_indicator")).toBe(true);
        expect(isValidFilterField("dashboard_principal_summary", "is_stuck")).toBe(true);
      });

      it("should validate soft delete filters", () => {
        // Filter for deleted records
        expect(isValidFilterField("contacts", "deleted_at")).toBe(true);
        expect(isValidFilterField("opportunities", "deleted_at@neq")).toBe(true);
        expect(isValidFilterField("products", "deleted_at@is")).toBe(true);
      });

      it("should validate array field filters", () => {
        // JSONB and array fields
        expect(isValidFilterField("contacts", "tags")).toBe(true);
        expect(isValidFilterField("opportunities", "contact_ids")).toBe(true);
      });
    });
  });
});
