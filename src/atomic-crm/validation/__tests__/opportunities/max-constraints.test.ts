import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  opportunitySchema,
  createOpportunitySchema,
  updateOpportunitySchema,
  closeOpportunityBaseSchema,
  closeOpportunitySchema,
  quickCreateOpportunitySchema,
  opportunityProductSyncInputSchema,
  opportunityProductSyncHandlerSchema,
  opportunityParticipantSchema,
  createOpportunityParticipantSchema,
  updateOpportunityParticipantSchema,
  opportunityContactSchema,
  createOpportunityContactSchema,
  updateOpportunityContactSchema,
} from "../../opportunities";

/**
 * DoS Protection Tests: .max() constraints on unbounded strings
 *
 * Per audit remediation (Task 8), all user-facing string fields must have
 * maximum length limits to prevent denial-of-service attacks via oversized payloads.
 *
 * Field type limits:
 * - Name/label fields: 255 chars
 * - Description/notes: 10,000 chars (core.ts has 2000/5000, respecting those)
 * - Short text (status, type, category): 100 chars
 * - ID strings: 50 chars
 *
 * Exceptions (no .max() needed):
 * - .datetime() strings (already format-constrained)
 * - search_tsv (computed, Postgres manages)
 * - Fields with .refine() or .regex()
 */

describe("DoS Protection: .max() constraints on opportunity schemas", () => {
  describe("opportunities-core.ts", () => {
    describe("computed fields (read-only - already have .max() or are exempt)", () => {
      it("should accept valid customer_organization_name", () => {
        const data = {
          name: "Test Opportunity",
          stage: "new_lead",
          priority: "medium",
          customer_organization_id: 1,
          principal_organization_id: 2,
          customer_organization_name: "Valid Org Name",
        };
        const result = opportunitySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept valid principal_organization_name", () => {
        const data = {
          name: "Test Opportunity",
          stage: "new_lead",
          priority: "medium",
          customer_organization_id: 1,
          principal_organization_id: 2,
          principal_organization_name: "Valid Principal",
        };
        const result = opportunitySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept valid distributor_organization_name", () => {
        const data = {
          name: "Test Opportunity",
          stage: "new_lead",
          priority: "medium",
          customer_organization_id: 1,
          principal_organization_id: 2,
          distributor_organization_name: "Valid Distributor",
        };
        const result = opportunitySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept valid primary_contact_name", () => {
        const data = {
          name: "Test Opportunity",
          stage: "new_lead",
          priority: "medium",
          customer_organization_id: 1,
          principal_organization_id: 2,
          primary_contact_name: "John Doe",
        };
        const result = opportunitySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept valid next_task_title", () => {
        const data = {
          name: "Test Opportunity",
          stage: "new_lead",
          priority: "medium",
          customer_organization_id: 1,
          principal_organization_id: 2,
          next_task_title: "Follow up with customer",
        };
        const result = opportunitySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept valid next_task_priority", () => {
        const data = {
          name: "Test Opportunity",
          stage: "new_lead",
          priority: "medium",
          customer_organization_id: 1,
          principal_organization_id: 2,
          next_task_priority: "high",
        };
        const result = opportunitySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("opportunities-operations.ts", () => {
    describe("opportunityProductSyncInputSchema", () => {
      it("should reject excessively long notes (DoS protection)", () => {
        const data = {
          product_id_reference: 1,
          notes: "a".repeat(2001), // Over 2000 limit
        };
        const result = opportunityProductSyncInputSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["notes"]);
        }
      });

      it("should accept notes at maximum length", () => {
        const data = {
          product_id_reference: 1,
          notes: "a".repeat(2000), // At limit
        };
        const result = opportunityProductSyncInputSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("opportunityProductSyncHandlerSchema", () => {
      it("should reject excessively long notes (DoS protection)", () => {
        const data = {
          product_id_reference: 1,
          notes: "a".repeat(2001), // Over 2000 limit
        };
        const result = opportunityProductSyncHandlerSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["notes"]);
        }
      });

      it("should reject excessively long product_name (DoS protection)", () => {
        const data = {
          product_id_reference: 1,
          product_name: "a".repeat(256), // Over 255 limit
        };
        const result = opportunityProductSyncHandlerSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["product_name"]);
        }
      });

      it("should accept product_name at maximum length", () => {
        const data = {
          product_id_reference: 1,
          product_name: "a".repeat(255), // At limit
        };
        const result = opportunityProductSyncHandlerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should reject excessively long product_category (DoS protection)", () => {
        const data = {
          product_id_reference: 1,
          product_category: "a".repeat(101), // Over 100 limit
        };
        const result = opportunityProductSyncHandlerSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["product_category"]);
        }
      });

      it("should accept product_category at maximum length", () => {
        const data = {
          product_id_reference: 1,
          product_category: "a".repeat(100), // At limit
        };
        const result = opportunityProductSyncHandlerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("opportunities-junctions.ts", () => {
    describe("opportunityParticipantSchema", () => {
      it("should reject excessively long role (DoS protection)", () => {
        const data = {
          opportunity_id: 1,
          organization_id: 2,
          role: "customer" as const,
          notes: "a".repeat(1001), // Over 1000 limit
        };
        const result = opportunityParticipantSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["notes"]);
        }
      });

      it("should accept notes at maximum length", () => {
        const data = {
          opportunity_id: 1,
          organization_id: 2,
          role: "customer" as const,
          notes: "a".repeat(1000), // At limit
        };
        const result = opportunityParticipantSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("createOpportunityParticipantSchema", () => {
      it("should reject excessively long notes (DoS protection)", () => {
        const data = {
          opportunity_id: 1,
          organization_id: 2,
          role: "customer" as const,
          notes: "a".repeat(1001), // Over 1000 limit
        };
        const result = createOpportunityParticipantSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["notes"]);
        }
      });
    });

    describe("updateOpportunityParticipantSchema", () => {
      it("should reject excessively long notes (DoS protection)", () => {
        const data = {
          id: 1,
          notes: "a".repeat(1001), // Over 1000 limit
        };
        const result = updateOpportunityParticipantSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["notes"]);
        }
      });
    });

    describe("opportunityContactSchema", () => {
      it("should accept role at maximum length", () => {
        const data = {
          opportunity_id: 1,
          contact_id: 2,
          role: "a".repeat(100), // At limit
        };
        const result = opportunityContactSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept notes at maximum length", () => {
        const data = {
          opportunity_id: 1,
          contact_id: 2,
          notes: "a".repeat(1000), // At limit
        };
        const result = opportunityContactSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("createOpportunityContactSchema", () => {
      it("should reject excessively long notes (DoS protection)", () => {
        const data = {
          opportunity_id: 1,
          contact_id: 2,
          notes: "a".repeat(1001), // Over 1000 limit
        };
        const result = createOpportunityContactSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["notes"]);
        }
      });
    });

    describe("updateOpportunityContactSchema", () => {
      it("should reject excessively long role (DoS protection)", () => {
        const data = {
          id: 1,
          role: "a".repeat(101), // Over 100 limit
        };
        const result = updateOpportunityContactSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["role"]);
        }
      });

      it("should reject excessively long notes (DoS protection)", () => {
        const data = {
          id: 1,
          notes: "a".repeat(1001), // Over 1000 limit
        };
        const result = updateOpportunityContactSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toEqual(["notes"]);
        }
      });
    });
  });
});
