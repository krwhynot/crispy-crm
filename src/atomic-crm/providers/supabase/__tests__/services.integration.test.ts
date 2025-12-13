import { describe, it, expect } from "vitest";
import {
  validationService,
  transformService,
  storageService,
  resourceUsesValidation,
  resourceUsesTransformers,
} from "../unifiedDataProvider";

describe("Service Integration Tests", () => {
  describe("ValidationService Integration", () => {
    it("should be properly wired in unifiedDataProvider", () => {
      expect(validationService).toBeDefined();
      expect(validationService.hasValidation("contacts")).toBe(true);
      expect(validationService.hasValidation("organizations")).toBe(true);
      expect(validationService.hasValidation("opportunities")).toBe(true);
      expect(validationService.hasValidation("unknown")).toBe(false);
    });

    it("resourceUsesValidation should use validationService", () => {
      expect(resourceUsesValidation("contacts")).toBe(true);
      expect(resourceUsesValidation("organizations")).toBe(true);
      expect(resourceUsesValidation("unknown")).toBe(false);
    });
  });

  describe("TransformService Integration", () => {
    it("should be properly wired in unifiedDataProvider", () => {
      expect(transformService).toBeDefined();
      expect(transformService.hasTransform("contacts")).toBe(true);
      expect(transformService.hasTransform("organizations")).toBe(true);
      expect(transformService.hasTransform("contactNotes")).toBe(true);
      expect(transformService.hasTransform("unknown")).toBe(false);
    });

    it("resourceUsesTransformers should use transformService", () => {
      expect(resourceUsesTransformers("contacts")).toBe(true);
      expect(resourceUsesTransformers("organizations")).toBe(true);
      expect(resourceUsesTransformers("unknown")).toBe(false);
    });
  });

  describe("StorageService Integration", () => {
    it("should be properly wired and accessible", () => {
      expect(storageService).toBeDefined();
      expect(storageService.uploadToBucket).toBeDefined();
      expect(typeof storageService.uploadToBucket).toBe("function");
    });
  });

  describe("Filter Validation Integration", () => {
    // Tests that MongoDB-style $or operator survives ValidationService.validateFilters()
    // so it can be transformed to ra-data-postgrest format by transformOrFilter()

    it("should preserve $or filter through validateFilters", () => {
      const filters = {
        $or: [
          { customer_organization_id: 123 },
          { principal_organization_id: 123 },
          { distributor_organization_id: 123 },
        ],
      };

      const result = validationService.validateFilters("opportunities", filters);

      // $or should NOT be stripped - it needs to reach transformOrFilter
      expect(result).toHaveProperty("$or");
      expect(result.$or).toHaveLength(3);
    });

    it("should preserve mixed $or and field filters", () => {
      const filters = {
        $or: [{ stage: "qualified" }, { stage: "proposal" }],
        status: "active",
        "created_at@gte": "2024-01-01",
      };

      const result = validationService.validateFilters("opportunities", filters);

      expect(result).toHaveProperty("$or");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("created_at@gte");
    });

    it("should preserve '@or' filter (ra-data-postgrest format after transformation)", () => {
      // After transformOrFilter runs, filter will have "@or" with object value
      // This format is what ra-data-postgrest expects for logical OR operators
      const filters = {
        "@or": {
          customer_organization_id: 123,
          principal_organization_id: 123,
        },
        status: "active",
      };

      const result = validationService.validateFilters("opportunities", filters);

      expect(result).toHaveProperty("@or");
      expect(result).toHaveProperty("status");
    });

    it("should throw HttpError on invalid filter fields (fail-fast)", () => {
      // Invalid filter that doesn't exist in schema
      const filters = {
        status: "active",
        invalid_field_that_does_not_exist: "should_cause_error",
      };

      expect(() => validationService.validateFilters("contacts", filters)).toThrow();

      // Verify error details
      try {
        validationService.validateFilters("contacts", filters);
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.message).toContain("invalid_field_that_does_not_exist");
        expect(error.message).toContain("contacts");
      }
    });

    it("should throw HttpError listing all invalid filter fields", () => {
      const filters = {
        status: "active",
        bad_field_1: "value",
        bad_field_2: "value",
      };

      try {
        validationService.validateFilters("contacts", filters);
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.status).toBe(400);
        expect(error.message).toContain("bad_field_1");
        expect(error.message).toContain("bad_field_2");
        // Should also list allowed fields for user guidance
        expect(error.message).toContain("Allowed fields");
      }
    });

    it("should allow all filters for resources without filter config", () => {
      // Resources not in filterRegistry should allow all filters (backward compatible)
      const filters = {
        any_field: "value",
        another_field: "value",
      };

      // This should NOT throw - unknown resources allow all filters
      const result = validationService.validateFilters("unknown_resource", filters);
      expect(result).toEqual(filters);
    });
  });
});
