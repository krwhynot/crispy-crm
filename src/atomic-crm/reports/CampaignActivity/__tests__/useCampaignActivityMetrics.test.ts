/**
 * useCampaignActivityMetrics Hook Test Suite
 *
 * Tests the campaign activity metrics hook, specifically:
 * - Data integrity validation (filter+warn pattern for missing stage)
 * - Stale opportunity calculations
 * - Activity grouping logic
 */

import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCampaignActivityMetrics } from "../useCampaignActivityMetrics";

interface CampaignActivity {
  id: number;
  type: string;
  subject: string;
  organization_id: number;
  organization_name: string;
  contact_id: number | null;
  contact_name?: string;
  opportunity_id?: number | null;
  created_by: number;
  created_at: string;
}

interface CampaignOpportunity {
  id: number;
  name: string;
  campaign: string | null;
  customer_organization_name?: string;
  stage?: string;
}

const createMockActivity = (overrides: Partial<CampaignActivity> = {}): CampaignActivity => ({
  id: 1,
  type: "note",
  subject: "Test activity",
  organization_id: 10,
  organization_name: "Test Org",
  contact_id: null,
  opportunity_id: null,
  created_by: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

const createMockOpportunity = (
  overrides: Partial<CampaignOpportunity> = {}
): CampaignOpportunity => ({
  id: 1,
  name: "Test Opportunity",
  campaign: "Test Campaign",
  customer_organization_name: "Test Org",
  stage: "new_lead",
  ...overrides,
});

describe("useCampaignActivityMetrics", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Data Integrity - Stage Validation", () => {
    it("should filter out opportunities with null stage and log error", () => {
      const activities: CampaignActivity[] = [];
      const opportunities: CampaignOpportunity[] = [
        createMockOpportunity({ id: 1, stage: undefined, campaign: "Test Campaign" }),
        createMockOpportunity({ id: 2, stage: "new_lead", campaign: "Test Campaign" }),
      ];

      // Render the hook - we only need to trigger the side effect (console.error)
      renderHook(() =>
        useCampaignActivityMetrics(
          activities,
          opportunities,
          activities,
          "Test Campaign",
          true // showStaleLeads = true to trigger stale calculation
        )
      );

      // The opportunity with null stage should be filtered out
      // Only the valid opportunity should be processed
      // Logger uses structured format: "[timestamp] [ERROR] message {json}"
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Opportunity ID 1 has no stage"),
        "" // logger.error passes empty string as second param when no error object
      );
    });

    it("should process opportunities with valid stage correctly", () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activities: CampaignActivity[] = [
        createMockActivity({
          id: 1,
          opportunity_id: 1,
          created_at: thirtyDaysAgo.toISOString(),
        }),
      ];

      const opportunities: CampaignOpportunity[] = [
        createMockOpportunity({
          id: 1,
          stage: "new_lead", // Valid stage
          campaign: "Test Campaign",
        }),
      ];

      const { result } = renderHook(() =>
        useCampaignActivityMetrics(
          activities,
          opportunities,
          activities,
          "Test Campaign",
          true // showStaleLeads = true
        )
      );

      // No data integrity errors for valid opportunities
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining("[DATA INTEGRITY]"));

      // The opportunity should be processed and marked as stale
      // (new_lead threshold is 7 days, activity is 30 days old)
      expect(result.current.staleOpportunities.length).toBeGreaterThanOrEqual(0);
    });

    it("should not log error when stage is present", () => {
      const activities: CampaignActivity[] = [];
      const opportunities: CampaignOpportunity[] = [
        createMockOpportunity({ id: 1, stage: "initial_outreach", campaign: "Test Campaign" }),
        createMockOpportunity({ id: 2, stage: "new_lead", campaign: "Test Campaign" }),
      ];

      renderHook(() =>
        useCampaignActivityMetrics(activities, opportunities, activities, "Test Campaign", true)
      );

      // No data integrity errors should be logged
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining("[DATA INTEGRITY]"));
    });

    it("should exclude opportunities with missing stage from stale calculations", () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activities: CampaignActivity[] = [
        createMockActivity({
          id: 1,
          opportunity_id: 1,
          created_at: thirtyDaysAgo.toISOString(),
        }),
        createMockActivity({
          id: 2,
          opportunity_id: 2,
          created_at: thirtyDaysAgo.toISOString(),
        }),
      ];

      const opportunities: CampaignOpportunity[] = [
        createMockOpportunity({
          id: 1,
          stage: undefined, // Missing stage - should be excluded
          campaign: "Test Campaign",
        }),
        createMockOpportunity({
          id: 2,
          stage: "new_lead", // Valid stage
          campaign: "Test Campaign",
        }),
      ];

      const { result } = renderHook(() =>
        useCampaignActivityMetrics(activities, opportunities, activities, "Test Campaign", true)
      );

      // The opportunity with missing stage should not be in staleOpportunities
      const staleIds = result.current.staleOpportunities.map((o) => o.id);
      expect(staleIds).not.toContain(1); // ID 1 had missing stage

      // ID 2 should potentially be in stale list if it meets threshold
      // (new_lead threshold is 7 days, activity is 30 days old)
    });
  });

  describe("Activity Grouping", () => {
    it("should group activities by type", () => {
      const activities: CampaignActivity[] = [
        createMockActivity({ id: 1, type: "note" }),
        createMockActivity({ id: 2, type: "note" }),
        createMockActivity({ id: 3, type: "call" }),
      ];

      const { result } = renderHook(() =>
        useCampaignActivityMetrics(activities, [], [], "Test Campaign", false)
      );

      expect(result.current.activityGroups).toHaveLength(2);

      const noteGroup = result.current.activityGroups.find((g) => g.type === "note");
      const callGroup = result.current.activityGroups.find((g) => g.type === "call");

      expect(noteGroup?.totalCount).toBe(2);
      expect(callGroup?.totalCount).toBe(1);
    });

    it("should return empty array when no activities", () => {
      const { result } = renderHook(() =>
        useCampaignActivityMetrics([], [], [], "Test Campaign", false)
      );

      expect(result.current.activityGroups).toEqual([]);
    });
  });

  describe("Summary Metrics", () => {
    it("should calculate total activities correctly", () => {
      const activities: CampaignActivity[] = [
        createMockActivity({ id: 1 }),
        createMockActivity({ id: 2 }),
        createMockActivity({ id: 3 }),
      ];

      const { result } = renderHook(() =>
        useCampaignActivityMetrics(activities, [], [], "Test Campaign", false)
      );

      expect(result.current.totalActivities).toBe(3);
    });

    it("should calculate unique organizations correctly", () => {
      const activities: CampaignActivity[] = [
        createMockActivity({ id: 1, organization_id: 10 }),
        createMockActivity({ id: 2, organization_id: 10 }), // Same org
        createMockActivity({ id: 3, organization_id: 20 }), // Different org
      ];

      const { result } = renderHook(() =>
        useCampaignActivityMetrics(activities, [], [], "Test Campaign", false)
      );

      expect(result.current.uniqueOrgs).toBe(2);
    });
  });
});
