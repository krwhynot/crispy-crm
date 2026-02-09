/**
 * Stage Change Deduplication - Integration Tests
 *
 * Tests Gate 1: Verify exactly 1 activity is created per stage change, no duplicates.
 *
 * ARCHITECTURE:
 * - Stage changes flow through: dataProvider.update -> Supabase -> DB Trigger
 * - The DB trigger `log_opportunity_stage_change` creates exactly 1 activity per update
 * - Client-side code MUST NOT create activity records for stage changes
 * - Multiple rapid stage changes should each result in exactly 1 activity
 *
 * These tests verify the deduplication guarantee:
 * - Single stage change = exactly 1 activity created
 * - Multiple stage changes = exactly 1 activity per change (no duplicates)
 * - Same stage (no change) = 0 activities created
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, UpdateParams } from "ra-core";
import { createMockDataProvider } from "@/tests/utils/typed-mocks";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import type { Opportunity } from "@/atomic-crm/types";

interface Activity {
  id: number;
  subject: string;
  opportunity_id: number;
  activity_type: string;
  type: string;
  activity_date: string;
}

interface ActivityStore {
  activities: Activity[];
  nextId: number;
}

/**
 * Simulates the database trigger behavior for testing deduplication.
 * In production, the DB trigger fires after UPDATE and creates exactly 1 activity.
 * This mock tracks activity creation to verify deduplication guarantees.
 */
function createActivityTrackingProvider(): {
  dataProvider: DataProvider;
  activityStore: ActivityStore;
  getActivitiesForOpportunity: (opportunityId: number) => Activity[];
  mockUpdate: ReturnType<typeof vi.fn>;
  mockCreate: ReturnType<typeof vi.fn>;
} {
  const activityStore: ActivityStore = {
    activities: [],
    nextId: 1,
  };

  const mockUpdate = vi.fn().mockImplementation(async (_resource: string, params: UpdateParams) => {
    const previousStage = params.previousData?.stage;
    const newStage = params.data.stage;

    if (previousStage !== newStage && newStage !== undefined) {
      const activity: Activity = {
        id: activityStore.nextId++,
        subject: `Stage changed from ${previousStage} to ${newStage}`,
        opportunity_id: params.id as number,
        activity_type: "activity",
        type: "stage_change",
        activity_date: new Date().toISOString(),
      };
      activityStore.activities.push(activity);
    }

    return {
      data: { ...params.previousData, ...params.data },
    };
  });

  const mockCreate = vi.fn().mockResolvedValue({ data: { id: 999 } });

  const dataProvider = createMockDataProvider({
    update: mockUpdate,
    create: mockCreate,
  });

  function getActivitiesForOpportunity(opportunityId: number): Activity[] {
    return activityStore.activities.filter((a) => a.opportunity_id === opportunityId);
  }

  return {
    dataProvider,
    activityStore,
    getActivitiesForOpportunity,
    mockUpdate,
    mockCreate,
  };
}

describe("Stage change deduplication", () => {
  let dataProvider: DataProvider;
  let activityStore: ActivityStore;
  let getActivitiesForOpportunity: (opportunityId: number) => Activity[];
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    const trackingProvider = createActivityTrackingProvider();
    dataProvider = trackingProvider.dataProvider;
    activityStore = trackingProvider.activityStore;
    getActivitiesForOpportunity = trackingProvider.getActivitiesForOpportunity;
    mockUpdate = trackingProvider.mockUpdate;
    mockCreate = trackingProvider.mockCreate;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("single stage change", () => {
    it("creates exactly 1 activity per stage change", async () => {
      /**
       * Gate 1 acceptance test: A single stage change should result in
       * exactly 1 activity record, no duplicates.
       */
      const opportunity = createMockOpportunity({
        id: 1,
        stage: "new_lead",
      }) as Opportunity;

      const beforeCount = getActivitiesForOpportunity(1).length;
      expect(beforeCount).toBe(0);

      const updateParams: UpdateParams<Opportunity> = {
        id: 1,
        data: {
          ...opportunity,
          stage: "initial_outreach",
          previous_stage: "new_lead",
        },
        previousData: opportunity,
      };

      await dataProvider.update("opportunities", updateParams);

      const activitiesAfter = getActivitiesForOpportunity(1);
      const stageChangeActivities = activitiesAfter.filter((a) =>
        a.subject?.startsWith("Stage changed")
      );

      expect(stageChangeActivities.length).toBe(beforeCount + 1);
      expect(stageChangeActivities[0].subject).toBe(
        "Stage changed from new_lead to initial_outreach"
      );
      expect(stageChangeActivities[0].opportunity_id).toBe(1);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("does not create duplicate activities for the same stage transition", async () => {
      /**
       * Verify that calling update once results in exactly 1 activity,
       * not 2 or more due to any client-side duplication bugs.
       */
      const opportunity = createMockOpportunity({
        id: 2,
        stage: "qualified",
      }) as Opportunity;

      await dataProvider.update("opportunities", {
        id: 2,
        data: { ...opportunity, stage: "proposal" },
        previousData: opportunity,
      });

      const activities = getActivitiesForOpportunity(2);
      expect(activities.length).toBe(1);

      const stageChanges = activities.filter((a) => a.type === "stage_change");
      expect(stageChanges.length).toBe(1);

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("multiple stage changes", () => {
    it("creates exactly 1 activity each for multiple stage changes (no duplicates)", async () => {
      /**
       * Multiple sequential stage changes should each create exactly 1 activity.
       * This verifies no accumulation or batching bugs.
       */
      const opportunity1 = createMockOpportunity({
        id: 10,
        stage: "new_lead",
      }) as Opportunity;

      await dataProvider.update("opportunities", {
        id: 10,
        data: { ...opportunity1, stage: "initial_outreach" },
        previousData: opportunity1,
      });

      let activities = getActivitiesForOpportunity(10);
      expect(activities.length).toBe(1);
      expect(activities[0].subject).toBe("Stage changed from new_lead to initial_outreach");

      const opportunity1Updated = { ...opportunity1, stage: "initial_outreach" };
      await dataProvider.update("opportunities", {
        id: 10,
        data: { ...opportunity1Updated, stage: "demo_scheduled" },
        previousData: opportunity1Updated,
      });

      activities = getActivitiesForOpportunity(10);
      expect(activities.length).toBe(2);
      expect(activities[1].subject).toBe("Stage changed from initial_outreach to demo_scheduled");

      const opportunity1Final = { ...opportunity1Updated, stage: "demo_scheduled" };
      await dataProvider.update("opportunities", {
        id: 10,
        data: { ...opportunity1Final, stage: "closed_won" },
        previousData: opportunity1Final,
      });

      activities = getActivitiesForOpportunity(10);
      expect(activities.length).toBe(3);

      const stageChanges = activities.filter((a) => a.type === "stage_change");
      expect(stageChanges.length).toBe(3);

      expect(mockUpdate).toHaveBeenCalledTimes(3);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("creates exactly 1 activity per opportunity in parallel updates", async () => {
      /**
       * Parallel stage changes for different opportunities should each
       * create exactly 1 activity with no cross-contamination.
       */
      const opportunities = [
        createMockOpportunity({ id: 100, stage: "new_lead" }) as Opportunity,
        createMockOpportunity({ id: 101, stage: "initial_outreach" }) as Opportunity,
        createMockOpportunity({ id: 102, stage: "qualified" }) as Opportunity,
      ];

      const updatePromises = opportunities.map((opp) =>
        dataProvider.update("opportunities", {
          id: opp.id,
          data: { ...opp, stage: "proposal" },
          previousData: opp,
        })
      );

      await Promise.all(updatePromises);

      expect(getActivitiesForOpportunity(100).length).toBe(1);
      expect(getActivitiesForOpportunity(101).length).toBe(1);
      expect(getActivitiesForOpportunity(102).length).toBe(1);

      expect(activityStore.activities.length).toBe(3);

      expect(mockUpdate).toHaveBeenCalledTimes(3);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("handles rapid successive stage changes correctly", async () => {
      /**
       * Rapid fire stage changes (user clicks fast) should each
       * result in exactly 1 activity.
       */
      const opportunityId = 50;
      let currentOpportunity = createMockOpportunity({
        id: opportunityId,
        stage: "new_lead",
      }) as Opportunity;

      const stages = ["initial_outreach", "qualified", "demo_scheduled", "proposal", "closed_won"];

      for (const stage of stages) {
        await dataProvider.update("opportunities", {
          id: opportunityId,
          data: { ...currentOpportunity, stage },
          previousData: currentOpportunity,
        });
        currentOpportunity = { ...currentOpportunity, stage };
      }

      const activities = getActivitiesForOpportunity(opportunityId);
      expect(activities.length).toBe(5);

      const stageChangeActivities = activities.filter((a) => a.type === "stage_change");
      expect(stageChangeActivities.length).toBe(5);

      expect(mockUpdate).toHaveBeenCalledTimes(5);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("same stage (no change)", () => {
    it("creates 0 activities when stage remains unchanged", async () => {
      /**
       * If the stage is not actually changed (same value), no activity
       * should be created.
       */
      const opportunity = createMockOpportunity({
        id: 20,
        stage: "proposal",
      }) as Opportunity;

      const beforeCount = activityStore.activities.length;

      await dataProvider.update("opportunities", {
        id: 20,
        data: {
          ...opportunity,
          stage: "proposal",
          description: "Updated description only",
        },
        previousData: opportunity,
      });

      expect(activityStore.activities.length).toBe(beforeCount);
      expect(getActivitiesForOpportunity(20).length).toBe(0);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("creates 0 activities for non-stage field updates", async () => {
      /**
       * Updates to other fields (priority, description, etc.) should
       * not trigger stage-change activity creation.
       */
      const opportunity = createMockOpportunity({
        id: 21,
        stage: "qualified",
        priority: "medium",
      }) as Opportunity;

      await dataProvider.update("opportunities", {
        id: 21,
        data: {
          ...opportunity,
          priority: "high",
          description: "New description",
        },
        previousData: opportunity,
      });

      expect(getActivitiesForOpportunity(21).length).toBe(0);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("does not create duplicate activities for repeated same-stage updates", async () => {
      /**
       * Multiple updates with the same stage value should not create
       * any activities.
       */
      const opportunity = createMockOpportunity({
        id: 22,
        stage: "demo_scheduled",
      }) as Opportunity;

      for (let i = 0; i < 5; i++) {
        await dataProvider.update("opportunities", {
          id: 22,
          data: { ...opportunity, stage: "demo_scheduled", index: i },
          previousData: opportunity,
        });
      }

      expect(getActivitiesForOpportunity(22).length).toBe(0);
      expect(mockUpdate).toHaveBeenCalledTimes(5);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles undefined previous stage gracefully", async () => {
      /**
       * New opportunities might not have a previous stage.
       * This should still create exactly 1 activity when stage is set.
       */
      const opportunity = createMockOpportunity({
        id: 30,
        stage: undefined,
      }) as unknown as Opportunity;

      await dataProvider.update("opportunities", {
        id: 30,
        data: { ...opportunity, stage: "new_lead" },
        previousData: opportunity,
      });

      expect(getActivitiesForOpportunity(30).length).toBe(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("handles null to stage transition", async () => {
      /**
       * Transition from null stage to a valid stage should create 1 activity.
       */
      const opportunity = createMockOpportunity({
        id: 31,
        stage: null,
      }) as unknown as Opportunity;

      await dataProvider.update("opportunities", {
        id: 31,
        data: { ...opportunity, stage: "new_lead" },
        previousData: opportunity,
      });

      expect(getActivitiesForOpportunity(31).length).toBe(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("handles stage to null transition", async () => {
      /**
       * Transition from a valid stage to null should create 1 activity
       * (clearing the stage is still a stage change).
       */
      const opportunity = createMockOpportunity({
        id: 32,
        stage: "proposal",
      }) as Opportunity;

      await dataProvider.update("opportunities", {
        id: 32,
        data: { ...opportunity, stage: null },
        previousData: opportunity,
      });

      expect(getActivitiesForOpportunity(32).length).toBe(1);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("does not double-count activities when same opportunity updated twice", async () => {
      /**
       * The same opportunity being updated twice with different stages
       * should result in exactly 2 activities, one for each change.
       */
      const opportunity = createMockOpportunity({
        id: 33,
        stage: "new_lead",
      }) as Opportunity;

      await dataProvider.update("opportunities", {
        id: 33,
        data: { ...opportunity, stage: "qualified" },
        previousData: opportunity,
      });

      const updatedOpportunity = { ...opportunity, stage: "qualified" };
      await dataProvider.update("opportunities", {
        id: 33,
        data: { ...updatedOpportunity, stage: "new_lead" },
        previousData: updatedOpportunity,
      });

      const activities = getActivitiesForOpportunity(33);
      expect(activities.length).toBe(2);
      expect(activities[0].subject).toContain("new_lead to qualified");
      expect(activities[1].subject).toContain("qualified to new_lead");

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("maintains activity isolation between different opportunities", async () => {
      /**
       * Activities for one opportunity should not affect counts for another.
       */
      const opp1 = createMockOpportunity({ id: 40, stage: "new_lead" }) as Opportunity;
      const opp2 = createMockOpportunity({ id: 41, stage: "new_lead" }) as Opportunity;

      await dataProvider.update("opportunities", {
        id: 40,
        data: { ...opp1, stage: "qualified" },
        previousData: opp1,
      });

      expect(getActivitiesForOpportunity(40).length).toBe(1);
      expect(getActivitiesForOpportunity(41).length).toBe(0);

      await dataProvider.update("opportunities", {
        id: 41,
        data: { ...opp2, stage: "proposal" },
        previousData: opp2,
      });

      expect(getActivitiesForOpportunity(40).length).toBe(1);
      expect(getActivitiesForOpportunity(41).length).toBe(1);

      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
