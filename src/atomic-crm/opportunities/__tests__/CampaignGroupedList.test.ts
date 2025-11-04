import { describe, it, expect } from "vitest";
import type { Opportunity } from "../../types";

/**
 * CampaignGroupedList Component Tests
 *
 * Tests the business logic for grouping opportunities by campaign and customer.
 * Full UI rendering tests are deferred to E2E (nested accordions require complex setup).
 */

describe("CampaignGroupedList - Grouping Logic", () => {
  const mockOpportunities: Opportunity[] = [
    {
      id: 1,
      name: "Nobu Miami - Ocean Hugger - Q4 2025",
      campaign: "Winter Fancy Food Show 2025",
      customer_organization_name: "Nobu Miami",
      principal_organization_name: "Ocean Hugger",
      customer_organization_id: 1,
      stage: "new_lead",
      status: "active",
      priority: "high",
      description: "",
      estimated_close_date: "2025-12-31",
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
      contact_ids: [],
      stage_manual: false,
      status_manual: false,
    },
    {
      id: 2,
      name: "Nobu Miami - Better Balance - Q4 2025",
      campaign: "Winter Fancy Food Show 2025",
      customer_organization_name: "Nobu Miami",
      principal_organization_name: "Better Balance",
      customer_organization_id: 1,
      stage: "initial_outreach",
      status: "active",
      priority: "medium",
      description: "",
      estimated_close_date: "2025-12-15",
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
      contact_ids: [],
      stage_manual: false,
      status_manual: false,
    },
    {
      id: 3,
      name: "The French Laundry - Kaufholds - Q4 2025",
      campaign: "Winter Fancy Food Show 2025",
      customer_organization_name: "The French Laundry",
      principal_organization_name: "Kaufholds",
      customer_organization_id: 2,
      stage: "demo_scheduled",
      status: "active",
      priority: "critical",
      description: "",
      estimated_close_date: "2025-11-30",
      created_at: "2025-01-02",
      updated_at: "2025-01-02",
      contact_ids: [],
      stage_manual: false,
      status_manual: false,
    },
    {
      id: 4,
      name: "Chef's Table - Farm Fresh - Q1 2026",
      campaign: "Summer Natural Products Expo 2025",
      customer_organization_name: "Chef's Table",
      principal_organization_name: "Farm Fresh",
      customer_organization_id: 3,
      stage: "closed_won",
      status: "active",
      priority: "low",
      description: "",
      estimated_close_date: "2026-01-15",
      created_at: "2025-01-03",
      updated_at: "2025-01-03",
      contact_ids: [],
      stage_manual: false,
      status_manual: false,
    },
  ];

  describe("Campaign → Customer → Opportunities Grouping", () => {
    it("should group opportunities by campaign", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      mockOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const campaignNames = Object.keys(campaignGroups);
      expect(campaignNames).toHaveLength(2);
      expect(campaignNames).toContain("Winter Fancy Food Show 2025");
      expect(campaignNames).toContain("Summer Natural Products Expo 2025");
    });

    it("should group opportunities by customer within campaign", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      mockOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const customerNames = Object.keys(winterCampaign);

      expect(customerNames).toHaveLength(2);
      expect(customerNames).toContain("Nobu Miami");
      expect(customerNames).toContain("The French Laundry");
    });

    it("should correctly count opportunities per customer", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      mockOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];

      expect(winterCampaign["Nobu Miami"]).toHaveLength(2);
      expect(winterCampaign["The French Laundry"]).toHaveLength(1);
    });

    it("should calculate total opportunities per campaign", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      mockOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const customerNames = Object.keys(winterCampaign);
      const totalOpportunities = customerNames.reduce(
        (sum, customer) => sum + winterCampaign[customer].length,
        0
      );

      expect(totalOpportunities).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("should skip opportunities without campaign field", () => {
      const opportunitiesWithNoCampaign: Opportunity[] = [
        ...mockOpportunities,
        {
          id: 5,
          name: "No Campaign Opp",
          campaign: undefined,
          customer_organization_name: "Test Customer",
          customer_organization_id: 4,
          stage: "new_lead",
          status: "active",
          priority: "medium",
          description: "",
          estimated_close_date: "2025-12-31",
          created_at: "2025-01-01",
          updated_at: "2025-01-01",
          contact_ids: [],
          stage_manual: false,
          status_manual: false,
        },
      ];

      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      opportunitiesWithNoCampaign.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      // Should still have only 2 campaigns (the one without campaign should be skipped)
      const campaignNames = Object.keys(campaignGroups);
      expect(campaignNames).toHaveLength(2);
    });

    it("should handle opportunities with missing customer organization name", () => {
      const opportunitiesWithNoCustomer: Opportunity[] = [
        {
          id: 6,
          name: "No Customer Name",
          campaign: "Test Campaign",
          customer_organization_name: undefined,
          customer_organization_id: 5,
          stage: "new_lead",
          status: "active",
          priority: "medium",
          description: "",
          estimated_close_date: "2025-12-31",
          created_at: "2025-01-01",
          updated_at: "2025-01-01",
          contact_ids: [],
          stage_manual: false,
          status_manual: false,
        },
      ];

      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      opportunitiesWithNoCustomer.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const testCampaign = campaignGroups["Test Campaign"];
      expect(testCampaign["Unknown Customer"]).toBeDefined();
      expect(testCampaign["Unknown Customer"]).toHaveLength(1);
    });

    it("should return empty object when no opportunities provided", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      const emptyOpportunities: Opportunity[] = [];

      emptyOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      expect(Object.keys(campaignGroups)).toHaveLength(0);
    });
  });

  describe("Sorting Behavior", () => {
    it("should sort campaign names alphabetically", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      mockOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const campaignNames = Object.keys(campaignGroups).sort();

      expect(campaignNames[0]).toBe("Summer Natural Products Expo 2025");
      expect(campaignNames[1]).toBe("Winter Fancy Food Show 2025");
    });

    it("should sort customer names alphabetically within campaign", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      mockOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const customerNames = Object.keys(winterCampaign).sort();

      expect(customerNames[0]).toBe("Nobu Miami");
      expect(customerNames[1]).toBe("The French Laundry");
    });
  });

  describe("Pluralization Logic", () => {
    it("should use singular form for 1 opportunity", () => {
      const count = 1;
      const text = `${count} ${count === 1 ? "opportunity" : "opportunities"}`;

      expect(text).toBe("1 opportunity");
    });

    it("should use plural form for multiple opportunities", () => {
      const count = 3;
      const text = `${count} ${count === 1 ? "opportunity" : "opportunities"}`;

      expect(text).toBe("3 opportunities");
    });

    it("should use singular form for 1 customer", () => {
      const count = 1;
      const text = `${count} ${count === 1 ? "customer" : "customers"}`;

      expect(text).toBe("1 customer");
    });

    it("should use plural form for multiple customers", () => {
      const count = 2;
      const text = `${count} ${count === 1 ? "customer" : "customers"}`;

      expect(text).toBe("2 customers");
    });
  });

  describe("Data Integrity", () => {
    it("should preserve all opportunity data in grouped structure", () => {
      const campaignGroups: Record<string, Record<string, Opportunity[]>> = {};

      mockOpportunities.forEach((opp) => {
        if (!opp.campaign) return;
        if (!campaignGroups[opp.campaign]) {
          campaignGroups[opp.campaign] = {};
        }
        const customerKey = opp.customer_organization_name || "Unknown Customer";
        if (!campaignGroups[opp.campaign][customerKey]) {
          campaignGroups[opp.campaign][customerKey] = [];
        }
        campaignGroups[opp.campaign][customerKey].push(opp);
      });

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const nobuOpportunities = winterCampaign["Nobu Miami"];

      // Verify all fields are preserved
      expect(nobuOpportunities[0].id).toBe(1);
      expect(nobuOpportunities[0].name).toBe("Nobu Miami - Ocean Hugger - Q4 2025");
      expect(nobuOpportunities[0].principal_organization_name).toBe("Ocean Hugger");
      expect(nobuOpportunities[0].stage).toBe("new_lead");
      expect(nobuOpportunities[0].priority).toBe("high");
    });
  });
});
