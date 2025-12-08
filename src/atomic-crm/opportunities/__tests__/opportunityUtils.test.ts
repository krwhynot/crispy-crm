import { describe, it, expect } from "vitest";

// Simple utility functions for opportunity management
// Note: 'awaiting_response' stage removed per PRD v1.20 pipeline simplification
export const calculateOpportunityProbability = (stage: string): number => {
  const stageProbabilities: Record<string, number> = {
    new_lead: 10,
    initial_outreach: 25,
    sample_visit_offered: 40,
    feedback_logged: 55,
    demo_scheduled: 80,
    closed_won: 100,
    closed_lost: 0,
  };

  return stageProbabilities[stage] !== undefined ? stageProbabilities[stage] : 50;
};

export const formatOpportunityStage = (stage: string): string => {
  const stageLabels: Record<string, string> = {
    new_lead: "New Lead",
    initial_outreach: "Initial Outreach",
    sample_visit_offered: "Sample/Visit Offered",
    feedback_logged: "Feedback Logged",
    demo_scheduled: "Demo Scheduled",
    closed_won: "Closed Won",
    closed_lost: "Closed Lost",
  };

  return stageLabels[stage] || stage;
};

describe("Opportunity Utils", () => {
  describe("calculateOpportunityProbability", () => {
    it("should return correct probability for new_lead stage", () => {
      expect(calculateOpportunityProbability("new_lead")).toBe(10);
    });

    it("should return correct probability for initial_outreach stage", () => {
      expect(calculateOpportunityProbability("initial_outreach")).toBe(25);
    });

    it("should return correct probability for demo_scheduled stage", () => {
      expect(calculateOpportunityProbability("demo_scheduled")).toBe(80);
    });

    it("should return correct probability for closed_won stage", () => {
      expect(calculateOpportunityProbability("closed_won")).toBe(100);
    });

    it("should return correct probability for closed_lost stage", () => {
      expect(calculateOpportunityProbability("closed_lost")).toBe(0);
    });

    it("should return default probability for unknown stage", () => {
      expect(calculateOpportunityProbability("unknown_stage")).toBe(50);
    });
  });

  describe("formatOpportunityStage", () => {
    it("should format new_lead stage", () => {
      expect(formatOpportunityStage("new_lead")).toBe("New Lead");
    });

    it("should format initial_outreach stage", () => {
      expect(formatOpportunityStage("initial_outreach")).toBe("Initial Outreach");
    });

    it("should format sample_visit_offered stage", () => {
      expect(formatOpportunityStage("sample_visit_offered")).toBe("Sample/Visit Offered");
    });

    it("should format feedback_logged stage", () => {
      expect(formatOpportunityStage("feedback_logged")).toBe("Feedback Logged");
    });

    it("should format demo_scheduled stage", () => {
      expect(formatOpportunityStage("demo_scheduled")).toBe("Demo Scheduled");
    });

    it("should format closed_won stage", () => {
      expect(formatOpportunityStage("closed_won")).toBe("Closed Won");
    });

    it("should format closed_lost stage", () => {
      expect(formatOpportunityStage("closed_lost")).toBe("Closed Lost");
    });

    it("should return original string for unknown stage", () => {
      expect(formatOpportunityStage("custom_stage")).toBe("custom_stage");
    });
  });

  describe("Opportunity Lifecycle Tests", () => {
    it("should validate stage progression logic", () => {
      // 7-stage pipeline per PRD v1.20 (awaiting_response removed)
      const stageProgression = [
        "new_lead",
        "initial_outreach",
        "sample_visit_offered",
        "feedback_logged",
        "demo_scheduled",
        "closed_won",
      ];

      // Test that probabilities increase through progression
      let lastProbability = 0;
      stageProgression.forEach((stage) => {
        const probability = calculateOpportunityProbability(stage);
        expect(probability).toBeGreaterThanOrEqual(lastProbability);
        lastProbability = probability;
      });
    });

    it("should handle opportunity participant role validation", () => {
      const validRoles = [
        "decision_maker",
        "influencer",
        "buyer",
        "end_user",
        "gatekeeper",
        "champion",
        "technical",
        "executive",
      ];

      const isValidRole = (role: string): boolean => {
        return validRoles.includes(role);
      };

      expect(isValidRole("decision_maker")).toBe(true);
      expect(isValidRole("influencer")).toBe(true);
      expect(isValidRole("invalid_role")).toBe(false);
    });

    it("should validate influence levels", () => {
      const validInfluenceLevels = ["High", "Medium", "Low", "Unknown"];

      const isValidInfluenceLevel = (level: string): boolean => {
        return validInfluenceLevels.includes(level);
      };

      expect(isValidInfluenceLevel("High")).toBe(true);
      expect(isValidInfluenceLevel("Medium")).toBe(true);
      expect(isValidInfluenceLevel("Low")).toBe(true);
      expect(isValidInfluenceLevel("Unknown")).toBe(true);
      expect(isValidInfluenceLevel("Invalid")).toBe(false);
    });

    it("should validate opportunity priority levels", () => {
      const validPriorities = ["low", "medium", "high", "critical"];

      const isValidPriority = (priority: string): boolean => {
        return validPriorities.includes(priority);
      };

      expect(isValidPriority("low")).toBe(true);
      expect(isValidPriority("medium")).toBe(true);
      expect(isValidPriority("high")).toBe(true);
      expect(isValidPriority("critical")).toBe(true);
      expect(isValidPriority("invalid")).toBe(false);
    });
  });

  describe("Contact Multi-Organization Logic", () => {
    it("should validate contact organization relationship data", () => {
      const contactOrgRelationship = {
        contact_id: 1,
        organization_id: 1,
        is_primary_organization: true,
        role: "decision_maker",
        purchase_influence: "High",
        decision_authority: "Decision Maker",
      };

      expect(contactOrgRelationship.contact_id).toBeTruthy();
      expect(contactOrgRelationship.organization_id).toBeTruthy();
      expect(typeof contactOrgRelationship.is_primary_organization).toBe("boolean");
      expect(contactOrgRelationship.role).toBeTruthy();
      expect(contactOrgRelationship.purchase_influence).toBeTruthy();
      expect(contactOrgRelationship.decision_authority).toBeTruthy();
    });

    it("should ensure only one primary organization per contact", () => {
      const relationships = [
        { contact_id: 1, organization_id: 1, is_primary_organization: true },
        { contact_id: 1, organization_id: 2, is_primary_organization: false },
        { contact_id: 1, organization_id: 3, is_primary_organization: false },
      ];

      const primaryCount = relationships.filter((rel) => rel.is_primary_organization).length;
      expect(primaryCount).toBe(1);
    });
  });

  describe("Company Organization Type Logic", () => {
    it("should validate organization type values", () => {
      const validOrgTypes = [
        "customer",
        "prospect",
        "principal",
        "distributor",
      ];

      const isValidOrgType = (type: string): boolean => {
        return validOrgTypes.includes(type);
      };

      validOrgTypes.forEach((type) => {
        expect(isValidOrgType(type)).toBe(true);
      });

      expect(isValidOrgType("invalid_type")).toBe(false);
    });

    it("should validate priority level values", () => {
      const validPriorities = ["A", "B", "C", "D"];

      const isValidPriority = (priority: string): boolean => {
        return validPriorities.includes(priority);
      };

      validPriorities.forEach((priority) => {
        expect(isValidPriority(priority)).toBe(true);
      });

      expect(isValidPriority("E")).toBe(false);
    });

    it("should validate principal organization requirements", () => {
      const principalOrg = {
        organization_type: "principal",
        name: "Principal Company",
        sector: "Technology",
      };

      expect(principalOrg.organization_type).toBe("principal");
      expect(principalOrg.name).toBeTruthy();
      expect(principalOrg.sector).toBeTruthy();
    });

    it("should validate distributor organization requirements", () => {
      const distributorOrg = {
        organization_type: "distributor",
        name: "Distributor Company",
        sector: "Distribution",
      };

      expect(distributorOrg.organization_type).toBe("distributor");
      expect(distributorOrg.name).toBeTruthy();
      expect(distributorOrg.sector).toBeTruthy();
    });
  });

  describe("Backward Compatibility", () => {
    it("should handle opportunity URLs correctly", () => {
      const validateOpportunityUrl = (url: string): boolean => {
        return url.includes("/opportunities");
      };

      expect(validateOpportunityUrl("/opportunities")).toBe(true);
      expect(validateOpportunityUrl("/opportunities/1")).toBe(true);
      expect(validateOpportunityUrl("/opportunities/1/show")).toBe(true);
      expect(validateOpportunityUrl("/opportunities/create")).toBe(true);
    });
  });
});
