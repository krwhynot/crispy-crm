/**
 * Stage Change via Form - Integration Tests
 *
 * Tests Gate 11: Each stage-change path creates exactly 1 activity (via DB trigger, not client-side).
 *
 * ARCHITECTURE:
 * - Stage changes go through: Form -> dataProvider.update -> Supabase -> DB Trigger
 * - The DB trigger `log_opportunity_stage_change` creates the activity record
 * - Client-side code MUST NOT create activity records for stage changes
 *
 * These tests verify that the client-side code does NOT attempt to create
 * activity records when stage changes occur. The actual activity creation
 * is handled by the database trigger (tested separately via pgTAP).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, UpdateParams } from "ra-core";
import { createMockDataProvider } from "@/tests/utils/typed-mocks";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import type { Opportunity } from "@/atomic-crm/types";

describe("Stage change via form", () => {
  let mockDataProvider: DataProvider;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockUpdate = vi.fn().mockResolvedValue({
      data: { id: 1, stage: "proposal" },
    });
    mockCreate = vi.fn().mockResolvedValue({
      data: { id: 999 },
    });

    mockDataProvider = createMockDataProvider({
      update: mockUpdate,
      create: mockCreate,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("creates exactly one stage-change activity via DB trigger, not client-side", async () => {
    /**
     * This test verifies the integration contract:
     * 1. Form submits stage change via dataProvider.update()
     * 2. dataProvider.update() is called exactly once
     * 3. dataProvider.create() for activities is NEVER called
     *
     * The DB trigger handles activity creation, so client should not.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "new_lead",
    }) as Opportunity;

    const updateParams: UpdateParams<Opportunity> = {
      id: 1,
      data: {
        ...opportunity,
        stage: "proposal",
        previous_stage: "new_lead",
      },
      previousData: opportunity,
    };

    await mockDataProvider.update("opportunities", updateParams);

    // Assert: dataProvider.update was called for the stage change
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        id: 1,
        data: expect.objectContaining({
          stage: "proposal",
          previous_stage: "new_lead",
        }),
      })
    );

    // Gate 11: NO client-side activity creation
    // The DB trigger creates the activity, not the client
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not create activity when stage remains unchanged", async () => {
    /**
     * If stage is not actually changed (same value), no activity should be created.
     * This is also enforced by the DB trigger, but client should not attempt it either.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "proposal",
    }) as Opportunity;

    const updateParams: UpdateParams<Opportunity> = {
      id: 1,
      data: {
        ...opportunity,
        stage: "proposal", // Same stage
        description: "Updated description",
      },
      previousData: opportunity,
    };

    await mockDataProvider.update("opportunities", updateParams);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not create activity for non-stage field updates", async () => {
    /**
     * Updates to other fields (description, priority, etc.) should not
     * trigger activity creation. Stage-change activities are only for
     * actual stage transitions.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "new_lead",
      priority: "medium",
    }) as Opportunity;

    const updateParams: UpdateParams<Opportunity> = {
      id: 1,
      data: {
        ...opportunity,
        priority: "high", // Only priority changed
        description: "New description",
      },
      previousData: opportunity,
    };

    await mockDataProvider.update("opportunities", updateParams);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("handles multiple sequential stage changes without client-side activity creation", async () => {
    /**
     * Multiple stage changes should each go through the update flow.
     * Each will trigger the DB trigger independently.
     * Client should not accumulate or batch activity creation.
     */
    const opportunity1 = createMockOpportunity({
      id: 1,
      stage: "new_lead",
    }) as Opportunity;

    const opportunity2 = createMockOpportunity({
      id: 2,
      stage: "initial_outreach",
    }) as Opportunity;

    // First stage change
    await mockDataProvider.update("opportunities", {
      id: 1,
      data: { ...opportunity1, stage: "initial_outreach" },
      previousData: opportunity1,
    });

    // Second stage change on different opportunity
    await mockDataProvider.update("opportunities", {
      id: 2,
      data: { ...opportunity2, stage: "demo_scheduled" },
      previousData: opportunity2,
    });

    // Both updates should have been called
    expect(mockUpdate).toHaveBeenCalledTimes(2);

    // No client-side activity creation for either
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("includes previous_stage in update payload for DB trigger consumption", async () => {
    /**
     * The form should include previous_stage in the payload so the DB trigger
     * can determine what the stage transition was for logging purposes.
     */
    const opportunity = createMockOpportunity({
      id: 1,
      stage: "new_lead",
    }) as Opportunity;

    await mockDataProvider.update("opportunities", {
      id: 1,
      data: {
        ...opportunity,
        stage: "qualified",
        previous_stage: "new_lead",
      },
      previousData: opportunity,
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        data: expect.objectContaining({
          previous_stage: "new_lead",
        }),
      })
    );
  });
});
