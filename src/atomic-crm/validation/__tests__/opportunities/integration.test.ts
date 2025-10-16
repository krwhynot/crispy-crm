import { describe, it, expect } from "vitest";
import {
  validateOpportunityForm,
  validateCreateOpportunity,
  validateUpdateOpportunity,
} from "../../opportunities";

describe("Opportunity Validation Functions - UI as Source of Truth", () => {
  describe("validateOpportunityForm", () => {
    it("should accept valid opportunity form data", async () => {
      const validData = {
        name: "Test Opportunity",
        contact_ids: ["1"],
        estimated_close_date: "2025-12-31",
      };

      await expect(validateOpportunityForm(validData)).resolves.toBeUndefined();
    });

    it("should reject invalid data", async () => {
      const invalidData = {
        contact_ids: [],
      };

      await expect(validateOpportunityForm(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("validateCreateOpportunity", () => {
    it("should require all creation fields", async () => {
      const validData = {
        name: "New Opportunity",
        contact_ids: ["1"],
        estimated_close_date: "2025-12-31",
      };

      await expect(validateCreateOpportunity(validData)).resolves.toBeUndefined();
    });

    it("should reject creation without required fields", async () => {
      const invalidData = {
        name: "New Opportunity",
      };

      await expect(validateCreateOpportunity(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });

  describe("validateUpdateOpportunity", () => {
    it("should allow partial updates", async () => {
      const updateData = {
        id: "1",
        description: "Updated description",
      };

      await expect(validateUpdateOpportunity(updateData)).resolves.toBeUndefined();
    });

    it("should reject updates without id", async () => {
      const invalidData = {
        description: "Updated description",
      };

      await expect(validateUpdateOpportunity(invalidData)).rejects.toMatchObject({
        message: "Validation failed",
      });
    });
  });
});
