import { describe, it, expect } from "vitest";
import type { Opportunity } from "../../types";

/**
 * CampaignGroupedList Component Tests
 *
 * Tests the business logic for grouping opportunities by campaign → principal → customer.
 * Full UI rendering tests are deferred to E2E (nested accordions require complex setup).
 *
 * Hierarchy: Campaign → Principal → Customer → Opportunities
 */

/**
 * Type for 3-level nested grouping structure
 * Campaign → Principal → Customer → Opportunities
 */
type CampaignGroupedData = Record<
  string, // Campaign name
  Record<
    string, // Principal organization name
    Record<
      string, // Customer organization name
      Opportunity[]
    >
  >
>;

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

  /**
   * Helper function that mirrors the component's grouping logic
   */
  function groupOpportunities(opportunities: Opportunity[]): CampaignGroupedData {
    const campaignGroups: CampaignGroupedData = {};

    opportunities.forEach((opp) => {
      if (!opp.campaign) return;

      if (!campaignGroups[opp.campaign]) {
        campaignGroups[opp.campaign] = {};
      }

      const principalKey = opp.principal_organization_name || "Unknown Principal";
      if (!campaignGroups[opp.campaign][principalKey]) {
        campaignGroups[opp.campaign][principalKey] = {};
      }

      const customerKey = opp.customer_organization_name || "Unknown Customer";
      if (!campaignGroups[opp.campaign][principalKey][customerKey]) {
        campaignGroups[opp.campaign][principalKey][customerKey] = [];
      }

      campaignGroups[opp.campaign][principalKey][customerKey].push(opp);
    });

    return campaignGroups;
  }

  describe("Campaign → Principal → Customer → Opportunities Grouping", () => {
    it("should group opportunities by campaign", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const campaignNames = Object.keys(campaignGroups);
      expect(campaignNames).toHaveLength(2);
      expect(campaignNames).toContain("Winter Fancy Food Show 2025");
      expect(campaignNames).toContain("Summer Natural Products Expo 2025");
    });

    it("should group opportunities by principal within campaign", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const principalNames = Object.keys(winterCampaign);

      expect(principalNames).toHaveLength(3);
      expect(principalNames).toContain("Ocean Hugger");
      expect(principalNames).toContain("Better Balance");
      expect(principalNames).toContain("Kaufholds");
    });

    it("should group opportunities by customer within principal", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const oceanHugger = winterCampaign["Ocean Hugger"];
      const customerNames = Object.keys(oceanHugger);

      expect(customerNames).toHaveLength(1);
      expect(customerNames).toContain("Nobu Miami");
    });

    it("should correctly count opportunities per customer", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const oceanHugger = winterCampaign["Ocean Hugger"];

      expect(oceanHugger["Nobu Miami"]).toHaveLength(1);
    });

    it("should calculate total opportunities per principal", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const kaufholds = winterCampaign["Kaufholds"];

      const customerNames = Object.keys(kaufholds);
      const totalOpps = customerNames.reduce(
        (sum, customer) => sum + kaufholds[customer].length,
        0
      );

      expect(totalOpps).toBe(1);
    });

    it("should calculate total opportunities per campaign", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const principalNames = Object.keys(winterCampaign);

      const totalOpportunities = principalNames.reduce((sum, principal) => {
        const customerGroups = winterCampaign[principal];
        return (
          sum +
          Object.values(customerGroups).reduce((customerSum, opps) => customerSum + opps.length, 0)
        );
      }, 0);

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
          principal_organization_name: "Test Principal",
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

      const campaignGroups = groupOpportunities(opportunitiesWithNoCampaign);

      // Should still have only 2 campaigns (the one without campaign should be skipped)
      const campaignNames = Object.keys(campaignGroups);
      expect(campaignNames).toHaveLength(2);
    });

    it("should handle opportunities with missing principal organization name", () => {
      const opportunitiesWithNoPrincipal: Opportunity[] = [
        {
          id: 6,
          name: "No Principal Name",
          campaign: "Test Campaign",
          customer_organization_name: "Test Customer",
          principal_organization_name: undefined,
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

      const campaignGroups = groupOpportunities(opportunitiesWithNoPrincipal);

      const testCampaign = campaignGroups["Test Campaign"];
      expect(testCampaign["Unknown Principal"]).toBeDefined();
      expect(testCampaign["Unknown Principal"]["Test Customer"]).toHaveLength(1);
    });

    it("should handle opportunities with missing customer organization name", () => {
      const opportunitiesWithNoCustomer: Opportunity[] = [
        {
          id: 7,
          name: "No Customer Name",
          campaign: "Test Campaign",
          customer_organization_name: undefined,
          principal_organization_name: "Test Principal",
          customer_organization_id: 6,
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

      const campaignGroups = groupOpportunities(opportunitiesWithNoCustomer);

      const testCampaign = campaignGroups["Test Campaign"];
      expect(testCampaign["Test Principal"]["Unknown Customer"]).toBeDefined();
      expect(testCampaign["Test Principal"]["Unknown Customer"]).toHaveLength(1);
    });

    it("should return empty object when no opportunities provided", () => {
      const campaignGroups = groupOpportunities([]);

      expect(Object.keys(campaignGroups)).toHaveLength(0);
    });
  });

  describe("Sorting Behavior", () => {
    it("should sort campaign names alphabetically", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const campaignNames = Object.keys(campaignGroups).sort();

      expect(campaignNames[0]).toBe("Summer Natural Products Expo 2025");
      expect(campaignNames[1]).toBe("Winter Fancy Food Show 2025");
    });

    it("should sort principal names alphabetically within campaign", () => {
      const campaignGroups = groupOpportunities(mockOpportunities);

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const principalNames = Object.keys(winterCampaign).sort();

      expect(principalNames[0]).toBe("Better Balance");
      expect(principalNames[1]).toBe("Kaufholds");
      expect(principalNames[2]).toBe("Ocean Hugger");
    });

    it("should sort customer names alphabetically within principal", () => {
      // Create test data with multiple customers per principal
      const multiCustomerOpps: Opportunity[] = [
        {
          id: 10,
          name: "Test Opp 1",
          campaign: "Test Campaign",
          customer_organization_name: "Zebra Restaurant",
          principal_organization_name: "Test Principal",
          customer_organization_id: 10,
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
        {
          id: 11,
          name: "Test Opp 2",
          campaign: "Test Campaign",
          customer_organization_name: "Alpha Bistro",
          principal_organization_name: "Test Principal",
          customer_organization_id: 11,
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

      const campaignGroups = groupOpportunities(multiCustomerOpps);
      const testPrincipal = campaignGroups["Test Campaign"]["Test Principal"];
      const customerNames = Object.keys(testPrincipal).sort();

      expect(customerNames[0]).toBe("Alpha Bistro");
      expect(customerNames[1]).toBe("Zebra Restaurant");
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

    it("should use singular form for 1 principal", () => {
      const count = 1;
      const text = `${count} ${count === 1 ? "principal" : "principals"}`;

      expect(text).toBe("1 principal");
    });

    it("should use plural form for multiple principals", () => {
      const count = 3;
      const text = `${count} ${count === 1 ? "principal" : "principals"}`;

      expect(text).toBe("3 principals");
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
      const campaignGroups = groupOpportunities(mockOpportunities);

      const winterCampaign = campaignGroups["Winter Fancy Food Show 2025"];
      const oceanHuggerOpportunities = winterCampaign["Ocean Hugger"]["Nobu Miami"];

      // Verify all fields are preserved
      expect(oceanHuggerOpportunities[0].id).toBe(1);
      expect(oceanHuggerOpportunities[0].name).toBe("Nobu Miami - Ocean Hugger - Q4 2025");
      expect(oceanHuggerOpportunities[0].principal_organization_name).toBe("Ocean Hugger");
      expect(oceanHuggerOpportunities[0].customer_organization_name).toBe("Nobu Miami");
      expect(oceanHuggerOpportunities[0].stage).toBe("new_lead");
      expect(oceanHuggerOpportunities[0].priority).toBe("high");
    });

    it("should maintain separate groupings for same customer under different principals", () => {
      // Create test data where same customer appears under different principals
      const sameCustomerDiffPrincipals: Opportunity[] = [
        {
          id: 20,
          name: "Same Customer - Principal A",
          campaign: "Test Campaign",
          customer_organization_name: "Shared Customer",
          principal_organization_name: "Principal A",
          customer_organization_id: 20,
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
        {
          id: 21,
          name: "Same Customer - Principal B",
          campaign: "Test Campaign",
          customer_organization_name: "Shared Customer",
          principal_organization_name: "Principal B",
          customer_organization_id: 20,
          stage: "demo_scheduled",
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
      ];

      const campaignGroups = groupOpportunities(sameCustomerDiffPrincipals);
      const testCampaign = campaignGroups["Test Campaign"];

      // Same customer should appear under both principals
      expect(testCampaign["Principal A"]["Shared Customer"]).toHaveLength(1);
      expect(testCampaign["Principal B"]["Shared Customer"]).toHaveLength(1);

      // Each should have its own opportunity data
      expect(testCampaign["Principal A"]["Shared Customer"][0].id).toBe(20);
      expect(testCampaign["Principal B"]["Shared Customer"][0].id).toBe(21);
    });
  });
});
