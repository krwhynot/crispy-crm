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

    it("should require stage explicitly (no silent default after WG-003)", () => {
      const minimalOpportunity = {
        name: "Minimal Opportunity",
        customer_organization_id: "1",
        principal_organization_id: "2",
        contact_ids: ["1"],
        // stage intentionally omitted - should fail
      };

      // WG-003 fix: stage is now required, no silent default
      expect(() => opportunitySchema.parse(minimalOpportunity)).toThrow(z.ZodError);
    });

    it("should require priority explicitly (no silent default after WG-002)", () => {
      const opportunityWithoutPriority = {
        name: "Opportunity without Priority",
        customer_organization_id: "1",
        principal_organization_id: "2",
        contact_ids: ["1"],
        stage: "new_lead",
        // priority intentionally omitted - should fail
      };

      // WG-002 fix: priority is now required, no silent default
      expect(() => opportunitySchema.parse(opportunityWithoutPriority)).toThrow(z.ZodError);
    });

    it("should require name field", () => {
      const invalidOpportunity = {
        contact_ids: ["1"],
      };

      expect(() => opportunitySchema.parse(invalidOpportunity)).toThrow(z.ZodError);
    });

    it("should allow empty contact_ids for creation (can be enriched later)", () => {
      const validOpportunity = {
        name: "Test",
        customer_organization_id: "1",
        principal_organization_id: "2",
        contact_ids: [],
        stage: "new_lead", // Required after WG-003 fix
        priority: "medium", // Required after WG-002 fix
      };

      // Contacts are optional for quick-add (can be enriched later via slide-over)
      const result = createOpportunitySchema.parse(validOpportunity);
      expect(result.contact_ids).toEqual([]);
    });
  });

  describe("createOpportunitySchema", () => {
    it("should require name, contact_ids, stage, and estimated_close_date", () => {
      const validData = {
        name: "New Opportunity",
        customer_organization_id: "1",
        principal_organization_id: "2",
        contact_ids: ["1"],
        estimated_close_date: "2025-12-31",
        stage: "new_lead", // Required after WG-003 fix
        priority: "medium", // Required after WG-002 fix
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
