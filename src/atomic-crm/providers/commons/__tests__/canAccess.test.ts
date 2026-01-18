/**
 * canAccess Helper Function Tests
 *
 * Tests the pure function for role-based access control.
 * No mocking needed since canAccess is a pure function.
 *
 * Permission Matrix:
 * - Admin: Full access to all resources
 * - Manager: Full access except sales resource
 * - Rep: Access based on ownership (RLS enforces at DB level)
 *
 * Ownership Fields (any match grants access):
 * - sales_id: Primary ownership
 * - created_by: Creator of record
 * - opportunity_owner_id: Opportunity owner
 * - account_manager_id: Organization account manager
 */

import { describe, it, expect } from "vitest";
import { canAccess } from "../canAccess";

describe("canAccess", () => {
  describe("admin role", () => {
    it("should allow all actions on all resources", () => {
      const actions = ["list", "show", "create", "edit", "delete", "export"] as const;
      const resources = [
        "contacts",
        "organizations",
        "opportunities",
        "activities",
        "tasks",
        "sales",
        "products",
        "tags",
        "segments",
      ] as const;

      for (const action of actions) {
        for (const resource of resources) {
          expect(
            canAccess("admin", { action, resource }),
            `admin should have ${action} access to ${resource}`
          ).toBe(true);
        }
      }
    });

    it("should allow access to sales resource (admin-only)", () => {
      expect(canAccess("admin", { action: "list", resource: "sales" })).toBe(true);
      expect(canAccess("admin", { action: "edit", resource: "sales" })).toBe(true);
      expect(canAccess("admin", { action: "delete", resource: "sales" })).toBe(true);
    });

    it("should allow access even when record is provided", () => {
      const record = { id: 1, sales_id: 999, name: "Test" };
      expect(canAccess("admin", { action: "edit", resource: "contacts", record })).toBe(true);
      expect(canAccess("admin", { action: "delete", resource: "opportunities", record })).toBe(
        true
      );
    });

    it("should allow access regardless of currentSalesId", () => {
      const record = { id: 1, sales_id: 100 };
      expect(canAccess("admin", { action: "edit", resource: "contacts", record }, 999)).toBe(true);
    });
  });

  describe("manager role", () => {
    it("should allow all actions on shared resources", () => {
      const actions = ["list", "show", "create", "edit", "delete", "export"] as const;
      const sharedResources = [
        "contacts",
        "organizations",
        "opportunities",
        "activities",
        "tasks",
        "products",
        "tags",
        "segments",
      ] as const;

      for (const action of actions) {
        for (const resource of sharedResources) {
          expect(
            canAccess("manager", { action, resource }),
            `manager should have ${action} access to ${resource}`
          ).toBe(true);
        }
      }
    });

    it("should deny access to sales resource (admin-only)", () => {
      expect(canAccess("manager", { action: "list", resource: "sales" })).toBe(false);
      expect(canAccess("manager", { action: "show", resource: "sales" })).toBe(false);
      expect(canAccess("manager", { action: "create", resource: "sales" })).toBe(false);
      expect(canAccess("manager", { action: "edit", resource: "sales" })).toBe(false);
      expect(canAccess("manager", { action: "delete", resource: "sales" })).toBe(false);
    });

    it("should allow access regardless of record ownership", () => {
      const record = { id: 1, sales_id: 999 };
      expect(canAccess("manager", { action: "edit", resource: "contacts", record })).toBe(true);
      expect(canAccess("manager", { action: "delete", resource: "opportunities", record })).toBe(
        true
      );
    });

    it("should allow access regardless of currentSalesId", () => {
      const record = { id: 1, sales_id: 100 };
      expect(canAccess("manager", { action: "edit", resource: "contacts", record }, 999)).toBe(
        true
      );
    });
  });

  describe("rep role - list/show/create actions", () => {
    it("should allow list action on all shared resources (RLS handles filtering)", () => {
      const resources = [
        "contacts",
        "organizations",
        "opportunities",
        "activities",
        "tasks",
        "products",
        "tags",
        "segments",
      ] as const;

      for (const resource of resources) {
        expect(canAccess("rep", { action: "list", resource }), `rep should list ${resource}`).toBe(
          true
        );
      }
    });

    it("should allow show action on all shared resources (RLS handles filtering)", () => {
      const resources = [
        "contacts",
        "organizations",
        "opportunities",
        "activities",
        "tasks",
        "products",
        "tags",
        "segments",
      ] as const;

      for (const resource of resources) {
        expect(canAccess("rep", { action: "show", resource }), `rep should show ${resource}`).toBe(
          true
        );
      }
    });

    it("should allow create action (record will be assigned to user)", () => {
      expect(canAccess("rep", { action: "create", resource: "contacts" })).toBe(true);
      expect(canAccess("rep", { action: "create", resource: "opportunities" })).toBe(true);
      expect(canAccess("rep", { action: "create", resource: "activities" })).toBe(true);
      expect(canAccess("rep", { action: "create", resource: "tasks" })).toBe(true);
    });

    it("should allow export action (RLS handles filtering)", () => {
      expect(canAccess("rep", { action: "export", resource: "contacts" })).toBe(true);
      expect(canAccess("rep", { action: "export", resource: "opportunities" })).toBe(true);
    });
  });

  describe("rep role - edit/delete WITHOUT record (backward compatibility)", () => {
    it("should allow edit without record context (RLS will enforce)", () => {
      expect(canAccess("rep", { action: "edit", resource: "contacts" })).toBe(true);
      expect(canAccess("rep", { action: "edit", resource: "opportunities" })).toBe(true);
      expect(canAccess("rep", { action: "edit", resource: "activities" })).toBe(true);
    });

    it("should allow delete without record context (RLS will enforce)", () => {
      expect(canAccess("rep", { action: "delete", resource: "contacts" })).toBe(true);
      expect(canAccess("rep", { action: "delete", resource: "opportunities" })).toBe(true);
      expect(canAccess("rep", { action: "delete", resource: "tasks" })).toBe(true);
    });

    it("should allow edit/delete without currentSalesId (RLS will enforce)", () => {
      const record = { id: 1, sales_id: 100 };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record })).toBe(true);
      expect(canAccess("rep", { action: "delete", resource: "contacts", record })).toBe(true);
    });

    it("should allow edit/delete with null currentSalesId (RLS will enforce)", () => {
      const record = { id: 1, sales_id: 100 };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, null)).toBe(true);
      expect(canAccess("rep", { action: "delete", resource: "contacts", record }, null)).toBe(true);
    });
  });

  describe("rep role - edit/delete WITH record and currentSalesId matching sales_id", () => {
    it("should allow edit when currentSalesId matches record.sales_id", () => {
      const record = { id: 1, sales_id: 123 };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, 123)).toBe(true);
    });

    it("should allow delete when currentSalesId matches record.sales_id", () => {
      const record = { id: 1, sales_id: 456 };
      expect(canAccess("rep", { action: "delete", resource: "tasks", record }, 456)).toBe(true);
    });
  });

  describe("rep role - edit/delete WITH record and currentSalesId matching created_by", () => {
    it("should allow edit when currentSalesId matches record.created_by", () => {
      const record = { id: 1, sales_id: 999, created_by: 123 };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, 123)).toBe(true);
    });

    it("should allow delete when currentSalesId matches record.created_by", () => {
      const record = { id: 1, sales_id: 999, created_by: 456 };
      expect(canAccess("rep", { action: "delete", resource: "activities", record }, 456)).toBe(
        true
      );
    });
  });

  describe("rep role - edit/delete WITH record and currentSalesId matching opportunity_owner_id", () => {
    it("should allow edit when currentSalesId matches record.opportunity_owner_id", () => {
      const record = { id: 1, sales_id: 999, opportunity_owner_id: 123 };
      expect(canAccess("rep", { action: "edit", resource: "opportunities", record }, 123)).toBe(
        true
      );
    });

    it("should allow delete when currentSalesId matches record.opportunity_owner_id", () => {
      const record = { id: 1, sales_id: 999, opportunity_owner_id: 456 };
      expect(canAccess("rep", { action: "delete", resource: "opportunities", record }, 456)).toBe(
        true
      );
    });
  });

  describe("rep role - edit/delete WITH record and currentSalesId matching account_manager_id", () => {
    it("should allow edit when currentSalesId matches record.account_manager_id", () => {
      const record = { id: 1, sales_id: 999, account_manager_id: 123 };
      expect(canAccess("rep", { action: "edit", resource: "organizations", record }, 123)).toBe(
        true
      );
    });

    it("should allow delete when currentSalesId matches record.account_manager_id", () => {
      const record = { id: 1, sales_id: 999, account_manager_id: 456 };
      expect(canAccess("rep", { action: "delete", resource: "organizations", record }, 456)).toBe(
        true
      );
    });
  });

  describe("rep role - edit/delete WITH record and NO matching ownership", () => {
    it("should deny edit when no ownership field matches currentSalesId", () => {
      const record = {
        id: 1,
        sales_id: 100,
        created_by: 200,
        opportunity_owner_id: 300,
        account_manager_id: 400,
      };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, 999)).toBe(false);
    });

    it("should deny delete when no ownership field matches currentSalesId", () => {
      const record = {
        id: 1,
        sales_id: 100,
        created_by: 200,
        opportunity_owner_id: 300,
        account_manager_id: 400,
      };
      expect(canAccess("rep", { action: "delete", resource: "opportunities", record }, 999)).toBe(
        false
      );
    });

    it("should deny edit when record has no ownership fields", () => {
      const record = { id: 1, name: "Test Record" };
      expect(canAccess("rep", { action: "edit", resource: "tags", record }, 123)).toBe(false);
    });

    it("should deny delete when record has only undefined ownership fields", () => {
      const record = { id: 1, sales_id: undefined, created_by: undefined };
      expect(canAccess("rep", { action: "delete", resource: "tasks", record }, 123)).toBe(false);
    });
  });

  describe("rep role - sales resource (admin-only)", () => {
    it("should deny all actions on sales resource", () => {
      expect(canAccess("rep", { action: "list", resource: "sales" })).toBe(false);
      expect(canAccess("rep", { action: "show", resource: "sales" })).toBe(false);
      expect(canAccess("rep", { action: "create", resource: "sales" })).toBe(false);
      expect(canAccess("rep", { action: "edit", resource: "sales" })).toBe(false);
      expect(canAccess("rep", { action: "delete", resource: "sales" })).toBe(false);
    });
  });

  describe("unknown role", () => {
    it("should deny all actions for unknown roles", () => {
      const actions = ["list", "show", "create", "edit", "delete", "export"] as const;
      const resources = ["contacts", "organizations", "opportunities"] as const;

      for (const action of actions) {
        for (const resource of resources) {
          expect(
            canAccess("unknown_role", { action, resource }),
            `unknown role should not have ${action} access to ${resource}`
          ).toBe(false);
        }
      }
    });

    it("should deny access for empty string role", () => {
      expect(canAccess("", { action: "list", resource: "contacts" })).toBe(false);
    });

    it("should deny access for role with whitespace", () => {
      expect(canAccess("  admin  ", { action: "list", resource: "contacts" })).toBe(false);
    });

    it("should deny access for case-mismatched roles", () => {
      expect(canAccess("Admin", { action: "list", resource: "contacts" })).toBe(false);
      expect(canAccess("ADMIN", { action: "list", resource: "contacts" })).toBe(false);
      expect(canAccess("Manager", { action: "list", resource: "contacts" })).toBe(false);
      expect(canAccess("Rep", { action: "list", resource: "contacts" })).toBe(false);
    });
  });

  describe("sales resource - admin only", () => {
    it("should only allow admin to access sales resource", () => {
      const actions = ["list", "show", "create", "edit", "delete"] as const;

      for (const action of actions) {
        expect(
          canAccess("admin", { action, resource: "sales" }),
          `admin should have ${action} access to sales`
        ).toBe(true);
        expect(
          canAccess("manager", { action, resource: "sales" }),
          `manager should NOT have ${action} access to sales`
        ).toBe(false);
        expect(
          canAccess("rep", { action, resource: "sales" }),
          `rep should NOT have ${action} access to sales`
        ).toBe(false);
      }
    });
  });

  describe("edge cases", () => {
    it("should handle record with null ownership fields", () => {
      const record = {
        id: 1,
        sales_id: null,
        created_by: null,
        opportunity_owner_id: null,
        account_manager_id: null,
      };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, 123)).toBe(false);
    });

    it("should handle numeric string ownership fields (strict equality)", () => {
      const record = { id: 1, sales_id: "123" };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, 123)).toBe(false);
    });

    it("should handle zero as valid ownership value", () => {
      const record = { id: 1, sales_id: 0 };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, 0)).toBe(true);
    });

    it("should handle custom action strings", () => {
      expect(canAccess("admin", { action: "custom_action", resource: "contacts" })).toBe(true);
      expect(canAccess("manager", { action: "custom_action", resource: "contacts" })).toBe(true);
    });

    it("should handle custom resource strings", () => {
      expect(canAccess("admin", { action: "list", resource: "custom_resource" })).toBe(true);
    });

    it("should handle record with multiple matching ownership fields", () => {
      const record = {
        id: 1,
        sales_id: 123,
        created_by: 123,
        opportunity_owner_id: 123,
        account_manager_id: 123,
      };
      expect(canAccess("rep", { action: "edit", resource: "contacts", record }, 123)).toBe(true);
    });
  });
});
