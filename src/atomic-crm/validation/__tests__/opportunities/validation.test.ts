/**
 * Tests for opportunity validation schemas
 * Focus: Core validation rules and schema behavior
 */

import { describe, it, expect } from "vitest";
import {
  opportunitySchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  opportunityStageSchema,
  opportunityStatusSchema,
  opportunityPrioritySchema,
} from "../../opportunities";
import { z } from "zod";

describe("Opportunity Validation Schemas", () => {
  describe("Enum Schemas", () => {
    describe("opportunityStageSchema", () => {
      it("should accept valid stages", () => {
        const validStages = [
          "new_lead",
          "initial_outreach",
          "sample_visit_offered",
          "awaiting_response",
          "feedback_logged",
          "demo_scheduled",
          "closed_won",
          "closed_lost",
        ];

        validStages.forEach((stage) => {
          expect(() => opportunityStageSchema.parse(stage)).not.toThrow();
        });
      });

      it("should reject invalid stages", () => {
        const invalidStages = ["", "pending", "won", "lost", "invalid_stage"];

        invalidStages.forEach((stage) => {
          expect(() => opportunityStageSchema.parse(stage)).toThrow(z.ZodError);
        });
      });
    });

    describe("opportunityStatusSchema", () => {
      it("should accept valid statuses", () => {
        const validStatuses = [
          "active",
          "on_hold",
          "nurturing",
          "stalled",
          "expired",
        ];

        validStatuses.forEach((status) => {
          expect(() => opportunityStatusSchema.parse(status)).not.toThrow();
        });
      });

      it("should reject invalid statuses", () => {
        expect(() => opportunityStatusSchema.parse("inactive")).toThrow(
          z.ZodError,
        );
        expect(() => opportunityStatusSchema.parse("completed")).toThrow(
          z.ZodError,
        );
      });
    });

    describe("opportunityPrioritySchema", () => {
      it("should accept valid priorities", () => {
        const validPriorities = ["low", "medium", "high", "critical"];

        validPriorities.forEach((priority) => {
          expect(() => opportunityPrioritySchema.parse(priority)).not.toThrow();
        });
      });

      it("should reject invalid priorities", () => {
        expect(() => opportunityPrioritySchema.parse("urgent")).toThrow(
          z.ZodError,
        );
        expect(() => opportunityPrioritySchema.parse("normal")).toThrow(
          z.ZodError,
        );
      });
    });
  });

  describe("opportunitySchema", () => {
    const validOpportunity = {
      name: "Test Opportunity",
      contact_ids: ["contact-1", "contact-2"],
      stage: "new_lead",
      priority: "medium",
      amount: 10000,
      probability: 75,
      expected_closing_date: "2024-12-31",
    };

    it("should accept valid opportunity data", () => {
      const result = opportunitySchema.parse(validOpportunity);
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Opportunity");
      expect(result.probability).toBe(75);
    });

    it("should provide default values", () => {
      const minimalOpportunity = {
        name: "Minimal Opportunity",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
      };

      const result = opportunitySchema.parse(minimalOpportunity);
      expect(result.stage).toBe("new_lead");
      expect(result.priority).toBe("medium");
      expect(result.amount).toBe(0);
      expect(result.probability).toBe(50);
    });

    it("should reject empty name", () => {
      const invalidData = { ...validOpportunity, name: "" };
      expect(() => opportunitySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should reject empty contact_ids array", () => {
      const invalidData = { ...validOpportunity, contact_ids: [] };
      expect(() => opportunitySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it("should validate probability range (0-100)", () => {
      // Valid probabilities
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, probability: 0 }),
      ).not.toThrow();
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, probability: 100 }),
      ).not.toThrow();
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, probability: 50 }),
      ).not.toThrow();

      // Invalid probabilities
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, probability: -1 }),
      ).toThrow(z.ZodError);
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, probability: 101 }),
      ).toThrow(z.ZodError);
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, probability: 150 }),
      ).toThrow(z.ZodError);
    });

    it("should validate amount is non-negative", () => {
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, amount: 0 }),
      ).not.toThrow();
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, amount: 1000000 }),
      ).not.toThrow();
      expect(() =>
        opportunitySchema.parse({ ...validOpportunity, amount: -100 }),
      ).toThrow(z.ZodError);
    });

    it("should accept both string and number IDs", () => {
      expect(() =>
        opportunitySchema.parse({
          ...validOpportunity,
          id: "string-id",
        }),
      ).not.toThrow();

      expect(() =>
        opportunitySchema.parse({
          ...validOpportunity,
          id: 12345,
        }),
      ).not.toThrow();

      const multipleIds = {
        ...validOpportunity,
        contact_ids: ["contact-1", "contact-2"],
        customer_organization_id: "org-1",
        principal_organization_id: "org-2",
      };
      expect(() => opportunitySchema.parse(multipleIds)).not.toThrow();
    });

    it("should handle nullable fields", () => {
      const dataWithNulls = {
        ...validOpportunity,
        description: null,
        closed_date: null,
        deleted_at: null,
      };

      expect(() => opportunitySchema.parse(dataWithNulls)).not.toThrow();
    });

    it("should handle tags array", () => {
      const oppWithTags = {
        ...validOpportunity,
        tags: ["hot", "enterprise", "q4"],
      };

      const result = opportunitySchema.parse(oppWithTags);
      expect(result.tags).toEqual(["hot", "enterprise", "q4"]);
      expect(result.tags).toHaveLength(3);
    });
  });

  describe("createOpportunitySchema", () => {
    it("should require essential fields for creation", () => {
      const validCreate = {
        name: "New Opportunity",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
      };

      expect(() => createOpportunitySchema.parse(validCreate)).not.toThrow();
    });

    it("should reject creation without required fields", () => {
      expect(() => createOpportunitySchema.parse({})).toThrow(z.ZodError);
      expect(() =>
        createOpportunitySchema.parse({ name: "Test" }),
      ).toThrow(z.ZodError);
      expect(() =>
        createOpportunitySchema.parse({
          name: "Test",
          contact_ids: ["contact-1"],
        }),
      ).toThrow(z.ZodError);
    });

    it("should not allow id field on creation", () => {
      const dataWithId = {
        id: "should-not-be-here",
        name: "New Opportunity",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
      };

      const result = createOpportunitySchema.parse(dataWithId);
      expect("id" in result).toBe(false);
    });

    it("should not include system fields on creation", () => {
      const dataWithSystemFields = {
        name: "New Opportunity",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = createOpportunitySchema.parse(dataWithSystemFields);
      expect("created_at" in result).toBe(false);
      expect("updated_at" in result).toBe(false);
    });

    it("should apply defaults on creation", () => {
      const minimalCreate = {
        name: "New Opp",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
      };

      const result = createOpportunitySchema.parse(minimalCreate);
      expect(result.stage).toBe("new_lead");
      expect(result.priority).toBe("medium");
      expect(result.probability).toBe(50);
      expect(result.amount).toBe(0);
    });
  });

  describe("updateOpportunitySchema", () => {
    it("should require id for updates", () => {
      const validUpdate = {
        id: "opp-123",
        name: "Updated Name",
      };

      expect(() => updateOpportunitySchema.parse(validUpdate)).not.toThrow();
    });

    it("should reject updates without id", () => {
      const invalidUpdate = {
        name: "Updated Name",
      };

      expect(() => updateOpportunitySchema.parse(invalidUpdate)).toThrow(
        z.ZodError,
      );
    });

    it("should allow partial updates", () => {
      expect(() =>
        updateOpportunitySchema.parse({ id: "opp-1", name: "New Name" }),
      ).not.toThrow();
      expect(() =>
        updateOpportunitySchema.parse({ id: "opp-1", probability: 80 }),
      ).not.toThrow();
      expect(() =>
        updateOpportunitySchema.parse({
          id: "opp-1",
          stage: "initial_outreach",
        }),
      ).not.toThrow();
      expect(() =>
        updateOpportunitySchema.parse({ id: "opp-1" }),
      ).not.toThrow();
    });

    it("should validate updated fields", () => {
      expect(() =>
        updateOpportunitySchema.parse({
          id: "opp-1",
          probability: 150,
        }),
      ).toThrow(z.ZodError);

      expect(() =>
        updateOpportunitySchema.parse({
          id: "opp-1",
          stage: "invalid_stage",
        }),
      ).toThrow(z.ZodError);
    });
  });
});