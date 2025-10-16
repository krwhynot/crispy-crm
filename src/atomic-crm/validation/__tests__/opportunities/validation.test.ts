import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  opportunitySchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  opportunityStageSchema,
  opportunityPrioritySchema,
  leadSourceSchema,
} from "../../opportunities";

describe("Opportunity Validation - UI as Source of Truth", () => {
  describe("opportunitySchema", () => {
    it("should accept valid opportunity data matching UI inputs", () => {
      const validOpportunity = {
        name: "Test Opportunity",
        description: "Test description",
        estimated_close_date: "2025-12-31",
        stage: "new_lead",
        priority: "medium",
        lead_source: "referral",
        customer_organization_id: "1",
        principal_organization_id: "2",
        distributor_organization_id: "3",
        account_manager_id: "4",
        contact_ids: ["5", "6"],
      };

      const result = opportunitySchema.parse(validOpportunity);
      expect(result.name).toBe("Test Opportunity");
      expect(result.stage).toBe("new_lead");
    });

    it("should apply default values for stage and priority", () => {
      const minimalOpportunity = {
        name: "Minimal Opportunity",
        contact_ids: ["1"],
      };

      const result = opportunitySchema.parse(minimalOpportunity);
      expect(result.stage).toBe("new_lead");
      expect(result.priority).toBe("medium");
    });

    it("should require name field", () => {
      const invalidOpportunity = {
        contact_ids: ["1"],
      };

      expect(() => opportunitySchema.parse(invalidOpportunity)).toThrow(z.ZodError);
    });

    it("should require at least one contact", () => {
      const invalidOpportunity = {
        name: "Test",
        contact_ids: [],
      };

      expect(() => opportunitySchema.parse(invalidOpportunity)).toThrow(z.ZodError);
    });
  });

  describe("createOpportunitySchema", () => {
    it("should require name, contact_ids, and estimated_close_date", () => {
      const validData = {
        name: "New Opportunity",
        contact_ids: ["1"],
        estimated_close_date: "2025-12-31",
      };

      expect(() => createOpportunitySchema.parse(validData)).not.toThrow();
    });

    it("should reject creation without estimated_close_date", () => {
      const invalidData = {
        name: "New Opportunity",
        contact_ids: ["1"],
      };

      expect(() => createOpportunitySchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe("updateOpportunitySchema", () => {
    it("should allow partial updates", () => {
      const update = {
        id: "1",
        description: "Updated description",
      };

      expect(() => updateOpportunitySchema.parse(update)).not.toThrow();
    });

    it("should require id for updates", () => {
      const invalidUpdate = {
        description: "Updated description",
      };

      expect(() => updateOpportunitySchema.parse(invalidUpdate)).toThrow(z.ZodError);
    });
  });

  describe("Enum Schemas", () => {
    it("should validate stage values", () => {
      expect(() => opportunityStageSchema.parse("new_lead")).not.toThrow();
      expect(() => opportunityStageSchema.parse("invalid")).toThrow(z.ZodError);
    });

    it("should validate priority values", () => {
      expect(() => opportunityPrioritySchema.parse("high")).not.toThrow();
      expect(() => opportunityPrioritySchema.parse("invalid")).toThrow(z.ZodError);
    });

    it("should validate lead_source values", () => {
      expect(() => leadSourceSchema.parse("referral")).not.toThrow();
      expect(() => leadSourceSchema.parse("invalid")).toThrow(z.ZodError);
    });
  });
});
