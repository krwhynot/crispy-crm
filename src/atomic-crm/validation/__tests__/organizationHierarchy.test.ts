// src/atomic-crm/validation/__tests__/organizationHierarchy.test.ts

import { describe, it, expect } from "vitest";
import {
  PARENT_ELIGIBLE_TYPES,
  isParentEligibleType,
  canBeParent,
  canHaveParent,
} from "../organizations";

describe("organizationHierarchy", () => {
  describe("PARENT_ELIGIBLE_TYPES", () => {
    it("includes distributor, customer, principal", () => {
      expect(PARENT_ELIGIBLE_TYPES).toEqual(["distributor", "customer", "principal"]);
    });
  });

  describe("isParentEligibleType", () => {
    it("returns true for distributor", () => {
      expect(isParentEligibleType("distributor")).toBe(true);
    });

    it("returns true for customer", () => {
      expect(isParentEligibleType("customer")).toBe(true);
    });

    it("returns true for principal", () => {
      expect(isParentEligibleType("principal")).toBe(true);
    });

    it("returns false for prospect", () => {
      expect(isParentEligibleType("prospect")).toBe(false);
    });

    it("returns false for unknown", () => {
      expect(isParentEligibleType("unknown")).toBe(false);
    });
  });

  describe("canBeParent", () => {
    it("returns true for standalone distributor", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: null,
      };
      expect(canBeParent(org)).toBe(true);
    });

    it("returns false for distributor with parent", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: 123,
      };
      expect(canBeParent(org)).toBe(false);
    });

    it("returns false for prospect", () => {
      const org = {
        organization_type: "prospect",
        parent_organization_id: null,
      };
      expect(canBeParent(org)).toBe(false);
    });
  });

  describe("canHaveParent", () => {
    it("returns true for standalone distributor with no children", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: null,
        child_branch_count: 0,
      };
      expect(canHaveParent(org)).toBe(true);
    });

    it("returns false for distributor with children", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: null,
        child_branch_count: 3,
      };
      expect(canHaveParent(org)).toBe(false);
    });

    it("returns false for distributor with existing parent", () => {
      const org = {
        organization_type: "distributor",
        parent_organization_id: 456,
        child_branch_count: 0,
      };
      expect(canHaveParent(org)).toBe(false);
    });

    it("returns false for prospect", () => {
      const org = {
        organization_type: "prospect",
        parent_organization_id: null,
        child_branch_count: 0,
      };
      expect(canHaveParent(org)).toBe(false);
    });

    it("returns true when child_branch_count is undefined", () => {
      const org = {
        organization_type: "customer",
        parent_organization_id: null,
      };
      expect(canHaveParent(org)).toBe(true);
    });
  });
});
