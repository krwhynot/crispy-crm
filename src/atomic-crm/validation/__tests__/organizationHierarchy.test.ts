import { describe, it, expect } from "vitest";
import {
  PARENT_ELIGIBLE_TYPES,
  isParentEligibleType,
  canBeParent,
  canHaveParent,
} from "../organizations";

describe("Organization Hierarchy Validation", () => {
  describe("PARENT_ELIGIBLE_TYPES constant", () => {
    it("should contain expected types", () => {
      expect(PARENT_ELIGIBLE_TYPES).toEqual([
        "distributor",
        "customer",
        "principal",
      ]);
    });

    it("should be a readonly tuple", () => {
      expect(PARENT_ELIGIBLE_TYPES.length).toBe(3);
    });
  });

  describe("isParentEligibleType", () => {
    it("should return true for eligible types", () => {
      expect(isParentEligibleType("distributor")).toBe(true);
      expect(isParentEligibleType("customer")).toBe(true);
      expect(isParentEligibleType("principal")).toBe(true);
    });

    it("should return false for non-eligible types", () => {
      expect(isParentEligibleType("prospect")).toBe(false);
      expect(isParentEligibleType("unknown")).toBe(false);
      expect(isParentEligibleType("invalid")).toBe(false);
      expect(isParentEligibleType("")).toBe(false);
    });

    it("should be case-sensitive", () => {
      expect(isParentEligibleType("Distributor")).toBe(false);
      expect(isParentEligibleType("CUSTOMER")).toBe(false);
      expect(isParentEligibleType("Principal")).toBe(false);
    });
  });

  describe("canBeParent", () => {
    it("should return true for eligible type without parent", () => {
      expect(
        canBeParent({
          organization_type: "distributor",
          parent_organization_id: null,
        }),
      ).toBe(true);

      expect(
        canBeParent({
          organization_type: "customer",
          parent_organization_id: undefined,
        }),
      ).toBe(true);

      expect(
        canBeParent({
          organization_type: "principal",
        }),
      ).toBe(true);
    });

    it("should return false for eligible type with parent", () => {
      expect(
        canBeParent({
          organization_type: "distributor",
          parent_organization_id: 123,
        }),
      ).toBe(false);

      expect(
        canBeParent({
          organization_type: "customer",
          parent_organization_id: "456",
        }),
      ).toBe(false);
    });

    it("should return false for ineligible types", () => {
      expect(
        canBeParent({
          organization_type: "prospect",
          parent_organization_id: null,
        }),
      ).toBe(false);

      expect(
        canBeParent({
          organization_type: "unknown",
        }),
      ).toBe(false);
    });

    it("should return false for ineligible type even without parent", () => {
      expect(
        canBeParent({
          organization_type: "prospect",
        }),
      ).toBe(false);
    });
  });

  describe("canHaveParent", () => {
    it("should return true for eligible type without parent and no children", () => {
      expect(
        canHaveParent({
          organization_type: "distributor",
          parent_organization_id: null,
          child_branch_count: 0,
        }),
      ).toBe(true);

      expect(
        canHaveParent({
          organization_type: "customer",
          parent_organization_id: undefined,
        }),
      ).toBe(true);

      expect(
        canHaveParent({
          organization_type: "principal",
          parent_organization_id: null,
          child_branch_count: undefined,
        }),
      ).toBe(true);
    });

    it("should return false for eligible type with children", () => {
      expect(
        canHaveParent({
          organization_type: "distributor",
          parent_organization_id: null,
          child_branch_count: 1,
        }),
      ).toBe(false);

      expect(
        canHaveParent({
          organization_type: "customer",
          parent_organization_id: undefined,
          child_branch_count: 5,
        }),
      ).toBe(false);
    });

    it("should return false for eligible type that already has parent", () => {
      expect(
        canHaveParent({
          organization_type: "distributor",
          parent_organization_id: 123,
          child_branch_count: 0,
        }),
      ).toBe(false);

      expect(
        canHaveParent({
          organization_type: "customer",
          parent_organization_id: "456",
        }),
      ).toBe(false);
    });

    it("should return false for ineligible types", () => {
      expect(
        canHaveParent({
          organization_type: "prospect",
          parent_organization_id: null,
          child_branch_count: 0,
        }),
      ).toBe(false);

      expect(
        canHaveParent({
          organization_type: "unknown",
          parent_organization_id: undefined,
        }),
      ).toBe(false);
    });

    it("should return false for ineligible type even without parent and children", () => {
      expect(
        canHaveParent({
          organization_type: "prospect",
        }),
      ).toBe(false);
    });
  });
});
