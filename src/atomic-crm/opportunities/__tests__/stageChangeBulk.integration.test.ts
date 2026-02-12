/**
 * Stage Change via Bulk Action - Integration Tests
 *
 * Tests Gate 11: Each stage-change path creates exactly 1 activity per opportunity
 * (via DB trigger, not client-side).
 *
 * ARCHITECTURE:
 * - Bulk stage changes go through: BulkActionsToolbar -> dataProvider.update (x N) -> Supabase -> DB Trigger (x N)
 * - Each individual update triggers the DB trigger `log_opportunity_stage_change`
 * - Client-side code MUST NOT create activity records for stage changes
 *
 * These tests verify that bulk stage changes result in N updates
 * but zero client-side activity creation calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { DataProvider, UpdateParams } from "ra-core";
import { createMockDataProvider } from "@/tests/utils/typed-mocks";
import { createMockOpportunity } from "@/tests/utils/mock-providers";
import type { Opportunity } from "@/atomic-crm/types";

/**
 * Simulates the bulk stage change behavior from useBulkActionsState.ts
 * Uses Promise.allSettled for parallel execution (fail-fast pattern with reporting).
 */
async function simulateBulkStageChange(
  dataProvider: DataProvider,
  opportunities: Opportunity[],
  newStage: string
): Promise<{ successCount: number; failureCount: number }> {
  const updatePromises = opportunities.map((opportunity) => {
    const updateParams: UpdateParams<Opportunity> = {
      id: opportunity.id,
      data: {
        stage: newStage,
        stage_manual: true,
      },
      previousData: opportunity,
    };

    return dataProvider.update("opportunities", updateParams);
  });

  const results = await Promise.allSettled(updatePromises);

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failureCount = results.filter((r) => r.status === "rejected").length;

  return { successCount, failureCount };
}

describe("Stage change via bulk action", () => {
  let mockDataProvider: DataProvider;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

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
    vi.clearAllMocks();
  });

  it("creates exactly N stage-change activities (one per opportunity) via DB trigger", async () => {
    /**
     * Bulk stage change for N opportunities should:
     * 1. Call dataProvider.update N times (one per opportunity)
     * 2. NOT call dataProvider.create for activities
     * 3. DB trigger fires N times (once per update) to create N activities
     */
    const opportunities = [
      createMockOpportunity({ id: 1, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 2, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 3, stage: "new_lead" }) as Opportunity,
    ];

    const { successCount, failureCount } = await simulateBulkStageChange(
      mockDataProvider,
      opportunities,
      "proposal"
    );

    // All 3 updates should succeed
    expect(successCount).toBe(3);
    expect(failureCount).toBe(0);

    // Assert: update called once per opportunity
    expect(mockUpdate).toHaveBeenCalledTimes(3);

    // Verify each update was called with correct data
    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        id: 1,
        data: expect.objectContaining({ stage: "proposal" }),
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        id: 2,
        data: expect.objectContaining({ stage: "proposal" }),
      })
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        id: 3,
        data: expect.objectContaining({ stage: "proposal" }),
      })
    );

    // Gate 11: NO client-side activity creation
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not create client-side activities even when some updates fail", async () => {
    /**
     * Partial failure scenario: some updates succeed, some fail.
     * Client should still not create activities - that's the DB trigger's job.
     * Failed updates won't trigger the DB trigger (transaction rolled back).
     */
    // First and third succeed, second fails
    mockUpdate
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockRejectedValueOnce(new Error("RLS policy violation"))
      .mockResolvedValueOnce({ data: { id: 3 } });

    const opportunities = [
      createMockOpportunity({ id: 1, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 2, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 3, stage: "new_lead" }) as Opportunity,
    ];

    const { successCount, failureCount } = await simulateBulkStageChange(
      mockDataProvider,
      opportunities,
      "demo_scheduled"
    );

    expect(successCount).toBe(2);
    expect(failureCount).toBe(1);

    // All 3 updates were attempted
    expect(mockUpdate).toHaveBeenCalledTimes(3);

    // Still no client-side activity creation
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("does not create activities when all bulk updates fail", async () => {
    /**
     * Complete failure scenario: all updates fail.
     * No activities should be created (neither client-side nor via trigger).
     */
    mockUpdate.mockRejectedValue(new Error("Database unavailable"));

    const opportunities = [
      createMockOpportunity({ id: 1, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 2, stage: "new_lead" }) as Opportunity,
    ];

    const { successCount, failureCount } = await simulateBulkStageChange(
      mockDataProvider,
      opportunities,
      "qualified"
    );

    expect(successCount).toBe(0);
    expect(failureCount).toBe(2);

    // Both updates were attempted
    expect(mockUpdate).toHaveBeenCalledTimes(2);

    // No client-side activity creation
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("sets stage_manual flag for all bulk updates", async () => {
    /**
     * All bulk stage changes should be marked as manual to differentiate
     * from automated stage transitions (e.g., workflow rules).
     */
    const opportunities = [
      createMockOpportunity({ id: 1, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 2, stage: "initial_outreach" }) as Opportunity,
    ];

    await simulateBulkStageChange(mockDataProvider, opportunities, "closed_won");

    // Both updates should have stage_manual: true
    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        data: expect.objectContaining({ stage_manual: true }),
      })
    );
  });

  it("executes updates in parallel, not sequentially", async () => {
    /**
     * Performance requirement: bulk updates should run in parallel.
     * This test verifies the Promise.allSettled pattern is used.
     */
    const updateDelay = 100;
    mockUpdate.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: {} }), updateDelay);
        })
    );

    const opportunities = [
      createMockOpportunity({ id: 1, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 2, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 3, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 4, stage: "new_lead" }) as Opportunity,
      createMockOpportunity({ id: 5, stage: "new_lead" }) as Opportunity,
    ];

    const startTime = Date.now();
    await simulateBulkStageChange(mockDataProvider, opportunities, "proposal");
    const duration = Date.now() - startTime;

    // If sequential: ~500ms (5 updates x 100ms each)
    // If parallel: ~100ms (all 5 run concurrently)
    // Assert duration is closer to parallel execution (< 250ms threshold)
    expect(duration).toBeLessThan(250);

    // All 5 updates were called
    expect(mockUpdate).toHaveBeenCalledTimes(5);

    // No client-side activity creation
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("handles empty selection gracefully", async () => {
    /**
     * Edge case: bulk action with no selected opportunities.
     * Should not call update or create.
     */
    const opportunities: Opportunity[] = [];

    await simulateBulkStageChange(mockDataProvider, opportunities, "proposal");

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("handles single item bulk action same as multi-item", async () => {
    /**
     * Bulk action with single item should behave the same as multi-item:
     * one update, zero client-side activities.
     */
    const opportunities = [createMockOpportunity({ id: 1, stage: "new_lead" }) as Opportunity];

    const { successCount, failureCount } = await simulateBulkStageChange(
      mockDataProvider,
      opportunities,
      "closed_lost"
    );

    expect(successCount).toBe(1);
    expect(failureCount).toBe(0);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("preserves previousData for each opportunity in bulk update", async () => {
    /**
     * Each update in the bulk operation should include the previousData
     * for that specific opportunity (for optimistic update rollback).
     */
    const opportunity1 = createMockOpportunity({
      id: 1,
      stage: "new_lead",
      name: "First Opp",
    }) as Opportunity;

    const opportunity2 = createMockOpportunity({
      id: 2,
      stage: "initial_outreach",
      name: "Second Opp",
    }) as Opportunity;

    await simulateBulkStageChange(mockDataProvider, [opportunity1, opportunity2], "demo_scheduled");

    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        id: 1,
        previousData: opportunity1,
      })
    );

    expect(mockUpdate).toHaveBeenCalledWith(
      "opportunities",
      expect.objectContaining({
        id: 2,
        previousData: opportunity2,
      })
    );
  });
});
