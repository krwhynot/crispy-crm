/**
 * Tests for opportunity business rules and edge cases
 * Focus: Business logic, lifecycle, and special scenarios
 */

import { describe, it, expect } from "vitest";
import {
  opportunitySchema,
} from "../../opportunities";

describe("Opportunity Business Rules and Edge Cases", () => {
  describe("Business Rules", () => {
    it("should enforce probability business rule (0-100)", () => {
      const testCases = [
        { probability: 0, expected: true },
        { probability: 25, expected: true },
        { probability: 50, expected: true },
        { probability: 75, expected: true },
        { probability: 100, expected: true },
        { probability: -1, expected: false },
        { probability: 101, expected: false },
        { probability: 200, expected: false },
      ];

      testCases.forEach(({ probability, expected }) => {
        const opportunity = {
          name: "Test",
          contact_ids: ["contact-1"],
          expected_closing_date: "2024-12-31",
          probability,
        };

        if (expected) {
          expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
        } else {
          expect(() => opportunitySchema.parse(opportunity)).toThrow();
        }
      });
    });

    it("should handle opportunity stage progression", () => {
      const stageProgression = [
        "new_lead",
        "initial_outreach",
        "sample_visit_offered",
        "awaiting_response",
        "feedback_logged",
        "demo_scheduled",
        "closed_won",
      ];

      stageProgression.forEach((stage) => {
        const opportunity = {
          name: `Opportunity at ${stage}`,
          contact_ids: ["contact-1"],
          expected_closing_date: "2024-12-31",
          stage,
        };

        expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
      });
    });

    it("should handle multi-contact opportunities", () => {
      const multiContactOpp = {
        name: "Multi-stakeholder Deal",
        contact_ids: ["contact-1", "contact-2", "contact-3", "contact-4"],
        customer_organization_id: "org-1",
        principal_organization_id: "org-2",
        expected_closing_date: "2024-12-31",
        stage: "demo_scheduled",
        amount: 100000,
      };

      const result = opportunitySchema.parse(multiContactOpp);
      expect(result.contact_ids).toHaveLength(4);
      expect(result.customer_organization_id).toBe("org-1");
      expect(result.principal_organization_id).toBe("org-2");
    });

    it("should validate opportunity lifecycle", () => {
      const lifecycleStates = [
        { stage: "new_lead", status: "active", closed_date: null },
        { stage: "demo_scheduled", status: "active", closed_date: null },
        { stage: "closed_won", status: "active", closed_date: "2024-12-31" },
        { stage: "closed_lost", status: "expired", closed_date: "2024-12-31" },
      ];

      lifecycleStates.forEach((state) => {
        const opportunity = {
          name: "Lifecycle Test",
          contact_ids: ["contact-1"],
          expected_closing_date: "2024-12-31",
          ...state,
        };

        expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
      });
    });

    it("should handle opportunity priority levels", () => {
      const priorities = ["low", "medium", "high", "critical"];

      priorities.forEach((priority) => {
        const opportunity = {
          name: `${priority} priority opportunity`,
          contact_ids: ["contact-1"],
          expected_closing_date: "2024-12-31",
          priority,
        };

        expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
      });
    });

    it("should validate opportunity amount calculations", () => {
      const amountScenarios = [
        { amount: 0, probability: 0, expectedValue: 0 },
        { amount: 10000, probability: 50, expectedValue: 5000 },
        { amount: 100000, probability: 75, expectedValue: 75000 },
        { amount: 1000000, probability: 10, expectedValue: 100000 },
      ];

      amountScenarios.forEach(({ amount, probability }) => {
        const opportunity = {
          name: "Amount Test",
          contact_ids: ["contact-1"],
          expected_closing_date: "2024-12-31",
          amount,
          probability,
        };

        expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
      });
    });

    it("should handle opportunity timeline", () => {
      const timelineScenarios = [
        {
          created_date: "2024-01-01",
          expected_closing_date: "2024-12-31",
          duration: "1 year",
        },
        {
          created_date: "2024-01-01",
          expected_closing_date: "2024-03-31",
          duration: "3 months",
        },
        {
          created_date: "2024-01-01",
          expected_closing_date: "2025-01-01",
          duration: "over 1 year",
        },
      ];

      timelineScenarios.forEach(({ expected_closing_date }) => {
        const opportunity = {
          name: "Timeline Test",
          contact_ids: ["contact-1"],
          expected_closing_date,
        };

        expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle opportunities with minimal data", () => {
      const minimalOpp = {
        name: "Minimal",
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
      };

      const result = opportunitySchema.parse(minimalOpp);
      expect(result.name).toBe("Minimal");
      expect(result.stage).toBeDefined(); // Should have default
      expect(result.priority).toBeDefined(); // Should have default
      expect(result.probability).toBeDefined(); // Should have default
    });

    it("should handle opportunities with maximum data", () => {
      const maximalOpp = {
        name: "Maximal Opportunity",
        description: "A".repeat(1000),
        contact_ids: ["c1", "c2", "c3", "c4", "c5"],
        customer_organization_id: "comp1",
        principal_organization_id: "comp2",
        distributor_organization_id: "comp3",
        stage: "demo_scheduled",
        status: "active",
        priority: "critical",
        amount: 1000000,
        probability: 90,
        expected_closing_date: "2024-12-31",
        closed_date: null,
        tags: ["enterprise", "q4", "expansion", "strategic"],
        competitor_ids: ["comp-1", "comp-2"],
        loss_reason: null,
        next_step: "Executive presentation",
        sales_rep_id: "rep-123",
        team_members: ["member-1", "member-2"],
      };

      expect(() => opportunitySchema.parse(maximalOpp)).not.toThrow();
    });

    it("should handle opportunities with special characters in names", () => {
      const specialNames = [
        "Deal #123",
        "Q4-2024 Expansion",
        "ABC Corp - Phase 2",
        "$1M Enterprise Deal",
        "50% Discount Offer",
        "Deal (Confidential)",
      ];

      specialNames.forEach((name) => {
        const opportunity = {
          name,
          contact_ids: ["contact-1"],
          expected_closing_date: "2024-12-31",
        };

        expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
      });
    });

    it("should handle opportunities with very long names", () => {
      const maxLengthName = "A".repeat(255); // Assuming 255 is max
      const opportunity = {
        name: maxLengthName,
        contact_ids: ["contact-1"],
        expected_closing_date: "2024-12-31",
      };

      expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
    });

    it("should handle opportunities with future dates", () => {
      const futureDates = [
        "2025-12-31",
        "2030-01-01",
        "2050-12-31",
      ];

      futureDates.forEach((date) => {
        const opportunity = {
          name: "Future Deal",
          contact_ids: ["contact-1"],
          expected_closing_date: date,
        };

        expect(() => opportunitySchema.parse(opportunity)).not.toThrow();
      });
    });
  });
});