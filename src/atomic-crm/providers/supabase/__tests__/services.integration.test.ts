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
    // Tests that MongoDB-style operators survive ValidationService.validateFilters()
    // so they can be transformed to ra-data-postgrest format by transformOrFilter()

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

    it("should preserve $and filter through validateFilters", () => {
      const filters = {
        $and: [{ status: "active" }, { priority: "high" }],
        name: "test",
      };

      const result = validationService.validateFilters("opportunities", filters);

      expect(result).toHaveProperty("$and");
      expect(result).toHaveProperty("name");
    });

    it("should preserve $not filter through validateFilters", () => {
      const filters = {
        $not: { status: "archived" },
      };

      const result = validationService.validateFilters("contacts", filters);

      expect(result).toHaveProperty("$not");
    });

    it("should preserve mixed MongoDB and field filters", () => {
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

    it("should preserve @or filter (ra-data-postgrest format)", () => {
      // After transformOrFilter runs, filter will have @or as nested object
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
  });
});
