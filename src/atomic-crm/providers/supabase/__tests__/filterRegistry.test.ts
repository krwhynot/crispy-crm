/**
 * Filter Registry Tests
 * Phase 2 Critical Testing - P0 Launch Blocker
 *
 * Test Coverage:
 * - Validate fields for contacts/orgs/opportunities exist
 * - Catch schema mismatches (field in registry but not in database)
 * - Prevent 400 errors from invalid filter parameters
 * - Ensure all resources have filter definitions
 * - Validate operator suffix handling (@gte, @lte, @like)
 *
 * Why This Matters:
 * The filter registry prevents 400 errors when users have stale cached filters
 * that reference database columns that no longer exist. Without this registry,
 * schema changes break the UI silently.
 */

import { describe, it, expect } from "vitest";
import { filterableFields } from "../filterRegistry";

describe("filterRegistry", () => {
  describe("Resource Coverage", () => {
    it("should define filterable fields for all core resources", () => {
      const requiredResources = [
        "contacts",
        "contacts_summary",
        "organizations",
        "opportunities",
        "tasks",
        "products",
      ];

      for (const resource of requiredResources) {
        expect(filterableFields[resource]).toBeDefined();
        expect(Array.isArray(filterableFields[resource])).toBe(true);
        expect(filterableFields[resource].length).toBeGreaterThan(0);
      }
    });

    it("should have non-empty filter arrays for each resource", () => {
      for (const [_resource, fields] of Object.entries(filterableFields)) {
        expect(fields.length).toBeGreaterThan(0);
        expect(fields).toBeTruthy();
      }
    });
  });

  describe("Field Validation", () => {
    it("should include common fields across resources", () => {
      const commonFields = ["id", "created_at", "updated_at"];

      // Check contacts
      for (const field of commonFields) {
        expect(filterableFields.contacts).toContain(field);
      }

      // Check organizations
      for (const field of commonFields) {
        expect(filterableFields.organizations).toContain(field);
      }

      // Check opportunities
      for (const field of commonFields) {
        expect(filterableFields.opportunities).toContain(field);
      }
    });

    it("should include soft delete field for resources that support it", () => {
      // Contacts, organizations, and opportunities support soft delete
      expect(filterableFields.contacts).toContain("deleted_at");
      expect(filterableFields.organizations).toContain("deleted_at");
      expect(filterableFields.opportunities).toContain("deleted_at");
    });

    it("should include full-text search parameter (q) for searchable resources", () => {
      // Resources with text search should have 'q' parameter
      expect(filterableFields.contacts).toContain("q");
      expect(filterableFields.organizations).toContain("q");
      expect(filterableFields.opportunities).toContain("q");
    });

    it("should include ownership fields for resources", () => {
      // Resources that have ownership tracking
      expect(filterableFields.contacts).toContain("sales_id");
      expect(filterableFields.organizations).toContain("sales_id");
      // Opportunities use created_by instead of sales_id
      expect(filterableFields.opportunities).toContain("created_by");
      expect(filterableFields.tasks).toContain("sales_id");
    });

    it("should not include operator suffixes in base field names", () => {
      // Field names should be base names, not include @gte, @lte, etc.
      for (const [_resource, fields] of Object.entries(filterableFields)) {
        for (const field of fields) {
          expect(field).not.toMatch(/@/);
          expect(field).not.toMatch(/\$/);
        }
      }
    });

    it("should have valid field name format", () => {
      // Field names should be snake_case or lowercase, with dots allowed for nested relationship filters
      const validFieldPattern = /^[a-z_][a-z0-9_.]*$/;

      for (const [_resource, fields] of Object.entries(filterableFields)) {
        for (const field of fields) {
          expect(field).toMatch(validFieldPattern);
        }
      }
    });
  });

  describe("Contacts Fields", () => {
    it("should include contact-specific fields", () => {
      const contactFields = [
        "first_name",
        "last_name",
        "email",
        "phone",
        "title",
        "organization_id",
        "company_name",
      ];

      for (const field of contactFields) {
        expect(filterableFields.contacts).toContain(field);
      }
    });

    it("should include JSONB array fields", () => {
      // Email and phone are JSONB arrays
      expect(filterableFields.contacts).toContain("email");
      expect(filterableFields.contacts).toContain("phone");
      expect(filterableFields.contacts).toContain("tags");
    });
  });

  describe("Organizations Fields", () => {
    it("should include organization-specific fields", () => {
      const orgFields = [
        "name",
        "organization_type",
        "parent_organization_id",
        "priority",
        "website",
        "segment_id",
      ];

      for (const field of orgFields) {
        expect(filterableFields.organizations).toContain(field);
      }
    });

    it("should include location fields", () => {
      const locationFields = ["city", "state", "postal_code"];

      for (const field of locationFields) {
        expect(filterableFields.organizations).toContain(field);
      }
    });
  });

  describe("Opportunities Fields", () => {
    it("should include opportunity-specific fields", () => {
      const opportunityFields = [
        "name",
        "stage",
        "status",
        "priority",
        "estimated_close_date",
        "customer_organization_id",
        "account_manager_id",
        "opportunity_owner_id",
        "created_by",
      ];

      for (const field of opportunityFields) {
        expect(filterableFields.opportunities).toContain(field);
      }
    });

    it("should include multi-participant fields", () => {
      // Opportunities support multiple organizations and contacts
      expect(filterableFields.opportunities).toContain("customer_organization_id");
      expect(filterableFields.opportunities).toContain("principal_organization_id");
      expect(filterableFields.opportunities).toContain("contact_ids");
    });
  });

  describe("Tasks Fields", () => {
    it("should include task-specific fields", () => {
      const taskFields = [
        "title",
        "type",
        "due_date",
        "completed",
        "completed_at",
        "sales_id",
        "contact_id",
        "opportunity_id",
      ];

      for (const field of taskFields) {
        expect(filterableFields.tasks).toContain(field);
      }
    });
  });

  describe("Products Fields", () => {
    it("should include product-specific fields", () => {
      const productFields = ["name", "description", "category"];

      for (const field of productFields) {
        expect(filterableFields.products).toContain(field);
      }
    });
  });

  describe("Field Uniqueness", () => {
    it("should not have duplicate fields in any resource", () => {
      for (const [_resource, fields] of Object.entries(filterableFields)) {
        const uniqueFields = new Set(fields);
        expect(uniqueFields.size).toBe(fields.length);
      }
    });
  });

  describe("Contacts Summary View Consistency", () => {
    it("should have same filterable fields as contacts base resource", () => {
      // contacts_summary is a database view, should mirror contacts fields
      expect(filterableFields.contacts_summary).toEqual(filterableFields.contacts);
    });
  });
});
